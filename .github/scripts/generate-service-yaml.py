"""
Generates /tmp/cloudrun-service.yaml for `gcloud run services replace`.

Reads env vars injected by GitHub Actions and produces a Cloud Run service spec with:
  - Custom Cloud SQL Auth Proxy sidecar (--dialer-keep-alive=5s)
  - Shared Unix socket volume between app and proxy
  - minScale=1 so the instance never freezes and the proxy tunnel stays alive
"""
import os
import sys

image = os.environ.get("IMAGE_SHA", "").strip()
if not image:
    print("ERROR: IMAGE_SHA env var is required", file=sys.stderr)
    sys.exit(1)

env_vars = {
    "NODE_ENV": "production",
    "PGHOST": os.environ.get("S_PGHOST", ""),
    "PGPORT": os.environ.get("S_PGPORT", ""),
    "PGDATABASE": os.environ.get("S_PGDATABASE", ""),
    "PGUSER": os.environ.get("S_PGUSER", ""),
    "PGPASSWORD": os.environ.get("S_PGPASSWORD", ""),
    "JWT_SECRET": os.environ.get("S_JWT_SECRET", ""),
    "JWT_EXPIRES_IN": os.environ.get("S_JWT_EXPIRES_IN", ""),
    "JWT_REFRESH_EXPIRES_IN": os.environ.get("S_JWT_REFRESH_EXPIRES_IN", ""),
    "WATHIQ_API_KEY": os.environ.get("S_WATHIQ_API_KEY", ""),
    "WATHIQ_API_SECRET": os.environ.get("S_WATHIQ_API_SECRET", ""),
    "GCS_BUCKET_NAME": os.environ.get("S_GCS_BUCKET_NAME", ""),
    "GCLOUD_PROJECT_ID": os.environ.get("S_GCLOUD_PROJECT_ID", ""),
    "EMAILJS_SERVICE_ID": os.environ.get("S_EMAILJS_SERVICE_ID", ""),
    "EMAILJS_PUBLIC_KEY": os.environ.get("S_EMAILJS_PUBLIC_KEY", ""),
    "EMAILJS_PRIVATE_KEY": os.environ.get("S_EMAILJS_PRIVATE_KEY", ""),
    "EMAILJS_NEWSLETTER_SUBSCRIPTION_TEMPLATE_ID": os.environ.get("S_EMAILJS_NEWSLETTER_TEMPLATE_ID", ""),
    "EMAILJS_SUBMISSION_TEMPLATE_ID": os.environ.get("S_EMAILJS_SUBMISSION_TEMPLATE_ID", ""),
    "EMAILJS_BANK_NEW_LEAD_TEMPLATE_ID": os.environ.get("S_EMAILJS_BANK_NEW_LEAD_TEMPLATE_ID", ""),
    "ADMIN_NOTIFICATION_EMAIL": os.environ.get("S_ADMIN_NOTIFICATION_EMAIL", ""),
    "DISABLE_EMAIL_NOTIFICATIONS": os.environ.get("S_DISABLE_EMAIL_NOTIFICATIONS", ""),
}

# Build the env block (8-space indent matches containers[0].env items in Cloud Run YAML)
env_lines = []
for key, value in env_vars.items():
    value = value.strip()
    escaped = value.replace("\\", "\\\\").replace('"', '\\"')
    env_lines.append(f'        - name: {key}')
    env_lines.append(f'          value: "{escaped}"')
env_block = "\n".join(env_lines)

service_yaml = f"""apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: nesbah-portal
  labels:
    cloud.googleapis.com/location: me-central2
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/minScale: "1"
        autoscaling.knative.dev/maxScale: "10"
        run.googleapis.com/execution-environment: gen2
    spec:
      containers:
      - name: nesbah-portal
        image: {image}
        ports:
        - name: http1
          containerPort: 8080
        env:
{env_block}
        volumeMounts:
        - name: cloudsql-socket
          mountPath: /cloudsql
      - name: cloud-sql-proxy
        image: gcr.io/cloud-sql-connectors/cloud-sql-proxy:2
        args:
        - "--unix-socket=/cloudsql"
        - "--dialer-keep-alive=5s"
        - "--health-check"
        - "--http-port=9090"
        - "nesbahdev:me-central2:production"
        volumeMounts:
        - name: cloudsql-socket
          mountPath: /cloudsql
        readinessProbe:
          httpGet:
            path: /readiness
            port: 9090
          initialDelaySeconds: 2
          periodSeconds: 5
          failureThreshold: 3
      volumes:
      - name: cloudsql-socket
        emptyDir: {{}}
"""

out = "/tmp/cloudrun-service.yaml"
with open(out, "w") as f:
    f.write(service_yaml)

print(f"=== Service YAML written to {out} ===")
print(f"  image: {image}")
for key, value in env_vars.items():
    value = value.strip()
    status = f"len={len(value)}" if value else "*** EMPTY ***"
    print(f"  {key}: {status}")
