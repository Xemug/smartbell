---
id: auth
title: Authentication via Firebase Auth: sign up, log in, session, splash
summary: Keep Firebase Auth (email, Google, Apple) as the identity provider so existing users and their RevenueCat/OneSignal/Mixpanel ids carry over; the API verifies Firebase ID tokens; V4 sign-up and log-in screens; auto-created first ranch.
---

# Authentication via Firebase Auth: sign up, log in, session, splash

## Problem

No one can use the app without an account; the old app's auth is the only reusable piece.

## Why

Gate for every authenticated card.

**Depends on:** `app-shell-navigation`, `core-data-model`.

## What it touches

`app/api/smartbell/routes/auth.py`, `app/api/smartbell/services/accounts.py`, `app/api/smartbell/security.py`, `app/web/src/features/auth/*`, `AuthProvider`, protected routes.

**Figma:** [V 2901-5671](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=2901-5671), [V 2901-5663](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=2901-5663), [V 2901-5565](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=2901-5565), [V 3291-9399](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=3291-9399), [W 1-146](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=1-146)
**Inventory:** v4-onboarding-dashboard-tasks.md §1.1–1.5 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Before building, open every linked frame with the Figma MCP (`get_screenshot`; load the figma:figma-design-to-code skill before `get_design_context`). Use only components from `app/web/src/ui` and tokens from the design-system cards; Spanish copy goes in the es-MX i18n catalog. Build the mobile layout (<960px) and the web layout (≥960px) in the same route. Smartbell 4.0 (V links) supersedes the older Mobile/Web frames where both exist; see `docs/reconciliation-v4.md` §2.
- Identity stays in Firebase Auth, project `smartbell-app-2025` (memo, recommendation after the audit). Web and Capacitor use the Firebase JS SDK. The API verifies ID tokens with `firebase-admin` and upserts a `users` row keyed by `firebase_uid`. No password storage in our DB.
- Providers: email/password, Google, Apple (required on iOS when Google is offered), Facebook only if the user confirms.
- V4 sign-up: name, phone (+52), email, password + confirm, T&C. The ranch is not asked: auto-create "Mi rancho".
- Forgot password uses Firebase's reset email.
- Splash and Home per V4. dairy-milk-tracker's auth is NOT ported.

## Audit notes and assumptions

- **Live project is off limits for this card (orchestrator, 2026-11-01):** never write to `smartbell-app-2025`. Build and test on the Auth emulator with project `demo-smartbell`. The legacy-account login check and authorized domains are steps for the user in the PR. Never print emails, phones or keys.
- The API holds an anonymous credential: it verifies tokens only and cannot write to Firebase.
- `firebase-admin` skips signature checks when `FIREBASE_AUTH_EMULATOR_HOST` is set, so Settings refuses that host unless the project is `demo-*`, and refuses a `demo-*` project when `ENV=prod`.
- An imported row (`firebase_uid` empty) is linked by email only when the token's email is verified; otherwise 409. This blocks takeover through an unconfirmed sign-up.
- Facebook is left out: the spec requires confirmation and none was given. Apple takes its slot, though no frame draws it.
- Login asks for an email: the frame's "Usuario" is ambiguous and Firebase needs an email. A forgot-password link is added though no frame draws it.
- T&C acceptance is enforced in the client only; storing it needs a column and a migration.
- The whole "Nombre" goes in `first_name`.
- `W 1-146` lives in the V file; the old link pointed at a file without that node.
- The first-cow step belongs to `onboarding-hub`; a placeholder route holds it until then.

## Effort

M.

## Acceptance

- [ ] Sign up by email, Google or Apple lands on the first-cow step with a ranch created.
- [ ] An existing legacy account logs in with its old password and gets the same uid.
- [ ] The API rejects expired or forged tokens (401).
- [ ] Screens match V 2901-5565 and V 3291-9399 (human).
- [ ] Tests for the new code pass in CI.
