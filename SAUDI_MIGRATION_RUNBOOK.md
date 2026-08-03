# Moving Nesbah to Google Cloud Dammam (me-central2)

**Scope:** the client requires the data hosted in Saudi Arabia (SAMA). Since Cloud Run
**is** available in Dammam (confirmed in the Console region picker), we move **both the
database and the application** there. That satisfies residency for storage *and*
processing, and keeps them co-located so there is no cross-region latency penalty.

> An earlier draft of this document claimed Cloud Run was unavailable in me-central2.
> That was wrong — it came from a `gcloud services list` permission error on the
> devadmin account, not a real region restriction. The Console lists the region.

**Current production, verified 2026-08-02 — the target must match:**

| | Value |
|---|---|
| Database | `production-eu` · POSTGRES_16 · `db-g1-small` · ENTERPRISE · **Single zone** · 10 GB PD_SSD · backups 11:00 · db name `postgres` · 90 applications |
| Application | `nesbah-portal-v2` · europe-west1 · image `gcr.io/nesbahdev/nesbah-portal` · 1 GiB · 1 CPU · concurrency 80 · timeout 300 · min 1 / max 10 |
| Service account | `638895547402-compute@developer.gserviceaccount.com` |
| Domain | `nesbah.com.sa` → `nesbah-portal-v2` |
| Uploads bucket | `nesbah-uploads` (europe-west1) |

**Note on cost:** Dammam is **Tier 2 pricing** — more expensive than europe-west1 per
vCPU-second and per GB. Both environments also run in parallel during transition. Tell
the client to expect the bill to rise, then settle above its current level.

**Note on DNS:** no change is needed at Sahara Net. `nesbah.com.sa` resolves to Google's
anycast IPs (`216.239.32/34/36/38.21`), which are identical regardless of the region the
service runs in. The domain move happens entirely inside Google.

---

## ⚠️ Do this in the right order: ship the pending release FIRST

**Status: the release has shipped.** ✅ Deployed to Europe on **2026-08-03**, commit
`f569d17` (site-wide RTL document direction, font plumbing, reference container, large-
display scaling). Migration `010` was already applied to the production database.

The rule this section exists to enforce still applies, though: **do not start Step 1 on
the same day as a release.** If something breaks while both a release and a region move
are in flight, you cannot tell which one caused it — they must stay separate,
individually reversible changes.

**Before Step 1, close out these two:**

1. **Log in and click through the admin and bank portals.** The `f569d17` release changed
   the document direction site-wide to `dir="rtl"`. Those portals opt out via a
   `dir="ltr"` wrapper on their own subtree. That opt-out is confirmed rendering on
   `/admin/login` and `/find-templates`, but **the authenticated interiors have never been
   seen by a human** — they redirect when unauthenticated, so no terminal check can reach
   them. A direction regression in the admin tables would be the single most likely
   fallout of that release, and you do not want to be diagnosing it mid-migration.
2. **Remove the temporary admin IP from the production database allowlist:**
   ```bash
   gcloud sql instances patch production-eu \
     --authorized-networks=176.125.231.86,143.178.144.140 --quiet
   ```
   This was added for the `010` migration and is still open.

Order: **release shipped → verify portals → close the allowlist → then Step 1.**

By the time you reach Step 4, the image tag you pick will already contain the new code.

---

## Step 1 — Database in Dammam

Cloud Console → **SQL** → **Create instance** → **PostgreSQL**

| Field | Value |
|---|---|
| Instance ID | `production-sa` |
| Password | generate a new one; store in a password manager, not a file |
| Database version | **PostgreSQL 16** |
| Edition | **Enterprise** |
| Region | **me-central2 (Dammam)** |
| Zonal availability | **Single zone** — see warning |
| Machine type | Shared core → **db-g1-small** |
| Storage | **SSD**, **10 GB**, automatic increases on |
| Backups | enabled, ~11:00 |

> ⚠️ **The zonal availability radio defaults to "Multiple zones (highly available)".**
> That default is how the old `trial` database ended up costing what it did — it roughly
> doubles the price. Production currently runs Single zone. Match it, or upgrade
> deliberately and tell the client, but don't accept the default by accident.

> Cloud SQL **cannot shrink a disk later**. 10 GB fits current usage and auto-grows.

---

## Step 2 — Copy the data

**2a. Export from Europe**
SQL → `production-eu` → **Export** → format **SQL**, database **postgres**,
destination `gs://my-sql-backup-saudi/prod-to-sa-YYYYMMDD.sql.gz`
*(that bucket is already in Dammam, so the export lands in-Kingdom)*

**2b. Grant read access**
SQL → `production-sa` → copy its **service account** email from the overview.
Cloud Storage → `my-sql-backup-saudi` → **Permissions** → **Grant access** → paste →
role **Storage Object Viewer** → Save.

**2c. Import**
SQL → `production-sa` → **Import** → the file → SQL → database `postgres`

**2d. Verify — run on both, compare**
```sql
SELECT count(*) FROM pos_application;   -- expect 90
SELECT count(*) FROM users;
SELECT count(*) FROM information_schema.columns
 WHERE table_name='pos_application' AND column_name='lead_score';   -- expect 1
```

---

## Step 3 — Uploads bucket in Dammam

