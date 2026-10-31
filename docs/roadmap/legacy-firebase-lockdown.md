---
id: legacy-firebase-lockdown
title: Lock down the live FlutterFlow app's Firebase (security)
summary: Mostly done by the user in FlutterFlow (Users write = own doc only). Remaining: verify the deployed rules; cross-ranch reads are intended (invites). Originally: replace the open Firestore rules (Users world-readable and writable; every ranch readable by any signed-in user) with per-owner rules, rotate the hard-coded OneSignal keys, and freeze the legacy app.
verifiedAt: 2026-10-31
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

The legacy repo's `firebase/firestore.rules` still shows `Users` open to anyone, so it may predate the fix: treat the deployed rules as the thing to check, and don't redeploy that file. The Firebase CLI isn't installed and the deployed rules need the user's login, so ask the user for them from the Firebase console if you can't read them. Report any write access the deployed rules still leave open, including `Ranches` writes by any signed-in user. Check with the Firebase emulator that a user can only write their own `Users` doc and can't set `premium` from the client, and that the app's own flows, including ranch search for invites, still work. If OneSignal keys are still hard-coded in `firebase/functions/index.js`, move them to Functions config/secrets. The user deploys and rotates the keys in the OneSignal console. Don't change app features. Background: `docs/spikes/flutterflow-audit.md` §6, whose per-ranch read rules are superseded by the update above.

## Effort

S.

## Acceptance

- [ ] The deployed rules were read, confirm `Users` writes are own-doc only, and any remaining open write access is reported.
- [ ] Emulator tests show a signed-out client can't read Users, a user can't write another user's doc or their own `premium`, and a signed-in user can still read other ranches for invites.
- [ ] The app's own flows (login, milk log, animals, tasks) still work against the emulator.
- [ ] No OneSignal key is hard-coded in `firebase/functions/index.js`.
- [ ] The user has deployed any changes and rotated the keys (human).
- [ ] Tests for the new code pass in CI.
