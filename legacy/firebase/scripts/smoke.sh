#!/usr/bin/env bash
# End-to-end smoke test on the emulators with a fake RevenueCat API. Local only.
# Needs: npm --prefix functions install
set -euo pipefail
cd "$(dirname "$0")/.."
trap 'rm -f functions/.secret.local functions/.env.local' EXIT
printf 'REVENUECAT_WEBHOOK_AUTH=Bearer smoke\nREVENUECAT_SECRET_KEY=fake\n' > functions/.secret.local
printf 'REVENUECAT_API_URL=http://127.0.0.1:5199\nREVENUECAT_ALLOW_SANDBOX=false\n' > functions/.env.local
npx firebase emulators:exec --project demo-smartbell --only firestore,auth,functions 'node scripts/smoke-driver.mjs'
