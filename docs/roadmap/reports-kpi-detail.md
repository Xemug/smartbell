---
id: reports-kpi-detail
title: Report KPI detail screens
summary: Per-KPI detail: change over period, trend chart, Malo→Excelente gauge, coaching copy, distribution table that drills to a cow list. Deferred: marked 'Futuro' or not in Smartbell 4.0.
---

# Report KPI detail screens

## Problem

A number alone doesn't tell the farmer what to do; the detail screens explain and point to cows.

## Why

Completes the reports experience.

**Depends on:** `reports-overview`.

## What it touches

`app/web/src/features/reports/detail/*` (Recharts line/bar, Gauge component).

**Figma:** [R 1-123396](https://www.figma.com/design/nUJCa7ZxyUPwr3J6sxato1/x?node-id=1-123396), [R 1-123548](https://www.figma.com/design/nUJCa7ZxyUPwr3J6sxato1/x?node-id=1-123548), [R 1-123848](https://www.figma.com/design/nUJCa7ZxyUPwr3J6sxato1/x?node-id=1-123848), [W 1091-41926](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=1091-41926)
**Inventory:** alerts-dashboard-reports.md 1.8–1.9, §3.4 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Before building, open every linked frame with the Figma MCP (`get_screenshot`; load the figma:figma-design-to-code skill before `get_design_context`). Use only components from `app/web/src/ui` and tokens from the design-system cards; Spanish copy goes in the es-MX i18n catalog. Build the mobile layout (<960px) and the web layout (≥960px) in the same route.
Per alerts-dashboard-reports.md 1.8–1.9 detail frames and §3.4. Services-per-conception uses a count gauge, not the % gauge (design bug). Calving interval toggle Días/Meses; age at first calving Meses/Años. Coaching copy keyed to band in the es-MX catalog.

## Effort

M.

## Acceptance

- [ ] Each Básico KPI has a detail screen with chart, gauge and copy.
- [ ] Distribution rows open the matching cow list.
- [ ] Matches R 1-123396 and R 1-123548 (human).
- [ ] Tests for the new code pass in CI.
