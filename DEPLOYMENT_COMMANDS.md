# Google Cloud Run Deployment Commands

## Complete Deployment Steps

### 1. Build Docker image locally:
```bash
docker build -t nesbah-portal .
```

### 2. Test it locally (optional):
```bash
docker run -p 3000:3000 nesbah-portal
```

### 3. Push to Google Cloud Container Registry:
```bash
# Tag the image
docker tag nesbah-portal gcr.io/nesbahdev/nesbah-portal

# Push to GCR
docker push gcr.io/nesbahdev/nesbah-portal
```

### 4. Deploy on Google Cloud Run:
```bash
gcloud run deploy nesbah-portal \
  --image gcr.io/nesbahdev/nesbah-portal \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --set-env-vars="PGHOST=34.166.77.134,PGPORT=5432,PGDATABASE=postgres,PGUSER=postgres,PGPASSWORD=Riyadh123!@#,NODE_ENV=production,JWT_SECRET=5f45fca69e952df8e813d8bcf8d3e5aa6e4887ee482adfb5e8d435a7d2e99966df067687881f2c21fbfdc640bd5109e99f7241a96e8326c9fb506c2dd1434abc,JWT_EXPIRES_IN=8h,JWT_REFRESH_EXPIRES_IN=7d"
```

## Quick Deploy (Using the Script)

Alternatively, you can use the provided deployment script:

```bash
chmod +x deploy.sh
./deploy.sh
```

## Project Details

- **Project ID**: `nesbahdev`
- **Region**: `europe-west1`
- **Service Name**: `nesbah-portal`
- **Service URL**: `https://nesbah-portal-638895547402.europe-west1.run.app`

## Prerequisites

1. Make sure you're authenticated with Google Cloud:
   ```bash
   gcloud auth login
   ```

2. Set the project:
   ```bash
   gcloud config set project nesbahdev
   ```

3. Enable required APIs:
   ```bash
   gcloud services enable run.googleapis.com
   gcloud services enable containerregistry.googleapis.com
   ```

4. Configure Docker to use gcloud as a credential helper:
   ```bash
   gcloud auth configure-docker
   ```


