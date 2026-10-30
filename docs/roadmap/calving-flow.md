---
id: calving-flow
title: ID05/ID07/ID02 Calving (on time, early, late) and calf registration
summary: Calving record with computed timing (esperado / anticipado / retrasado), successful calving prompting calf registration with dam and sire prefilled, and the heifers-to-register reminder when skipped.
---

# ID05/ID07/ID02 Calving (on time, early, late) and calf registration

## Problem

Calving restarts the cycle (lactation, DIM, VWP) and adds a new animal.

## Why

Closes the reproductive loop for the golden path.

**Depends on:** `event-launcher`, `animal-forms`.

## What it touches

`app/web/src/features/events/calving/*`.

**Figma:** [M 2072-175885](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2072-175885), [M 2072-179596](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2072-179596), [M 1866-124901](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-124901), [M 1866-126175](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-126175), [W 2018-706892](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=2018-706892), [W 2018-706665](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=2018-706665), [W 2017-445348](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=2017-445348), [W 2017-562104](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=2017-562104)
**Inventory:** event-flows.md 1.15; mobile-core.md D10 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Before building, open every linked frame with the Figma MCP (`get_screenshot`; load the figma:figma-design-to-code skill before `get_design_context`). Use only components from `app/web/src/ui` and tokens from the design-system cards; Spanish copy goes in the es-MX i18n catalog. Build the mobile layout (<960px) and the web layout (≥960px) in the same route.
Per event-flows 1.15 and mobile-core D10. Timing is computed by the API, shown read-only. Successful calving → calf form (animal-forms heifer kind) prefilled with dam = this cow, sire = last service bull, birth date = calving date; "registrar después" logs "sin registro de vaquilla parida" and creates HEIFER_TO_REGISTER. Heifer dams become VACA. Note the mobile calving modal mis-titled "Registro de celo": use "Registro de parto".

## Effort

M.

## Acceptance

- [ ] Fixture cows 00005 (on time), 00007 (early) and 00002 (late) record with the right timing label.
- [ ] After calving: DIM resets, lactation +1, banner shows next heat window.
- [ ] Skipping the calf creates the reminder; registering it later clears it.
- [ ] Matches M 2072-175885 and W 2018-706892 (human).
- [ ] Tests for the new code pass in CI.
