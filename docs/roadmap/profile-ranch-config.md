---
id: profile-ranch-config
title: My account and ranch data configuration
summary: Mi cuenta (profile, photo, phone, password change) and Datos del rancho (name, address with map pin, delete ranch) on mobile and web.
---

# My account and ranch data configuration

## Problem

Users must set up their profile and ranch during onboarding and edit them later from the avatar menu.

## Why

Ranch name/location appear across the app and the email digest.

**Depends on:** `ranch-tenancy-permissions`.

## What it touches

`app/api/smartbell/api/users.py`, `ranches.py` (update/delete), photo upload endpoint (JPG/PNG ≤2MB to local/S3-compatible storage), `app/web/src/features/config/{account,ranch}/*`.

**Figma:** [M 1691-104](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1691-104), [M 1691-824](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1691-824), [M 1697-93765](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1697-93765), [M 2524-149062](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2524-149062), [M 2524-148618](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2524-148618), [W 49-1365](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=49-1365), [W 1315-56000](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=1315-56000)
**Inventory:** mobile-core.md A12–A14, E2, E6; web-onboarding-registry.md 1.4–1.5 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Before building, open every linked frame with the Figma MCP (`get_screenshot`; load the figma:figma-design-to-code skill before `get_design_context`). Use only components from `app/web/src/ui` and tokens from the design-system cards; Spanish copy goes in the es-MX i18n catalog. Build the mobile layout (<960px) and the web layout (≥960px) in the same route.
Fields and validation per mobile-core A13–A14/E2/E6 and web 1.4–1.5. Map: Leaflet + OSM tiles with a draggable pin (no Google key). Password change requires the current password. Deleting a ranch needs typed confirmation and Dueño role.

Audit (2026-11-19): `ranch-tenancy-permissions` is merged. `users.py` doesn't exist yet (this card adds it); the ranch routes live in `app/api/smartbell/routes/ranches.py`. The avatar menu already links Mi perfil to `/config/perfil` and Mis ranchos to `/config/ranchos` (placeholders until now). These were settled without a question, as the safest reading of the docs:

- **Email is read-only.** It is the Firebase sign-in identity; changing it needs Firebase's verify-before-update flow, which belongs with `auth`. The form shows it but doesn't edit it.
- **Password change happens in Firebase**, not our API: re-authenticate with the current password, then update. Accounts that signed in only with Google/Apple have no password, so the section isn't offered to them. Minimum 8 characters, new ≠ current, confirm = new (web 1.4).
- **Photo upload** is `PUT /api/users/me/photo` with the raw JPG/PNG body (no multipart dependency). The API checks the file's magic bytes as well as its type, stops reading past 2MB, and stores it under a random name. Storage is local disk (`MEDIA_DIR`) behind a small interface; an S3-compatible backend is a follow-up for deployment. Files are served at `/api/media/avatars/<random>.jpg|png` without auth, since `<img>` can't send a token; the names can't be guessed.
- **Who edits ranch data:** the Dueño and Administrador of that ranch. No §7.8 code covers ranch data, so it is a role check. **Only the owner deletes** a ranch (planner, 2026-11-19), after typing its name. A user can't delete the last ranch they belong to, since the app needs an active ranch.
- **Address** is free text plus a draggable pin (Leaflet + OSM tiles, no geocoding). With no pin saved, the map opens on Guadalajara.
- **Creating a ranch is Pro-gated (planner, 2026-11-19, per `plans-billing`):** a user with no owned ranch, or with Pro, may create one; a user who already owns one or more and lacks Pro gets the upsell. Ranches they only belong to as a member don't count, and legacy users keep every ranch they own. One check, `services/plans.ranch_creation`, decides it; `GET /api/auth/me` returns it as `ranch_creation` (`allowed` / `upsell` / `limit`) and `POST /api/ranches` refuses with 402 `pro_required`. "Has Pro" means any ranch the user owns has a `plan_id` (the RevenueCat entitlement); no purchase flow is built. Mi perfil stays free.
- **Vacunación y Desarrollo** tab of the hub belongs to `vaccination-plan`; the hub shows only Mi cuenta and Datos Rancho.

## Effort

M.

## Acceptance

- [ ] Profile edits persist and show in the header.
- [ ] Photo >2MB or non-JPG/PNG is rejected with the design's message.
- [ ] Ranch pin position saves and reloads.
- [ ] Matches M 1691-824, M 1697-93765, W 49-1365, W 1315-56000 (human).
- [ ] Tests for the new code pass in CI.
