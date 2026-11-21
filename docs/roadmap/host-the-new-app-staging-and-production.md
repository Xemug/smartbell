---
id: host-the-new-app-staging-and-production
title: "Host the new app: staging and production"
summary: Nothing deploys the new web app, API and Postgres yet. Pick hosting, deploy staging from main, then production, with uploaded photos in cloud storage, a production geocoder and map tiles, and the launch settings (Firebase domains, Apple web sign-in, ADMIN_EMAILS, RevenueCat webhook).
verifiedAt: 2026-11-21
---

# Host the new app: staging and production

## Problem

The new app runs only on laptops. No card deploys the web app, the API or Postgres. Profile photos are written to a local `MEDIA_DIR`, which a hosted API would lose on every redeploy. Several cards left launch steps for the user (auth, whatsapp-support, user-admin) that need a real address first.

## Why

The user can't try the app on a phone, and `mobile-store-release` needs a production API.

**Depends on:** none to start. `mobile-store-release` depends on this card.

## What it touches

Deploy config and CI deploy jobs, `app/api` settings for storage and secrets, the media store behind `PUT /api/users/me/photo`, and docs for the user's console steps.

## Approach

- **Recommendation first:** the PR opens with a short recommendation for the user to approve, covering hosting, managed Postgres with backups, object storage for media, cost per month and region (close to Mexico). Build only after the user picks. Stay in Google Cloud, next to Firebase, unless a cheaper option is clearly simpler.
- **Staging:** deploy on every merge to main. **Production:** deploy from a manual approval.
- **Storage:** move media from the local disk to object storage behind the same API.
- **Map tiles:** the ranch map (`RanchMap.tsx`) moves off `tile.openstreetmap.org` to the production tile option before launch.
- **Geocoder:** Datos Rancho uses the free public OpenStreetMap geocoder (Nominatim), which only allows low volume. Recommend a production option (a paid geocoder or a self-hosted Nominatim) in the same approval, and switch to it before launch.
- **Secrets:** in the platform's secret store, never in git.
- **User checklist:** a numbered list of the console steps the user does, written for a non-technical founder. It covers the Firebase authorized domains, Apple web sign-in setup, `ADMIN_EMAILS`, the RevenueCat webhook URL and secret, and the custom domain.
- **Live project:** never touch the live Firebase project's data. Only add the authorized domains, through the user.

## Grooming notes (2026-11-21)

Checked against the code:

- Still true: nothing deploys. `.github/workflows/ci.yml` only tests, and `docker-compose.yml` is the local Postgres.
- Photos: `PUT /api/users/me/photo` and `GET /api/media/avatars/{name}` live in `app/api/smartbell/routes/users.py`. `media.LocalStorage` writes under `settings.media_dir`. The `media.Storage` protocol's `path()` returns a local `Path`, so the bucket version must change how the GET route serves the file (stream it, or redirect to a short-lived signed URL). The public URL `/api/media/avatars/<name>` stays the same.
- Settings that hosting must provide: `ENV=prod`, `DATABASE_URL`, `SECRET_KEY`, `FIREBASE_PROJECT_ID`, `CORS_ORIGINS`, `ADMIN_EMAILS`, `REVENUECAT_WEBHOOK_AUTH`, `REVENUECAT_SECRET_KEY` (`app/api/smartbell/settings.py`). On the web side, the build needs the `VITE_*` values: `VITE_API_BASE_URL`, the `VITE_FIREBASE_*` keys, `VITE_TERMS_URL` and `VITE_WHATSAPP_NUMBER`.
- **Correction:** the browser does the geocoding, not the API. `app/web/src/features/config/ranch/geocode.ts` calls `nominatim.openstreetmap.org` directly. Switching to a paid geocoder means either a key in the browser or a new API route that proxies the request. A new route is public input, so it needs a security pass.
- **Also found:** the ranch map loads its tiles from `tile.openstreetmap.org` (`RanchMap.tsx`), and that server has the same low-volume policy. Added to this card: production switches to a production tile provider (see the recommendation and the acceptance list).

## Recommendation (awaiting the founder's approval)

Plain language. All figures are USD list prices from Google's pricing pages and recent price guides, checked 2026-11-21. Querétaro usually costs about 15% more than Google's US reference region, and that is already included. Every line still needs a check in the console's pricing calculator at setup.

**Short version:** Google Cloud, in a new project next to Firebase, in Querétaro, Mexico (`northamerica-south1`). Expect about **$50 a month, or about $630 a year**, for staging and production together at launch. Budget **$750 a year** to leave room for surprises.

