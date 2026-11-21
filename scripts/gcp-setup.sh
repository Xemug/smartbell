#!/usr/bin/env bash
# One-time setup of a hosting environment on Google Cloud (staging or production). Safe to
# re-run: each step skips what already exists. Run by a person with Owner rights on the billing
# account, signed in with `gcloud auth login`, plus `gh auth login` for the GitHub step.
#
#   BILLING_ACCOUNT=XXXXXX-XXXXXX-XXXXXX scripts/gcp-setup.sh staging|production
#
# Secrets are generated or read straight into Secret Manager and never printed. The live
# Firebase project (smartbell-app-2025) is never touched: its public web config is only read so
# the web app can sign users in, and its authorized domains are a manual step (docs/hosting.md).
set -euo pipefail

env="${1:-}"
case "$env" in
  staging) project=smartbell-2026-staging name=Smartbell-2026-staging domain=staging.smartbell.app ;;
  production) project=smartbell-2026-production name=Smartbell-2026-production domain=smartbell.app ;;
  *) echo "usage: BILLING_ACCOUNT=... $0 staging|production" >&2; exit 2 ;;
esac
billing="${BILLING_ACCOUNT:?set BILLING_ACCOUNT}"
region=us-central1
repo=Xemug/smartbell
live_firebase=smartbell-app-2025
budget_usd="${BUDGET_USD:-20}"
api_sa="smartbell-api@$project.iam.gserviceaccount.com"
deploy_sa="smartbell-deploy@$project.iam.gserviceaccount.com"
bucket="$project-media"
instance=smartbell-db
step() { printf '\n== %s\n' "$*"; }
exists() { "$@" >/dev/null 2>&1; }
token() { gcloud auth print-access-token; }

step "project $project"
exists gcloud projects describe "$project" || gcloud projects create "$project" --name="$name"
gcloud billing projects link "$project" --billing-account="$billing" >/dev/null
number="$(gcloud projects describe "$project" --format='value(projectNumber)')"

step "APIs"
gcloud services enable --project="$project" \
  run.googleapis.com sqladmin.googleapis.com artifactregistry.googleapis.com \
  cloudbuild.googleapis.com secretmanager.googleapis.com iam.googleapis.com \
  iamcredentials.googleapis.com sts.googleapis.com storage.googleapis.com \
  firebase.googleapis.com firebasehosting.googleapis.com apikeys.googleapis.com \
  geocoding-backend.googleapis.com tile.googleapis.com cloudresourcemanager.googleapis.com \
  serviceusage.googleapis.com cloudbilling.googleapis.com billingbudgets.googleapis.com

step "service accounts"
exists gcloud iam service-accounts describe "$api_sa" --project="$project" ||
  gcloud iam service-accounts create smartbell-api --project="$project" --display-name="Smartbell API"
exists gcloud iam service-accounts describe "$deploy_sa" --project="$project" ||
  gcloud iam service-accounts create smartbell-deploy --project="$project" --display-name="GitHub deploys"
for role in roles/cloudsql.client roles/secretmanager.secretAccessor; do
  gcloud projects add-iam-policy-binding "$project" --member="serviceAccount:$api_sa" \
    --role="$role" --condition=None >/dev/null
done
for role in roles/run.admin roles/cloudbuild.builds.editor roles/artifactregistry.writer \
  roles/firebasehosting.admin roles/secretmanager.secretAccessor roles/storage.admin \
  roles/serviceusage.serviceUsageConsumer roles/logging.viewer roles/cloudsql.viewer; do
  gcloud projects add-iam-policy-binding "$project" --member="serviceAccount:$deploy_sa" \
    --role="$role" --condition=None >/dev/null
done
gcloud iam service-accounts add-iam-policy-binding "$api_sa" --project="$project" \
  --member="serviceAccount:$deploy_sa" --role=roles/iam.serviceAccountUser >/dev/null
# Cloud Build runs as the Compute Engine default account in new projects.
build_sa="$number-compute@developer.gserviceaccount.com"
for role in roles/artifactregistry.writer roles/logging.logWriter roles/storage.objectViewer; do
  gcloud projects add-iam-policy-binding "$project" --member="serviceAccount:$build_sa" \
    --role="$role" --condition=None >/dev/null
