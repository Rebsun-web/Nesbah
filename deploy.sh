#!/bin/bash

# Nesbah Portal Deployment Script
# This script handles the URL encoding issues with DATABASE_URL in Cloud Run

set -e

echo "🚀 Starting Nesbah Portal deployment..."

# Build Docker image
echo "📦 Building Docker image..."
docker build -t nesbah-portal .

# Tag for Google Cloud Registry
echo "🏷️ Tagging image for GCR..."
docker tag nesbah-portal gcr.io/nesbahdev/nesbah-portal

# Push to Google Cloud Registry
echo "⬆️ Pushing to Google Cloud Registry..."
docker push gcr.io/nesbahdev/nesbah-portal

# Deploy to Cloud Run with individual environment variables to avoid URL encoding issues
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy nesbah-portal \
  --image gcr.io/nesbahdev/nesbah-portal \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --set-env-vars="PGHOST=34.166.77.134,PGPORT=5432,PGDATABASE=postgres,PGUSER=postgres,PGPASSWORD=Riyadh123!@#,NODE_ENV=production,JWT_SECRET=5f45fca69e952df8e813d8bcf8d3e5aa6e4887ee482adfb5e8d435a7d2e99966df067687881f2c21fbfdc640bd5109e99f7241a96e8326c9fb506c2dd1434abc,JWT_EXPIRES_IN=8h,JWT_REFRESH_EXPIRES_IN=7d"

echo "✅ Deployment completed successfully!"
echo "🌐 Service URL: https://nesbah-portal-638895547402.europe-west1.run.app"
