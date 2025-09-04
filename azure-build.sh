#!/bin/bash

# Azure Build Script for nesbah.ae
# This script prepares the application for Azure App Service deployment

set -e

echo "🔨 Building application for Azure deployment..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf .next
rm -rf deployment-package.zip

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build the application
echo "🏗️ Building Next.js application..."
npm run build

# Create deployment package
echo "📦 Creating deployment package..."
zip -r deployment-package.zip . \
    -x "node_modules/*" \
    -x ".git/*" \
    -x ".next/cache/*" \
    -x "*.log" \
    -x ".env.local" \
    -x ".env.development" \
    -x "deployment-package.zip"

echo "✅ Build completed successfully!"
echo "📦 Deployment package created: deployment-package.zip"
echo "🚀 Ready for Azure deployment. Run: ./azure-deploy.sh"
