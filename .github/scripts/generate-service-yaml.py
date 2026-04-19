"""
Generates /tmp/env-vars.yaml for `gcloud run deploy --env-vars-file`.

Reads env vars injected by GitHub Actions and writes a YAML file that
gcloud can consume directly. Using a script (rather than inline shell)
keeps escaping correct for values that contain quotes, backslashes, etc.
"""
import os
import sys

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

# Write YAML using single-quoted strings — safe for backslashes, double quotes,
# colons, and everything else. The only escape needed in single-quoted YAML is
# '' to represent a literal single quote.
out = "/tmp/env-vars.yaml"
with open(out, "w") as f:
    for key, value in env_vars.items():
        value = str(value).strip() if value else ""
        escaped = value.replace("'", "''")
        f.write(f"{key}: '{escaped}'\n")

print(f"=== Env vars written to {out} ===")
for key, value in env_vars.items():
    value = str(value).strip() if value else ""
    status = f"len={len(value)}" if value else "*** EMPTY ***"
    print(f"  {key}: {status}")
