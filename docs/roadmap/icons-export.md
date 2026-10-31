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

`app/web/src/ui/icons/` (`line/` and `color/` SVG files, generated `index.ts`, `Icon.tsx`, `Illustration.tsx`), `app/web/public/illustrations/`, `app/web/scripts/gen-icons.ts` (`npm run icons`), the `/dev/icons` gallery (`src/pages/DevIconsPage.tsx`).

**Figma:** [K 31916-36672](https://www.figma.com/design/61o8icnDCev7fz5IN4irtj/x?node-id=31916-36672), [M 3633-95078](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=3633-95078), [M 83-790](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=83-790)
**Inventory:** uikit-design-system.md §3; design-system.md §3 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Interface icons come from the UI Kit Icons page (K 31916-36672, 1,179 Untitled-UI-style icons; export only the ones used, listed per screen in the inventories). Domain icons, feature discs and mascots come from the old library (design-system.md §3: M 3633-95078, M 83-790). Line icons recolor via `currentColor`. Generate a typed `<Icon name=…/>` and a gallery.

## Decisions and assumptions (groomed 2026-10-30)

- **Premise check.** Nothing in the code predated this card and `design-tokens` has shipped. The inventories do **not** list interface icons per screen, as the Approach assumed: they name them loosely in prose. The interface set is therefore uikit-design-system.md §3 "Generic needs" plus the icons the screen inventories mention, 57 in all.
- **Spec over inventory.** uikit-design-system.md §4.2 says to use an npm package rather than export from Figma; this spec says export the used ones, so they are exported from K and no dependency is added.
- **Names.** Short English kebab-case with the kit's suffix dropped (`bell` is `bell-01`, `search` is `search-md`, `x` is `x-close`).
- **Two kinds.** `line/` paints with `currentColor`; `color/` keeps Figma's colours. Line icons keep a red or green accent where the accent carries the meaning (`animal-reproduction`, `animal-additional`, `channel-*`).
- **Heat, pregnant, calving and health are colour icons.** design-system.md §3.3 lists them as line icons, but the Icons page art (M 3633-95078) is multi-colour, so recolouring would lose the art. The grey placeholder tiles are stripped.
- **Viewboxes.** Kit icons are 24×24. Icons page icons keep their 32×30 artboards, the rest their own size; `size` sets the height and the width follows.
- **Masks.** `heat` and `disc-heat` use a mask; `Icon` suffixes ids per rendered copy so repeats do not share one.
- **Offline.** Illustrations are added to the PWA precache, as the fonts already are.
- **Drop shadows removed.** Figma's shadow filters clipped to grey corners at the icon bounds; elevation belongs to the shadow tokens.
- **Illustrations.** Mascots, logos and the avatar are files in `public/illustrations/`, shown by a typed `<Illustration name alt/>`. The avatar embeds its raster photo fill (Figma has no vector for it).
- **Export method.** One whole-page SVG per source (K page, M 83-790, M 3633-95078) cut by group id, which kept Figma use to about 15 calls. The SVG files are now the source of truth; the slicer was a one-off and is not in the repo.
- **Bundle size.** `index.ts` inlines every icon (271 kB, 87 kB gzipped). Only the lazy gallery imports it today, so the main bundle is unchanged, but the first screen that imports `Icon` pulls in all of it. `ui-primitives` should decide whether that is acceptable or whether to split it.

### design-system.md §3 coverage

| Listed | Result |
|---|---|
| Logo, white logo, mascots ×5, Avatar | `public/illustrations/` |
| Bell_icon and the seven feature discs | `color/disc-*` |
| Icon_Medical_Event, Icon_KPI_Event, marks ×4, OrangeDate_Icon, Alert_icon, Format_Icon | `color/` (`event-medical`, `event-kpi`, `mark-*`, `date-badge`, `alert-badge`, `file-format`) |
| Icons page §3.2, all 15 | `line/` and `color/` (`animals`, `groups`, `history`, `report`, `delete`, `heat`, `pregnant`, `calving`, `health`, `cow`, `bull`, `heifer`, `animal-info`, `animal-reproduction`, `animal-additional`) |
| Channels large and small | `line/channel-*`, `line/channel-*-small` |
| Icon_Cow_Calf, line Icon_Vaccine, Diet_Icon, Reply, Answer, Alerts_Icon, expand/contract and `_2` | `line/` (`calf`, `vaccine`, `diet`, `reply`, `answer`, `alerts`, `expand`, `contract`, `expand-large`, `contract-large`) |
| Search, Show / No show, Pencil, Garbage, Email, arrows, ImageIcon, Save, Logout, Download, Filter_Icon, more_info_icon | Not exported from M: replaced by the kit's `search`, `eye`, `eye-off`, `pencil`, `trash`, `mail`, `chevron-*`, `image`, `save`, `log-out`, `download`, `filter`, `info-circle`, since the kit is canonical for generic icons |
| Icon_Cow_Adult, Icon_Bull, Stall, Report_Icon | Not exported: §3.3 step 5 prefers the Icons page versions (`cow`, `bull`, `groups`, `report`) |
| favicon | Missing: `public/favicon.svg` and the PWA icons are still scaffold placeholders. Replacing them changes the installed app, so it needs its own card (§3.3 step 3 has the sizes) |
| Web `calf_blue 1`, `Vaca adulta` | Missing: they live in the web file, which this card does not link; `calf` and `cow` cover the same subjects |

Not in §3 but mentioned elsewhere, and left out: payment logos (§3.3 wants official brand kits) and a WhatsApp icon (no asset in K or M).

## Effort

S.

## Acceptance

- [x] Every icon listed in design-system.md §3 is exported or listed as missing in the PR with reason.
- [x] `<Icon name="bell"/>` type-checks and an unknown name fails `tsc`.
- [x] Gallery renders all icons; line icons follow text color.
- [x] Tests for the new code pass in CI.
