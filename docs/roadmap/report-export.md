---
id: report-export
title: Report export: PDF and XLS
summary: Download the Básico report for a period as PDF (with charts) and XLS, with a history entry. Deferred: marked 'Futuro' or not in Smartbell 4.0.
---

# Report export: PDF and XLS

## Problem

Farmers share monthly reports with vets and accountants.

## Why

Matches the design's download action.

**Depends on:** `reports-overview`.

## What it touches

`app/api/smartbell/reports/export.py` (WeasyPrint for PDF, openpyxl for XLS), download endpoint.

**Figma:** [W 1091-41926](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=1091-41926)
**Inventory:** alerts-dashboard-reports.md §3.4 spec 1091:41924 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Contents per spec 1091:41924 (header, 1st and 2nd sections). CSV optional. History: "Descargó el reporte general del periodo…".

## Effort

S.

## Acceptance

- [ ] PDF and XLS download for a period and contain every Básico KPI.
- [ ] A history entry is written.
- [ ] Tests for the new code pass in CI.