done
gcloud iam service-accounts add-iam-policy-binding "$build_sa" --project="$project" \
  --member="serviceAccount:$deploy_sa" --role=roles/iam.serviceAccountUser >/dev/null

step "container registry"
exists gcloud artifacts repositories describe smartbell --project="$project" --location="$region" ||
  gcloud artifacts repositories create smartbell --project="$project" --location="$region" \
    --repository-format=docker --description="Smartbell API images"

step "photo bucket gs://$bucket (private)"
exists gcloud storage buckets describe "gs://$bucket" ||
  gcloud storage buckets create "gs://$bucket" --project="$project" --location="$region" \
    --uniform-bucket-level-access --public-access-prevention
gcloud storage buckets add-iam-policy-binding "gs://$bucket" \
  --member="serviceAccount:$api_sa" --role=roles/storage.objectAdmin >/dev/null

step "Cloud SQL $instance (db-f1-micro, PostgreSQL 16, daily backups kept 7 days)"
if ! exists gcloud sql instances describe "$instance" --project="$project"; then
  pitr=()
  [[ "$env" == production ]] && pitr=(--enable-point-in-time-recovery)
  gcloud sql instances create "$instance" --project="$project" --region="$region" \
    --database-version=POSTGRES_16 --edition=enterprise --tier=db-f1-micro \
    --storage-type=SSD --storage-size=10 --storage-auto-increase \
    --backup-start-time=08:00 --retained-backups-count=7 ${pitr[@]+"${pitr[@]}"}
fi
exists gcloud sql databases describe smartbell --instance="$instance" --project="$project" ||
  gcloud sql databases create smartbell --instance="$instance" --project="$project"

secret() { # name: value on stdin, never echoed
  if exists gcloud secrets describe "$1" --project="$project"; then
    gcloud secrets versions add "$1" --project="$project" --data-file=- >/dev/null
  else
    gcloud secrets create "$1" --project="$project" --replication-policy=automatic \
      --data-file=- >/dev/null
  fi
}
has_secret() { exists gcloud secrets describe "$1" --project="$project"; }

step "database user and DATABASE_URL secret"
if ! has_secret database-url; then
  password="$(openssl rand -hex 24)"
  if exists gcloud sql users describe smartbell --instance="$instance" --project="$project"; then
    gcloud sql users set-password smartbell --instance="$instance" --project="$project" \
      --password="$password" >/dev/null
  else
    gcloud sql users create smartbell --instance="$instance" --project="$project" \
      --password="$password" >/dev/null
  fi
  printf 'postgresql+asyncpg://smartbell:%s@/smartbell?host=/cloudsql/%s:%s:%s' \
    "$password" "$project" "$region" "$instance" | secret database-url
  unset password
fi

step "SECRET_KEY secret"
has_secret secret-key || openssl rand -hex 32 | tr -d '\n' | secret secret-key

step "Google Maps keys (server key for geocoding, browser key for tiles)"
key_string() { # display name -> key string, or nothing
  local name
  name="$(gcloud services api-keys list --project="$project" \
    --filter="displayName=$1" --format='value(name)' | head -1)"
  [[ -n "$name" ]] && gcloud services api-keys get-key-string "$name" --format='value(keyString)'
}
if [[ -z "$(key_string smartbell-geocoding)" ]]; then
  gcloud services api-keys create --project="$project" --display-name=smartbell-geocoding \
    --api-target=service=geocoding-backend.googleapis.com >/dev/null 2>&1
fi
has_secret maps-server-key || key_string smartbell-geocoding | tr -d '\n' | secret maps-server-key
if [[ -z "$(key_string smartbell-map-tiles)" ]]; then
  gcloud services api-keys create --project="$project" --display-name=smartbell-map-tiles \
    --api-target=service=tile.googleapis.com \
    --allowed-referrers="https://$project.web.app/*,https://$project.firebaseapp.com/*,https://$domain/*" \
    >/dev/null 2>&1
fi

