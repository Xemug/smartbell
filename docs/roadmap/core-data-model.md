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

`app/api/smartbell/enums.py`, `app/api/smartbell/models/*`, `app/api/smartbell/schemas/events.py`, `app/api/migrations/versions/0002_core.py` (`0001` is the empty baseline from `app-scaffold`), `app/api/smartbell/seed/fixture_herd.py` (the 7 prototype cows 00001–00007 from event-flows.md plus 31 more), `app/api/tests/test_models.py`, `test_event_payloads.py`, `test_fixture_herd.py`, `test_migrations.py`.

**Figma:** n/a (no UI)
**Inventory:** domain-model.md §1 and §7 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Implement `docs/domain-model.md` §1 exactly (names in English, enums as Postgres enums or check-constrained strings). Event payload is JSONB validated by Pydantic discriminated unions per `type` (schemas live in `app/api/smartbell/schemas/events.py`). Animal repro fields are a projection (nullable, written only by the repro engine). `RanchSettings` seeded with the defaults in domain-model §1 (⚙ values). Unique constraints: (ranch_id, control_id), (ranch_id, siniiga) where not null, (ranch_id, bull name). Soft-delete via status except ERROR_REGISTRO. **Apply domain-model.md §7** (it overrides §1): Animal sex / development_stage / crossbreed_level / contributing_breed / repro_stage_date / weights / parents on all animals; the Task entity (replaces Reminder); MilkHerdLog and MilkCowLog; the DietChange payload fields; the new settings.

### Assumptions and decisions (groomed 2026-10-30)

- **Paths.** The scaffold's package is `smartbell` and its migrations live in `migrations/`, so the original `app/api/app/...` and `alembic/` paths were stale. Other cards still use the old prefix; read it as `smartbell/`.
- **Enums** are check-constrained strings, not Postgres enums: same safety, and they run on the test suite's SQLite fallback. Adding a value needs a migration either way.
- **No `password_hash`.** §1 lists it, but the approved stack (reconciliation §5) and the `auth` card keep identity in Firebase, so `users` has a nullable, unique `firebase_uid` instead.
- **`heat_window_days` = 7 is the total width** (§7.6), not the ± of §3.3: 7 means 3 days either side. `repro-engine` must read it that way.
- **`Ranch.plan_id`** is a plain string with no FK: plans come from RevenueCat (reconciliation §5).
- **Added to the documented fields**, because a later card needs them: `Animal.name`, `RanchSettings.target_cow_count` (the declared herd, §7.5), `HistoryEntry.n`, `MilkCowLog.ranch_id`, created_at columns, alert kinds `PREG_RECHECK`, `CLOSE_UP`, `DIET_CHANGE`, and task kind `MANUAL`.
- **Bull-name uniqueness** applies to males only. `is_sick` is non-null, default false; the other projection fields are nullable.
- **Constraints that back later cards' idempotency:** one alert per (animal, kind, window); one OPEN task per alert.
- **`MilkCowLog` has no uniqueness rule:** §7.3 asks for one per day only on the herd log.
- **Delete rules.** Hard-deleting an animal cascades its events, alerts, tasks and milk logs and nulls parent references. Deleting a user nulls authorship and removes memberships. A ranch owner can't be deleted until ownership moves.
- **`occurred_on` has no column default:** "today" is the ranch's date, so `events-api` fills it in.
- **Payload validation runs in the ORM unit of work.** Bulk `insert()`/`update()` statements skip it, so bulk writers such as `legacy-firestore-import` must call `validate_event_payload` themselves. It only re-runs when `payload` or `type` changes.
- **One group per preset per ranch**, so General is always a single row.
- **`derive_kind` refuses a male with stage AUTO:** `repro-engine` resolves AUTO first.
- **Validation left to the service cards:** `occurred_on` not in the future, control_id charset, SINIIGA format and tenant checks on cross-references (depend on "today" or on other rows).
- **`MEDICAL_TREATMENT.treatment` is required**, as §1 says, though event-flows 1.8 draws only kind, date and description. Loosening it is a Pydantic change if `events-api` needs that.
- **Fixture herd.** Dates are relative to the day of seeding, so each prototype cow starts its flow. The projection fields are written by the seed until `repro-engine` exists. It refuses `ENV=prod` and does nothing on a second run. `membership.permissions` is empty until `ranch-tenancy-permissions` defines the codes. It writes no HistoryEntry rows: the keys belong to `history-writer`.
- **Left to their own cards (later modules in §1):** ReportExport, Plan, Subscription, Invoice, CancellationReason, Message, and legacy fields such as `legacy_siniiga` and milk prices.

## Effort

M.

## Acceptance

- [x] `alembic upgrade head` then `downgrade base` both succeed on Postgres.
- [x] `python -m smartbell.seed.fixture_herd` creates a ranch, an owner user and ≥37 animals with events.
- [x] Pydantic rejects an Event payload that doesn't match its type (tests per type).
- [x] Unique constraints tested.
- [x] Task, MilkHerdLog and MilkCowLog tables exist with the §7 fields.
- [x] Tests for the new code pass in CI.
