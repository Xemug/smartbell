---
id: history-writer
title: Activity history writer and templates
summary: A service that records a HistoryEntry for every animal, group, event, user and ranch change, rendered from the Spanish templates in the design.
---

# Activity history writer and templates

## Problem

Every mutation needs a consistent audit trail. V4 removed the Historial tab and deferred the global feed (`docs/reconciliation-v4.md`, card `history`), and the per-cow log reads the bitácora (Events), but the entries still have to be written from day one: the domain model requires one for every event, `groups`, `user-admin` and `report-export` accept on them, and a later feed can't recover what was never recorded.

## Why

Writing it before the feature APIs means each API card just calls one function.

**Depends on:** `core-data-model`.

## What it touches

`app/api/smartbell/services/history.py`, templates in `app/api/smartbell/i18n/history_es.py`, keys in `app/api/smartbell/enums.py`, refs in `app/api/smartbell/schemas/history.py`, tests. No migration: `event_key` is a free string and `refs` is JSON.

**Figma:** n/a (no UI)
**Inventory:** alerts-dashboard-reports.md §3.5 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Per alerts-dashboard-reports.md §3.5 (categories, event keys, card types A/B/C, templates with N, refs). `record(session, ranch_id, user_id, key, refs, n)`; batch operations (e.g. moving 5 cows) produce one entry with N. Deleting a user keeps their entries.

## As built

- **`record`** adds and flushes, never commits, so the entry lives or dies with the caller's transaction. It raises `ValueError` for an entry that couldn't be shown: a name its template needs is missing, a named group has no `group_id`, or `n` differs from the distinct IDs on an A or C card. `user_id` may be None for system actions. **`render(entry)`** gives the Spanish text.
- **`HistoryRefs`** extends the domain model's `{animal_ids[], group_id, user_ids[]}` with the names `group`, `to_group` and `ranch`, copied at write time so an entry reads the same after a rename or delete. `group_id` is the group the card links to: the destination for a move or a group delete.
- **Only A/B/C rows have keys.** §3.5 marks Con Dispositivos, De Reportes and De Finanzas TBD, so they are out; `report-export` adds its key with its card.
- **Assumptions.** Singular forms are ours, since §3.5 only gives the plural. Four keys are not in §3.5 because "every event writes a HistoryEntry" and it has no template for these outcomes, all with copy to confirm: `PREGNANCY_NEGATIVE`, `ABORTED`, `VACCINATED`, `WEIGHED`. `ANIMALS_REMOVED_ERROR` is card B with no required ref: ERROR_REGISTRO is a hard delete, so there is no animal left to link. §3.5 copy is verbatim, including "Se eliminó X potrero" and feminine wording after "animales".
- **For the callers.** `events-api` maps ALTA→`ANIMALS_ADDED`, HEAT→`HEAT_IDENTIFIED`, PREGNANCY_CHECK→`PREGNANCY_DIAGNOSED`/`PREGNANCY_NEGATIVE`, CALVING→`CALVED`, ABORTION→`ABORTED`, ILLNESS→`ANIMALS_ILL`, ACCIDENT→`ANIMALS_INJURED`, MEDICAL_TREATMENT→`TREATMENT_APPLIED`, TREATMENT_FOLLOWUP→`ANIMALS_CURED`/`TREATMENT_CHANGED`, DIET_CHANGE→`DIET_CHANGED`, GROUP_CHANGE→`GROUP_ANIMALS_MOVED`, VACCINATION→`VACCINATED`, WEIGHT→`WEIGHED`, and REMOVAL→the `ANIMALS_REMOVED_*` key for its reason. `history_entries.ranch_id` cascades, so a ranch removal must be soft or `RANCH_REMOVED` disappears with the ranch (Ranch has no soft delete yet).

## Effort

S.

## Acceptance

- [ ] Every template in §3.5 marked A/B/C has a key and a rendering test (singular/plural).
- [ ] `record` is called inside the caller's transaction (rollback leaves no entry).
- [ ] Tests for the new code pass in CI.
