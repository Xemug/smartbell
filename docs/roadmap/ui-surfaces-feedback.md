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

Base on the UI Kit's widgets and components (uikit-design-system.md §2.1–2.2), which include the hover, focus, error and disabled states the old library lacked. Build on Radix with Tailwind tokens, as `ui-primitives` did. Custom work the kit lacks (§2.3): data table, KPI cards, animal-type selector, gauge, date-range picker, pagination, side nav.

Per design-system.md §2.3–§2.5 and §4.2. Snackbar variants match web event confirmations (event-flows.md §1.11: success, deleted, connection error). DataTable: sortable columns, checkbox selection, row actions, 10 per page, empty state copy "No encontramos animales con el filtro aplicado". FilterPanel: two-level Categoría → Variable with defaults preselected and "Aplicar filtro" disabled until a choice. Wizard: step header, progress bar, unsaved-changes confirm on back (designs mention it; dialog not drawn, build a ConfirmDialog).

**Stack:** A′ is final (React PWA + Capacitor).

## Decisions and assumptions (groomed 2026-10-31)

- **Premise check.** `ui-primitives` has shipped, and every inventory file and Figma node named here exists. Two things in the spec were stale: the Moon evaluation (dropped; decision-memo-stack.md, 2026-10-31) and the stack note (A′ is final). Both are corrected above.
- **New dependencies.** `@radix-ui/react-dialog` (Modal, ConfirmDialog, BottomSheet) and `@radix-ui/react-tabs`, in line with the primitives. Radix returns focus only to its own Trigger, so `useReturnFocus` does it for our controlled dialogs.
- **DataTable has two modes.** `animal-api` filters, sorts and pages on the server at size 10, so passing `total` makes `rows` the current page and hands sort and page to the caller. Without `total` the table does both itself.
  - The header checkbox selects the current page, not the whole list; selection survives page changes. In client mode rows a filter removes leave the selection, so a bulk action cannot reach hidden animals. A server-mode caller clears selection on a new filter.
  - The table cannot tell a new filter from an edited list, so the caller returns to page 1 on a new filter (`page`/`onPageChange`). If the page stops existing the table moves to the last one, through `onPageChange` with a server.
  - While `loading`, empty rows mean nothing: no alert, no selection pruning, no page change. Callers pass it during every fetch.
  - Sorting toggles asc/desc and returns to page 1. Blank values stay last in both directions.
  - Mobile hides columns and actions per Header Table_Mobile (`hideOnMobile`). Below that a narrow table scrolls inside its own box.
  - The empty state follows Figma's red alert row, with the web copy on both sizes (mobile draws different copy in A10: "No se encontro ninguna vaca…"). `empty` replaces it, e.g. with `EmptyState` when a list has no animals at all.
- **FilterPanel.** Generic over its categories: declared `as const satisfies FilterCategories`, `FilterOf<T>` ties each category to its own variables. Category lists live with the list cards, not here; Grupo values come from the API. `variant="inline"` is the web pair of dropdowns, `variant="sheet"` the mobile bottom sheet; the caller picks by screen size.
  - The sheet shows both radio groups at once instead of Figma's two steps, because arrow keys change a radio as they move, and jumping to step 2 on the first press would strand keyboard users.
  - Figma's web frame shows no button, but the spec's Aplicar applies to both. Aplicar stays disabled until the choice differs from the filter in force.
  - Beyond Figma: a **Sin filtro** button when a filter is on, using the "Sin filtro" category from web-onboarding-registry.md §3, since neither variant otherwise has a way back. `onApply` emits `null` for it.
- **Wizard.** The caller owns the step. Any Regresar with `dirty` asks first (event-flows.md §3.3 warns on back, and does not limit it to the first step). The copy is ours, since the dialog isn't drawn. Leaving by browser back or a nav link is not covered: `app-shell-navigation` owns routing.
- **ConfirmDialog** ignores outside clicks. When `danger`, focus starts on Cancelar so a stray Enter cannot delete.
- **Snackbar.** Three kinds per §1.11. Bottom-centre, at least 312 wide, growing with the text as Figma's error frame does. New ones stack (three at most) so two quick saves are both confirmed. 5 s, or 8 s for errors; hover or focus holds the count, then it restarts. `SnackbarProvider` is mounted in `App.tsx`. Mobile has no snackbar frames (event-flows.md §1.11), so it reuses the web one.
- **Beyond Figma, for AA.** The success snackbar and KPI headers keep the mint but use dark text, since Figma's white on it is 1.8:1. White on `#EB004E` is 4.5:1, so red surfaces match. Banner: `error` is Alert_Message's solid red; warning, info and success are tints with dark text. The table header uses `primary-text`, the nearest token to Figma's dark gray.
- **KpiTile** covers both Generic-card patterns: `value` for KpiStatCard, `rows` for KpiSplitCard. Clickable tiles are one button. Domain cards (GroupCard, plan counter) stay with their own cards.
- **Not built here:** Accordion, Badge and range slider aren't in this card's list.

## Effort

L.

## Acceptance

- [x] All listed components on `/dev/ui` with mobile and web variants.
- [x] DataTable sorts, paginates 10/page, selects rows, and shows the empty state.
- [x] FilterPanel emits a typed filter object; Aplicar disabled until a value is chosen.
- [x] Wizard back with dirty data opens the discard confirmation.
- [ ] Snackbar matches W 3807-170164 (human).
- [x] Tests for the new code pass in CI.
