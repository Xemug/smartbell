---
id: animal-forms
title: Unified animal registration form (V4): sex, stage, crossbreed, parents
summary: The V4 'Primer animal' unified form: Macho/Hembra toggle, development stage (AUTO), breed + crossbreed level + contributing breed, more/less data disclosure, parent search or inline registration, the dam-status modal, and the female reproductive section.
---

# Unified animal registration form (V4): sex, stage, crossbreed, parents

## Problem

Registering animals is the most frequent onboarding step and the V4 designs reworked it for every scenario (heifer with a known mother, purchased cow, crossbreeds).

## Why

Required before any event flow can be exercised on real data.

**Depends on:** `animal-api`, `ui-surfaces-feedback`.

## What it touches

`app/web/src/features/animals/forms/*`.

**Figma:** [V 2955-9420](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=2955-9420), [V 2955-8971](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=2955-8971), [V 3074-10657](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=3074-10657), [V 315-1902](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=315-1902), [V 734-6074](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=734-6074)
**Inventory:** v4-animal-registration-profile.md §1.1–1.10, §2 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Before building, open every linked frame with the Figma MCP (`get_screenshot`; load the figma:figma-design-to-code skill before `get_design_context`). Use only components from `app/web/src/ui` and tokens from the design-system cards; Spanish copy goes in the es-MX i18n catalog. Build the mobile layout (<960px) and the web layout (≥960px) in the same route. Smartbell 4.0 (V links) supersedes the older Mobile/Web frames where both exist; see `docs/reconciliation-v4.md` §2.
Per v4-animal-registration-profile.md §1.1, §1.4–1.10 and flows F1–F5. Quick mode shows 4 fields; "Tengo más datos de mi animal" expands. Defaults: Holstein, General, FB, lactation 1, stage Ninguna, development AUTO. The required-field error is "Este campo es obligatorio", with the toast "Por favor, llena los datos solicitados". Parents: search by ID (autofill) or register inline. The dam-status modal appears after a heifer is saved with a dam. The female repro section has last calving, lactation cycle, repro stage + stage date. Fix F4 = 93.75% (15/16).

## Effort

M.

## Acceptance

- [ ] A female and a male can be registered with only name/ID + birth date.
- [ ] An F2 crossbreed requires a contributing breed.
- [ ] A heifer with a newly typed dam creates both animals; choosing 'Vendida a rastro' removes the dam.
- [ ] Matches V 2955-9420 and V 734-6074 (human).
- [ ] Tests for the new code pass in CI.
