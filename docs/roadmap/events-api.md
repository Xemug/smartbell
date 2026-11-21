---
id: events-api
title: Events API: record, edit, delete events with re-projection
summary: One API for all bitácora event types with typed payloads, deletability rules, deletion requests, re-projection of the cow and alert/reminder sync.
verifiedAt: 2026-11-21
auditedAt: 2026-11-21
---

# Events API: record, edit, delete events with re-projection

## Problem

All 7 event flows write events; the rules (non-deletable repro events, deletion requests, re-projection) must live in one place.

## Why

Each event-flow card then only builds UI.

**Depends on:** `repro-engine`, `animal-api`.

## What it touches

`app/api/smartbell/routes/events.py`, `app/api/smartbell/services/events.py`, `app/api/smartbell/services/alert_sync.py`, tests.

**Figma:** n/a (no UI)
**Inventory:** domain-model.md §1, §4; event-flows.md §3 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Per domain-model §1 Events + §4. `POST /animals/{id}/events` with discriminated payload; server computes derived fields (calving timing, loss classification, withdrawal_until). After each write: rerun `repro.project`, persist the projection, and upsert/close Alerts and Reminders from the returned specs (idempotent by (animal, kind, window)). Edit allowed on deletable types and by admins on repro types (memo open question; implement admin-only edit). Delete: refused for ALTA/HEAT/PREGNANCY_CHECK/CALVING/ABORTION; without permission creates a DeletionRequest. Group change and ILLNESS auto-move to ENFERMAS update `group_id`. History entry per event.

## Audit (2026-11-21, builder)

- Files: `routes/events.py`, `services/events.py` and `services/alert_sync.py` are new. The pieces they build on exist: `models/events.py` (Event, DeletionRequest), `schemas/events.py` (typed payloads), `services/projection.py` (`reproject_animal`), `domain/repro.py` (alert and reminder specs, `classify_loss`, `calving_window`), `models/work.py` (Alert, with the unique (animal, kind, window) key).
- There is no Reminder table: §7.2 replaced it with Task, which belongs to `alert-engine`. So `alert_sync` upserts and closes **Alerts** only. Reminder specs go through a no-op seam with a TODO naming `alert-engine`.

## Decisions and assumptions

- **Routes** (all under `/api/animals/{animal_id}/events`, scoped to `X-Ranch-Id`): `GET` (bitácora, newest first), `POST` (record), `PATCH /{event_id}` (edit), `DELETE /{event_id}`.
- **ALTA and REMOVAL are not recorded here**: ALTA comes from `POST /animals`, and REMOVAL from `POST /animals/{id}/removal` (it changes status and SINIIGA rules). Editing or deleting either is refused with 409 (`event_not_editable` / `event_not_deletable`). Undoing a baja is left to its own card.
- **Permissions**: recording, editing and deleting need `EVENTS_RECORD`. Deleting directly also needs `ANIMALS_DELETE` ("Eliminar vacas"). Without it, the API creates (or returns the existing) pending DeletionRequest and answers 202. Editing a repro event (HEAT, PREGNANCY_CHECK, CALVING, ABORTION) is for the Dueño and Administrador roles only (§6 Q4: editable by admins, never deletable).
- **Derived fields**: CALVING `timing` is always computed by the server from the calving window before the event (inside = ESPERADO, before = ANTICIPADO, after = RETRASADO). If there is no window, the server keeps what the client sent, or ESPERADO. The ABORTION loss classification (`classify_loss`) and a treatment's `withdrawal_until` come back in the response's `derived` and are not stored. The animal's `milk_withdrawal_until` comes from the projection as before, which is the field the milk API reads.
- **Alert sync** (`services/alert_sync.py`): for each spec, insert the alert if (animal, kind, window) doesn't exist yet. A closed alert whose resolving event is edited or deleted is reopened if the projection asks for it again. No other closed alert reopens, so one the alert engine expired stays expired. A PENDING alert that is missing from the specs is closed when its window hasn't ended, or when the event resolves its kind (HEAT→HEAT; PREGNANCY_CHECK→PREGNANCY_CHECK, PREG_RECHECK, HEAT; CALVING and ABORTION→CALVING, DRY_OFF, CLOSE_UP, PREGNANCY_CHECK, PREG_RECHECK; TREATMENT_FOLLOWUP→HEALTH). It closes as CONFIRMED with `resulting_event_id` when an event resolves it (NEGATED for a HEAT that was NOT_OBSERVED, "No entró"), and EXPIRED otherwise. A removed animal has every pending alert closed, of every kind. Expiring alerts whose window has passed stays with `alert-engine`. An open Task on a closed alert is closed with it.
- **Groups**: a GROUP_CHANGE, or a `group_change` on ILLNESS or ACCIDENT, moves the animal (`from_group_id` is set by the server). An ILLNESS with no `group_change` moves the animal to the ranch's ENFERMAS preset group, if the ranch has one, and records the move in the payload. Deleting the event moves the animal back if it is still in that group. An edit corrects the recorded move, but moves the animal only if she is still where the old move put her. An ILLNESS or ACCIDENT edited without `group_change` keeps the stored move. To undo a move, record a GROUP_CHANGE.
- **References** (`bull_id`, `calf_animal_id`, `vaccine_id`, group ids) must belong to the active ranch, or the API answers 422. `occurred_on` can't be in the future or before the animal's birth. A removed animal is read-only (409 `animal_removed`). HEAT, PREGNANCY_CHECK, CALVING and ABORTION are refused on a male (422 `not_female`).
- **Concurrency**: each write locks the animal row (`SELECT … FOR UPDATE`), so two writes to one animal can't insert the same alert or two pending deletion requests. This needs no migration, so it doesn't collide with #27's 0007.
- **Edits**: an edit that sends neither a payload nor a new date leaves the stored payload alone, even one from an older schema.
- **History**: create writes the event's De Salud entry (or GROUP_ANIMALS_SENT for a group change). Edit and delete write ANIMALS_EDITED.

## Effort

L.

## Acceptance

- [ ] Each event type has a create test that asserts the resulting projection and open alerts.
- [ ] Deleting a HEAT returns 409; deleting an ILLNESS without permission creates a DeletionRequest.
- [ ] Deleting an ILLNESS re-projects and closes its HEALTH alert.
- [ ] Posting the same event twice doesn't duplicate alerts.
- [ ] Tests for the new code pass in CI.
