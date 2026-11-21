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
