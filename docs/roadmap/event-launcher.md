---
id: event-launcher
title: Event launcher and mobile event-form pattern
summary: Shared EventWizard (full-screen stepper on mobile, modal on web) opened from the profile cards and from automatic tasks, with confirmation snackbars and the unsaved-data guard.
---

# Event launcher and mobile event-form pattern

## Problem

Event forms are only drawn at 1366×768; the mobile pattern is undefined, and 7 flows would otherwise each invent one.

## Why

Sets the pattern every event-flow card follows.

**Depends on:** `cow-profile`, `ui-surfaces-feedback`.

## What it touches

`app/web/src/features/events/EventWizard.tsx`, `EventLauncher.tsx`, `useRecordEvent` (TanStack mutation + snackbar + query invalidation).

**Figma:** [M 2005-5517](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2005-5517), [M 2005-31277](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2005-31277), [W 2018-565589](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=2018-565589), [W 3807-170164](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=3807-170164), [W 3807-170908](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=3807-170908), [W 3807-169763](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=3807-169763)
**Inventory:** event-flows.md 1.0, 1.11; mobile-core.md D (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Before building, open every linked frame with the Figma MCP (`get_screenshot`; load the figma:figma-design-to-code skill before `get_design_context`). Use only components from `app/web/src/ui` and tokens from the design-system cards; Spanish copy goes in the es-MX i18n catalog. Build the mobile layout (<960px) and the web layout (≥960px) in the same route.
Launcher per event-flows 1.0 (health vs reproduction entries; reproduction entries enabled only inside the cow's current window, per "está dentro de los días estimados"). Mobile: full-screen stepper using tokens and the Wizard shell, one question per step for decision trees; web: modal per W frames. Snackbars per event-flows 1.11 (also on mobile, as the design gap fix). Connection error snackbar on failed mutation. Document the pattern in `app/web/src/features/events/README.md` with a screenshot. Entry points in V4: the profile's Reproducción/Salud cards and **automatic tasks** (e.g. the heat task opens 'Registro de Celo' with 'No entró' / 'Sí, confirmar', v4-onboarding-dashboard-tasks.md §1.12). Expose `openEvent(animalId, type, taskId?)` so a task can launch it and close itself on success.

## Effort

M.

## Acceptance

- [ ] Opening the launcher on a cow outside any window disables the reproduction entries with a reason.
- [ ] A stub event recorded through EventWizard shows the success snackbar and refreshes the profile.
- [ ] Backing out with data entered asks for confirmation.
- [ ] Mobile pattern reviewed against the 1366 frames (human).
- [ ] Tests for the new code pass in CI.
