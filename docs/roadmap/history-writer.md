---
id: history-writer
title: Activity history writer and templates
summary: A service that records a HistoryEntry for every animal, group, event, user and ranch change, rendered from the Spanish templates in the design.
---

# Activity history writer and templates

## Problem

The History tab and the per-cow log need a consistent audit trail written from every mutation.

## Why

Writing it before the feature APIs means each API card just calls one function.

**Depends on:** `core-data-model`.

## What it touches

`app/api/app/services/history.py`, templates in `app/api/app/i18n/history_es.py`, tests.

**Figma:** n/a (no UI)
**Inventory:** alerts-dashboard-reports.md §3.5 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Per alerts-dashboard-reports.md §3.5 (categories, event keys, card types A/B/C, templates with N, refs). `record(session, ranch_id, user_id, key, refs, n)`; batch operations (e.g. moving 5 cows) produce one entry with N. Deleting a user keeps their entries.

## Effort

S.

## Acceptance

- [ ] Every template in §3.5 marked A/B/C has a key and a rendering test (singular/plural).
- [ ] `record` is called inside the caller's transaction (rollback leaves no entry).
- [ ] Tests for the new code pass in CI.
