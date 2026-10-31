---
id: user-admin
title: User administration and permissions
summary: Users list, invite/create with role preset and per-permission tabs (Ganado, Usuarios, Dispositivos, Salud, Reportes, Finanzas), edit and delete keeping history.
---

# User administration and permissions

## Problem

Ranches have vets, nutritionists and field techs who need scoped access.

## Why

Multi-user ranches are core to the product.

**Depends on:** `ranch-tenancy-permissions`, `history-writer`.

## What it touches

`app/api/smartbell/api/members.py` (invite by email, accept link), `app/web/src/features/config/users/*`.

**Figma:** [M 2573-152259](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2573-152259), [M 2579-28](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2579-28), [M 1457-137410](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1457-137410), [W 871-28](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=871-28), [W 894-37699](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=894-37699), [W 906-38180](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=906-38180)
**Inventory:** mobile-core.md E8, E10; web-onboarding-registry.md 1.17 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Before building, open every linked frame with the Figma MCP (`get_screenshot`; load the figma:figma-design-to-code skill before `get_design_context`). Use only components from `app/web/src/ui` and tokens from the design-system cards; Spanish copy goes in the es-MX i18n catalog. Build the mobile layout (<960px) and the web layout (≥960px) in the same route.
Per mobile-core E8, E10 and web 1.17. Create disabled until permissions chosen. Plan user caps are shown only when plans-billing exists.

## Effort

M.

## Acceptance

- [ ] Owner invites a Médico; the invitee signs up via the link and sees only permitted actions.
- [ ] Editing permissions takes effect on the next request.
- [ ] Deleting a user keeps their history entries.
- [ ] Matches M 2573-152259 and W 871-28 (human).
- [ ] Tests for the new code pass in CI.