step "web build settings (public values) in the web-build-env secret"
app_id="$(curl -fsS -H "Authorization: Bearer $(token)" -H "x-goog-user-project: $project" \
  "https://firebase.googleapis.com/v1beta1/projects/$live_firebase/webApps" |
  python3 -c 'import json,sys; print(json.load(sys.stdin)["apps"][0]["appId"])')"
{
  curl -fsS -H "Authorization: Bearer $(token)" -H "x-goog-user-project: $project" \
    "https://firebase.googleapis.com/v1beta1/projects/$live_firebase/webApps/$app_id/config" |
    python3 -c '
import json, sys
c = json.load(sys.stdin)
print(f"VITE_FIREBASE_API_KEY={c[\"apiKey\"]}")
print(f"VITE_FIREBASE_AUTH_DOMAIN={c[\"authDomain\"]}")
print(f"VITE_FIREBASE_PROJECT_ID={c[\"projectId\"]}")
print(f"VITE_FIREBASE_APP_ID={c[\"appId\"]}")'
  echo "VITE_GOOGLE_MAPS_API_KEY=$(key_string smartbell-map-tiles)"
  echo "VITE_GEOCODE_VIA_API=true"
} | secret web-build-env

step "Firebase Hosting on $project (not the live project)"
if ! curl -fsS -H "Authorization: Bearer $(token)" -H "x-goog-user-project: $project" \
  "https://firebase.googleapis.com/v1beta1/projects/$project" >/dev/null 2>&1; then
  curl -fsS -X POST -H "Authorization: Bearer $(token)" -H "x-goog-user-project: $project" \
    "https://firebase.googleapis.com/v1beta1/projects/$project:addFirebase" >/dev/null
  echo "Firebase is being added; it can take a minute."
fi

step "GitHub sign-in for deploys (Workload Identity Federation, $env environment only)"
exists gcloud iam workload-identity-pools describe github --project="$project" --location=global ||
  gcloud iam workload-identity-pools create github --project="$project" --location=global \
    --display-name="GitHub Actions"
exists gcloud iam workload-identity-pools providers describe github-oidc --project="$project" \
  --location=global --workload-identity-pool=github ||
  gcloud iam workload-identity-pools providers create-oidc github-oidc --project="$project" \
    --location=global --workload-identity-pool=github \
    --issuer-uri=https://token.actions.githubusercontent.com \
    --attribute-mapping=google.subject=assertion.sub,attribute.repository=assertion.repository \
    --attribute-condition="assertion.sub == 'repo:$repo:environment:$env'"
pool="projects/$number/locations/global/workloadIdentityPools/github"
gcloud iam service-accounts add-iam-policy-binding "$deploy_sa" --project="$project" \
  --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/$pool/attribute.repository/$repo" >/dev/null

step "GitHub environment '$env' and its variables"
gh api -X PUT "repos/$repo/environments/$env" --silent \
  ${GITHUB_REVIEWER_ID:+-F "reviewers[][type]=User" -F "reviewers[][id]=$GITHUB_REVIEWER_ID"} \
  -F "deployment_branch_policy[protected_branches]=false" \
  -F "deployment_branch_policy[custom_branch_policies]=true"
gh api -X POST "repos/$repo/environments/$env/deployment-branch-policies" --silent \
  -f name=main -f type=branch 2>/dev/null || true
gh variable set GCP_PROJECT --repo "$repo" --env "$env" --body "$project"
gh variable set GCP_WIF_PROVIDER --repo "$repo" --env "$env" --body "$pool/providers/github-oidc"
gh variable set GCP_DEPLOY_SA --repo "$repo" --env "$env" --body "$deploy_sa"

step "budget alert at \$$budget_usd a month"
if ! gcloud billing budgets list --billing-account="$billing" --billing-project="$project" \
  --format='value(displayName)' 2>/dev/null | grep -qx "$name"; then
  gcloud billing budgets create --billing-account="$billing" --billing-project="$project" \
    --display-name="$name" --budget-amount="${budget_usd}USD" \
    --filter-projects="projects/$project" \
    --threshold-rule=percent=0.5 --threshold-rule=percent=0.9 --threshold-rule=percent=1.0 \
    >/dev/null || echo "Budget not created: add it in the console (docs/hosting.md)." >&2
fi

echo
echo "Done: $project is ready for scripts/deploy.sh $env."
