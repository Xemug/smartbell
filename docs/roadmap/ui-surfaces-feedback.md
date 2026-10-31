---
id: ui-surfaces-feedback
title: UI surfaces and feedback: modal, bottom sheet, snackbar, cards, table, tabs, filters
summary: Second half of the kit: Modal/Dialog, BottomSheet, Snackbar, Banner, Card, KPI tile, EmptyState, DataTable (sort, paging 10/page, selection), Tabs, FilterPanel (Categoría → Variable).
verifiedAt: 2026-10-31
---

# UI surfaces and feedback: modal, bottom sheet, snackbar, cards, table, tabs, filters

## Problem

Lists, profiles, wizards, confirmations and alerts all depend on these; the filter model alone is reused by cows, heifers, bulls, groups and reports.

## Why

Without a shared DataTable and FilterPanel each registry card would re-implement them.

**Depends on:** `ui-primitives`.

## What it touches

`app/web/src/ui/` (Modal, ConfirmDialog, BottomSheet, Snackbar provider + `useSnackbar`, Banner, Card, KpiTile, EmptyState, DataTable, Pagination, Tabs, FilterPanel, Wizard shell with steps and back/next), tests.

**Figma:** [K 31189-366](https://www.figma.com/design/61o8icnDCev7fz5IN4irtj/x?node-id=31189-366), [K 31303-2](https://www.figma.com/design/61o8icnDCev7fz5IN4irtj/x?node-id=31303-2), [K 31243-4578](https://www.figma.com/design/61o8icnDCev7fz5IN4irtj/x?node-id=31243-4578), [K 31303-10478](https://www.figma.com/design/61o8icnDCev7fz5IN4irtj/x?node-id=31303-10478), [M 0-47](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=0-47), [W 5200-0](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=5200-0), [W 3807-170164](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=3807-170164)
**Inventory:** uikit-design-system.md §2; design-system.md §2.3–2.5 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Base on the UI Kit's widgets and components (uikit-design-system.md §2.1–2.2), which include the hover, focus, error and disabled states the old library lacked. If the web client is React, evaluate `@heathmont/moon-core-tw` first and wrap or theme it rather than hand-building; record the decision in the PR. Custom work the kit lacks (§2.3): data table, KPI cards, animal-type selector, gauge, date-range picker, pagination, side nav.

Per design-system.md §2.3–§2.5 and §4.2. Snackbar variants match web event confirmations (event-flows.md §1.11: success, deleted, connection error). DataTable: sortable columns, checkbox selection, row actions, 10 per page, empty state copy "No encontramos animales con el filtro aplicado". FilterPanel: two-level Categoría → Variable with defaults preselected and "Aplicar filtro" disabled until a choice. Wizard: step header, progress bar, unsaved-changes confirm on back (designs mention it; dialog not drawn, build a ConfirmDialog).

**Stack note:** the platform for UI cards depends on the memo's revised decision (A′ React PWA, or G Flutter mobile + React web). Write UI cards against the chosen client; API cards are unaffected.

## Effort

L.

## Acceptance

- [ ] All listed components on `/dev/ui` with mobile and web variants.
- [ ] DataTable sorts, paginates 10/page, selects rows, and shows the empty state.
- [ ] FilterPanel emits a typed filter object; Aplicar disabled until a value is chosen.
- [ ] Wizard back with dirty data opens the discard confirmation.
- [ ] Snackbar matches W 3807-170164 (human).
- [ ] Tests for the new code pass in CI.
