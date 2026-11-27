---
id: dashboard
title: Reportes 'General' dashboard (V4)
summary: The V4 General view under Reportes: Vacas / Vaquillas / Toros counters, Días abiertos and DEL cards, heat watch split into A revisar hoy / Para seguimiento, sick, pregnancy follow-up toward calving, a herd-distribution donut on web, and litres per cow per day, each drilling into a filtered list; Expandido/Avanzado as fake doors.
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

**Founder decisions (2026-11-26).** These settle the v3→v4 conflicts in v4-reports.md §3. Where they disagree with a frame, they win over the frame.

1. **Keep the heat split.** The heat tile shows two counts: **"A revisar hoy"** and **"Para seguimiento"**. Both count cows whose expected-heat window includes today. "A revisar hoy" is the first expected heat since her last calving. "Para seguimiento" is the second or a later cycle, meaning she has already gone through at least one expected heat with no service recorded. This is the 2019 rule (`mixins/heats.js` and `HomeFullCard.vue` in the recovered app). It takes cycle length and window from `RanchSettings` (`heat_cycle_days`, `heat_window_days`), not the 2019 hard-coded 21 ± 3 days. Each count drills into its own list, and the two together equal the old single "Vacas a observar celos" count. If v4 has no two-part tile, add the second count to the V 3259-9504 heat row in the same style.
2. **"Seguimiento preñez" follows confirmed pregnant cows toward calving.** It is not a count of cows due for a pregnancy check. It counts cows with a confirmed pregnancy (`repro_state` GESTANTE or SECA, i.e. `pregnancy_confirmed_date` is set). Its purpose is to help the farmer give each cow proper attention and care in the days around calving. The drill-down list:
   - is sorted by `expected_calving_date`, soonest first;
   - shows days left to calving;
   - highlights cows whose calving window (`calving_window()` in `app/api/smartbell/domain/repro.py`, domain-model §3.5) includes today;
   - keeps the "Siguientes partos entre" range filter from alerts-dashboard-reports.md (Preñadas list).
3. **Keep the "Distribución del hato" donut, on web (≥960px) only.** Lay it out from W 1091-41524 (alerts-dashboard-reports.md §1.2). The slices split the cows in the selected category by reproductive state:
   - **Preñadas**: GESTANTE + SECA.
   - **Con servicio**: SERVIDA.
   - **Abiertas**: ABIERTA + RECIEN_PARIDA.

   The slices add up to the total in the centre. **Enfermas** is a legend line with a count, not a slice, because a sick cow already sits in one of the three slices. "Ver más" and each legend line drill into the animal list with that filter.

## Effort

M.

## Acceptance

- [ ] Tile counts match the fixture herd's projections (API test).
- [ ] The heat tile shows "A revisar hoy" and "Para seguimiento". The API test has a cow on her first post-calving cycle in the first count and a cow on her second cycle in the second, and the two counts sum to the cows whose expected-heat window includes today.
- [ ] "Seguimiento preñez" counts only cows with a confirmed pregnancy. Its list is sorted by expected calving date, shows days to calving, and highlights cows inside their calving window (API and component tests).
- [ ] At ≥960px the herd donut shows Preñadas / Con servicio / Abiertas, which sum to the centre total, with Enfermas as a legend count. Below 960px the donut is not rendered.
- [ ] On a phone and on a desktop browser, the heat split, the pregnancy follow-up list and the web donut look right and their counts match the lists they open (human).
- [ ] Each tile opens a filtered list whose count equals the tile.
- [ ] Matches M 1725-93380 and W 1091-41524 (human).
- [ ] Tests for the new code pass in CI.
