# Dev Test Checklist — Application Questions + Deposits Proxy

**Date:** 2026-07-28
**Scope:** client spec Part A (three new form questions + alignment with the nesbah.net reference), the deposits reverse-proxy that replaces spec Part B, the homepage promo card, and a visuals pass on the application form.

> **Where we are:** backend and database are fully verified on dev. What remains is
> **browser click-through of the portals (§1.1–1.4, §2, §3, §4, §6, §7)**, then
> **deploy for the Cloudflare proxy test (§5.1)**, then the prod migration.

---

## 0. Prerequisites — ✅ DONE (2026-07-28)

### 0.1 Dev database — done
`.env.local` now points at `nesbah_dev` @ `34.166.101.46`.

> ⚠️ It is still pointed at **dev**. Switch it back deliberately before any prod work — a prod migration must not run from a session that believes it is on dev.

### 0.2 Backfill blast radius — checked, lossless on dev
```
Less than 250K SAR  2   → lt_250k
More than 5M SAR    1   → gt_1m
(no amount)         1   → stays NULL
```
**Zero rows** in the un-mappable old "250K – 1M" bucket, so nothing was lost.

> **Still required before the prod migration:** run the same query on prod. Dev has 4 applications and tells us nothing about prod's distribution.
> ```sql
> SELECT approximate_financing_amount, COUNT(*) FROM pos_application GROUP BY 1 ORDER BY 2 DESC;
> ```

### 0.3 Migration applied and verified on dev
- [x] `010_lead_prioritization_fields.sql` ran clean
- [x] All 10 new columns present
- [x] `pos_application_derive_lead_tier_trg` created
- [x] All 6 CHECK constraints present with `convalidated = false` (NOT VALID, so existing rows were never checked)
- [x] Code rename landed on real data: `corporate`, `commercial_real_estate`, `expansion`, `pos` — no `business` / `real_estate`
- [x] Tier trigger verified at every boundary (rolled-back tx): 95→high, 75→high, 74→medium, 45→medium, 44→low, NULL→NULL; also fires on `UPDATE OF lead_score`
- [x] Constraints reject: pre-revenue + revenue code together, retired `250k_1m`, `lead_score = 150`

---

## What actually changed — read this before testing

### New questions on the application form

| Field | Column | Rule |
|---|---|---|
| Annual revenue | `annual_revenue_code` | `100k_300k` / `300k_1m` / `gt_1m`. Required **unless** pre-revenue |
| No sales yet | `is_pre_revenue` | Checkbox. When checked: revenue dropdown disabled, cleared, no longer required |
| Sales via POS devices | `own_pos_system` *(reused)* | Two buttons, **no default**, required |
| Business age | `business_age_range_code` | `lt_1` / `1_2` / `2_3` / `3_5` / `gt_5`. Required |
| Consent | `consent_at`, `consent_version` | Explicit checkbox, required. Version `2026-07-10` |

### Four existing fields now store codes instead of free text or labels

City, sector, requested amount and financing type. The **amount buckets changed** to the reference implementation's boundaries — `<250K / 250K–500K / 500K–1M / >1M`, replacing the old `<250K / 250K–1M / 1M–5M / >5M`. City and sector became dropdowns; they used to be typed by hand.

**Nothing was converted in place.** New `*_code` columns sit next to the old text columns, which stay populated as a display fallback. Every display surface prefers the code and falls back to the stored text, so historical rows keep rendering.

### The internal prioritization indicator

`lead_score` (0–100) and `lead_tier` (`high` ≥75 / `medium` ≥45 / `low`), ported verbatim from the reference implementation. Score computed in the API, tier derived by a DB trigger.

> **This is the single most sensitive thing in the release.** It is visible to admins and financing partners only. It must never appear in the applicant flow — not on screen, and not as an unrendered JSON field.

### Deposits proxy

`nesbah.com.sa/deposits` now reverse-proxies to nesbah.net. No redirect, no duplicated code, no rate data in this repo.

---

## 1. Public application form (`/onboarding`)

### 1.1 Step 1 — company information

- [X] Fields in order: business name, CR number, **City (dropdown)**, **Sector (dropdown)**, **Annual revenue (dropdown)**, **pre-revenue checkbox**, then the contact block
- [X] City and sector are dropdowns, not text inputs
- [X] Annual revenue offers exactly three options in this order, with Arabic-Indic numerals in AR: `١٠٠ - ٣٠٠ ألف ريال`, `٣٠٠ ألف - ١ مليون ريال`, `أكثر من ١ مليون ريال`
- [X] Tick the pre-revenue box → revenue dropdown greys out, its value clears, the `*` disappears
- [X] Untick → dropdown re-enables and the `*` returns
- [X] With neither revenue nor the checkbox set, **Next stays disabled**
- [ ] Type Arabic-Indic digits (`٧٠٠١٢٣٤٥٦٧`) into the CR field → they convert to Western digits automatically
- [X] CR still rejects anything not `70` + 8 digits (kept stricter than the reference on purpose — this value goes to Wathiq)

