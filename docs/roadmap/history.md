---
id: history
title: History (Historial): activity feed with filters
summary: The Historial tab: activity entries (card types A/B/C) with search by cow ID, date range, filters by user role and event category. Deferred: marked 'Futuro' or not in Smartbell 4.0.
---

# History (Historial): activity feed with filters

## Problem

Owners need to see who did what across the ranch.

## Why

Surfaces the history writer's entries.

**Depends on:** `history-writer`, `cow-profile`.

## What it touches

`app/api/smartbell/api/history.py`, `app/web/src/features/history/*`.

**Figma:** [M 1442-69867](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1442-69867), [W 960-41601](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=960-41601)
**Inventory:** alerts-dashboard-reports.md 1.7, §3.5; web-onboarding-registry.md 1.20 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Before building, open every linked frame with the Figma MCP (`get_screenshot`; load the figma:figma-design-to-code skill before `get_design_context`). Use only components from `app/web/src/ui` and tokens from the design-system cards; Spanish copy goes in the es-MX i18n catalog. Build the mobile layout (<960px) and the web layout (≥960px) in the same route.
Per alerts-dashboard-reports.md 1.7 and web-onboarding-registry.md 1.20. Infinite scroll grouped by day; type A cards list cow IDs (expandable), B links the entity, C shows user avatars.

## Effort

S.

## Acceptance

- [ ] Recording events and moving cows produces entries that filter by category, role and date range.
- [ ] Search by cow ID returns only entries referencing it.
- [ ] Matches M 1442-69867 and W 960-41601 (human).
- [ ] Tests for the new code pass in CI.
