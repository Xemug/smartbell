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

**Stack:** A′ is final (React PWA + Capacitor).

## Decisions and assumptions (groomed 2026-10-31)

- **Premise check.** `design-tokens` and `icons-export` have shipped, the Figma nodes and inventory files exist, and nothing in `app/web/src/ui/` predated this card except icons.
- **Moon not adopted.** `@heathmont/moon-core-tw` 10.24 pins `@headlessui/react` 1.7, `react-popper` and old Radix versions, which conflicts with this spec's Radix primitives, and inventory §6.4 lists no date picker in it. The tokens already carry Moon's names, so a later switch stays open. Built on Radix with Tailwind tokens.
- **Calendar.** `react-day-picker` owns the grid and its keyboard model; the kit has no range calendar, so the range follows the old `Calendar_TwoDates` (Borrar, Cancelar).
- **Scope of "each component in §2.1–2.2".** The list in "What it touches" decides, plus what the same symbols need:
  - Search box: `TextField type="search"`. Masks such as SINIIGA: left to `animal-forms`.
  - Textarea: `TextArea`, added because design-system.md §4.2 lists it as a primitive.
  - Boton Text On/Off, 2 lines, Boton Vaca/Vaquilla/Toro: `RadioGroup variant="card"`. Boton Text Check: `Checkbox`.
  - Cow/Calf/Bull counters and Boton Vacas en Sistema: `SplitIndicator`. Choice Chips: `ChipGroup`.
  - "Stepper": `Stepper` is the old Steper Bar 1/N; the kit's −/value/+ is `CountController`.
  - Not built here: Combobox, Boton Imagen (`animal-forms`), custom scrollbars, Toggle Button, Segmented Control and Slider. The Toggle's sun/moon icon variant is dropped because v1 has no dark mode.
- **Design defaults (reconciliation §4.8).** Blue primary CTA, so no green `cta` button; Open Sans buttons; radii 8/12, except buttons at 4 (user review of M 80-574, 2026-10-31); body 16 in every input; light mode only.
- **Beyond Figma.**
  - `danger` button (uikit §6.3 asks for one).
  - `SplitIndicator` paints the frame's light-blue half in `primary` and the dark half in `primary-dark`, because white on the frame's `#57A7F5` is 2.6:1, under AA. Inactive uses `neutral-2` and `secondary-text` for the same reason.
  - Error text is primary text with a red icon: `#EB004E` on `#F9F9F9` is 4.3:1, under AA.
  - Toggle's off track is `neutral-3`, since the kit's is near-invisible.
  - The focus ring from Figma's buttons is used on every control.
- **Values.** Dates are ISO day strings, so a form value cannot shift a day across time zones. A rejected typed date also empties the value, so a form cannot save the previous date unnoticed. `maxDate` takes `today`. NumberField keeps the typed string. PhoneField's value is the full number; a code not in the list stays in the number.
- **Icons split.** Size is spread evenly over the set, so no few icons could be moved out. `<Icon name=…>` became `<Icon icon={iconBell} />` with one named export per icon in `glyphs.ts`. `index.ts` keeps its own copy for the gallery, because a bundler cannot split one module across chunks; lint blocks it in app code.

## Effort

L.

## Acceptance

- [x] Each component in design-system.md §2.1–2.2 exists with its Figma variants as props, shown on `/dev/ui`.
- [x] Keyboard: every control is reachable and operable; focus ring visible (axe has no violations on `/dev/ui`).
- [x] DateField rejects future dates when `maxDate=today`; PhoneField strips non-digits except +.
- [x] Visual check against Symbols buttons frame M 80-574 (human).
- [x] Tests for the new code pass in CI.
