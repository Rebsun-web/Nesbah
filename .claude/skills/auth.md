# Auth guidelines — Nesbah

Read this before touching any endpoint that involves authentication,
role checking, JWT, cookies, or MFA.

---

## The auth model

Three separate auth paths through one login endpoint:

```
POST /api/auth/login
  → business_user  → JWT cookie, redirect to /business/
  → bank_user      → JWT cookie, redirect to /bank/
  → admin_user     → JWT cookie + TOTP challenge → redirect to /admin/
```

Never create a second login endpoint. Never bypass the unified flow.

---

## JWT structure

Tokens live in HTTP-only cookies. Do not change the cookie config (name, flags, expiry)
without explicit instruction. Do not add new fields to the JWT payload without checking
what verifyToken() expects downstream — it's used in 94 endpoints.

If you need user context in an endpoint, extract it from the verified token:
```javascript
const user = await verifyToken(request)
// user.id, user.role, user.bankId, user.businessId — check what fields exist
// before using them — not all roles have all fields
```

---

## Role checking — do it explicitly every time

Middleware is not enough. Check the role inside the route handler:

```javascript
// Correct — explicit role check
if (user.role !== 'bank_user' && user.role !== 'bank_employee') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// Wrong — relying on route structure to imply access
// /api/bank/... does NOT mean only bank users can reach it
```

Cross-role access rules:
- `admin_user` can access all resources
- `bank_user` can manage their bank's data only (filter by `bank_id = user.bankId`)
- `bank_employee` has subset of bank_user permissions — check specific endpoint for rules
- `business_user` can only access their own applications (filter by `business_id = user.businessId`)

---

## MFA — admin only

MFA uses TOTP via speakeasy. It only applies to `admin_user` role.
The full flow lives in `src/lib/auth/admin-auth.js` — 20,000 lines.

**Do not touch admin-auth.js without:**
1. Reading the relevant section first
2. Describing the change and waiting for confirmation
3. Testing the full login → TOTP → session flow after any modification

---

## Password handling

- bcrypt for all password operations — no other algorithm
- Never log passwords, tokens, or cookie values
- Never return password hashes in API responses — check your SELECT statements

---

## Common auth bugs to check for

Before shipping any auth-related change:
- [ ] 401 returned for unauthenticated (no token), 403 for authenticated but wrong role
- [ ] Bank users cannot access other banks' data (filter by bankId)
- [ ] Business users cannot access other businesses' data (filter by businessId)
- [ ] Admin routes verify MFA completion, not just JWT presence
- [ ] Token expiry handled — expired token returns 401, not 500
- [ ] No sensitive data (password hash, raw token) in response body or logs