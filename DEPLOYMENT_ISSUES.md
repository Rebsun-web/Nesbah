# Deployment Issues & Solutions

> ⚠️ **This file previously contained the live production database password and
> `JWT_SECRET` in plaintext, in a repository that is public.** The values have been
> removed, but removal does not undo the exposure — anything committed to a public
> repo (or a fork of one) stays retrievable. **Both credentials must be rotated.**
>
> Never paste a real credential into documentation. Use placeholders, as below.

## Database Connection Issues in Cloud Run

### Problem
The `DATABASE_URL` environment variable with URL-encoded characters (like `%21%40%23` for `!@#`) causes connection failures in Google Cloud Run, triggering the circuit breaker.

### Root Cause
- Cloud Run environment doesn't properly handle URL-encoded characters in `DATABASE_URL`
- The `pg` library in production sometimes fails to decode the connection string correctly
- This leads to consecutive connection failures, opening the circuit breaker

### Solution
1. **Use individual environment variables instead of `DATABASE_URL` in production**
2. **Modified `src/lib/db.js`** to prioritize individual vars in production:
   ```javascript
   const useIndividualVars = process.env.NODE_ENV === 'production' && 
     (process.env.PGHOST && process.env.PGUSER && process.env.PGPASSWORD);
   ```

3. **Deploy with individual variables** — values supplied from CI secrets or the
   environment, never written into a file:
   ```bash
   gcloud run deploy nesbah-portal \
     --set-env-vars="PGHOST=<host>,PGPORT=5432,PGDATABASE=<db>,PGUSER=<user>,PGPASSWORD=<from-secret-store>"
   ```

### Prevention
- CI/CD (`.github/workflows/deploy.yml`) is the canonical deploy path; it reads credentials from GitHub Actions secrets
- `deploy.sh` is for manual fallback only and now requires every credential to be passed in as an environment variable
- The database configuration automatically detects production and uses individual variables
- Added logging to help debug connection issues

### Manual Fix (if needed)
If the circuit breaker is OPEN:
1. Update Cloud Run service with individual environment variables
2. Wait for new revision to deploy
3. Circuit breaker will reset automatically

### Environment Variables for Production

Names only — the values live in GitHub Actions secrets and Cloud Run's environment,
and should move to Secret Manager.

```
PGHOST=<cloud-sql-host-or-socket>
PGPORT=5432
PGDATABASE=<database>
PGUSER=<user>
PGPASSWORD=<from-secret-store>
NODE_ENV=production
JWT_SECRET=<from-secret-store>
JWT_EXPIRES_IN=8h
JWT_REFRESH_EXPIRES_IN=7d
```

> Historical note: this file previously documented `PGHOST=34.166.77.134`. That
> instance has been decommissioned — see the project notes for the current host.