### 1.2 Step 2 — financing details

- [X] Financing type is a **grid of 7 icon buttons**, not a dropdown. No "Other" option
- [X] Amount dropdown shows the **new** four ranges (`<250K / 250K–500K / 500K–1M / >1M`)
- [X] Business age dropdown present with 5 options
- [X] POS question renders as two buttons, **neither pre-selected**
- [X] Next stays disabled until financing type, amount, age and the POS answer are all set

### 1.3 Step 3 — review and submit

- [X] Review shows the localized **labels** for every code (never `gt_1m` or `commercial_real_estate`)
- [X] Pre-revenue applicants see "لا توجد مبيعات بعد" / "No sales yet" in the revenue row
- [X] Consent checkbox is present and **unticked** by default
- [X] Submit is disabled until consent is ticked; clicking the row shows the inline error
- [X] Submit succeeds → success screen with reference number

### 1.4 Language

- [X] Toggle to EN and repeat 1.1–1.3 — every new label, option and error message is translated
- [X] **No score, rating, priority or eligibility wording appears anywhere in the applicant flow, in either language**

### 1.5 Verify what landed in the database — ✅ DONE via API (application 31)

Verified on a real Wathiq-validated CR (`7051664865`): `amount_range_code=500k_1m`,
`requested_financing_amount=1000000.00`, `approximate_financing_amount=٥٠٠ ألف - ١ مليون ريال`,
`city_code=jeddah`/`city_of_operation=جدة`, `sector_code=technology`/`sector=التكنولوجيا`,
`consent_version=2026-07-10`, **`lead_score=74` → `lead_tier=medium`**, `verification_status=verified`.
Wathiq upserted and joined; duplicate resubmit → **409**. A maximal submission logged `score=95`.
Re-run the queries below only if you change the write path.


```sql
SELECT reference_number, financing_type, amount_range_code, business_age_range_code,
       annual_revenue_code, is_pre_revenue, own_pos_system, city_code, sector_code,
       consent_at, consent_version, lead_score, lead_tier
  FROM pos_application ORDER BY submitted_at DESC LIMIT 1;
```

- [X] Every code column holds a **code**, not a label
- [ ] `consent_at` set, `consent_version = '2026-07-10'`
- [ ] `lead_score` populated and `lead_tier` matches the thresholds
- [ ] Legacy columns also populated as the display fallback: `city_of_operation`, `sector`, `approximate_financing_amount` hold Arabic labels; `requested_financing_amount` holds the range's upper bound (or `min` for the open-ended top bucket) — never `0`

**Score spot-check** — base 40; amount ≥1M +25 / ≥500K +18 / ≥250K +10 / else +5; age ≥5y +20 / ≥3y +12 / ≥1y +6; POS yes +10; pre-revenue −20.

- [ ] `gt_1m` + `gt_5` + POS yes + not pre-revenue = **95** → `high`
- [ ] `lt_250k` + `lt_1` + POS no + pre-revenue = **25** → `low`

### 1.6 Server-side rejection — ✅ DONE via API (all 10 cases returned 400)

All of the following were confirmed to return **400 before any DB write**:

- [x] Both `annual_revenue_code` and `is_pre_revenue: true` sent together
- [x] Neither sent
- [x] `has_pos` missing or not a boolean
- [x] `consent` missing or `false`
- [x] An invalid code, e.g. `amount_range_code: "250k_1m"` (the retired bucket)
- [x] Missing `city_code` / `sector_code` / `business_age_range_code`

---

## 2. Admin portal

### 2.1 Applications list

- [X] Financing column shows readable labels ("Corporate Financing", "Commercial Real Estate") — **never** `corporate` or `commercial real estate`
- [X] Financing filter lists the 7 types plus **"Other (legacy)"** — that entry exists so pre-existing `general` rows stay reachable
- [X] Filtering by each type returns the right rows

### 2.2 View Application modal

- [X] Financing Details shows: financing type, requested amount, **annual revenue, business age, sales via POS devices**, city, sector
- [X] **Lead Priority** badge with score and the "not a credit or affordability assessment" disclaimer
- [X] Open a **pre-migration** application → new rows read "Not specified", amount/city/sector fall back to the old stored text, no crash, no blank labels

