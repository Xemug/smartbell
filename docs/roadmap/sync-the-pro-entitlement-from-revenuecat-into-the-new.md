---
id: sync-the-pro-entitlement-from-revenuecat-into-the-new
title: Sync the Pro entitlement from RevenueCat into the new API
summary: has_pro reads Ranch.plan_id, which nothing sets yet. Set it from RevenueCat's Pro entitlement for the ranch owner, by webhook and on import, so paying users keep invites and extra ranches.
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

## Effort

S.

## Acceptance

- [ ] A purchase event gives every ranch the owner owns Pro, and a lapse or refund removes it (tests ported from `legacy/firebase`).
- [ ] A wrong or missing webhook secret is refused and changes nothing.
- [ ] An imported paying owner can invite on first sign-in; a free owner sees the upsell.
- [ ] Tests for the new code pass in CI.
