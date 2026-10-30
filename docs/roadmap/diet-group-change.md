---
id: diet-group-change
title: ID01/ID03 Diet change and group (potrero) change events
summary: Standalone diet change (reason + diet) and stall/group change events from the cow profile.
---

# ID01/ID03 Diet change and group (potrero) change events

## Problem

Diet and group changes are logged separately from health events and need their own entries.

## Why

Completes ID01 and ID03.

**Depends on:** `event-launcher`, `groups`.

## What it touches

`app/web/src/features/events/{diet,group}/*`.

**Figma:** [M 2071-259586](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2071-259586), [M 2076-182122](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2076-182122), [M 2005-32422](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2005-32422), [W 2017-341853](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=2017-341853), [W 2017-343768](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=2017-343768), [V 3441-11153](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=3441-11153)
**Inventory:** event-flows.md 1.7, 1.10; mobile-core.md D5, D7 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Before building, open every linked frame with the Figma MCP (`get_screenshot`; load the figma:figma-design-to-code skill before `get_design_context`). Use only components from `app/web/src/ui` and tokens from the design-system cards; Spanish copy goes in the es-MX i18n catalog. Build the mobile layout (<960px) and the web layout (≥960px) in the same route.
Per event-flows 1.7, 1.10 and mobile-core D5, D7. Reasons: Etapa reproductiva, Enfermedad, Tratamiento médico, Otra. Group change uses the group picker and writes GROUP_CHANGE. V4 additions: the diet payload adds diet type, kg/day and cost/day, and the profile shows the diet history (v4-animal-registration-profile.md §1.11d, §1.14). The automatic DIET_CHANGE task at 120 DIM is produced by tasks-engine and opens this form.

## Effort

S.

## Acceptance

- [ ] Both events record, appear in the log as deletable, and the group change updates the cow's group.
- [ ] Matches M 2071-259586 and M 2005-32422 (human).
- [ ] Tests for the new code pass in CI.
