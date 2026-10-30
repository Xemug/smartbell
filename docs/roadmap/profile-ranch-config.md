---
id: profile-ranch-config
title: My account and ranch data configuration
summary: Mi cuenta (profile, photo, phone, password change) and Datos del rancho (name, address with map pin, delete ranch) on mobile and web.
---

# My account and ranch data configuration

## Problem

Users must set up their profile and ranch during onboarding and edit them later from the avatar menu.

## Why

Ranch name/location appear across the app and the email digest.

**Depends on:** `ranch-tenancy-permissions`.

## What it touches

`app/api/app/api/users.py`, `ranches.py` (update/delete), photo upload endpoint (JPG/PNG ≤2MB to local/S3-compatible storage), `app/web/src/features/config/{account,ranch}/*`.

**Figma:** [M 1691-104](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1691-104), [M 1691-824](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1691-824), [M 1697-93765](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1697-93765), [M 2524-149062](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2524-149062), [M 2524-148618](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2524-148618), [W 49-1365](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=49-1365), [W 1315-56000](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=1315-56000)
**Inventory:** mobile-core.md A12–A14, E2, E6; web-onboarding-registry.md 1.4–1.5 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Before building, open every linked frame with the Figma MCP (`get_screenshot`; load the figma:figma-design-to-code skill before `get_design_context`). Use only components from `app/web/src/ui` and tokens from the design-system cards; Spanish copy goes in the es-MX i18n catalog. Build the mobile layout (<960px) and the web layout (≥960px) in the same route.
Fields and validation per mobile-core A13–A14/E2/E6 and web 1.4–1.5. Map: Leaflet + OSM tiles with a draggable pin (no Google key). Password change requires the current password. Deleting a ranch needs typed confirmation and Dueño role.

## Effort

M.

## Acceptance

- [ ] Profile edits persist and show in the header.
- [ ] Photo >2MB or non-JPG/PNG is rejected with the design's message.
- [ ] Ranch pin position saves and reloads.
- [ ] Matches M 1691-824, M 1697-93765, W 49-1365, W 1315-56000 (human).
- [ ] Tests for the new code pass in CI.
