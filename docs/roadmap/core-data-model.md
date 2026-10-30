---
id: core-data-model
title: Core data model and migrations
summary: SQLAlchemy models + first Alembic migration for users, ranches, memberships, settings, animals (V4 model: sex, development stage, crossbreed), groups, events, alerts, tasks, milk logs, history; a seeded fixture herd.
---

# Core data model and migrations

## Problem

Nothing in the database matches the domain; all API cards need these tables.

## Why

Locks the schema once so feature cards add endpoints, not tables.

**Depends on:** `app-scaffold`.

## What it touches

`app/api/app/models/*`, `app/api/alembic/versions/0001_core.py`, `app/api/app/seed/fixture_herd.py` (the 7 prototype cows 00001–00007 from event-flows.md plus ~30 more), `app/api/tests/test_models.py`.

**Figma:** n/a (no UI)
**Inventory:** domain-model.md §1 and §7 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Implement `docs/domain-model.md` §1 exactly (names in English, enums as Postgres enums or check-constrained strings). Event payload is JSONB validated by Pydantic discriminated unions per `type` (schemas live in `app/api/app/schemas/events.py`). Animal repro fields are a projection (nullable, written only by the repro engine). `RanchSettings` seeded with the defaults in domain-model §1 (⚙ values). Unique constraints: (ranch_id, control_id), (ranch_id, siniiga) where not null, (ranch_id, bull name). Soft-delete via status except ERROR_REGISTRO. **Apply domain-model.md §7** (it overrides §1): Animal sex / development_stage / crossbreed_level / contributing_breed / repro_stage_date / weights / parents on all animals; the Task entity (replaces Reminder); MilkHerdLog and MilkCowLog; the DietChange payload fields; the new settings.

## Effort

M.

## Acceptance

- [ ] `alembic upgrade head` then `downgrade base` both succeed on Postgres.
- [ ] `python -m app.seed.fixture_herd` creates a ranch, an owner user and ≥37 animals with events.
- [ ] Pydantic rejects an Event payload that doesn't match its type (tests per type).
- [ ] Unique constraints tested.
- [ ] Task, MilkHerdLog and MilkCowLog tables exist with the §7 fields.
- [ ] Tests for the new code pass in CI.
