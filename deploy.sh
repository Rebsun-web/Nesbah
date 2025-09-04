#!/bin/bash

# Nesbah Portal Deployment Script for Google Cloud Run
# This script automates the deployment process

set -e  # Exit on any error

# Configuration - UPDATE THESE VALUES
PROJECT_ID="nesbah-portal"  # Replace with your actual GCP project ID
REGION="me-central1"              # Middle East (Doha) - closest to Saudi Arabia
SERVICE_NAME="nesbah-portal"
IMAGE_NAME="nesbah-portal"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Nesbah Portal Deployment to Google Cloud Run${NC}"
echo "=================================================="

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ Google Cloud CLI (gcloud) is not installed.${NC}"
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed.${NC}"
    echo "Please install Docker Desktop or Docker Engine"
    exit 1
fi

# Check if user is authenticated
echo -e "${YELLOW}🔐 Checking Google Cloud authentication...${NC}"
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${YELLOW}⚠️  Not authenticated. Please run: gcloud auth login${NC}"
    gcloud auth login
fi

# Set the project
echo -e "${YELLOW}📋 Setting GCP project to: ${PROJECT_ID}${NC}"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo -e "${YELLOW}🔧 Enabling required Google Cloud APIs...${NC}"
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com

# Configure Docker for GCR
echo -e "${YELLOW}🐳 Configuring Docker for Google Container Registry...${NC}"
gcloud auth configure-docker

# Build Docker image
echo -e "${YELLOW}🔨 Building Docker image: ${IMAGE_NAME}${NC}"
docker build -t $IMAGE_NAME .

# Tag image for GCR
echo -e "${YELLOW}🏷️  Tagging image for Google Container Registry...${NC}"
docker tag $IMAGE_NAME gcr.io/$PROJECT_ID/$IMAGE_NAME

# Push image to GCR
echo -e "${YELLOW}📤 Pushing image to Google Container Registry...${NC}"
docker push gcr.io/$PROJECT_ID/$IMAGE_NAME

# Deploy to Cloud Run
echo -e "${YELLOW}🚀 Deploying to Google Cloud Run...${NC}"
gcloud run deploy $SERVICE_NAME \
    --image gcr.io/$PROJECT_ID/$IMAGE_NAME \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --port 8080 \
    --memory 2Gi \
    --cpu 2 \
    --max-instances 10 \
    --set-env-vars NODE_ENV=production

# Get the service URL
echo -e "${YELLOW}🔍 Getting service URL...${NC}"
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo "=================================================="
echo -e "${GREEN}🌐 Service URL: ${SERVICE_URL}${NC}"
echo -e "${GREEN}📊 Monitor your service at: https://console.cloud.google.com/run/detail/${REGION}/${SERVICE_NAME}${NC}"
echo ""
echo -e "${BLUE}📝 Next steps:${NC}"
echo "1. Update your DNS records to point to this service"
echo "2. Configure custom domain if needed"
echo "3. Set up monitoring and alerts"
echo "4. Test all functionality"

# Clean up local images
echo -e "${YELLOW}🧹 Cleaning up local Docker images...${NC}"
docker rmi $IMAGE_NAME gcr.io/$PROJECT_ID/$IMAGE_NAME

echo -e "${GREEN}🎉 Deployment script completed!${NC}"
