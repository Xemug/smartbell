---
id: dashboard
title: Reportes 'General' dashboard (V4)
summary: The V4 General view under Reportes: Vacas / Vaquillas / Toros counters, Días abiertos and DEL cards, heat watch, sick, pregnancy follow-up and litres per cow per day, each drilling into a filtered list; Expandido/Avanzado as fake doors.
---

# Reportes 'General' dashboard (V4)

## Problem

The home screen must answer "what needs attention today" at a glance.

## Why

First screen after onboarding; ties alerts and registry together.

**Depends on:** `alert-engine`, `animal-lists`, `milk-api`.

## What it touches

`app/api/smartbell/api/dashboard.py` (one aggregate endpoint), `app/web/src/features/dashboard/*`.

**Figma:** [V 3259-9504](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=3259-9504), [V 3633-1096](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=3633-1096)
**Inventory:** v4-reports.md §1.1, §3 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Before building, open every linked frame with the Figma MCP (`get_screenshot`; load the figma:figma-design-to-code skill before `get_design_context`). Use only components from `app/web/src/ui` and tokens from the design-system cards; Spanish copy goes in the es-MX i18n catalog. Build the mobile layout (<960px) and the web layout (≥960px) in the same route. Smartbell 4.0 (V links) supersedes the older Mobile/Web frames where both exist; see `docs/reconciliation-v4.md` §2.
Per v4-reports.md §1.1 and §3. Formulas in the KPI table there. Expandido/Avanzado open the fake-door modal. Counters drill into the animal list with preset filters.

## Effort

M.

## Acceptance

- [ ] Tile counts match the fixture herd's projections (API test).
- [ ] Each tile opens a filtered list whose count equals the tile.
- [ ] Matches M 1725-93380 and W 1091-41524 (human).
- [ ] Tests for the new code pass in CI.
