---
id: abortion-flow
title: ID02 Abortion record
summary: Abortion branch of the calving flow: natural (Hormonal, Reabsorción embrionaria, Nutrición, Desconocido) or induced (accident, illness, intoxication, virus, bacteria, treatment) with cause and description.
---

# ID02 Abortion record

## Problem

Losses must be recorded to restart the cycle and feed culling/repro-problem reports.

## Why

Completes ID02.

**Depends on:** `calving-flow`.

## What it touches

`app/web/src/features/events/abortion/*`.

**Figma:** [M 2071-153698](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2071-153698), [W 2018-679236](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=2018-679236)
**Inventory:** event-flows.md 1.15, §3.3 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Before building, open every linked frame with the Figma MCP (`get_screenshot`; load the figma:figma-design-to-code skill before `get_design_context`). Use only components from `app/web/src/ui` and tokens from the design-system cards; Spanish copy goes in the es-MX i18n catalog. Build the mobile layout (<960px) and the web layout (≥960px) in the same route.
Per event-flows 1.15 (abortion branch). The API classifies by days since service (<42 → early embryonic death recorded as negative check, ≥260 → calving anticipado) and the UI explains the reclassification. Resulting state per domain-model §2 (ABIERTA, pending the memo answer).

## Effort

S.

## Acceptance

- [ ] Natural and induced abortions record with cause; the cow's next heat window appears.
- [ ] A loss at 30 days is recorded as early embryonic death with an explanation.
- [ ] Matches the ID02 abortion frames (human).
- [ ] Tests for the new code pass in CI.
