---
id: animal-lists
title: Animal lists with search and filters (cows, heifers, bulls)
summary: The Vacas tab: cows / heifers / bulls lists with search by ID, Categoría→Variable filters, sort, paging, selection and row actions, on mobile and web.
---

# Animal lists with search and filters (cows, heifers, bulls)

## Problem

The herd list is the main way to find a cow and the launch point for bulk moves and removals.

## Why

Entry to the cow profile and every event flow.

**Depends on:** `animal-api`, `ui-surfaces-feedback`.

## What it touches

`app/web/src/features/animals/list/*`.

**Figma:** [M 1781-99287](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1781-99287), [M 1781-99585](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1781-99585), [M 1803-96981](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1803-96981), [M 1635-93922](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1635-93922), [W 2018-878545](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=2018-878545), [W 2018-878629](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=2018-878629), [W 49-1514](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=49-1514)
**Inventory:** mobile-core.md A10, B1; web-onboarding-registry.md 1.8, 1.14 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Before building, open every linked frame with the Figma MCP (`get_screenshot`; load the figma:figma-design-to-code skill before `get_design_context`). Use only components from `app/web/src/ui` and tokens from the design-system cards; Spanish copy goes in the es-MX i18n catalog. Build the mobile layout (<960px) and the web layout (≥960px) in the same route.
Columns per web 1.14 (Vacas: ID, Raza, Estado, DIM, Grupo, Acciones; Vaquillas: ID, Raza, Estado, edad, Grupo; Toros: ID, Raza, Nombre, edad, SINIIGA). Heifer "DIM" column shows age (open question; label it Edad). Mobile list cards per B1/A10. Filters via FilterPanel, state in the URL query. Bulk actions: move to group (opens the groups card's picker when available) and remove.

## Effort

M.

## Acceptance

- [ ] Search by ID, each filter category and sort work on the fixture herd at both widths.
- [ ] Empty filter result shows "No encontramos animales con el filtro aplicado".
- [ ] Filter state survives reload (URL).
- [ ] Matches M 1781-99287, W 2018-878545 (human).
- [ ] Tests for the new code pass in CI.
