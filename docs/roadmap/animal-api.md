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

`app/api/smartbell/routes/animals.py` (routers live in `routes/`; there is no `api/` package), `app/api/smartbell/schemas/animals.py`, `app/api/smartbell/services/animals.py`, migration `0004_siniiga_national.py`, `app/api/tests/test_animals.py`, and the regenerated `app/web/src/api/schema.d.ts`.

**Figma:** n/a (no UI)
**Inventory:** domain-model.md §1, §3.11, §7.1; v4-animal-registration-profile.md §3; web-onboarding-registry.md 1.9 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Rules from domain-model §1 and §3.11 and web-onboarding-registry.md §3: control_id charset, SINIIGA per domain-model §7.7 (10 digits, state 01–32, unique nationally: this card replaces the per-ranch index `uq_animals_ranch_id_siniiga` with a partial unique index on `siniiga` for ACTIVE animals, in a migration), default breed Holstein, birth date not future, cow last calving ≥ birth + 660 d, heifer ≤ 24 months on edit, >30 months warning. Creating a cow takes onboarding repro inputs (stage, last calving, last heat/service, lactation number) which are written as initial events so the repro engine can project; then runs the projection. Removal reasons; ERROR_REGISTRO hard-deletes. List endpoint: kind, search by control_id, filters (group, breed, repro state, health, removed reason), sort, page size 10. Permission codes from ranch-tenancy. History entries via history-writer. **V4 model (domain-model.md §7.1):** only name_or_control_id + birth_date are required; sex replaces kind (kind derived); development_stage with AUTO; crossbreed_level + contributing_breed (required when not FB); dam/sire on every animal with inline parent creation (`POST /animals` with a nested `dam`/`sire` that is created first); dam status on heifer registration writes a REMOVAL on the dam when she is not alive.

## Decisions made while building (2026-11-03)

Audit: the dependencies (`repro-engine`, `history-writer`, `ranch-tenancy-permissions`) are merged and their code matches what this card assumed. These were resolved without a question, as the safest reading of the docs:

- **Endpoints** (all under `/api`, ranch from `X-Ranch-Id`): `POST /animals` (ANIMALS_CREATE), `GET /animals` (ANIMALS_VIEW), `GET /animals/{id}` (ANIMALS_VIEW, with the live projection), `PATCH /animals/{id}` (ANIMALS_EDIT), `POST /animals/{id}/removal` (ANIMALS_DELETE; 204 for ERROR_REGISTRO, 200 otherwise). Another ranch's animal is a 404.
- **Field errors** use FastAPI's validation shape (`detail: [{loc, type, msg}]`) with Spanish `msg`; a taken ID is a 409, every other refusal a 422. The SINIIGA refusal names nobody.
- **Required fields:** only `control_id` and `birth_date`; `sex` defaults to HEMBRA (the form's toggle).
- **control_id charset:** letters (ñ and accented vowels), digits, spaces and hyphens (the form's placeholder is `0000-0000-0000`).
- **SINIIGA:** 10 digits or the stored `MX-00-EE-NNNN-NNNN` form; an empty string is no SINIIGA. The new partial unique index covers ACTIVE holders only (as specified); a number retired by MUERTE or VENTA_RASTRO is refused by the service check.
- **Onboarding repro inputs** (`repro_stage`, `repro_stage_date`, `lactation_number`, `last_calving_date`, `last_service_date`) go on the ALTA event, which seeds the engine; "last heat" is `repro_stage_date` for ABIERTA. They are female-only and not editable afterwards (events own them).
- **Age rules:** "heifer ≤ 24 months on edit" means a VAQUILLA's birth date can only be changed to one that keeps her 24 months old or younger; a cow's birth date must stay 660 days before her last calving. The > 30 months advice is `projection.warnings: ["NOT_FERTILE"]`. An AUTO-stage female over 27 months is registered as a cow with one lactation (engine rule, §7.1).
- **Dam status** applies whenever a dam is given (by id or inline). A non-VIVA status needs ANIMALS_DELETE too, since it writes a REMOVAL.
- **Group filter:** a group id, or a preset name. No GENERAL group is seeded yet (that is `groups`), so `group=GENERAL` also matches animals with no group.
- **Removed animals** are read-only (409 `animal_removed`) except for an ERROR_REGISTRO deletion. The default list shows ACTIVE animals; `removed_reason` lists the Bajas.
- **"Today"** is the America/Mexico_City date until ranches store a timezone.

## Effort

M.

## Acceptance

- [x] Creating a cow with stage Gestante + service date returns a projection with an expected calving window.
- [x] Duplicate control_id in the same ranch → 409 with field error.
- [x] A SINIIGA held by an ACTIVE animal in any ranch → 409 with a field error that names no ranch, owner or animal (test with two ranches).
- [x] A SINIIGA whose last holder died or went to slaughter → 409 in any ranch; one sold to another ranch can be registered by the buyer (domain-model §7.7).
- [x] A SINIIGA with the wrong length or a state outside 01–32 → 422; a missing SINIIGA is accepted.
- [x] Filter `repro=SERVIDA&group=GENERAL` returns only matching cows (test).
- [x] Baja with ERROR_REGISTRO removes the row and its events; other reasons keep them with status REMOVED.
- [x] A heifer registered with a new dam creates both animals, linked, in one transaction.
- [x] crossbreed_level F2 without a contributing_breed → 422.
- [ ] Tests for the new code pass in CI.