### 2.3 Edit Application modal

- [X] City, sector, annual revenue, business age are dropdowns; POS is a Yes/No/Not-specified select
- [X] Pre-revenue checkbox disables and clears the revenue dropdown
- [X] Existing values pre-select correctly
- [X] Change the **amount** → save → reopen: `lead_score` and `lead_tier` **recalculated**
- [X] Change the **POS answer** → save → score changes by 10
- [X] Legacy text columns stay in sync — after changing city, `city_of_operation` reflects the new choice
- [X] Editing a legacy `general` row keeps "Other (legacy)" selectable and saves without a 400

### 2.4 New Application modal

- [X] CR lookup still works; Wathiq's city name pre-selects the matching city code where it can
- [X] All new fields present and required
- [X] Consent checkbox worded as an admin affirming the **applicant's** consent — it is not auto-sent
- [X] Submitting without consent shows an inline error, not a 400 from the server
- [X] Created row is indistinguishable in the DB from a public submission (codes + score present)

### 2.5 Business Users

- [X] `/admin/users` → Business tab: financing type and amount cells show labels, not codes
- [X] View a business user → modal shows financing type, city, requested amount, **annual revenue, business age, sales via POS devices, Lead Priority**

### 2.6 Excel export

- [X] Export downloads and opens
- [X] New columns present: `Requested Amount (range)`, `Annual Revenue`, `Business Age`, `Sales via POS Devices`, `Consent Given At`, `Consent Version`, `Lead Priority`, `Lead Score (0-100)`
- [X] **Regression fix to confirm:** public-form leads previously exported a blank amount (the export only read the numeric column). `Requested Amount (range)` must now be populated for them
- [X] Financing type and city/sector export as labels
- [X] Active search/status/financing filters are respected

---

## 3. Bank portal

- [ ] Leads list: financing badge shows a label, not a code
- [ ] **Business Info modal** (the modal a bank opens on a lead): financing type, amount, **annual revenue, business age, sales via POS devices**, and the **Lead Priority** badge with disclaimer
- [ ] Lead detail page: same fields, plus Lead Priority
- [ ] Purchased-leads Excel export has `Sales via POS Devices`, `Annual Revenue`, `Business Age`
- [ ] The old **"Own POS System"** label is gone everywhere — it now reads "Sales via POS Devices" in EN and "مبيعات عبر أجهزة نقاط البيع" in AR

> **Why the rename matters:** the POS question reuses the existing `own_pos_system` column. Rows created before this release answered a *different* question ("does the business own a POS system"). The score treats `NULL` and legacy values as *unknown* rather than "no", but the historical values themselves are not strictly comparable to new ones. Worth remembering if you analyse this field over time.

---

## 4. Applicant-facing leak check — do not skip

The spec is explicit that the indicator is never visible to the applicant.

- [ ] Log in as a business user, open the portal, F12 → Network → the `posApplication/[user_id]` response
- [ ] **`lead_score` and `lead_tier` are absent from the JSON payload**, not merely unrendered

That endpoint used `SELECT *`, which would have shipped both columns to the applicant's browser the moment the migration ran. It now uses an explicit column list that omits them. If someone adds a column later, this is the place to re-check.

- [ ] Search the applicant bundle for score wording: nothing in `/onboarding` or the business portal mentions priority, score or eligibility

---

## 5. Deposits proxy

Already verified locally; re-verify on a deployed dev instance because the risk is environmental, not code.

- [ ] `/deposits` loads **fully styled**, with bank logos and working filters
- [ ] URL stays on your domain — no redirect to nesbah.net at any point
- [ ] `/deposits/` (trailing slash) resolves to `/deposits` **on your domain**. Next's own normalisation handles this; confirm it still does
- [ ] DevTools Console: no 404s, no CORS errors
- [ ] `/en/deposits` loads
- [ ] **The deposit request form actually submits.** This is the one most likely to break: the form POSTs to `/_serverFn/*`, which sits outside `/deposits` and needs its own rewrite rule. The page can look perfect while the form silently fails
- [ ] `<html lang="ar" dir="rtl">` present, RTL layout correct
- [ ] Mobile renders correctly
- [ ] The main site's own favicon still shows on `/deposits` — `/favicon.ico` is deliberately **not** proxied

### 5.1 The Cloudflare go/no-go test — must run from Cloud Run

Cloudflare fronts nesbah.net. The proxy works from a laptop; that says nothing about a datacenter IP. Cloudflare bot management is exactly the class of thing that passes locally and 403s from a container.

