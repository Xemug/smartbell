---
id: mobile-store-release
title: Capacitor iOS/Android build under the existing bundle id, with RevenueCat
summary: Wrap the web app with Capacitor as `com.juanbordesontiveros.smartbell`, wire RevenueCat purchases (Pro: monthly / annual / lifetime) with server-side entitlement checks through RevenueCat webhooks, FCM push, and ship it as an update to the live listings.
---

# Capacitor iOS/Android build under the existing bundle id, with RevenueCat

## Problem

The app is live in both stores with a RevenueCat paywall; the rebuild must replace it in place.

## Why

Keeps the listings, installs and subscribers.

**Depends on:** `auth`, `tasks-home`, `milk-screens`, `groups`, `profile-ranch-config`, `user-admin`, `legacy-firestore-import`, `report-export`.

This build replaces the live app under the same bundle id, so it must not take away anything live users have today. The founder raised this on 2026-11-03. See the parity check below.

## What it touches

`app/web/capacitor.config.ts`, `app/web/ios`, `app/web/android`, `app/api/smartbell/api/revenuecat_webhook.py`, the paywall screen.

**Figma:** n/a (no UI)
**Inventory:** spikes/flutterflow-audit.md §4, §10 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Per the memo's recommendation after the audit and `docs/spikes/flutterflow-audit.md` §4, §10. Use `@revenuecat/purchases-capacitor` with appUserID = Firebase uid. The backend stores the entitlement from webhooks; gating is server-side (no client `premium` flag). Restore purchases. Resolve the iOS price mismatch with the user first. Push via `@capacitor/push-notifications` (FCM).

## Effort

L.

## Acceptance

- [ ] A TestFlight / internal-track build installs over the legacy app and keeps the user logged in (human).
- [ ] A sandbox purchase unlocks Pro through the webhook; restore works.
- [ ] Push arrives on a real device (human).
- [ ] Parity check: every live feature in `docs/spikes/flutterflow-audit.md` §1.2 is listed with its new card. That covers auth, onboarding, milk, animals, groups and group diet change, tasks, profile, ranches and invites, workers, membership, and the CSV exports. Each one must have shipped, or the user must have approved its drop in writing. No live feature stays a fake door (human).
- [ ] Live data is imported before release: users open the new build and see their ranches, animals and records.
- [ ] Tests for the new code pass in CI.
