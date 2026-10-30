---
id: design-tokens
title: Design tokens from the Smartbell UI Kit (Moon)
summary: One tokens.json from the UI Kit's variables (Moon + Smartbell brand, light mode), plus the domain tokens the kit dropped, generating CSS variables / Tailwind theme (and a Flutter ThemeData if the mobile client is Flutter).
---

# Design tokens from the Smartbell UI Kit (Moon)

## Problem

Two token sources exist: the 2020 library and the newer UI Kit built on Moon for FlutterFlow. The build needs one.

## Why

Foundation for every UI card; lets builders use names instead of hex values.

**Depends on:** `app-scaffold`.

## What it touches

`app/web/src/styles/tokens.json` (single source), generated `tokens.css`, `tailwind.config.ts` (Moon preset if `@heathmont/moon-core-tw` is chosen), Flutter `theme.dart` when applicable, `/dev/tokens` preview.

**Figma:** [K 30390-24927](https://www.figma.com/design/61o8icnDCev7fz5IN4irtj/x?node-id=30390-24927), [K 31944-509](https://www.figma.com/design/61o8icnDCev7fz5IN4irtj/x?node-id=31944-509), [M 1851-99029](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=1851-99029)
**Inventory:** uikit-design-system.md §1, §4.1, §6; design-system.md §1 (domain colors only) (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Follow `docs/design-inventory/uikit-design-system.md` §1, §4.1 and §6.5. The UI Kit is canonical (reconciliation §4.8); apply the proposed defaults unless the user overrides them: navy `#063664`, blue primary CTA, separate heat and error tokens, orange kept for "Aceptable", the kit's greys, `#F9F9F9` background, radii 8/12, body 16, Open Sans buttons, light app bar, breakpoints 600/960/1280, no dark mode in v1 (keep the light/dark structure in the token file). Re-add the domain tokens: heat, warning-orange, primary-dark, success-light. Map them to Moon CSS vars (piccolo, goku, gohan, bulma, trunks, beerus, chichi, krillin, roshi, whis, hit) when using Moon React.

## Decisions and assumptions (groomed 2026-10-29)

- **No Flutter output.** Stack A′ is approved (reconciliation §5): one React PWA wrapped with Capacitor, so `theme.dart` is out of scope.
- **Moon without the package.** The card does not install `@heathmont/moon-core-tw`; `ui-primitives` evaluates it. `tokens.css` already emits Moon's variable names (`--piccolo` … `--whis`, plus `--goten`, as RGB channels; `--radius-i-*` / `--radius-s-*`; `--shadow-*`) and the Tailwind theme uses Moon's class names (`rounded-moon-i-sm`, `shadow-moon-md`), so the preset can be dropped in later.
- **Files.** `src/styles/tokens.json` is the source (DTCG-style `$type` / `$value`; `$extensions.figma` names the kit variable, `$extensions.dark` keeps the dark value). `src/styles/designTokens.ts` reads it and builds both `tokens.css` (`npm run tokens`; a test fails if the file is stale) and the Tailwind theme. It is not called `tokens.ts` because the Tailwind config loader would resolve `./tokens` to the JSON file first.
- **Navy** is `primary-dark` `#063664` (the reconciliation default; the inventory's §6.5 says `#073460`). Where the brief and this spec disagree, the spec wins.
- **Heat and error** are separate tokens with the same kit red `#EB004E` for now, so they can diverge without touching call sites.
- **Tints** (`*-60`, `*-10`) are re-derived from their semantic colours as the inventory's §4.1 step 4 asks; Primary tints use the navy. The kit's mismatched bases (`#4D8FF3`, `#F4C158`, `#F85065`, `#4CCE80`) are dropped, along with template residue (`[Archived]/*`, `new-custom`, the Moon template boards).
- **Gohan** (Moon surface) maps to Neutral 1 `#FFFFFF`, not Secondary-background.
- **Type ramp.** The kit has one scale, so the responsive roles (`ramp-body`, `ramp-caption`, `ramp-card-title`, `ramp-section-title`, `ramp-page-title`, `ramp-kpi`) pick kit styles per tier: below 600, from 600, from 960. They follow the 2020 library's mobile-to-tablet table. Body is 16 at every tier. Tune these at the side-by-side review.
- **Type sizes are in rem** so they follow the OS text-size setting; spacing, radii and sizes are in px.
- **Tailwind.** Colours, radii and shadows *replace* Tailwind's defaults (no `gray-700` or hex habits); spacing extends them with the same 4-px steps. Screens are `md` 600, `lg` 960, `xl` 1280.
- **Fonts** are self-hosted with `@fontsource` (Montserrat 600/700, Open Sans 400/600) so the PWA does not depend on Google Fonts.
- **Dark mode** is kept in `tokens.json` but not emitted.

## Effort

M.

## Acceptance

- [x] Every UI Kit color/type/spacing/radius/shadow variable exists in tokens.json with a semantic name.
- [x] The domain tokens (heat, warning-orange, primary-dark, success-light) exist.
- [x] `/dev/tokens` renders all tokens; the type ramp switches at 600 and 960.
- [ ] The preview matches the UI Kit Foundations page side by side (human).
- [ ] Tests for the new code pass in CI.
