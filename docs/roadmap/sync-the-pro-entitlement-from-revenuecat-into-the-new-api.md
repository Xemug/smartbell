---
id: sync-the-pro-entitlement-from-revenuecat-into-the-new-api
title: Sync the Pro entitlement from RevenueCat into the new API
summary: has_pro reads Ranch.plan_id, which nothing sets yet. Set it from RevenueCat's Pro entitlement for the ranch owner, by webhook and on import, so paying users keep invites and extra ranches.
verifiedAt: 2026-11-20
---

# Sync the Pro entitlement from RevenueCat into the new API

## Problem

`user-admin` and `profile-ranch-config` gate inviting users and creating a second ranch behind `services/plans.has_pro`, which reads `Ranch.plan_id`. Nothing sets that field, so in the new app every ranch counts as free. Paying users of the live app would lose invites and extra ranches.

## Why

The parity rule on `mobile-store-release`: no live feature may disappear. Paying users keep what they pay for.

**Depends on:** `user-admin`, `profile-ranch-config`.

## What it touches

`app/api/smartbell/services/plans.py`, a RevenueCat webhook route in the new API, `legacy-firestore-import` (initial state), `Ranch.plan_id`.

## Approach

- **Source of truth:** RevenueCat's `Pro` entitlement for the ranch owner, whose app user id is the Firebase uid (project `projca1c5dee`). `legacy/firebase/functions` already holds the event rules, so port them: purchase, renewal, lapse, refund, transfer, aliases, lifetime, out-of-order events and sandbox.
- **Scope of Pro:** an owner's Pro covers every ranch they own. Members never carry Pro.
- **Webhook:** `POST /api/webhooks/revenuecat`, with its own shared secret, failing closed when unset. On each event it reads the subscriber, the same way the legacy function does.
- **Initial state:** the import sets it from the live RevenueCat state, not from the client-writable legacy `premium` field.
- **Out of scope:** the paywall and purchase screens, which stay in `plans-billing`.

## Decisions and assumptions (2026-11-20, while building)

- **Where the rules live:** `services/revenuecat.py` is a port of `legacy/firebase/functions/lib.js` (`hasActivePro`, `uidsFromEvent`, `applyRevenueCatEvent`), and `services/plans.py` stays the only place that answers "has Pro". It now also holds `set_owner_pro`.
- **`plan_id` value:** `"Pro"` (the RevenueCat entitlement id) while active, `NULL` otherwise, written on every ranch the owner owns.
- **`has_pro(ranch_id)` asks about the owner:** a ranch counts as Pro when any ranch its owner owns carries the entitlement. So a ranch created after the purchase is Pro at once, with no wait for the next event. There is no ownership transfer yet; when one is added it must move `plan_id` with it.
- **Atomic per event:** a TRANSFER touches two users. If RevenueCat fails for one, nothing is committed and the webhook returns non-2xx so RevenueCat retries.
- **Webhook config:** `REVENUECAT_WEBHOOK_AUTH` (the whole `Authorization` header value set in RevenueCat's dashboard), `REVENUECAT_SECRET_KEY` (to read `GET /v1/subscribers/{uid}`), `REVENUECAT_API_URL`, `REVENUECAT_ALLOW_SANDBOX` (default false). Either secret unset: every call gets 503. A wrong header: 401. Neither is required at startup, so existing deploys keep booting.
- **Import:** `legacy-firestore-import` isn't built yet. It must call `revenuecat.import_pro_entitlement(session, firebase_uid, fetch_subscriber)` once per imported user, after that user's ranches exist, then commit. It reads RevenueCat's live state, never `Users.premium`.
- **Concurrent deliveries:** the event's users are locked (`SELECT … FOR UPDATE`, sorted by uid) before RevenueCat is read, so a second delivery for the same user waits and re-reads after the first commits.
- **RevenueCat `201`:** `GET /v1/subscribers/{uid}` creates unknown subscribers and answers 201; that counts as a normal answer (free), not an outage.
- **Known gaps (accepted after review, 2026-11-20):**
  - An event for a uid with no `User` row is answered 200 and dropped, as in legacy. New-app users have a row before they can reach the paywall (`auth` creates it at sign-in), and legacy users get theirs from the import, which reads RevenueCat at that point.
  - Pro bought while owning no ranch lands nowhere: every sign-up gets "Mi rancho", so this needs a member-only imported user who buys Pro before creating a ranch. The next RevenueCat event fixes it. If it matters, `plans-billing` can move Pro onto the user.
- **PR #22 (`profile-ranch-config`)** also rewrites `plans.py` (`has_pro(session, user)` plus `ranch_creation`). Whichever merges second resolves by keeping both: #22's user-scoped check should read `Ranch.plan_id` on owned ranches, which is what this card writes.

## Effort

S.

## Acceptance

- [x] A purchase event gives every ranch the owner owns Pro, and a lapse or refund removes it (tests ported from `legacy/firebase`).
- [x] A wrong or missing webhook secret is refused and changes nothing.
- [x] An imported paying owner can invite on first sign-in; a free owner sees the upsell.
- [ ] Tests for the new code pass in CI.