Cloud Storage → **Create bucket** → name `nesbah-uploads-sa`,
Location type **Region** → **me-central2**, defaults otherwise.

Cloud Shell:
```bash
gcloud storage rsync -r gs://nesbah-uploads gs://nesbah-uploads-sa
```

Leaving uploads in Europe would defeat the point — applicant documents are exactly the
data the requirement is about.

---

## Step 4 — Application in Dammam

Cloud Run → **Create service**

- **Deploy one revision from an existing container image** → **Select** →
  `gcr.io/nesbahdev/nesbah-portal` → pick the tag currently live in Europe
- Service name: `nesbah-portal-sa`
- Region: **me-central2 (Dammam)**
- Authentication: **Allow unauthenticated invocations**
- **Service scaling:** Minimum **1**, Maximum **10**
  *(the form defaults minimum to 0 — that causes cold starts; production uses 1)*
- **Containers → Settings:** Memory **1 GiB**, CPU **1**, Request timeout **300**,
  Max concurrent requests **80**
- **Security → Service account:** `638895547402-compute@developer.gserviceaccount.com`
- **Connections → Cloud SQL connections:** add **production-sa**

---

## Step 5 — Environment variables

All 21, copied from Cloud Run → `nesbah-portal-v2` → **Revisions** → latest →
**Variables**. Change only the four marked ⚠️:

```
NODE_ENV=production
⚠️ PGHOST=/cloudsql/nesbahdev:me-central2:production-sa
PGPORT=5432
PGDATABASE=postgres
PGUSER=postgres
⚠️ PGPASSWORD=<new Dammam password from Step 1>
JWT_SECRET=<same as Europe — changing it logs everyone out>
JWT_EXPIRES_IN=8h
JWT_REFRESH_EXPIRES_IN=7d
WATHIQ_API_KEY=<copy>
WATHIQ_API_SECRET=<copy>
⚠️ GCS_BUCKET_NAME=nesbah-uploads-sa
GCLOUD_PROJECT_ID=nesbahdev
EMAILJS_SERVICE_ID=<copy>
EMAILJS_PUBLIC_KEY=<copy>
EMAILJS_PRIVATE_KEY=<copy>
EMAILJS_NEWSLETTER_SUBSCRIPTION_TEMPLATE_ID=<copy>
EMAILJS_SUBMISSION_TEMPLATE_ID=<copy>
EMAILJS_BANK_NEW_LEAD_TEMPLATE_ID=<copy>
ADMIN_NOTIFICATION_EMAIL=<copy>
⚠️ DISABLE_EMAIL_NOTIFICATIONS=true    ← testing only; set false at cutover
```

`DISABLE_EMAIL_NOTIFICATIONS=true` stops the Dammam copy emailing real banks about test
submissions. **Turning it off at cutover is easy to forget.**

---

## Step 6 — Test before anyone is sent there

On the new service's own `run.app` URL:

- Homepage, `/onboarding`, `/login` load
- Submit a test application → row appears in the **Dammam** database
- Admin login works, lead list renders
- `/deposits` loads (the proxied tool)
- Cloud Run **Logs** → no database errors
- Pages feel at least as fast as Europe — they should, now that app and DB are co-located

Delete the test row afterwards.

---

## Step 7 — Cutover (quiet hour; Friday morning Riyadh is typically lowest)

1. Warn admin users; avoid writes during the window.
2. **Re-export Europe → re-import Dammam** (repeat Step 2). The first copy is stale.
   **Skipping this loses every application submitted since.** Most commonly forgotten step.
3. Re-run the Step 2d counts — they must match.
4. Re-run the Step 3 `rsync` to catch new uploads.
5. Set `DISABLE_EMAIL_NOTIFICATIONS=false` on `nesbah-portal-sa`.
6. **Move the domain.** Cloud Run → `nesbah-portal-v2` → Manage custom domains →
   remove `nesbah.com.sa`. Then `nesbah-portal-sa` → Manage custom domains → add it.
   A domain maps to one service only, so the removal comes first.
   *If the load balancer is used instead:* Network services → Load balancing →
   `nesbah-backend` → point the backend at a new serverless NEG for `nesbah-portal-sa`.
7. Verify: site loads, login works, one end-to-end application submitted.

**Rollback:** move the domain mapping back to `nesbah-portal-v2`. Europe is still
running with its data. **Delete nothing for two weeks.**

---

## Step 8 — After two clean weeks

- Final export of `production-eu`, then delete it
- Delete Cloud Run `nesbah-portal-v2`
- Delete bucket `nesbah-uploads` once the Dammam copy is confirmed complete
- Update `.github/workflows/deploy.yml`:
  ```yaml
  REGION: me-central2
  SERVICE: nesbah-portal-sa
  CLOUDSQL_INSTANCE: nesbahdev:me-central2:production-sa
  ```
  and update the `PGHOST` / `PGPASSWORD` GitHub secrets.
  **Until this is done, every deploy ships back to Europe and undoes the migration.**

---

## Confirm with the client before starting

- **Cost rises** — Dammam is Tier 2 pricing, and both environments run in parallel
  during transition.
- **A short maintenance window** is needed for the final data copy.
- **Residency now covers storage and processing**, since both sit in Dammam — worth
  stating explicitly if he needs to evidence it to anyone.