- [ ] Deploy, then load `/deposits` on the deployed URL
- [ ] Check Cloud Run logs for 403s or challenge HTML from the origin
- [ ] Load it repeatedly (~20 times) to check for rate limiting

**If it fails:** either ask the nesbah.net side to allowlist the Cloud Run egress IP / exempt `/deposits*` from bot fighting, or fall back to a `deposits.nesbah.com.sa` CNAME. Set `DEPOSITS_PROXY_ENABLED=false` to disable the whole proxy without a code change.

### 5.2 Canonical and sitemap sequencing — easy to get wrong

The proxied page still emits `<link rel="canonical" href="https://nesbah.net/deposits">` until the nesbah.net side sets `VITE_SITE_URL=https://nesbah.com.sa`.

- [ ] `/sitemap.xml` does **not** list `/deposits` yet — `DEPOSITS_IN_SITEMAP` is unset by default, on purpose
- [ ] Tell nesbah.net the proxy is live → they flip `VITE_SITE_URL`
- [ ] Confirm the canonical now says `nesbah.com.sa` **before** setting `DEPOSITS_IN_SITEMAP=true`
- [ ] Never add `noindex` or a robots block on nesbah.net — it is the origin, so that tag would be served through the proxy and de-index our page too

---

## 6. Homepage promo card

- [ ] Card appears directly below the hero, max-width 480px, aligned to the start of the container (right in RTL)
- [ ] Full width on mobile; does not compete with the hero
- [ ] Clicking anywhere navigates to `/deposits` in the **same tab** — no `target="_blank"`
- [ ] Toggle to EN → card copy is in English and the arrow flips direction
- [ ] Only the three illustrative placeholder rows (Bank A/B/C) appear — **no real profit rate anywhere**
- [ ] No CSS collisions with existing homepage styles (all classes are `nsb-` prefixed)

> The link intentionally has **no UTM parameters**. The original embed tagged them because the card pointed at another domain; with the proxy this is same-domain navigation, and tagging our own traffic as external would corrupt the analytics the UTMs exist to measure.

---

## 7. Visuals pass on the form

Kept as a separate track from the data model, so it can be reviewed and reverted independently.

- [ ] Fields use `rounded-2xl`, labels are semibold with a red `*` on required ones
- [ ] Financing type renders as the 7-icon button grid; selected state is the violet fill
- [ ] Primary buttons are pills with the violet glow; disabled state drops the glow
- [ ] Step headings show title + subtitle
- [ ] Errors use the destructive token, not ad-hoc `text-red-500`
- [ ] Check at 375px width — grid collapses to 2 columns, nothing overflows

---

## 8. Second-pass audit — surfaces found after the first sweep

These were missed initially and are now fixed. Each is worth an explicit check because they were exactly the "looks fine, isn't" cases.

### 8.1 Bugs found in the new code itself

- [ ] **Legacy-row clobbering in the admin PUT (data loss).** The edit modal sends every field on every save. A pre-migration application arrives with all codes empty, and the route was nulling the *legacy* text columns alongside them — so simply opening and saving an old application wiped its city, sector and amount, the only data making it renderable. Now: setting a code refreshes the legacy column; clearing a code clears only the code column. **Test:** open a pre-migration application in Edit, change nothing, save, then confirm `city_of_operation`, `sector` and `approximate_financing_amount` are unchanged.
- [ ] **Small leads lost their numeric amount.** `requested_financing_amount` was derived as `min || null`, and `lt_250k` has `min = 0` — so every "under 250K" lead stored NULL. Now uses `representativeAmount()` (upper bound, falling back to min for the open-ended top bucket), matching the reference. **Test:** submit an `lt_250k` lead → `requested_financing_amount = 250000`, not NULL.
- [ ] **XOR enforced at the write layer.** Pre-revenue now always nulls `annual_revenue_code` in the PUT, even if the client omits it. **Test:** on a row with a revenue code, tick pre-revenue and save → code becomes NULL, constraint holds.

### 8.2 The legacy business-portal form is live and was writing retired buckets

`/portal` still renders the old POS application form (`PosApplication`), and it was writing the **old** amount labels (`"250K – 1M SAR"`) as free text — a bucket set that no longer exists. Two live creation paths were producing incompatible amount data. It now uses the shared code vocabulary, and the route validates the code and derives the label and numeric value.

