---
id: ranch-tenancy-permissions
title: Ranches, memberships, roles and permission guard
summary: Ranch CRUD, multi-ranch membership with the 5 roles and their permission presets, an API permission guard, and the live ranch switcher.
verifiedAt: 2026-11-02
---

# Ranches, memberships, roles and permission guard

## Problem

All data is per ranch and actions are role-gated (e.g. Nutriólogo cannot add cows); nothing enforces that yet.

## Why

Every write endpoint after this declares a permission code instead of inventing checks.

**Depends on:** `auth`.

## What it touches

`app/api/smartbell/routes/ranches.py` (routes live in `routes/`, not `api/`), `app/api/smartbell/security/permissions.py` (codes + role presets; `security.py` became a package), `app/api/smartbell/security/ranch.py` (`require(permission)` dependency), `app/api/smartbell/services/ranches.py`, `app/web/src/app/ActiveRanchProvider.tsx`, `app/web/src/api/client.ts` (the `X-Ranch-Id` header), tests.

**Figma:** n/a (no UI)
**Inventory:** mobile-core.md E1, E10; web-onboarding-registry.md 1.17 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Permission codes and role presets from `docs/domain-model.md` §7.8, the confirmed matrix. It replaces mobile-core.md's, so no TODOs are left. Every request carries `X-Ranch-Id`; the guard checks membership + permission. Ranch switcher (from app-shell) now lists the user's ranches and persists the choice. Owner can't be removed from their ranch.

### Built (2026-11-02)

- **Codes:** one `Permission` per §7.8 row (`ANIMALS_CREATE` … `BILLING`). A membership stores its codes, starting from its role's preset; `user-admin` edits them. The Dueño always has every code, whatever is stored.
- **Guard:** `require(Permission.X)` reads `X-Ranch-Id`. No header → 400 `ranch_required`; not a member (or no such ranch) → 403 `not_a_member`, the same answer either way; missing code → 403 `permission_denied`. Handlers get a `RanchContext` and filter on `ctx.ranch_id`.
- **Endpoints:** `GET /api/ranches`, `POST /api/ranches` (the caller becomes Dueño; at most 20 owned ranches), `GET /api/ranch/members` (USERS_VIEW), `PATCH /api/ranch/members/{user_id}` (USERS_EDIT; role resets the preset, or explicit codes), `DELETE /api/ranch/members/{user_id}` (USERS_DELETE). `/auth/me` and `/auth/session` now return each ranch's role and codes.
- **Member rules:** the owner can't be edited or removed (403 `owner_protected`); nobody edits their own membership; DUENO can't be handed out; nobody grants a code they don't hold (403 `cannot_grant`), so an Admin can't give out billing.
- **Web:** the switcher lists the account's ranches, the choice is kept in localStorage per user, every API call carries `X-Ranch-Id`, and a switch resets all queries (old data never shows under the new ranch). `useActiveRanch().can(code)` lets screens hide what the role can't do.

### Assumptions (no answer needed to proceed)

- **Cow creation doesn't exist yet** (`animal-api`). The 403/201 acceptance test runs against a test-only route guarded with `ANIMALS_CREATE`, exactly as `animal-api` will declare it.
- **Rename and delete of a ranch** stay with `profile-ranch-config`, which names them; **inviting/adding members** stays with `user-admin`. This card builds list/create ranches and list/edit/remove members.
- **No data migration:** today only sign-up creates memberships, all Dueño, and the Dueño gets every code regardless of what is stored. `legacy-firestore-import` must write presets with `preset(role)`.
- **Isolation fixture:** `tests/test_ranch_isolation.py` holds `LIST_ENDPOINTS`; each later list endpoint adds an entry (path + seed). The `ranch_pair` fixture in `tests/conftest.py` gives one owner with ranches A and B.

## Effort

M.

## Acceptance

- [x] A Técnico de campo gets 403 on cow creation; a Médico gets 201 (API tests from the matrix). Run on a test route guarded with `ANIMALS_CREATE` until `animal-api` adds the real one.
- [x] Every role's preset matches §7.8 cell by cell (one table-driven test, read from the doc's own table).
- [x] Data from ranch A is never returned when the active ranch is B (test on every list endpoint added later via a shared fixture).
- [x] Switching ranch in the UI refetches all queries.
- [x] Tests for the new code pass in CI.
- [x] Owner can't be removed from their ranch (API test).
