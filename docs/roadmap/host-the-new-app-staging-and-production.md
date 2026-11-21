---
id: host-the-new-app-staging-and-production
title: "Host the new app: staging and production"
summary: Nothing deploys the new web app, API and Postgres yet. Pick hosting, deploy staging from main, then production, with uploaded photos in cloud storage and the launch settings (Firebase domains, Apple web sign-in, ADMIN_EMAILS, RevenueCat webhook).
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
- **Also found:** the ranch map loads its tiles from `tile.openstreetmap.org` (`RanchMap.tsx`), and that server has the same low-volume policy. This card does not fix that. It is flagged here as a launch risk.

## Recommendation (awaiting the founder's approval)

Plain language. Prices are list prices in USD as of late 2026, rounded up. Check them on the console at setup.

| Piece | Recommendation | Staging / month | Production / month |
|---|---|---|---|
| Web app | **Firebase Hosting** on a new Google Cloud project (not the live one), with a free SSL certificate and the custom domain | $0 | $0 to $1 |
| API | **Cloud Run** (runs the API container and scales to zero when idle) | $0 to $2 | $0 to $10 |
| Database | **Cloud SQL for PostgreSQL 16**, with daily automatic backups kept 7 days and point-in-time recovery in production | about $10 (smallest size) | about $30 (small size, with backups) |
| Photos | **Cloud Storage** private bucket, served through the API at the same address | under $1 | under $1 |
| Secrets | **Secret Manager** (keys never in git) | under $1 | under $1 |
| Geocoder | **Google Geocoding API** through a small API route, so the key stays on the server and addresses are cached | $0 | $0 up to about 10,000 lookups a month, then about $5 per 1,000 |
| **Total** | | **about $12** | **about $35 to $45** |

- **Region:** `northamerica-south1` (Querétaro, Mexico) if Cloud Run, Cloud SQL and Cloud Storage are all offered there when we set up. Otherwise `us-south1` (Dallas). Both are close to Mexican users.
- **Why Google Cloud:** sign-in already runs on Firebase, so billing, the console and permissions stay in one place. Cheaper options exist, such as Neon for the database (free to about $19) or Fly.io for the API, but they would mean a second vendor and a second bill to save about $20 a month.
- **Deploys:** GitHub Actions signs in to Google Cloud with Workload Identity Federation, so no key file is stored anywhere. Every merge to `main` deploys staging (database migration, then API, then web). Production deploys the same build only after someone approves it in GitHub (a `production` environment with a required reviewer).
- **Geocoder alternative:** a self-hosted Nominatim server costs about $40 to $80 a month on its own and needs maintenance. That is not worth it at this volume.
- **Live Firebase project:** untouched apart from the authorized domains, which the founder adds themselves (checklist step).
- **What the founder decides:** (1) approve Google Cloud and the region, (2) approve the Google geocoder, (3) create the Google Cloud project with billing, or say who creates it, and (4) the custom domain names for staging and production.

Nothing that creates cloud resources or costs money is built before this approval.

## Effort

M.

## Acceptance

- [ ] The user approves the hosting recommendation (human).
- [ ] Merging to main deploys staging, and `/api/health` answers there.
- [ ] A photo uploaded on staging survives a redeploy.
- [ ] Production deploys only from a manual approval.
- [ ] Ranch addresses are geocoded by the production option, not the public Nominatim server.
- [ ] The user signs in on staging from their phone (human).
- [ ] Tests for the new code pass in CI.
