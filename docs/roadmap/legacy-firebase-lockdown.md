---
id: legacy-firebase-lockdown
title: Lock down the live FlutterFlow app's Firebase (security)
summary: Mostly done by the user in FlutterFlow (Users write = own doc only). Remaining: verify the deployed rules; cross-ranch reads are intended (invites). Originally: replace the open Firestore rules (Users world-readable and writable; every ranch readable by any signed-in user) with per-owner rules, rotate the hard-coded OneSignal keys, and freeze the legacy app.
---

# Lock down the live FlutterFlow app's Firebase (security)

## Problem

The live app's Firestore rules let anyone read every user's email and phone and set `premium`, and any signed-in user can read and write every ranch. Two OneSignal REST keys are hard-coded in `firebase/functions/index.js`.

## Why

Real users' personal data is exposed today, independent of the rebuild.

**Depends on:** none.

## What it touches

`/Users/juan/Development/smartbell-flutterflow/smartbell/firebase/firestore.rules`, `functions/index.js`, the Firebase and OneSignal consoles (outside this repo).

**Figma:** n/a (no UI)
**Inventory:** spikes/flutterflow-audit.md §3, §6 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

**Update 2026-10-29:** the user fixed the `Users` rules in FlutterFlow. Cross-ranch reads by signed-in users are intended (ranch invites); do NOT restrict them. Remaining scope: confirm the deployed rules match, and keep the OneSignal keys server-side.


Per `docs/spikes/flutterflow-audit.md` §6. Write rules where each document is readable/writable only by its ranch's members (`Ranches.members` contains `request.auth.uid`), and `Users/{uid}` only by that uid, with `premium` not writable from the client. Test them with the Firebase emulator against the app's actual queries (including the search index, which returns all ranches today). The user deploys with `firebase deploy --only firestore:rules` and rotates the OneSignal keys in the OneSignal console, then moves them to Functions config/secrets. Don't change app features.

## Effort

S.

## Acceptance

- [ ] Emulator tests show a signed-out client can't read Users, and user A can't read ranch B.
- [ ] The app's own flows (login, milk log, animals, tasks) still work against the emulator.
- [ ] The user has deployed the rules and rotated the keys (human).
- [ ] Tests for the new code pass in CI.
