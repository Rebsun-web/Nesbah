#!/bin/bash

# Nesbah Production Deployment Script
# This script deploys the application to Google Cloud Run with all required environment variables

set -e  # Exit on any error

echo "🚀 Starting Nesbah Production Deployment..."

# Clean up old resources
echo "🧹 Cleaning up old resources..."
gcloud run services delete nesbahdev-app --region=me-central1 --quiet || echo "Service nesbahdev-app not found, continuing..."

# List and clean up old images
echo "📋 Listing existing images..."
gcloud container images list --repository=gcr.io/nesbahdev

echo "🗑️  Deleting old image..."
gcloud container images delete gcr.io/nesbahdev/nesbahdev-app --force-delete-tags --quiet || echo "Old image not found, continuing..."

# Build the Docker image
echo "🏗️  Building Docker image..."
docker build -t nesbah-portal .

# Tag for the project
echo "🏷️  Tagging image for Google Container Registry..."
docker tag nesbah-portal gcr.io/nesbahdev/nesbah-portal

# Push to Google Container Registry
echo "📤 Pushing image to Google Container Registry..."
docker push gcr.io/nesbahdev/nesbah-portal

# Deploy to Cloud Run with all environment variables
echo "🚀 Deploying to Cloud Run with environment variables..."

gcloud run deploy nesbah-portal \
  --image gcr.io/nesbahdev/nesbah-portal \
  --platform managed \
  --region me-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --cpu 1 \
  --max-instances 10 \
  --min-instances 0 \
  --set-env-vars="DATABASE_URL=postgresql://postgres:Riyadh123%21%40%23@34.166.77.134:5432/postgres" \
  --set-env-vars="NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=1Ivllk-5mFxZxATpz" \
  --set-env-vars="NEXT_PUBLIC_EMAILJS_SERVICE_ID=service_mykz9r4" \
  --set-env-vars="NEXT_PUBLIC_EMAILJS_NEWSLETTER_TEMPLATE_ID=newsletter_subscription" \
  --set-env-vars="EMAILJS_SERVICE_ID=service_mykz9r4" \
  --set-env-vars="EMAILJS_PUBLIC_KEY=1Ivllk-5mFxZxATpz" \
  --set-env-vars="EMAILJS_PRIVATE_KEY=267xl81NNi-ekrb-BrYh7" \
  --set-env-vars="EMAILJS_NEWSLETTER_SUBSCRIPTION_TEMPLATE_ID=newsletter_subscription" \
  --set-env-vars="EMAILJS_BUSINESS_REGISTRATION_TEMPLATE_ID=business_user_registration_welcome" \
  --set-env-vars="EMAILJS_APPLICATION_SUBMITTED_TEMPLATE_ID=application_submission_confirmation" \
  --set-env-vars="EMAILJS_AUCTION_EXPIRATION_TEMPLATE_ID=auction_window_expiry" \
  --set-env-vars="EMAILJS_NEW_APPLICATION_LEAD_TEMPLATE_ID=new_application_lead_bank" \
  --set-env-vars="DISABLE_EMAIL_NOTIFICATIONS=false" \
  --set-env-vars="PGHOST=34.166.77.134" \
  --set-env-vars="PGPORT=5432" \
  --set-env-vars="PGDATABASE=postgres" \
  --set-env-vars="PGUSER=postgres" \
  --set-env-vars="PGPASSWORD=Riyadh123!@#" \
  --set-env-vars="NODE_ENV=production" \
  --set-env-vars="PORT=8080" \
  --set-env-vars="WATHQ_API_KEY=vFRBMGAv78vRdCAnbXhVJMcN6AaxLn34" \
  --set-env-vars="DEFAULT_AUCTION_HOURS=48" \
  --set-env-vars="JWT_SECRET=5f45fca69e952df8e813d8bcf8d3e5aa6e4887ee482adfb5e8d435a7d2e99966df067687881f2c21fbfdc640bd5109e99f7241a96e8326c9fb506c2dd1434abc" \
  --set-env-vars="JWT_EXPIRES_IN=8h" \
  --set-env-vars="JWT_REFRESH_EXPIRES_IN=7d" \
  --set-env-vars="JWT_ISSUER=nesbah-app" \
  --set-env-vars="JWT_AUDIENCE=nesbah-users" \
  --set-env-vars="MFA_SECRET=ceefb7c3d2afe33d4f8482cda39daee6a75360e2199a91e13dc0f2dfa596a8f5"

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "🔗 Getting service URL..."
SERVICE_URL=$(gcloud run services describe nesbah-portal --region=me-central1 --format='value(status.url)')
echo "Service URL: $SERVICE_URL"
echo ""
echo "🧪 Testing deployment..."
echo "You can now test your application at: $SERVICE_URL"
echo ""
echo "🔐 Test login with:"
echo "  - Admin: admin@nesbah.com"
echo "  - Bank: bank@nesbah.com"
echo ""
echo "📊 Monitor logs with:"
echo "  gcloud run services logs read nesbah-portal --region=me-central1 --limit=50"
