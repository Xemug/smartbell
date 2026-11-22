#!/usr/bin/env bash
# Deploy the current checkout to a hosting environment: build the API image (Cloud Build), run
# migrations (a Cloud Run job), deploy the API (Cloud Run) and the daily alert job (a Cloud Run
# job that Cloud Scheduler starts at 05:00 Mexico City time), build and deploy the web app
# (Firebase Hosting, which sends /api/** to the API), then check /api/health.
#
#   scripts/deploy.sh staging|production
#
# Run by .github/workflows/deploy.yml, or by a person signed in with gcloud. The project must
# have been set up with scripts/gcp-setup.sh. Secrets stay in Secret Manager and are never printed.
set -euo pipefail

env="${1:-}"
case "$env" in
  staging) project=smartbell-2026-staging domain=staging.smartbell.app ;;
  production) project=smartbell-2026-production domain=smartbell.app ;;
  *) echo "usage: $0 staging|production" >&2; exit 2 ;;
esac
root="$(cd "$(dirname "$0")/.." && pwd)"
region=us-central1
live_firebase=smartbell-app-2025 # Sign-in only: the API checks tokens against its public keys.
# The commit checked out, so the image tag always matches the code it was built from.
sha="$(git -C "$root" rev-parse HEAD)"
if [[ -n "${DEPLOY_SHA:-}" && "$DEPLOY_SHA" != "$sha" ]]; then
  echo "deploy: checkout is $sha but DEPLOY_SHA is $DEPLOY_SHA" >&2
  exit 1
fi
image="$region-docker.pkg.dev/$project/smartbell/api:$sha"
api_sa="smartbell-api@$project.iam.gserviceaccount.com"
sql="$project:$region:smartbell-db"
step() { printf '\n== %s\n' "$*"; }
has_secret() { gcloud secrets describe "$1" --project="$project" >/dev/null 2>&1; }

# Production must never fall back to OpenStreetMap's free servers or the local disk.
for name in database-url secret-key maps-server-key web-build-env; do
  size="$(gcloud secrets versions access latest --secret="$name" --project="$project" 2>/dev/null | wc -c | tr -d ' ')"
  [[ "${size:-0}" -gt 0 ]] || { echo "deploy: secret $name is missing or empty; run scripts/gcp-setup.sh $env" >&2; exit 1; }
done

step "API image $sha"
if ! gcloud artifacts docker images describe "$image" >/dev/null 2>&1; then
  gcloud builds submit "$root/app/api" --project="$project" --region="$region" --tag="$image" \
    --suppress-logs
fi

secrets="DATABASE_URL=database-url:latest,SECRET_KEY=secret-key:latest"
secrets+=",GOOGLE_MAPS_API_KEY=maps-server-key:latest"
# Optional until the founder sets them (docs/hosting.md). The webhook refuses every call while
# its secrets are unset, and no one is staff while ADMIN_EMAILS is unset.
for pair in REVENUECAT_WEBHOOK_AUTH=revenuecat-webhook-auth REVENUECAT_SECRET_KEY=revenuecat-secret-key \
  ADMIN_EMAILS=admin-emails; do
  has_secret "${pair#*=}" && secrets+=",$pair:latest"
done
env_file="$(mktemp)"
trap 'rm -f "$env_file"' EXIT
cat >"$env_file" <<EOF
ENV: prod
FIREBASE_PROJECT_ID: $live_firebase
MEDIA_BUCKET: $project-media
CORS_ORIGINS: '["https://$domain","https://$project.web.app","https://$project.firebaseapp.com"]'
REVENUECAT_ALLOW_SANDBOX: '$([[ "$env" == staging ]] && echo true || echo false)'
EOF

step "migrations"
gcloud run jobs deploy smartbell-migrate --project="$project" --region="$region" \
  --image="$image" --service-account="$api_sa" --set-cloudsql-instances="$sql" \
  --set-secrets="DATABASE_URL=database-url:latest,SECRET_KEY=secret-key:latest" \
  --env-vars-file="$env_file" --command=alembic --args=upgrade,head \
  --max-retries=0 --task-timeout=10m --quiet >/dev/null
gcloud run jobs execute smartbell-migrate --project="$project" --region="$region" --wait

step "API (Cloud Run)"
gcloud run deploy smartbell-api --project="$project" --region="$region" --image="$image" \
  --service-account="$api_sa" --add-cloudsql-instances="$sql" \
  --set-secrets="$secrets" --env-vars-file="$env_file" \
  --allow-unauthenticated --min-instances=0 --max-instances=3 --memory=512Mi \
  --quiet >/dev/null

step "daily alert job (Cloud Run job, started by Cloud Scheduler at 05:00 Mexico City)"
# The API scales to zero, so it can't keep a clock: Cloud Scheduler starts this job instead.
gcloud run jobs deploy smartbell-daily --project="$project" --region="$region" \
  --image="$image" --service-account="$api_sa" --set-cloudsql-instances="$sql" \
  --set-secrets="DATABASE_URL=database-url:latest,SECRET_KEY=secret-key:latest" \
  --env-vars-file="$env_file" --command=python --args=-m,smartbell.jobs.daily \
  --max-retries=1 --task-timeout=30m --quiet >/dev/null
schedule=(--project="$project" --location="$region" --schedule="0 5 * * *"
  --time-zone=America/Mexico_City --http-method=POST
  --uri="https://run.googleapis.com/v2/projects/$project/locations/$region/jobs/smartbell-daily:run"
  --oauth-service-account-email="$api_sa")
if gcloud scheduler jobs describe smartbell-daily --project="$project" --location="$region" \
  >/dev/null 2>&1; then
  gcloud scheduler jobs update http smartbell-daily "${schedule[@]}" --quiet >/dev/null
else
  gcloud scheduler jobs create http smartbell-daily "${schedule[@]}" --quiet >/dev/null
fi

step "web app (Firebase Hosting)"
(
  cd "$root/app/web"
  npm ci --no-audit --no-fund
  # Read line by line (macOS's bash 3.2 can't `source <(...)`); values are never printed.
  while IFS= read -r line; do
    name="${line%%=*}"
    [[ "$name" =~ ^VITE_[A-Z_]+$ ]] && export "$name=${line#*=}"
  done < <(gcloud secrets versions access latest --secret=web-build-env --project="$project")
  [[ -n "${VITE_GOOGLE_MAPS_API_KEY:-}" && "${VITE_GEOCODE_VIA_API:-}" == true ]] || {
    echo "deploy: web-build-env must set the Google maps key and VITE_GEOCODE_VIA_API=true" >&2
    exit 1
  }
  npm run build
)
(cd "$root/app" && npx --yes firebase-tools@15.37.0 deploy --only hosting \
  --project="$project" --non-interactive --message="$sha")

step "health"
url="https://$project.web.app/api/health"
for _ in 1 2 3 4 5 6; do
  body="$(curl -fsS "$url" 2>/dev/null || true)"
  if [[ "$body" == *'"ok"'* ]]; then
    echo "$url answers ok"
    exit 0
  fi
  sleep 10
done
echo "deploy: $url did not answer ok" >&2
exit 1