### What we'd use

| Piece | Service | Why |
|---|---|---|
| Web app | **Firebase Hosting** (new Google Cloud project, not the live Firebase one) | Free tier covers us; free SSL; custom domain |
| API | **Cloud Run**, reached at `/api` through a Firebase Hosting rewrite | Scales to zero when idle. Cloud Run can't attach a custom domain in Querétaro, so the rewrite puts the API under the web address (this also removes cross-site CORS) |
| Database | **Cloud SQL for PostgreSQL 16**, with daily backups kept 7 days, plus point-in-time recovery in production | Managed, patched and backed up by Google |
| Photos | **Cloud Storage** private bucket, served by the API at the same `/api/media/...` address | Survives redeploys |
| Secrets | **Secret Manager** | Keys never in git |
| Address lookup | **Google Geocoding API**, called by a small API route so the key stays on the server | 10,000 free lookups a month; we look up an address only when a ranch is set up |
| Map tiles | **Google Map Tiles API** (2D tiles), shown in the existing Leaflet map | 100,000 free tiles a month. One vendor for both map and address lookup, and Google's terms expect Google-geocoded points to be shown on a Google map |
| Deploys | **GitHub Actions** with Workload Identity Federation (no key files) | Merge to `main` deploys staging; production deploys after a click to approve in GitHub |

### Monthly cost breakdown (launch: a few dozen ranches)

| Item | Staging | Production | Notes |
|---|---|---|---|
| Cloud SQL instance | $9 (db-f1-micro) | $30 (db-g1-small) | Shared-core sizes, about $0.0105/h and $0.035/h before the region uplift |
| Cloud SQL disk and backups | $2 (10 GB) | $6 (20 GB, plus backups and recovery logs) | |
| Cloud Run (API) | $0 | $0 to $5 | Free each month: 2 million requests and about 180,000 to 240,000 vCPU-seconds, shared across the billing account |
| Cloud Storage (photos) | under $0.10 | under $0.50 | Photos are 2 MB at most; a few GB costs cents |
| Secret Manager | $0.50 | $0.50 | $0.06 per active secret version, about 8 secrets |
| Artifact Registry (API images) | $0.25 | shared | 0.5 GB free, then $0.10/GB |
| Firebase Hosting | $0 | $0 | 10 GB storage and 10 GB transfer free each month |
| Geocoding | $0 | $0 | Up to 10,000 a month free, then about $5 per 1,000 |
| Map tiles | $0 | $0 | Up to 100,000 tiles a month free, about 4,000 map views |
| Logging and uptime checks | $0 | $0 | Within the free tier |
| GitHub Actions deploy minutes | $0 | $0 | Within the plan's monthly minutes |
| **Total per month** | **about $12** | **about $37 to $42** | **about $50 combined** |

### Annual total cost of ownership

| | Per month | Per year |
|---|---|---|
| Staging | $12 | $144 |
| Production | $37 to $42 | $444 to $504 |
| **Google Cloud total** | **$49 to $54** | **$588 to $648** |
| Contingency (about 15%) | | about $100 |
| **Budget** | | **about $750** |
| Domain name | already owned? | $0 if `smartbell.mx` is already registered; about $20 to $40 a year for a new `.mx` |
| Upkeep time | 1 to 2 hours a month | Google patches the database and servers. Our time goes on checking alerts and approving production deploys |

No one-off setup fees are charged by Google.

### Optional extras (not in the totals)

| Option | Extra per month | When it's worth it |
|---|---|---|
| Keep one API instance always warm (no 1 to 2 second wake-up after idle) | about $10 to $15 | If the first tap of the day feels slow |
| Database high availability (standby copy in another zone) | about $30 | Once paying customers depend on it all day |

### If it grows (about 1,000 ranches)

The database moves to a dedicated 1 vCPU size (about $55), Cloud Run costs about $10 to $20, and maps and address lookup probably stay free. That makes about **$90 to $110 a month in production (about $1,100 to $1,300 a year)**.

### Alternatives considered

- **Neon (Postgres) or Fly.io (API):** saves about $20 a month, but adds a second vendor and a second bill.
- **Self-hosted Nominatim:** about $40 to $80 a month on its own, plus upkeep. Not worth it at this volume.
- **MapTiler or Stadia free tiers:** non-commercial use only, so they can't be used here. Their paid plans start around $30 a month.
- **Dallas (`us-south1`) instead of Querétaro:** about 15% cheaper, but slightly farther from users. It's the fallback if any service is missing in Querétaro.

