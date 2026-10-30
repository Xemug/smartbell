---
id: ranch-tenancy-permissions
title: Ranches, memberships, roles and permission guard
summary: Ranch CRUD, multi-ranch membership with the 5 roles and their permission presets, an API permission guard, and the live ranch switcher.
---

# Ranches, memberships, roles and permission guard

## Problem

All data is per ranch and actions are role-gated (e.g. Nutriólogo cannot add cows); nothing enforces that yet.

## Why

Every write endpoint after this declares a permission code instead of inventing checks.

**Depends on:** `auth`.

## What it touches

`app/api/app/api/ranches.py`, `app/api/app/security/permissions.py` (codes + role presets), `require(permission)` dependency, `app/web/src/app/ActiveRanchProvider.tsx`, tests.

**Figma:** n/a (no UI)
**Inventory:** mobile-core.md E1, E10; web-onboarding-registry.md 1.17 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Permission codes and presets from mobile-core.md §Role permission matrix (Dueño = all; flag the Médico/Técnico oddities as TODO comments linked to the memo). Every request carries `X-Ranch-Id`; the guard checks membership + permission. Ranch switcher (from app-shell) now lists the user's ranches and persists the choice. Owner can't be removed from their ranch.

## Effort

M.

## Acceptance

- [ ] A Técnico de campo gets 403 on cow creation; a Médico gets 201 (API tests from the matrix).
- [ ] Data from ranch A is never returned when the active ranch is B (test on every list endpoint added later via a shared fixture).
- [ ] Switching ranch in the UI refetches all queries.
- [ ] Tests for the new code pass in CI.
