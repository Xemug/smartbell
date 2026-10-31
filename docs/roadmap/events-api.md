---
id: events-api
title: Events API: record, edit, delete events with re-projection
summary: One API for all bitácora event types with typed payloads, deletability rules, deletion requests, re-projection of the cow and alert/reminder sync.
---

# Events API: record, edit, delete events with re-projection

## Problem

All 7 event flows write events; the rules (non-deletable repro events, deletion requests, re-projection) must live in one place.

## Why

Each event-flow card then only builds UI.

**Depends on:** `repro-engine`, `animal-api`.

## What it touches

`app/api/smartbell/api/events.py`, `app/api/smartbell/services/events.py`, `app/api/smartbell/services/alert_sync.py`, tests.

**Figma:** n/a (no UI)
**Inventory:** domain-model.md §1, §4; event-flows.md §3 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Per domain-model §1 Events + §4. `POST /animals/{id}/events` with discriminated payload; server computes derived fields (calving timing, loss classification, withdrawal_until). After each write: rerun `repro.project`, persist the projection, and upsert/close Alerts and Reminders from the returned specs (idempotent by (animal, kind, window)). Edit allowed on deletable types and by admins on repro types (memo open question; implement admin-only edit). Delete: refused for ALTA/HEAT/PREGNANCY_CHECK/CALVING/ABORTION; without permission creates a DeletionRequest. Group change and ILLNESS auto-move to ENFERMAS update `group_id`. History entry per event.

## Effort

L.

## Acceptance

- [ ] Each event type has a create test that asserts the resulting projection and open alerts.
- [ ] Deleting a HEAT returns 409; deleting an ILLNESS without permission creates a DeletionRequest.
- [ ] Deleting an ILLNESS re-projects and closes its HEALTH alert.
- [ ] Posting the same event twice doesn't duplicate alerts.
- [ ] Tests for the new code pass in CI.
