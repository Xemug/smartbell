---
id: reports-overview
title: Reports tab: Básicos overview
summary: Mobile and web reports overview with period, ranch and category filters, KPI cards with change vs previous period, and Avanzados shown as locked. Deferred: marked 'Futuro' or not in Smartbell 4.0.
---

# Reports tab: Básicos overview

## Problem

Users need the monthly "estado de cuenta" of their herd.

## Why

Entry to KPI detail and exports.

**Depends on:** `kpi-engine`.

## What it touches

`app/web/src/features/reports/overview/*`.

**Figma:** [M 2315-175535](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2315-175535), [M 2380-177190](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2380-177190), [M 2334-5855](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2334-5855), [W 1166-32](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=1166-32), [W 1091-41926](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=1091-41926), [R 1-129207](https://www.figma.com/design/nUJCa7ZxyUPwr3J6sxato1/x?node-id=1-129207), [R 1-122903](https://www.figma.com/design/nUJCa7ZxyUPwr3J6sxato1/x?node-id=1-122903), [R 0-1](https://www.figma.com/design/nUJCa7ZxyUPwr3J6sxato1/x?node-id=0-1)
**Inventory:** alerts-dashboard-reports.md 1.8–1.9 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Before building, open every linked frame with the Figma MCP (`get_screenshot`; load the figma:figma-design-to-code skill before `get_design_context`). Use only components from `app/web/src/ui` and tokens from the design-system cards; Spanish copy goes in the es-MX i18n catalog. Build the mobile layout (<960px) and the web layout (≥960px) in the same route.
Per alerts-dashboard-reports.md 1.8–1.9 and Reports file frames. Period default current month. Avanzados tiles (Finanzas, Aretes, Genética) render locked with the plan badge.

## Effort

M.

## Acceptance

- [ ] Overview shows every Básico KPI from the engine for the selected period at both widths.
- [ ] Changing period/category refetches.
- [ ] Matches R 1-129207 and W 1091-41926 (human).
- [ ] Tests for the new code pass in CI.
