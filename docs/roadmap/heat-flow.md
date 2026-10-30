---
id: heat-flow
title: ID04 Heat flow (Registro de celo)
summary: The heat decision tree: observed?, clean or dirty, medicated?, VWP?, inseminated (bull picker + inline Agregar Toro, IA or monta), with the missed-heat warning and the 6 outcomes.
---

# ID04 Heat flow (Registro de celo)

## Problem

Heat detection and insemination drive the whole reproductive cycle and are the most frequent repro event.

## Why

Produces SERVIDA cows and the pregnancy-check alerts.

**Depends on:** `event-launcher`.

## What it touches

`app/web/src/features/events/heat/*`.

**Figma:** [M 2087-548](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2087-548), [M 2114-166787](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2114-166787), [M 1866-117975](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-117975), [M 1866-120399](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-120399), [W 2017-403675](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=2017-403675), [W 2017-402994](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=2017-402994)
**Inventory:** event-flows.md 1.13; mobile-core.md D8 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Before building, open every linked frame with the Figma MCP (`get_screenshot`; load the figma:figma-design-to-code skill before `get_design_context`). Use only components from `app/web/src/ui` and tokens from the design-system cards; Spanish copy goes in the es-MX i18n catalog. Build the mobile layout (<960px) and the web layout (≥960px) in the same route.
Per event-flows 1.13 and mobile-core D8; outcomes ①②③④⑤⑦ map to HEAT payload. ④ includes the treatment sub-form from health-flows (reuse its TreatmentFields if landed; otherwise build TreatmentFields here and health-flows reuses it). Clean heat not inseminated outside VWP shows "cada celo perdido representa pérdidas importantes". Bull picker searches bulls; Agregar Toro opens the bull form inline.

## Effort

M.

## Acceptance

- [ ] Each of the 6 outcomes can be recorded and the profile banner updates (⑦ → "Confirma preñez entre…").
- [ ] Inseminated heat stores the bull and method.
- [ ] Fixture cow 00004 can go through a full cycle in a Playwright test.
- [ ] Matches M 2087-548 and W 2017-403675 (human).
- [ ] Tests for the new code pass in CI.
