---
id: web-push-pwa
title: Web push notifications and installable PWA
summary: Web push for the browser PWA (native push ships in mobile-store-release).
---

# Web push notifications and installable PWA

## Problem

Push is the fastest nudge on a phone; the designs include push templates.

## Why

Gives mobile users timely alerts without a native app.

**Depends on:** `email-digest`, `tasks-home`.

## What it touches

Service worker (Workbox), VAPID keys, `app/api/app/notifications/channels/webpush.py`, subscription endpoints, install prompt.

**Figma:** [M 2361-177314](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2361-177314), [W 1068-139](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=1068-139)
**Inventory:** alerts-dashboard-reports.md 1.6 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Per alerts-dashboard-reports.md 1.6 (push templates: singular/plural, one/several users). iOS requires installed PWA (16.4+): show install guidance. Respect preferences.

## Effort

M.

## Acceptance

- [ ] On Chrome desktop and Android, a new alert produces a push that opens the alert.
- [ ] Install prompt appears once; iOS shows install guidance.
- [ ] Tested on a real phone (human).
- [ ] Tests for the new code pass in CI.
