---
id: app-favicon-and-install-icons
title: App favicon and install icons
summary: Replace the scaffold placeholder favicon and PWA icons with the real Smartbell brand art, and add the iOS and Android app icons for the store build.
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

## Effort

S.

## Acceptance

- [ ] The browser tab shows the Smartbell icon, not a placeholder.
- [ ] The installed PWA shows the Smartbell icon, and the maskable icon isn't cropped.
- [ ] The icon matches the current store listing, or the user approved a new one (human).
- [ ] Tests for the new code pass in CI.
