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

## Effort

M.

## Acceptance

- [ ] Every UI Kit color/type/spacing/radius/shadow variable exists in tokens.json with a semantic name.
- [ ] The domain tokens (heat, warning-orange, primary-dark, success-light) exist.
- [ ] `/dev/tokens` renders all tokens; the type ramp switches at 600 and 960.
- [ ] The preview matches the UI Kit Foundations page side by side (human).
- [ ] Tests for the new code pass in CI.
