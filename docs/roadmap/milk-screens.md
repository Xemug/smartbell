---
id: milk-screens
title: Milk screens: daily log, per-cow log and production history chart
summary: Registro global (today's herd litres), Registro individual (per-cow litres, cows leave the list once saved), the tank-log history with edit/delete, and the production history chart (bars + trend) by period.
---

# Milk screens: daily log, per-cow log and production history chart

## Problem

Farmers log milk daily; the shipped app's users depend on it.

## Why

Parity with the shipped app, plus the V4 charts.

**Depends on:** `milk-api`, `ui-surfaces-feedback`.

## What it touches

`app/web/src/features/milk/*` (Recharts bar + line).

**Figma:** [V 3269-9429](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=3269-9429), [V 3274-587](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=3274-587), [V 3274-10634](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=3274-10634), [V 3633-1096](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=3633-1096), [K 40935-510](https://www.figma.com/design/61o8icnDCev7fz5IN4irtj/x?node-id=40935-510)
**Inventory:** v4-reports.md §1.2–1.6; uikit-product.md S1–S2 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Before building, open every linked frame with the Figma MCP (`get_screenshot`; load the figma:figma-design-to-code skill before `get_design_context`). Use only components from `app/web/src/ui` and tokens from the design-system cards; Spanish copy goes in the es-MX i18n catalog. Build the mobile layout (<960px) and the web layout (≥960px) in the same route. Smartbell 4.0 (V links) supersedes the older Mobile/Web frames where both exist; see `docs/reconciliation-v4.md` §2.
Per v4-reports.md §1.2–1.6 and uikit-product.md S1–S2. Fix the garbled snackbar copy. The y-axis is labelled "lts". Period menu: week, month, quarter, semester, year (semester and year reuse the monthly chart).

## Effort

M.

## Acceptance

- [ ] Herd and per-cow logs save and show in the history list with edit/delete.
- [ ] The chart switches between week, month and quarter.
- [ ] Matches V 3269-9429 and V 3274-587 (human).
- [ ] Tests for the new code pass in CI.
