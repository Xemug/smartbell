# Hosting: staging and production

The new app runs on Google Cloud, in two projects, each with its own database and photo bucket:

| | Staging | Production |
|---|---|---|
| Google Cloud project | `smartbell-2026-staging` (Smartbell-2026-staging) | `smartbell-2026-production` (Smartbell-2026-production) |
| Address | https://staging.smartbell.app (and https://smartbell-2026-staging.web.app) | https://smartbell.app (and https://smartbell-2026-production.web.app) |
| Deploys | Automatically, after every green CI run on `main` | The same commit, after a person approves it in GitHub |

The pieces, all in `us-central1` (Iowa):

- **Web app:** Firebase Hosting. It also forwards `/api/**` to the API, so the app and API share one address.
- **API:** Cloud Run service `smartbell-api`. It scales to zero when nobody is using it.
- **Database:** Cloud SQL PostgreSQL 16, instance `smartbell-db` (db-f1-micro), with daily backups kept 7 days. Production also has point-in-time recovery.
- **Photos:** private bucket `gs://<project>-media`. The API serves photos from it, so they survive redeploys.
- **Addresses:** Google Geocoding, called through `/api/geocode/*` with a server-side key.
- **Map tiles:** Google Map Tiles, with a browser key that only works on the addresses above.
- **Secrets:** Secret Manager. They never go in git: `database-url`, `secret-key`, `maps-server-key`, `web-build-env`, plus the optional `revenuecat-webhook-auth`, `revenuecat-secret-key` and `admin-emails`.
- **Sign-in:** the live Firebase project `smartbell-app-2025`, so users keep their logins. The API only checks sign-in tokens against Google's public keys and never reads that project's data.

Expected cost: about $22 a month for both environments ($10 to $12 each). A budget alert is set on each project.

## How a deploy works

`.github/workflows/deploy.yml` runs `scripts/deploy.sh <env>`. That script:

1. Builds the API image with Cloud Build.
2. Runs `alembic upgrade head` as the Cloud Run job `smartbell-migrate`.
3. Deploys the API.
4. Builds the web app with the values in `web-build-env` and deploys it to Hosting.
5. Checks that `/api/health` answers.

GitHub signs in to Google Cloud with Workload Identity Federation, so no key file exists. Each project only trusts jobs running in its own GitHub environment (`staging` or `production`).

**To approve a production deploy:** open the repository's **Actions** tab and select the **Deploy** run for the commit. Click **Review deployments**, tick **production**, then click **Approve and deploy**.

**First-time setup** has already been run once per environment: `BILLING_ACCOUNT=... scripts/gcp-setup.sh staging|production`. It is safe to re-run.

## The founder's checklist

These steps need your accounts. Do them in order; each one says how to check it worked.

1. **Point the addresses at the app (GoDaddy).**
   - Sign in at godaddy.com and open **My Products**. Next to `smartbell.app`, click **DNS**.
   - Add each record below exactly as written, leaving TTL at the default (1 hour). Delete any other A record on `@` if GoDaddy added one (a "Parked" record).

     | Type | Name | Value | For |
     |---|---|---|---|
     | CNAME | `staging` | `smartbell-2026-staging.web.app` | staging.smartbell.app |
     | A | `@` | `199.36.158.100` | smartbell.app |
     | TXT | `@` | `hosting-site=smartbell-2026-production` | proves smartbell.app is yours |

   - Wait up to a few hours. Google issues the padlock certificates by itself.
   - Check: https://staging.smartbell.app opens the app with a padlock. smartbell.app shows a Firebase "Site not found" page until the first production deploy is approved, and that is expected.
2. **Allow sign-in from the new addresses (live Firebase project, only this setting).**
   - Go to console.firebase.google.com and open **Smartbell 2025** (`smartbell-app-2025`).
   - Open **Authentication**, then the **Settings** tab, then **Authorized domains**.
   - Click **Add domain** once for each of these four: `staging.smartbell.app`, `smartbell.app`, `smartbell-2026-staging.web.app`, `smartbell-2026-production.web.app`.
   - Change nothing else there.
   - Check: on staging, click **Continuar con Google** and the Google window opens.
3. **Apple sign-in on the web.**
   - In the Apple Developer account, open **Certificates, Identifiers & Profiles**, then **Identifiers**, then **Services IDs**.
   - Open the Smartbell Services ID, or create one, and turn on **Sign in with Apple**.
   - Under **Domains**, add `smartbell-app-2025.firebaseapp.com`.
   - Under **Return URLs**, add `https://smartbell-app-2025.firebaseapp.com/__/auth/handler`.
   - In Firebase, open **Authentication**, then **Sign-in method**, then **Apple**. Paste in the Services ID, the Team ID, the Key ID and the private key, if they aren't there already.
   - Check: on staging, **Continuar con Apple** signs you in.
4. **Staff emails (ADMIN_EMAILS).**
   - Tell the agent which emails are Smartbell staff. It stores them as the `admin-emails` secret in each project, and the next deploy picks them up.
   - Never paste them into GitHub.
5. **RevenueCat webhook.**
   - In the RevenueCat dashboard, open **Project settings**, then **Integrations**, then **Webhooks**, and add a webhook.
   - URL: `https://smartbell.app/api/webhooks/revenuecat`. For a staging test, use `https://staging.smartbell.app/api/webhooks/revenuecat` instead.
   - Authorization header: a long random value. Share it with the agent privately, together with RevenueCat's secret API key (**Project settings**, **API keys**).
   - The agent stores them as `revenuecat-webhook-auth` and `revenuecat-secret-key`. Until then the webhook refuses every call, which is safe.
6. **Budget alerts.**
   - In console.cloud.google.com, open **Billing**, then **Budgets & alerts**.
   - Check there is a budget for each new project at $20 a month, so about $40 in total. Add any that are missing.
7. **Production approval.**
   - In GitHub, open **Settings**, then **Environments**, then **production**.
   - Check that **Required reviewers** includes you.

## Old projects

These 2021 projects still have App Engine apps serving and are billed to the same account:

- `smartbell-frontend-prod`
- `smartbell-frontend-stg`
- `smartbell-frontend-dev`

They are not part of this setup. Shutting them down is a separate decision.