### Google Cloud access review (2026-11-21, read-only)

- The agent can reach the founder's Google Cloud account through the local `gcloud` login. Only listing commands were run. Nothing was enabled, created or changed.
- `smartbell-app-2025` is the live Firebase project (sign-in, Firestore, Hosting, Functions). It is **not** used for this card.
- Older projects from 2021, `smartbell-frontend-prod` and `smartbell-frontend-stg`, still have App Engine apps serving in `us-central` and are billed to the open "Pago de Firebase" account. `smartbell-backend-*` have no billing. Shutting these down is a separate decision for the founder, not part of this card.
- **Plan:** one **new** project (for example `smartbell-app-hosting`) holding staging and production, linked to the open "Pago de Firebase" billing account.

### Lower-cost option (the founder asked for one)

Most of the cost is the production database size and the Querétaro surcharge. Two cheaper layouts:

| Layout | What changes | Per month | Per year | Trade-off |
|---|---|---|---|---|
| Recommended above | Querétaro, small production database | ~$50 | ~$630 | Closest to users, most headroom |
| **Lean (new recommendation)** | Iowa (`us-central1`), the smallest database (db-f1-micro) for both staging and production, backups kept | **~$22** | **~$265** | About 40 ms farther from Mexico, which users won't notice in a forms app. Production moves to a bigger size in minutes when needed. Cloud Run domain mapping works in Iowa |
| Leanest | Lean, plus staging as a second database on the production server | ~$13 | ~$160 | A staging mistake can slow production. Not recommended |

Cheaper again would mean leaving Google Cloud (Neon free tier, $0 to $19) or running our own Postgres on a free virtual machine, which means doing our own backups. Neither is worth the extra vendor or the risk at ~$22 a month.

### What the founder decides

1. Pick a layout: Lean in Iowa (~$22 a month, recommended) or Querétaro (~$50 a month).
2. Approve Google for address lookup and map tiles.
3. Approve creating a new project `smartbell-app-hosting` on the "Pago de Firebase" billing account (the agent can do it with the founder's login once approved), with a **budget alert at $40 a month** (Lean) or $75 (Querétaro).
4. Choose the web addresses for staging and production (for example `staging.app.smartbell.mx` and `app.smartbell.mx`).

**Live Firebase project:** nothing changes except the authorized domains, which the founder adds through the checklist. Nothing that creates cloud resources or costs money is built before this approval.

## Decisions and status (2026-11-21)

- **Approved by the founder:** the Lean layout in `us-central1`, as two projects named Smartbell-2026-staging and Smartbell-2026-production. Production lives at `smartbell.app` and staging at `staging.smartbell.app`. `smartbell.com` stays for marketing.
- **Built:**
  - `scripts/gcp-setup.sh` creates and configures a project, and has been run for both.
  - `scripts/deploy.sh` builds, migrates, deploys and checks health.
  - `.github/workflows/deploy.yml` deploys staging after green CI on `main`, then production after approval.
  - Photos go to a private bucket.
  - `/api/geocode/*` calls Google, and the ranch map loads Google tiles.
  - `docs/hosting.md` has the founder's checklist and the exact GoDaddy records.
- **Assumptions:**
  - Staging runs with `ENV=prod` and RevenueCat sandbox purchases allowed.
  - Dev keeps OpenStreetMap. Hosted builds switch through `VITE_GEOCODE_VIA_API` and `VITE_GOOGLE_MAPS_API_KEY`, which the deploy refuses to build without.
  - Production is never deployed by hand: its first deploy is the approved run after merge.

## Effort

M.

## Acceptance

- [ ] The user approves the hosting recommendation (human).
- [ ] Merging to main deploys staging, and `/api/health` answers there.
- [x] A photo uploaded on staging survives a redeploy. (Verified 2026-11-21: a photo in the staging bucket was served at `/api/media/avatars/…` before and after a redeploy to a new revision. The upload path is covered by tests.)
- [ ] Production deploys only from a manual approval.
- [x] Ranch addresses are geocoded by the production option, not the public Nominatim server. (Hosted builds call `/api/geocode/*`, and the API uses Google with the server key. Deploys refuse an empty key. Checked on staging 2026-11-21.)
- [ ] The production ranch map loads its tiles from the production tile provider, never `tile.openstreetmap.org`.
- [ ] The user signs in on staging from their phone (human).
- [x] Tests for the new code pass in CI.
