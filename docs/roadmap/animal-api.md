---
id: animal-api
title: Animal registry API: create, edit, remove, search, filter
summary: CRUD API for animals on the V4 model (sex, development stage, crossbreed level, parents on every animal, dam status), the ALTA event, removal with reasons, and list search/filters.
---

# Animal registry API: create, edit, remove, search, filter

## Problem

Registering and finding animals is the first daily action; validations in the notes (SINIIGA format, age limits) must be enforced server-side.

## Why

Every screen with a cow depends on this API.

**Depends on:** `repro-engine`, `history-writer`, `ranch-tenancy-permissions`.

## What it touches

`app/api/smartbell/api/animals.py`, `app/api/smartbell/services/animals.py`, tests.

**Figma:** n/a (no UI)
**Inventory:** domain-model.md §1, §3.11, §7.1; v4-animal-registration-profile.md §3; web-onboarding-registry.md 1.9 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Rules from domain-model §1 and §3.11 and web-onboarding-registry.md §3: control_id charset, SINIIGA 4–8 digits with 4-digit expansion, default breed Holstein, birth date not future, cow last calving ≥ birth + 660 d, heifer ≤ 24 months on edit, >30 months warning. Creating a cow takes onboarding repro inputs (stage, last calving, last heat/service, lactation number) which are written as initial events so the repro engine can project; then runs the projection. Removal reasons; ERROR_REGISTRO hard-deletes. List endpoint: kind, search by control_id, filters (group, breed, repro state, health, removed reason), sort, page size 10. Permission codes from ranch-tenancy. History entries via history-writer. **V4 model (domain-model.md §7.1):** only name_or_control_id + birth_date are required; sex replaces kind (kind derived); development_stage with AUTO; crossbreed_level + contributing_breed (required when not FB); dam/sire on every animal with inline parent creation (`POST /animals` with a nested `dam`/`sire` that is created first); dam status on heifer registration writes a REMOVAL on the dam when she is not alive.

## Effort

M.

## Acceptance

- [ ] Creating a cow with stage Gestante + service date returns a projection with an expected calving window.
- [ ] Duplicate control_id or SINIIGA in the same ranch → 409 with field error.
- [ ] Filter `repro=SERVIDA&group=GENERAL` returns only matching cows (test).
- [ ] Baja with ERROR_REGISTRO removes the row and its events; other reasons keep them with status REMOVED.
- [ ] A heifer registered with a new dam creates both animals, linked, in one transaction.
- [ ] crossbreed_level F2 without a contributing_breed → 422.
- [ ] Tests for the new code pass in CI.
