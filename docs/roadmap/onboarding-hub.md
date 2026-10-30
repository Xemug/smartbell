---
id: onboarding-hub
title: Onboarding (V4): first cow, congratulations, one-time offer
summary: The V4 onboarding: after sign-up, register the first cow with the 4-field quick form, the Felicidades modal with the value estimate, and the skippable 50% first-year offer, ending on the task home.
---

# Onboarding (V4): first cow, congratulations, one-time offer

## Problem

New users need to reach value fast; V4 replaces the old task-card hub and the alert-channel step with a first-cow flow.

## Why

It is the first thing every new user sees, and it seeds the automatic tasks.

**Depends on:** `ranch-tenancy-permissions`, `animal-forms`, `tasks-engine`.

## What it touches

`app/web/src/features/onboarding/*`, `GET /onboarding/status`, notification preferences defaulted (push + email), value-estimate setting.

**Figma:** [V 2901-5972](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=2901-5972), [V 2951-8750](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=2951-8750), [V 2913-12490](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=2913-12490), [V 2901-5613](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=2901-5613), [V 2901-6385](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=2901-6385), [V 2951-8498](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=2951-8498)
**Inventory:** v4-onboarding-dashboard-tasks.md §1.6–1.8, §3.5 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Before building, open every linked frame with the Figma MCP (`get_screenshot`; load the figma:figma-design-to-code skill before `get_design_context`). Use only components from `app/web/src/ui` and tokens from the design-system cards; Spanish copy goes in the es-MX i18n catalog. Build the mobile layout (<960px) and the web layout (≥960px) in the same route. Smartbell 4.0 (V links) supersedes the older Mobile/Web frames where both exist; see `docs/reconciliation-v4.md` §2.
Per v4-onboarding-dashboard-tasks.md §1.6–1.8 and §3.5. The first-cow form reuses the animal form in quick mode (animal-forms card); if that has not landed, build against the API and swap in later. Felicidades shows registered × $2,100 MXN. OTO: 50% off the first year, code `50Primero`, "Contratar" goes to the membership screen (a stub until billing is decided), "Saltar" goes to the task home. Notification preferences default to push + email; there is no channel step (V4 dropped it).

## Effort

M.

## Acceptance

- [ ] A new account goes sign-up → first cow → Felicidades → OTO → tasks home.
- [ ] Skipping the OTO never shows it again.
- [ ] The first cow appears in Vacas and creates a FIRST_EVENT task.
- [ ] Matches V 2901-5972, V 2901-5613 and V 2901-6385 (human).
- [ ] Tests for the new code pass in CI.
