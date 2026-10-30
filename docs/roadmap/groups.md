---
id: groups
title: Groups (potreros): list, wizard, detail, delete and move cows
summary: Potrero management: list with KPI indicator, create/edit wizard with automatic or manual cow selection, detail, delete with re-homing to General, move/add cows, and computed heifer groups.
---

# Groups (potreros): list, wizard, detail, delete and move cows

## Problem

Farmers organise cows into groups (General, Alta producción, Secas, Recién paridas, Enfermas) to manage diet and milking.

## Why

The Grupos tab, stall-change events and dashboard group KPIs depend on it.

**Depends on:** `animal-lists`, `events-api`.

## What it touches

`app/api/app/api/groups.py`, `app/web/src/features/groups/*`.

**Figma:** [M 1658-94285](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1658-94285), [M 1968-104045](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1968-104045), [M 1976-103201](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1976-103201), [M 1946-1757](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1946-1757), [M 1975-306](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1975-306), [M 2005-2848](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2005-2848), [W 129-1430](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=129-1430), [W 164-629](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=164-629), [W 164-1426](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=164-1426), [W 164-2822](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=164-2822), [W 4163-164994](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=4163-164994)
**Inventory:** mobile-core.md A11, C1–C7; web-onboarding-registry.md 1.10–1.13 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Before building, open every linked frame with the Figma MCP (`get_screenshot`; load the figma:figma-design-to-code skill before `get_design_context`). Use only components from `app/web/src/ui` and tokens from the design-system cards; Spanish copy goes in the es-MX i18n catalog. Build the mobile layout (<960px) and the web layout (≥960px) in the same route.
Per mobile-core A11, C1–C7 and web 1.10–1.13. Name ≤60, description ≤120, preset or custom, AUTO (filter by age/breed/# lactations, re-evaluated on demand) or MANUAL (two-table picker; drag on web, checkboxes on mobile). KPI indicator optional, only after ≥1 cow. Delete moves cows to General (history: "Se eliminó X potrero y las vacas se enviaron a potrero Y"). Heifer groups are computed from age/state, read-only. Moving cows writes GROUP_CHANGE events through the events API.

## Effort

L.

## Acceptance

- [ ] Create a manual group with 3 cows; it lists them and its KPI tile shows the selected indicator.
- [ ] Deleting a group moves its cows to General and writes one history entry.
- [ ] Heifer groups list heifers by age bucket (0–6 mo, 6–16 mo, …).
- [ ] Matches M 1658-94285, M 1968-104045, W 129-1430, W 164-2822 (human).
- [ ] Tests for the new code pass in CI.