- [ ] Submit through `/portal` → `amount_range_code` set, `approximate_financing_amount` holds the derived Arabic label, `requested_financing_amount` populated
- [ ] Posting an old label string to `/api/posApplication` returns **400**
- [ ] **Expected gap, by design:** portal submissions get **no** `lead_score` — they don't collect revenue, business age or the POS question. Banks see "Not specified" for priority on those leads. Extending that older form was outside the spec's scope; flag it to the client if they want portal leads ranked too.

### 8.3 Notifications were sending raw codes to humans

- [ ] Admin new-lead email shows a readable financing type ("التمويل العقاري التجاري"), **not** `commercial_real_estate`
- [ ] Same for the WhatsApp alert, if enabled
- [ ] Amount still renders in all emails — they read the derived label column, which every write path keeps populated

### 8.4 NULL treated as "No"

- [ ] Bank lead **history** page showed `own_pos_system ? Yes : No`, so a row that never answered read as a definitive "No" under the new question wording. Now shows "Not specified"

### 8.5 Verified clean, no change needed

- `POST /api/admin/applications` exists but **nothing calls it** — both callers use GET. Left alone rather than rewriting dead code; if anyone wires it up later it will create applications with no codes and no score
- `admin/bank-offers` (list + detail), `leads/[id]/unmasked-contact`, and the bank leads list read `approximate_financing_amount`, the derived label column — correct without change
- `v_application_full` (from migration 005) is not queried by any application code
- No raw `financing_type.replace()` renders remain anywhere
- INSERT parameter alignment machine-checked on both write paths: public-submit 30 columns / 30 slots / `$1..$26` contiguous; legacy portal 24/24 / `$1..$21` contiguous
- Score arithmetic re-derived independently: `gt_1m`+`gt_5`+POS = 95 high · `500k_1m`+`2_3`+POS = 74 **medium** (just under the boundary) · `lt_250k`+`lt_1`+pre-revenue = 25 low

---

## 9. Regression sweep

- [ ] `npm run build` — clean (verified at time of writing)
- [ ] Business, bank and admin login all still work
- [ ] Bank can open a lead, submit an offer, ignore a lead
- [ ] Admin analytics tabs render without errors
- [ ] A pre-migration application is viewable end to end in both portals with no blank labels and no crash
- [ ] Confirm all three emails still fire on submit (business, admin, banks)

---

## Known-open items (not bugs — decisions and dependencies)

| Item | Status |
|---|---|
| Migration 010 applied | **Nowhere yet.** Dev first, then prod in a quiet window |
| Cloudflare test from Cloud Run | Outstanding — the proxy's real go/no-go |
| nesbah.net `VITE_SITE_URL` flip | Their side; gates `DEPOSITS_IN_SITEMAP` |
| EN promo card copy | My translation — needs client sign-off, it is their asset |
| Old "250K–1M" amount rows | Left `NULL` by design; fall back to the stored label |
| `general` financing type | Retired from the form, kept on legacy rows, still filterable and editable |
| Illustrative rates on the card | Spec permits them against anonymised banks; the caption is 9px on a regulated fintech homepage — the client's call, flagged not changed |
| `SELECT *` in `leads/[id]/purchased_applications` | Pre-existing, against the repo's SQL rules, but only used for `rowCount` and not applicant-facing. Left alone to keep this diff tight |
| Portal (`/portal`) leads carry no priority score | By design — that older form doesn't collect revenue/age/POS. Client decision whether to extend it |
| `POST /api/admin/applications` | Dead code path that would create score-less applications if ever wired up |

---

## Files changed

**New:** `src/lib/apply-options.js` (code vocabulary + formatters), `src/lib/lead-score.js`, `src/lib/migrations/010_lead_prioritization_fields.sql`, `src/components/public/landing/DepositsPromoCard.jsx`

**Form / public:** `src/app/onboarding/OnboardingClient.jsx`, `src/contexts/PublicLanguageContext.jsx`, `src/app/page.jsx`, `src/styles/tailwind.css`, `next.config.mjs`, `src/app/sitemap.js`

**APIs:** `applications/public-submit`, `admin/applications` (list, `[id]`, `export`), `admin/users/business` (list, `[id]`), `leads` (list, `[id]`, `purchased`, `purchased/export`), `posApplication/[user_id]`

**Admin UI:** `ViewApplicationModal`, `EditApplicationModal`, `NewApplicationModal`, `BusinessUserViewModal`, `ApplicationsTable`, `AdminApplicationsDashboard`, `UserManagement`

**Bank / business UI:** `BusinessInfoModal`, `BankLeadsTable`, `IncomingOffer`, `YourApplication`, `bankPortal/leads/[id]/page.jsx`

**Translations:** `src/translations/en.js`, `src/translations/ar.js`
