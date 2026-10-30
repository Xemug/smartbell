---
id: icons-export
title: Icon set and illustrations export
summary: Export icons: the UI Kit's generic 24px set for interface icons, plus the old library's domain icons (livestock, feature discs, mascots, logo), as typed icon components.
---

# Icon set and illustrations export

## Problem

Screens use ~30 interface icons, 8 colored feature icons, animal line icons, status marks, channel icons and 5 mascot illustrations; none exist in code.

## Why

Components and screens need them; doing it once avoids each card exporting its own.

**Depends on:** `design-tokens`.

## What it touches

`app/web/src/ui/icons/` (SVG files + generated `index.ts`), `app/web/public/illustrations/`.

**Figma:** [K 31916-36672](https://www.figma.com/design/61o8icnDCev7fz5IN4irtj/x?node-id=31916-36672), [M 3633-95078](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=3633-95078), [M 83-790](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=83-790)
**Inventory:** uikit-design-system.md §3; design-system.md §3 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Interface icons come from the UI Kit Icons page (K 31916-36672, 1,179 Untitled-UI-style icons; export only the ones used, listed per screen in the inventories). Domain icons, feature discs and mascots come from the old library (design-system.md §3: M 3633-95078, M 83-790). Line icons recolor via `currentColor`. Generate a typed `<Icon name=…/>` and a gallery.

## Effort

S.

## Acceptance

- [ ] Every icon listed in design-system.md §3 is exported or listed as missing in the PR with reason.
- [ ] `<Icon name="bell"/>` type-checks and an unknown name fails `tsc`.
- [ ] Gallery renders all icons; line icons follow text color.
- [ ] Tests for the new code pass in CI.
