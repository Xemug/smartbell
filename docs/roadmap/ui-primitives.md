---
id: ui-primitives
title: UI primitives: buttons, inputs, selection controls
summary: Build the base component kit from the Symbols page: buttons, text/number/phone/date inputs, select/dropdown, checkbox, radio, toggle, chips, stepper.
---

# UI primitives: buttons, inputs, selection controls

## Problem

Every form in the designs (registration, events, configuration) uses the same buttons and inputs; none exist.

## Why

Unblocks all form cards; consistent validation and error states across ~60 forms.

**Depends on:** `design-tokens`, `icons-export`.

## What it touches

`app/web/src/ui/` (Button, IconButton, TextField, NumberField, PhoneField, DateField + calendar with range, Select, Checkbox, Radio/RadioGroup, Toggle, Chip, Stepper/ProgressBar, FormField wrapper), Storybook-like `/dev/ui` page, unit tests.

**Figma:** [K 31189-366](https://www.figma.com/design/61o8icnDCev7fz5IN4irtj/x?node-id=31189-366), [K 31303-2](https://www.figma.com/design/61o8icnDCev7fz5IN4irtj/x?node-id=31303-2), [K 31243-4578](https://www.figma.com/design/61o8icnDCev7fz5IN4irtj/x?node-id=31243-4578), [K 31303-10478](https://www.figma.com/design/61o8icnDCev7fz5IN4irtj/x?node-id=31303-10478), [M 0-47](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=0-47), [M 80-574](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=80-574)
**Inventory:** uikit-design-system.md §2; design-system.md §2.1, §2.2, §4.2 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Base on the UI Kit's widgets and components (uikit-design-system.md §2.1–2.2), which include the hover, focus, error and disabled states the old library lacked. If the web client is React, evaluate `@heathmont/moon-core-tw` first and wrap or theme it rather than hand-building; record the decision in the PR. Custom work the kit lacks (§2.3): data table, KPI cards, animal-type selector, gauge, date-range picker, pagination, side nav.

Follow design-system.md §2.1–§2.2 and the build order in §4.2. Use Radix primitives for accessibility (Select, Checkbox, Radio, Switch, Popover). Define the states Figma lacks (hover, focus-visible, disabled, error, loading) from tokens. Date fields: default today, no future dates by prop (`maxDate`), range mode for log filters. Phone: +country code list, default +52, digits and + only. Integrate with `react-hook-form` + `zod` via a `FormField`.

**Stack note:** the platform for UI cards depends on the memo's revised decision (A′ React PWA, or G Flutter mobile + React web). Write UI cards against the chosen client; API cards are unaffected.

## Effort

L.

## Acceptance

- [ ] Each component in design-system.md §2.1–2.2 exists with its Figma variants as props, shown on `/dev/ui`.
- [ ] Keyboard: every control is reachable and operable; focus ring visible (axe has no violations on `/dev/ui`).
- [ ] DateField rejects future dates when `maxDate=today`; PhoneField strips non-digits except +.
- [ ] Visual check against Symbols buttons frame M 80-574 (human).
- [ ] Tests for the new code pass in CI.
