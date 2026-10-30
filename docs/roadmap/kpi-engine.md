---
id: kpi-engine
title: Report KPI engine (Básico report)
summary: A tested service computing every Básico KPI for a ranch, period and animal category, with previous-period delta and benchmark bands. Deferred: marked 'Futuro' or not in Smartbell 4.0.
---

# Report KPI engine (Básico report)

## Problem

Reports are how the product proves profitability; the formulas are scattered across report specs.

## Why

Report screens and exports become thin renderers.

**Depends on:** `events-api`.

## What it touches

`app/api/app/reports/kpis.py`, `bands.py`, `/reports/basic` endpoint, tests on a fixture herd with hand-computed expectations.

**Figma:** n/a (no UI)
**Inventory:** alerts-dashboard-reports.md §3.4 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Per alerts-dashboard-reports.md §3.4 (each KPI's formula, unit, bands) and spec 1091:41924 contents. Include: confirmed/expected heats, pregnancies, calvings; sick treated/waiting; heat detection efficiency; heats 45–60 DIM; services performed; first-service conception rate; services per conception (+ distribution); calving interval (days, months view); age at first calving; days calving→first service (+ histogram); culled total and for repro problems; lactation-number distribution; DIM; days open. Each returns value, unit, band, previous value, delta %, and drill-down cow IDs. Regional benchmark copy is out of scope (no data).

## Effort

L.

## Acceptance

- [ ] Every KPI in §3.4's Básico list has a test against a fixture with a hand-computed value.
- [ ] Changing the period changes values and deltas correctly.
- [ ] Bands map values to Malo/Aceptable/Bueno/Excelente per §3.4.
- [ ] Tests for the new code pass in CI.
