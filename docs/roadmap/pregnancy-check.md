---
id: pregnancy-check
title: ID06 Pregnancy check (Registro de preñez)
summary: Pregnancy diagnosis by tacto or ultrasonido with positive/negative result, optional diet and group change, description required when negative.
---

# ID06 Pregnancy check (Registro de preñez)

## Problem

Confirming pregnancy sets the expected calving and dry-off dates.

## Why

Produces GESTANTE cows and calving alerts.

**Depends on:** `event-launcher`.

## What it touches

`app/web/src/features/events/pregnancy/*`.

**Figma:** [M 2160-215331](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2160-215331), [M 2160-217861](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2160-217861), [M 1866-118211](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1866-118211), [W 2017-520703](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=2017-520703), [W 2017-521909](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=2017-521909)
**Inventory:** event-flows.md 1.14; mobile-core.md D9 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Before building, open every linked frame with the Figma MCP (`get_screenshot`; load the figma:figma-design-to-code skill before `get_design_context`). Use only components from `app/web/src/ui` and tokens from the design-system cards; Spanish copy goes in the es-MX i18n catalog. Build the mobile layout (<960px) and the web layout (≥960px) in the same route.
Per event-flows 1.14 and mobile-core D9. Positive → banner "Parto estimado entre…"; negative → "Próximo celo entre…". Optional diet/group checkboxes make their dropdown required.

## Effort

S.

## Acceptance

- [ ] Positive and negative results both record and update the banner and alerts.
- [ ] Negative without description is blocked.
- [ ] Fixture cow 00006 passes a Playwright test.
- [ ] Matches M 2160-215331 and W 2017-520703 (human).
- [ ] Tests for the new code pass in CI.
