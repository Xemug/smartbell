---
id: health-flows
title: ID01/ID03 Health events: illness, accident, medical treatment, follow-up
summary: Health event entry with illness (9 illnesses with descriptions), accident and medical treatment forms sharing TreatmentFields (type, presentation, duration, time out of production), the sick banner, auto-move to Enfermas, and treatment follow-up (success / change).
---

# ID01/ID03 Health events: illness, accident, medical treatment, follow-up

## Problem

Sick cows' milk must be kept out of the sale tank; farmers need a record and a countdown.

## Why

Drives HEALTH alerts, milk-withdrawal reminders and sick KPIs.

**Depends on:** `event-launcher`.

## What it touches

`app/web/src/features/events/health/*` (HealthEntry, IllnessForm, AccidentForm, MedicalTreatmentForm, TreatmentFields, FollowUp).

**Figma:** [M 2021-200894](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2021-200894), [M 2005-33139](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2005-33139), [M 2005-33425](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2005-33425), [M 2021-201299](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2021-201299), [M 2021-202307](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2021-202307), [M 2076-196092](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2076-196092), [M 2071-260359](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2071-260359), [W 2018-565817](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=2018-565817), [W 2018-566994](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=2018-566994), [W 2018-586199](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=2018-586199), [W 2017-340242](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=2017-340242), [W 2017-342096](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=2017-342096)
**Inventory:** event-flows.md 1.1–1.8; mobile-core.md D2–D4, D6 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Before building, open every linked frame with the Figma MCP (`get_screenshot`; load the figma:figma-design-to-code skill before `get_design_context`). Use only components from `app/web/src/ui` and tokens from the design-system cards; Spanish copy goes in the es-MX i18n catalog. Build the mobile layout (<960px) and the web layout (≥960px) in the same route.
Per event-flows 1.1–1.8 and mobile-core D2–D4, D6. Defaults: today, Antibiótico, Inyección, 5 days, 5 days out of production; withdrawal suggested from the table (domain-model §3.6), editable. Quirúrgico requires another type. Optional diet/group change. Follow-up: Tratamiento exitoso (closes HEALTH, restores group) or Cambio de tratamiento (new treatment).

## Effort

L.

## Acceptance

- [ ] Illness on fixture cow 00001 shows the sick banner, moves her to Enfermas, and creates a withdrawal reminder with days remaining.
- [ ] Selecting Corticoide suggests 21 days withdrawal.
- [ ] Tratamiento exitoso removes the banner and HEALTH alert.
- [ ] Accident and medical treatment record and appear in the log; both are deletable.
- [ ] Matches M 2005-33425, M 2021-202307, M 2071-260359, W 2018-566994 (human).
- [ ] Tests for the new code pass in CI.
