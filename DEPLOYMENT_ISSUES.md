# Deployment Issues & Solutions

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

3. **Deploy with individual variables**:
   ```bash
   gcloud run deploy nesbah-portal \
     --set-env-vars="PGHOST=34.166.77.134,PGPORT=5432,PGDATABASE=postgres,PGUSER=postgres,PGPASSWORD=Riyadh123!@#"
   ```

### Prevention
- Use the provided `deploy.sh` script for consistent deployments
- The database configuration now automatically detects production environment and uses individual variables
- Added logging to help debug connection issues

### Manual Fix (if needed)
If the circuit breaker is OPEN:
1. Update Cloud Run service with individual environment variables
2. Wait for new revision to deploy
3. Circuit breaker will reset automatically

### Environment Variables for Production
```
PGHOST=34.166.77.134
PGPORT=5432
PGDATABASE=postgres
PGUSER=postgres
PGPASSWORD=Riyadh123!@#
NODE_ENV=production
JWT_SECRET=5f45fca69e952df8e813d8bcf8d3e5aa6e4887ee482adfb5e8d435a7d2e99966df067687881f2c21fbfdc640bd5109e99f7241a96e8326c9fb506c2dd1434abc
JWT_EXPIRES_IN=8h
JWT_REFRESH_EXPIRES_IN=7d
```
