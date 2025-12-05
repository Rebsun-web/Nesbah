# File Storage Guide

## Current File Storage Situation

### 1. **Bank Logos** 📸
- **Location**: `public/uploads/bank-logos/` (local filesystem)
- **Status**: ❌ **LOST on redeployment** (Cloud Run has ephemeral storage)
- **Routes**: 
  - `/api/admin/users/upload-bank-logo` (admin upload)
  - `/api/upload/bank-logo` (general upload)

### 2. **Application Documents** 📄
- **Location**: `public/uploads/documents/{userId}/` (local filesystem)
- **Status**: ❌ **LOST on redeployment**
- **Routes**: `/api/upload/document`

### 3. **Offer Files** 💼
- **Location**: Database (`application_offers.uploaded_document` as base64)
- **Status**: ✅ **PERSISTENT** (stored in database)
- **Issue**: ⚠️ Inefficient for large files (increases database size)

## Problem: Files Lost on Redeployment

**Why files are lost:**
- Cloud Run containers are **ephemeral** - filesystem is wiped on:
  - Container restart
  - New deployment
  - Scaling events
  - Container replacement

## Solution: Google Cloud Storage (GCS)

### Recommended Approach

**For Production:**
- Use **Google Cloud Storage** bucket for all file uploads
- Files persist across deployments
- Scalable and cost-effective
- CDN-ready

**For Development:**
- Keep local filesystem (current approach)
- Faster for local testing

### Implementation Steps

#### 1. Install GCS SDK
```bash
npm install @google-cloud/storage
```

#### 2. Create GCS Bucket
```bash
# Create bucket
gsutil mb -p nesbahdev -l europe-west1 gs://nesbah-uploads

# Make bucket publicly readable (for logos/images)
gsutil iam ch allUsers:objectViewer gs://nesbah-uploads
```

#### 3. Set Environment Variables
Add to Cloud Run environment variables:
```
GCS_BUCKET_NAME=nesbah-uploads
GCLOUD_PROJECT_ID=nesbahdev
```

#### 4. Update Upload Routes

**Bank Logo Upload** (`src/app/api/admin/users/upload-bank-logo/route.jsx`):
- Use GCS in production
- Use local filesystem in development

**Document Upload** (`src/app/api/upload/document/route.jsx`):
- Use GCS in production
- Use local filesystem in development

#### 5. Migration Strategy

**Option A: Gradual Migration**
- New uploads → GCS
- Old files remain in database/filesystem
- Migrate old files over time

**Option B: Full Migration**
- Migrate all existing files to GCS
- Update all file URLs in database
- Remove local filesystem code

## File Storage Service

I've created `src/lib/storage/gcs-storage.js` that:
- ✅ Automatically uses GCS in production
- ✅ Falls back to local filesystem in development
- ✅ Handles both upload and delete operations
- ✅ Returns proper URLs for both storage types

## Next Steps

1. **Install GCS SDK**: `npm install @google-cloud/storage`
2. **Create GCS bucket** (see commands above)
3. **Update upload routes** to use the storage service
4. **Test locally** (should still use filesystem)
5. **Deploy and test** (should use GCS)

## Current File Locations Summary

| File Type | Current Storage | Status | Solution |
|-----------|----------------|--------|----------|
| Bank Logos | `public/uploads/bank-logos/` | ❌ Lost on deploy | → GCS |
| Documents | `public/uploads/documents/` | ❌ Lost on deploy | → GCS |
| Offer Files | Database (base64) | ✅ Persistent | → GCS (better performance) |

## Benefits of GCS

1. **Persistent**: Files survive deployments
2. **Scalable**: Handle unlimited files
3. **Cost-effective**: Pay only for storage used
4. **Fast**: CDN-ready for global access
5. **Secure**: Fine-grained access control
6. **Reliable**: 99.99% availability SLA

