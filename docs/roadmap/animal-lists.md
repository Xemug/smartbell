---
id: animal-lists
title: Animal lists with search and filters (cows, heifers, bulls)
summary: The Vacas tab: cows / heifers / bulls lists with search by ID, Categoría→Variable filters, sort, paging, selection and row actions, on mobile and web.
verifiedAt: 2026-11-21
---

# Animal lists with search and filters (cows, heifers, bulls)

## Problem

The herd list is the main way to find a cow and the launch point for bulk moves and removals.

## Why

Entry to the cow profile and every event flow.

**Depends on:** `animal-api`, `ui-surfaces-feedback`.

## What it touches

`app/web/src/features/animals/list/*`, plus a read-only `GET /api/groups` (`app/api/smartbell/routes/groups.py`) and `born_from`/`born_to` on `GET /api/animals`.

**Figma:** [M 1781-99287](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1781-99287), [M 1781-99585](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1781-99585), [M 1803-96981](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1803-96981), [M 1635-93922](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1635-93922), [W 2018-878545](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=2018-878545), [W 2018-878629](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=2018-878629), [W 49-1514](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=49-1514)
**Inventory:** mobile-core.md A10, B1; web-onboarding-registry.md 1.8, 1.14 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Before building, open every linked frame with the Figma MCP (`get_screenshot`; load the figma:figma-design-to-code skill before `get_design_context`). Use only components from `app/web/src/ui` and tokens from the design-system cards; Spanish copy goes in the es-MX i18n catalog. Build the mobile layout (<960px) and the web layout (≥960px) in the same route.
Columns per web 1.14 (Vacas: ID, Raza, Estado, DIM, Grupo, Acciones; Vaquillas: ID, Raza, Estado, edad, Grupo; Toros: ID, Raza, Nombre, edad, SINIIGA). Heifer "DIM" column shows age (open question; label it Edad). Mobile list cards per B1/A10. Filters via FilterPanel, state in the URL query. Bulk actions: move to group (opens the groups card's picker when available) and remove.

## Audit (2026-11-21)

- Premise holds: `GET /api/animals` (animal-api) already offers kind, `q`, group, breed, repro, health, removed_reason, sort and pages of 10; `FilterPanel`, `DataTable`, `Pagination`, `Tabs`, `Modal` exist in `app/web/src/ui`. `/vacas` was a placeholder and `features/animals` did not exist yet.
- Gap: the list returns only `group_id` and there was no groups endpoint, so the Grupo column could not name a potrero. Added read-only `GET /api/groups` (id, name, type, preset; ANIMALS_VIEW, ranch-scoped) for the `groups` card to extend (orchestrator agreed).
- Gap: bulls' Edad filter (B1, `Bull_Age`) had no API support. Added `born_from`/`born_to` to `GET /api/animals`; the web maps each bucket (Menos de un año, 1…8 años, 9+) to a birth-date range.
- URL state: `/vacas?tipo=vaquillas&q=…&filtro=repro&valor=GESTANTE&orden=dim:desc&pagina=2`; defaults stay out of the URL, and values a list doesn't offer fall back to none.

### Assumptions

- Estado: cows show the lactation state (Lactando/Seca, per the frames), falling back to the repro state; heifers show the repro state with VAQUILLA labelled "En desarrollo". Reproducción "Vacía" = ABIERTA.
- Heifers and bulls show an "Edad" column in months, not "DIM" (the open question above).
- Sorting is server-side, so only ID, DIM (by last calving) and Edad (by birth date) sort; Raza/Estado/Grupo headers do not, as the API has no such sort keys. DIM sorts by last calving date, so a dry cow (DIM "—") sorts among the milking cows by her calving date; a lactation-aware sort key is a follow-up if that matters.
- A cow with no group shows "General" (domain-model §7).
- Bajas asks for a reason (sale to another ranch, sale to slaughter, death, registration error). Bulk baja sends one request per animal and reports the ones the API refuses.
- "Agregar Vaca/Vaquilla/Toro" goes to `/vacas/nueva?tipo=…`, still a placeholder until `animal-forms` lands.

### Deferred

- Bulk and row "move to group" (⇄): waits for the `groups` card's picker.
- The "10 vacas por hoja" page-size select: `DataTable` is fixed at 10 rows per page.

## Effort

M.

## Acceptance

- [ ] Search by ID, each filter category and sort work on the fixture herd at both widths.
- [ ] Empty filter result shows "No encontramos animales con el filtro aplicado".
- [ ] Filter state survives reload (URL).
- [ ] Matches M 1781-99287, W 2018-878545 (human).
- [ ] Tests for the new code pass in CI.
- [ ] `GET /api/groups` lists only the active ranch's groups, presets first.
- [ ] The bulls' Edad filter lists bulls whose age falls in the picked bucket.
