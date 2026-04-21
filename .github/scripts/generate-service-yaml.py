"""
Generates /tmp/cloudrun-service.yaml for `gcloud run services replace`.

Uses a single-container spec with the built-in Cloud SQL Auth Proxy
(run.googleapis.com/cloudsql-instances annotation) rather than a custom
sidecar. This completely replaces the service spec on every deploy, so
no stale volume mounts or container definitions carry over from previous
deploys. minScale=1 keeps the instance warm so the proxy tunnel never
goes stale after idle periods.
"""
import os
import sys

image = os.environ.get("IMAGE_SHA", "").strip()
if not image:
    print("ERROR: IMAGE_SHA env var is required", file=sys.stderr)
    sys.exit(1)

cloudsql_instance = os.environ.get("CLOUDSQL_INSTANCE", "nesbahdev:europe-west1:production-eu").strip()

env_vars = {
    "NODE_ENV": "production",
    # Always use the Unix socket path — direct TCP to Cloud SQL IP doesn't work
    # from Cloud Run because Cloud Run IPs are dynamic and can't be added to
    # Cloud SQL authorized networks. The built-in proxy creates this socket.
    "PGHOST": f"/cloudsql/{cloudsql_instance}",
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

# Build the env block — 8-space indent matches containers[0].env in Cloud Run YAML
env_lines = []
for key, value in env_vars.items():
    value = str(value).strip() if value else ""
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
        run.googleapis.com/cloudsql-instances: "{cloudsql_instance}"
        run.googleapis.com/cpu-throttling: "false"
    spec:
      containerConcurrency: 80
      timeoutSeconds: 60
      containers:
      - name: nesbah-portal
        image: {image}
        ports:
        - name: http1
          containerPort: 8080
        env:
{env_block}
        resources:
          limits:
            cpu: "1"
            memory: "1Gi"
"""

out = "/tmp/cloudrun-service.yaml"
with open(out, "w") as f:
    f.write(service_yaml)

print(f"=== Service YAML written to {out} ===")
print(f"  image: {image}")
print(f"  cloudsql-instances: {cloudsql_instance}")
for key, value in env_vars.items():
    value = str(value).strip() if value else ""
    status = f"len={len(value)}" if value else "*** EMPTY ***"
    print(f"  {key}: {status}")
