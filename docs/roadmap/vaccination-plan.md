---
id: vaccination-plan
title: Vaccination and development plan wizard
summary: Three-step ranch plan: development parameters, vaccine schedule (10 presets + custom), summary with approve; pending state when abandoned. (Not in V4: scheduled after the core.). Deferred: marked 'Futuro' or not in Smartbell 4.0.
---

# Vaccination and development plan wizard

## Problem

Vaccine-due alerts and the per-cow development tab need a ranch plan; the designs make it an onboarding step.

## Why

Feeds VACCINE_DUE alerts and the "Próximo evento según edad" banner.

**Depends on:** `onboarding-hub`.

## What it touches

`app/api/app/api/vaccination_plan.py`, models VaccinationPlan/PlanVaccine (from core model), `app/web/src/features/config/vaccination/*`.

**Figma:** [M 1698-94138](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1698-94138), [M 1698-94257](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1698-94257), [M 2524-147738](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2524-147738), [W 1416-52](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=1416-52), [W 1416-218](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=1416-218), [W 1426-53248](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=1426-53248)
**Inventory:** web-onboarding-registry.md 1.6; mobile-core.md A15, B6, E7 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Before building, open every linked frame with the Figma MCP (`get_screenshot`; load the figma:figma-design-to-code skill before `get_design_context`). Use only components from `app/web/src/ui` and tokens from the design-system cards; Spanish copy goes in the es-MX i18n catalog. Build the mobile layout (<960px) and the web layout (≥960px) in the same route.
Per web-onboarding-registry.md 1.6 and mobile-core A15/E7. Ranges: first insemination 330–380 kg, weaning 60–90 d, first deworming 90–180 d, 3-digit numeric inputs. Vaccine modal: dose ml, start by age/weight/event, frequency (single, boosters n×m, every 6 months, yearly). Leaving before approval sets status `pendiente` and shows the reminder. Per-cow tab (mobile B6) is read-only here; schedule generation is in the alert-engine card.

## Effort

M.

## Acceptance

- [ ] Completing all 3 steps sets the plan to aprobado; abandoning leaves pendiente and an onboarding reminder.
- [ ] Out-of-range values show validation messages.
- [ ] The 10 preset vaccines are selectable; a custom one can be added.
- [ ] Matches W 1416-52 and M 1698-94138 (human).
- [ ] Tests for the new code pass in CI.
