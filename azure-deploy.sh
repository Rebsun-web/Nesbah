#!/bin/bash

# Azure Deployment Script for nesbah.ae
# This script deploys the Nesbah portal to Azure App Service

set -e

# Configuration
RESOURCE_GROUP="nesbah-web-rg"
APP_NAME="nesbah-ae"
LOCATION="East US"  # Change to your preferred Azure region
PLAN_NAME="nesbah-app-plan"
SKU="B1"  # Basic tier - adjust as needed

echo "🚀 Starting Azure deployment for nesbah.ae..."

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI is not installed. Please install it first:"
    echo "   brew install azure-cli"
    exit 1
fi

# Check if logged in
if ! az account show &> /dev/null; then
    echo "🔐 Please login to Azure first:"
    echo "   az login"
    exit 1
fi

echo "✅ Azure CLI authenticated"

# Create resource group
echo "📦 Creating resource group: $RESOURCE_GROUP"
az group create \
    --name $RESOURCE_GROUP \
    --location "$LOCATION" \
    --output table

# Create App Service plan
echo "🏗️ Creating App Service plan: $PLAN_NAME"
az appservice plan create \
    --name $PLAN_NAME \
    --resource-group $RESOURCE_GROUP \
    --location "$LOCATION" \
    --sku $SKU \
    --is-linux \
    --output table

# Create web app
echo "🌐 Creating web app: $APP_NAME"
az webapp create \
    --resource-group $RESOURCE_GROUP \
    --plan $PLAN_NAME \
    --name $APP_NAME \
    --runtime "NODE|20-lts" \
    --output table

# Configure app settings
echo "⚙️ Configuring app settings..."
az webapp config appsettings set \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME \
    --settings \
        NODE_ENV=production \
        PORT=8080 \
        WEBSITES_PORT=8080 \
        WEBSITES_ENABLE_APP_SERVICE_STORAGE=false \
    --output table

# Configure startup command
echo "🚀 Setting startup command..."
az webapp config set \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME \
    --startup-file "npm start" \
    --output table

# Deploy the application
echo "📤 Deploying application..."
az webapp deployment source config-zip \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME \
    --src ./deployment-package.zip \
    --output table

# Get the app URL
APP_URL=$(az webapp show \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME \
    --query defaultHostName \
    --output tsv)

echo "✅ Deployment completed successfully!"
echo "🌐 Your app is available at: https://$APP_URL"
echo "📊 Monitor your app at: https://portal.azure.com"

# Optional: Configure custom domain
echo ""
echo "🔧 To configure custom domain (nesbah.ae):"
echo "   1. Go to Azure Portal > App Services > $APP_NAME"
echo "   2. Navigate to Custom domains"
echo "   3. Add your domain and configure DNS"
