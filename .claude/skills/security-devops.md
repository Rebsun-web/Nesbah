# Security & DevOps guidelines — Nesbah

Read this for every task. Security applies regardless of whether the task looks
like a "security task" — auth, SQL, env vars, file uploads all have security implications.

---

## Critical — active issues in this codebase

### `.env.local` is tracked in git
Real credentials (DB password, EmailJS private key, GCS project ID) are in `.env.local`
which is committed to the repository. This is a known issue.

**Rules until this is fixed:**
- Do NOT add new secrets to `.env.local`
- Do NOT log any env variable values
- Do NOT introduce new hardcoded credentials anywhere

**To fix it properly (do this once):**
```bash
# 1. Rotate all credentials first (DB password, EmailJS key, GCS key)
# 2. Add to .gitignore
echo ".env.local" >> .gitignore
# 3. Remove from git history
git rm --cached .env.local
git commit -m "Remove .env.local from tracking"
# 4. Create .env.local.example with key names but no values — commit this
# 5. Update README with setup instructions
```

---

## SQL injection — zero tolerance

```javascript
// CORRECT — parameterised always
await query('SELECT * FROM users WHERE id = $1', [userId])

// CRITICAL BUG — never do this
await query(`SELECT * FROM users WHERE id = ${userId}`)
await query('SELECT * FROM users WHERE id = ' + userId)
```

If you see string interpolation in SQL anywhere in this codebase, flag it as a bug.

---

## Auth rules (summary — full rules in auth.md)

- 401 for unauthenticated, 403 for wrong role
- Bank users filtered by `bank_id` — cannot access other banks' data
- Business users filtered by `business_id` — cannot access other businesses' data
- Never expose password hashes, tokens, or MFA secrets in API responses

---

## File uploads (Busboy + GCS)

- Validate MIME type server-side — do not trust the `Content-Type` header from the client
- Validate file size before processing
- GCS bucket permissions should be private — files served via signed URLs, not public
- Never store uploaded files in the local filesystem on Cloud Run (ephemeral container)

---

## Google Cloud Run specifics

```dockerfile
# Always: non-root user
RUN addgroup -S app && adduser -S app -G app
USER app

# Port 8080 — Cloud Run requirement
EXPOSE 8080
ENV PORT=8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s \
  CMD wget -qO- http://localhost:8080/api/health || exit 1
```

- Container is ephemeral — no local file storage persists between requests
- All persistent storage goes to GCS or PostgreSQL
- Secrets come from environment variables injected at runtime by Cloud Run — not baked into the image

---

## Environment variables

Required vars (from current setup):
```
DATABASE_URL          or individual PG* vars
EMAILJS_SERVICE_ID
EMAILJS_TEMPLATE_ID
EMAILJS_PRIVATE_KEY
GCS_PROJECT_ID
GCS_BUCKET_NAME
JWT_SECRET
```

Rules:
- All secrets via env vars — never hardcoded
- Check `process.env.VAR` is defined at startup, not at call time
- Never log env var values
- `.env.local.example` should document all required keys (no values)

---

## node-cron background tasks

`src/lib/background-tasks.js` runs auction automation with real financial side effects.

- Do not add cron jobs without explicit discussion
- Do not change job schedules without understanding the business logic
- Background jobs must handle errors internally — an uncaught exception crashes the job scheduler

---

## GitHub Actions CI (transitional state)

`.github/workflows/` may target Azure Static Web Apps — this appears to be legacy/transitional.
Do not modify CI workflows without confirming the current deployment target (Cloud Run vs Azure).

---

## Wathiq API (Saudi gov CR validation)

`src/lib/wathiq-api-service.js` is an external government API integration.
- Do not modify without understanding the current error handling
- API failures should be caught and handled gracefully — do not let Wathiq errors crash application flows
- Credentials come from env vars

---

## Before marking done

- [ ] No new secrets hardcoded anywhere
- [ ] No string interpolation in SQL
- [ ] File uploads validate MIME type and size server-side
- [ ] No sensitive data (passwords, tokens, hashes) in API responses or logs
- [ ] Env vars used for all external service credentials
- [ ] No local filesystem writes (Cloud Run is ephemeral)