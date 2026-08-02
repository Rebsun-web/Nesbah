#!/bin/bash

# Nesbah Portal — manual deployment script.
#
# ⚠️  CI/CD (.github/workflows/deploy.yml) is the canonical deploy path. It reads
#     credentials from GitHub Actions secrets and targets the correct Cloud SQL
#     instance. Prefer it. This script exists only for a manual deploy when CI is
#     unavailable.
#
# ⚠️  This script previously hardcoded the production database password and
#     JWT_SECRET in plaintext, in a file tracked in a PUBLIC repository. Those
#     values are compromised and must be rotated — deleting them from this file
#     does not undo the exposure. Never put a credential back in here; pass them
#     in as environment variables at run time.
#
#     It also hardcoded PGHOST=34.166.77.134, a database that has since been
#     decommissioned. Running the old version would have repointed production at
#     a dead host.
#
# Usage:
#   PGHOST=... PGDATABASE=... PGUSER=... PGPASSWORD=... JWT_SECRET=... ./deploy.sh
#
# Better still for anything long-lived: keep these in Secret Manager and reference
# them with `gcloud run deploy --set-secrets`, so no credential is ever passed on a
# command line, where it lands in shell history and process listings.

set -euo pipefail

PROJECT_ID="${PROJECT_ID:-nesbahdev}"
SERVICE="${SERVICE:-nesbah-portal}"
REGION="${REGION:-europe-west1}"
IMAGE="${IMAGE:-gcr.io/${PROJECT_ID}/nesbah-portal}"

# Required at run time — no defaults. A missing value must stop the deploy rather
# than silently ship a revision pointing at the wrong database.
: "${PGHOST:?PGHOST is required (Cloud SQL host or /cloudsql socket path)}"
: "${PGDATABASE:?PGDATABASE is required}"
: "${PGUSER:?PGUSER is required}"
: "${PGPASSWORD:?PGPASSWORD is required}"
: "${JWT_SECRET:?JWT_SECRET is required}"

PGPORT="${PGPORT:-5432}"
JWT_EXPIRES_IN="${JWT_EXPIRES_IN:-8h}"
JWT_REFRESH_EXPIRES_IN="${JWT_REFRESH_EXPIRES_IN:-7d}"

echo "🚀 Deploying ${SERVICE} to ${REGION} (project ${PROJECT_ID})"
echo "   DB host: ${PGHOST}   database: ${PGDATABASE}   user: ${PGUSER}"
echo "   (secrets are not echoed)"

echo "📦 Building Docker image..."
docker build -t nesbah-portal .

echo "🏷️  Tagging for GCR..."
docker tag nesbah-portal "${IMAGE}"

echo "⬆️  Pushing to GCR..."
docker push "${IMAGE}"

echo "🚀 Deploying to Cloud Run..."
gcloud run deploy "${SERVICE}" \
  --project "${PROJECT_ID}" \
  --image "${IMAGE}" \
  --platform managed \
  --region "${REGION}" \
  --allow-unauthenticated \
  --set-env-vars="PGHOST=${PGHOST},PGPORT=${PGPORT},PGDATABASE=${PGDATABASE},PGUSER=${PGUSER},PGPASSWORD=${PGPASSWORD},NODE_ENV=production,JWT_SECRET=${JWT_SECRET},JWT_EXPIRES_IN=${JWT_EXPIRES_IN},JWT_REFRESH_EXPIRES_IN=${JWT_REFRESH_EXPIRES_IN}"

echo "✅ Deployment completed."
