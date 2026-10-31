---
id: legacy-firebase-lockdown
title: Lock down the live FlutterFlow app's Firebase (security)
summary: Users writes are fixed. Remaining: scope ranch data to ranch members, limit Users create and read, and make premium server-set so only paying users get it.
verifiedAt: 2026-10-31
---

# Lock down the live FlutterFlow app's Firebase (security)

## Problem

The live app's Firestore rules let anyone read every user's email and phone and set `premium`, and any signed-in user can read and write every ranch. Two OneSignal REST keys are hard-coded in `firebase/functions/index.js`.

## Why

Real users' personal data is exposed today, independent of the rebuild.

**Depends on:** none.

## What it touches

`/Users/juan/Development/smartbell-flutterflow/smartbell/firebase/firestore.rules`, the FlutterFlow project, Firebase and RevenueCat consoles (outside this repo).

**Figma:** n/a (no UI)
**Inventory:** spikes/flutterflow-audit.md §3, §6 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

**Update 2026-10-31, from the deployed rules the user shared and a code review.** This replaces the earlier scope. Nothing in this card writes to the live project without the user's OK; the user deploys.

**State of the deployed rules:** `Users` write is own-doc only, delete is No One, and the collection isn't public. Still open: `Users` create is Everyone and read is any signed-in user, so anyone who signs up can read every email and phone. Every other collection allows create, read, write and delete by any signed-in user, so one free account can edit or delete any ranch's cows.

1. **Ranch rules.** Cows, Bulls, Tasks, Groups and the rest carry `ranch_id`, so scope them to ranch members. Decisions needed from the user are at the end of this section.
   - Don't trust `Users.ranch_list` for membership: users can write their own doc, so they could add any ranch to it.
   - `Ranches.workesList` is a list of structs, which rules can't search by uid. Expect to add a plain `memberIds` list, a backfill and an update wherever the app changes workers.
   - FlutterFlow's table can't express this, so these are custom rules. Find out whether FlutterFlow's Redeploy overwrites them before anything is deployed.
2. **`Users`.** Create only for your own uid, and limit what other signed-in users can read, keeping ranch search for invites working.
3. **Premium.** `premium` gates real features, all in the client: invite users, add a ranch, CSV exports and the WhatsApp community. Today a user can set it on their own doc, and nothing clears it after a lapse or refund. Fix: RevenueCat tells the server (webhook or extension), the server sets and clears `premium`, the client stops writing it, and rules block client writes. Check which entitlements exist in RevenueCat. The order matters: server first, then a FlutterFlow app release, then the rule. Find out what happens to older app versions whose client write gets refused.
4. **Tamper check (read-only).** Compare `premium=true` users with RevenueCat customers and report mismatches. Don't change anyone without the user's OK.
5. **Storage.** `users/{uid}/**` is public. Report whether that's needed for photos.

**OneSignal: dropped from scope.** The keys live in FlutterFlow's integration settings and in the generated Cloud Function. They aren't in the shipped app. Moving them wouldn't last, because FlutterFlow regenerates that file. The functions check the caller. Rotate them only if the exported code was shared.

Make a Firestore export before any rule or data change. Background: `docs/spikes/flutterflow-audit.md` §4, §6.

**Decided by the user (2026-10-31):** all ranch members can write ranch data; per-role limits come later. Only the owner can delete a ranch. Members can delete cows and tasks.

**Ranch visibility (user, 2026-10-31):** nobody sees a ranch they don't belong to. There is no ranch search in the app, so the 2026-10-29 note that cross-ranch reads are intended is wrong and is replaced by this. Only owners, members and users in that ranch's `invitedUsers` can read the `Ranches` doc; an invited user sees that doc until they accept, and no cows or production data.

**Found in the code on 2026-10-31:**
- **Invites write another user's doc.** `invite_user` looks the invitee up in `Users` by exact email, updates the ranch, then adds to the invitee's `invitedRanchesList`. The own-doc-only rule should refuse that last write, so invites may be failing partway today. Confirm it first. The invitee's list reads `Ranches.invitedUsers`, so check whether `invitedRanchesList` is needed at all. Invites must work when this ships.
- **`Users` read:** the email lookup needs a way to find one user by exact email without letting anyone list every user. A callable function is the likely answer.
- **Algolia bypasses Firestore rules.** Cows and Bulls are searched through Algolia with a key shipped in the app (8 cow screens, 1 bull). Rules don't apply there, so report what's indexed and whether results are limited by ranch on the server. Without that, cow data stays readable across ranches.

## Effort

M. A FlutterFlow app release is part of this.

## Acceptance

- [ ] Emulator tests: a non-member can't write or delete another ranch's data; a member can do what the user decided; a non-member can't read another ranch, including its `Ranches` doc.
- [ ] Inviting by email and accepting both work end to end, and an invited user can't read the ranch's animals before accepting.
- [ ] The Algolia exposure is closed, or reported with a fix.
- [ ] Emulator tests: a client can't create a `Users` doc for another uid or set `premium`.
- [ ] A purchase sets `premium` and a lapse or refund clears it, with no client write, tested in RevenueCat sandbox.
- [ ] The app's own flows (login, milk log, animals, tasks, invites, purchase) still work against the emulator.
- [ ] The tamper check is reported.
- [ ] The user has deployed the rules and released the app (human).
