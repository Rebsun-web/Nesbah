# 🚀 Nesbah Portal Deployment Guide

This guide will walk you through deploying the Nesbah Portal to Google Cloud Run.

## 📋 Prerequisites

Before starting, ensure you have:

- [Google Cloud CLI (gcloud)](https://cloud.google.com/sdk/docs/install) installed
- [Docker](https://docs.docker.com/get-docker/) installed
- Access to a Google Cloud Project
- Your database credentials and environment variables ready

## 🔧 Step 1: Google Cloud Setup

### 1.1 Install Google Cloud CLI
```bash
# macOS (using Homebrew)
brew install google-cloud-sdk

# Windows (download installer)
# https://cloud.google.com/sdk/docs/install#windows

# Linux
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

### 1.2 Authenticate with Google Cloud
```bash
gcloud auth login
gcloud auth application-default login
```

### 1.3 Set Your Project ID
```bash
# Replace YOUR_PROJECT_ID with your actual project ID
gcloud config set project YOUR_PROJECT_ID
```

## 🐳 Step 2: Local Docker Build & Test

### 2.1 Build the Docker Image
```bash
docker build -t nesbah-portal .
```

### 2.2 Test Locally (Optional)
```bash
docker run -p 3000:8080 \
  -e DATABASE_URL="your-database-url" \
  -e NODE_ENV=production \
  nesbah-portal
```

Visit `http://localhost:3000` to test your application.

## 🚀 Step 3: Deploy to Google Cloud Run

### 3.1 Enable Required APIs
```bash
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### 3.2 Configure Docker for Google Container Registry
```bash
gcloud auth configure-docker
```

### 3.3 Build and Push Image
```bash
# Tag the image for GCR
docker tag nesbah-portal gcr.io/YOUR_PROJECT_ID/nesbah-portal

# Push to GCR
docker push gcr.io/YOUR_PROJECT_ID/nesbah-portal
```

### 3.4 Deploy to Cloud Run
```bash
gcloud run deploy nesbah-portal \
  --image gcr.io/YOUR_PROJECT_ID/nesbah-portal \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 2Gi \
  --cpu 2 \
  --max-instances 10 \
  --set-env-vars NODE_ENV=production
```

## 🔐 Step 4: Environment Variables

### 4.1 Set Production Environment Variables
```bash
gcloud run services update nesbah-portal \
  --region us-central1 \
  --set-env-vars \
    DATABASE_URL="postgresql://postgres:Riyadh123%21%40%23@34.166.77.134:5432/postgres",\
    PGHOST="34.166.77.134",\
    PGPORT="5432",\
    PGDATABASE="postgres",\
    PGUSER="postgres",\
    PGPASSWORD="Riyadh123!@#",\
    NEXT_PUBLIC_EMAILJS_SERVICE_ID="service_mykz9r4",\
    NEXT_PUBLIC_EMAILJS_TEMPLATE_ID="template_ed4f33c",\
    NEXT_PUBLIC_EMAILJS_PUBLIC_KEY="1Ivllk-5mFxZxATpz",\
    EMAILJS_PRIVATE_KEY="267xl81NNi-ekrb-BrYh7",\
    NODE_ENV="production"
```

### 4.2 Set Secrets (Recommended for sensitive data)
```bash
# Create secrets
echo -n "Riyadh123!@#" | gcloud secrets create nesbah-db-password --data-file=-

# Update service to use secrets
gcloud run services update nesbah-portal \
  --region us-central1 \
  --set-env-vars \
    PGPASSWORD="nesbah-db-password" \
  --update-secrets \
    PGPASSWORD="nesbah-db-password:latest"
```

## 🌐 Step 5: Custom Domain Setup

### 5.1 Map Custom Domain
```bash
gcloud run domain-mappings create \
  --service nesbah-portal \
  --domain nesbah.com.sa \
  --region us-central1
```

### 5.2 Update DNS Records
Add a CNAME record in your DNS provider:
```
Type: CNAME
Name: @
Value: ghs.googlehosted.com
```

## 📊 Step 6: Monitoring & Scaling

### 6.1 View Service Details
```bash
gcloud run services describe nesbah-portal --region us-central1
```

### 6.2 Monitor Logs
```bash
gcloud logs tail --service nesbah-portal --region us-central1
```

### 6.3 Set Up Alerts
- Go to [Google Cloud Console](https://console.cloud.google.com)
- Navigate to Monitoring > Alerting
- Create alerts for:
  - High error rates
  - High latency
  - Resource usage

## 🔄 Step 7: Continuous Deployment (Optional)

### 7.1 Set Up Cloud Build Trigger
```bash
# Create a trigger for automatic deployment
gcloud builds triggers create github \
  --repo-name=newPortal \
  --repo-owner=nesbahSa \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml
```

### 7.2 Create Cloud Build Configuration
Create `cloudbuild.yaml`:
```yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/nesbah-portal', '.']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/nesbah-portal']
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'nesbah-portal'
      - '--image'
      - 'gcr.io/$PROJECT_ID/nesbah-portal'
      - '--region'
      - 'us-central1'
      - '--platform'
      - 'managed'
```

## 🧪 Step 8: Testing

### 8.1 Health Check
```bash
# Get your service URL
SERVICE_URL=$(gcloud run services describe nesbah-portal --region=us-central1 --format="value(status.url)")

# Test health endpoint
curl $SERVICE_URL/api/health
```

### 8.2 Functional Testing
- Test user registration/login
- Test database connections
- Test email functionality
- Test file uploads
- Test admin functions

## 🚨 Troubleshooting

### Common Issues

#### 1. Build Failures
```bash
# Check build logs
docker build -t nesbah-portal . --progress=plain

# Verify Dockerfile syntax
docker run --rm -i hadolint/hadolint < Dockerfile
```

#### 2. Runtime Errors
```bash
# Check service logs
gcloud logs tail --service nesbah-portal --region us-central1

# Check service status
gcloud run services describe nesbah-portal --region us-central1
```

#### 3. Database Connection Issues
- Verify database credentials
- Check firewall rules
- Ensure database is accessible from Cloud Run

#### 4. Environment Variables
```bash
# List current environment variables
gcloud run services describe nesbah-portal --region us-central1 --format="value(spec.template.spec.containers[0].env[].name,spec.template.spec.containers[0].env[].value)"
```

## 📈 Performance Optimization

### 1. Resource Allocation
```bash
# Update service with optimal resources
gcloud run services update nesbah-portal \
  --region us-central1 \
  --memory 4Gi \
  --cpu 4 \
  --max-instances 20
```

### 2. Enable CDN
```bash
# Enable Cloud CDN for static assets
gcloud compute backend-buckets create nesbah-static \
  --gcs-bucket-name=your-static-bucket
```

## 🔒 Security Best Practices

1. **Use Secrets Manager** for sensitive data
2. **Enable VPC Connector** for private database access
3. **Set up IAM roles** with minimal permissions
4. **Enable audit logging**
5. **Regular security updates**

## 📞 Support

If you encounter issues:

1. Check the [Google Cloud Run documentation](https://cloud.google.com/run/docs)
2. Review service logs: `gcloud logs tail --service nesbah-portal`
3. Check service status: `gcloud run services describe nesbah-portal`
4. Contact your DevOps team or Google Cloud support

## 🎯 Next Steps

After successful deployment:

1. Set up monitoring and alerting
2. Configure backup strategies
3. Implement CI/CD pipelines
4. Set up staging environments
5. Plan disaster recovery procedures

---

**Happy Deploying! 🚀**
