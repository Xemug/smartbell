---
id: soporte-y-demanda-admin-page-for-whatsapp-copy-and-fake-door
title: "Soporte y demanda: admin page for WhatsApp copy and fake-door taps"
summary: A staff-only page in the web app where Smartbell admins edit the WhatsApp number, prefilled messages and community link, and see fake-door taps per feature.
---

# Soporte y demanda: admin page for WhatsApp copy and fake-door taps

## Problem

`whatsapp-support` made the support number, messages and community link editable without a deploy, and counts fake-door taps. Both work only through admin API calls, so the founder can't use them without a terminal script.

## Why

Requested by the user on 2026-11-03. The founder changes support copy and reads feature demand without help.

**Depends on:** `whatsapp-support`.

## What it touches

`app/web/src/features/admin/*` (a "Soporte y demanda" page and its route), the avatar menu entry, and `GET /api/auth/me`, which gains `is_admin`. It uses the existing `GET`/`PUT /api/admin/support/config` and `GET /api/admin/fake-door-taps`.

**Inventory:** no Figma frame. Use the existing form, table, filter and snackbar components from `app/web/src/ui`.

## Approach

- **Who is an admin:** the same rule as the admin endpoints, a verified email listed in `ADMIN_EMAILS`. This is Smartbell staff, not a ranch role. `/api/auth/me` returns `is_admin`, and nothing else about the list.
- **Hidden from everyone else:** the menu entry and route show only for admins. Anyone else is sent home, and the API still answers 403.
- **Soporte form:**
  - **Fields:** the WhatsApp number, the support, payment and feature-interest messages, and the community link.
  - **Behaviour:** validated as the API does, and saved with `PUT`. A snackbar confirms the save, and an empty message falls back to the app's default copy.
  - **Preview:** a "Probar en WhatsApp" link opens the saved number with the support message.
- **Demanda table:** feature, taps, distinct users and last tap, from `GET /api/admin/fake-door-taps`. It has a "since" date filter, defaulting to the last 30 days, and an empty state.

## Effort

S.

## Acceptance

- [ ] A non-admin never sees the menu entry, is redirected from the route, and gets 403 from the API (tests).
- [ ] An admin saves each field, and an invalid number or link is refused with a field error.
- [ ] The table matches the API for a fixture with taps across two dates, and the "since" filter narrows it.
- [ ] The founder edits the Soporte message in the browser and sees it in WhatsApp (human).
- [ ] Tests for the new code pass in CI.
