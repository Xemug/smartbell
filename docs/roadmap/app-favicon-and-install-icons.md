---
id: app-favicon-and-install-icons
title: App favicon and install icons
summary: Replace the scaffold placeholder favicon and PWA icons with the real Smartbell brand art, and add the iOS and Android app icons for the store build.
verifiedAt: 2026-10-31
---

# App favicon and install icons

## Problem

`app/web/public/favicon.svg` and the PWA icons are still scaffold placeholders. `icons-export` left them out because changing them changes the installed app.

## Why

The app replaces a live store listing, so it needs the real brand icon in the browser tab, on the home screen and in the stores.

**Depends on:** `icons-export`.

## What it touches

`app/web/public/` (favicon and PWA icons), the manifest in `app/web/vite.config.ts`. The iOS and Android icon sets land with `mobile-store-release`; this card produces the source art.

**Figma:** find the brand mark in the UI Kit `61o8icnDCev7fz5IN4irtj`. If it isn't there, take it from the legacy app at `/Users/juan/Development/smartbell-flutterflow/smartbell`.

## Approach

Export one master mark, then generate the favicon, the 192 and 512 PWA icons, a maskable icon and an apple-touch icon. Match the listing's existing icon unless the user says otherwise.

## Decisions and assumptions (groomed 2026-11-02)

- **Premise check.** `public/favicon.svg` was still the scaffold "S" tile, the 192 and 512 PNGs were placeholders, and the manifest comment said the real set was still to come. `icons-export` has shipped. The premise holds.
- **Source.** The listing's icon is the legacy `flutter_launcher_icons` source, `assets/images/app_launcher_icon.png`: a white bell in a white ring on navy `#063664` (also the Android adaptive background). The legacy iOS `AppIcon.appiconset` still holds Flutter's default logo, so it was not used. The UI Kit was not searched, because matching the listing is the goal and the legacy file is the listing's own source.
- **Master mark.** `public/favicon.svg` redraws that icon as vectors on a 512 grid and serves as both the favicon and the master. Rendered at 512, it differs from the store PNG in 0.46% of pixels, all of them antialiased edges.
- **Generation.** `npm run app-icons` (`scripts/gen-app-icons.ts`) renders the PNGs from the master with Playwright's Chromium, which is already a dev dependency: `icon-192.png`, `icon-512.png` and `apple-touch-icon.png` (180). All are opaque.
- **Maskable.** The ring's outer radius is 140 of 256, inside the 204.8 safe-zone radius, and the navy is full-bleed. `icon-512.png` is therefore listed a second time with `purpose: 'maskable'` rather than shipping a duplicate file.
- **Store icon sets.** As "What it touches" says, the iOS and Android sets land with `mobile-store-release`. This card ships the master they will be cut from.
- **Unchanged.** `index.html`'s `theme-color` and the manifest colours stay on the design tokens.

## Effort

S.

## Acceptance

- [x] The browser tab shows the Smartbell icon, not a placeholder.
- [x] The installed PWA shows the Smartbell icon, and the maskable icon isn't cropped.
- [x] The icon matches the current store listing, or the user approved a new one (human).
- [x] Tests for the new code pass in CI.
