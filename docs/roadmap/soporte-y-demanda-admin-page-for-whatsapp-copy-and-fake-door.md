---
id: soporte-y-demanda-admin-page-for-whatsapp-copy-and-fake-door
title: "Soporte y demanda: admin page for WhatsApp copy and fake-door taps"
summary: A staff-only page in the web app where Smartbell admins edit the WhatsApp number, prefilled messages and community link, and see fake-door taps per feature.
verifiedAt: 2026-11-20
---

# Soporte y demanda: admin page for WhatsApp copy and fake-door taps

## Problem

`whatsapp-support` made the support number, messages and community link editable without a deploy, and counts fake-door taps. Both work only through admin API calls, so the founder can't use them without a terminal script.

## Why

Requested by the user on 2026-11-03. The founder changes support copy and reads feature demand without help.

**Depends on:** `whatsapp-support`.

## What it touches

`app/web/src/features/admin/*` (a "Soporte y demanda" page at `/admin/soporte`), the avatar menu entry, and the account the API returns (`AccountOut`, from `GET /api/auth/me` and `POST /api/auth/session`), which gains `is_admin`. It uses the existing `PUT /api/admin/support/config` and `GET /api/admin/fake-door-taps`, and reads the config from the public `GET /api/support/config` (there is no admin `GET`; groomed 2026-11-20).

**Inventory:** no Figma frame. Use the existing form, table, filter and snackbar components from `app/web/src/ui`.

## Approach

- **Who is an admin:** the same rule as the admin endpoints, a verified email listed in `ADMIN_EMAILS`. This is Smartbell staff, not a ranch role. `/api/auth/me` returns `is_admin`, and nothing else about the list.
- **Hidden from everyone else:** the menu entry and route show only for admins. Anyone else is sent home, and the API still answers 403.
- **Same rule, one place:** `smartbell.security.is_admin` backs both the 403 and the flag. The web reads the flag from the session call it already makes, so a change to `ADMIN_EMAILS` shows on the next sign-in or reload.
- **Soporte form:**
  - **Fields:** the WhatsApp number, the support, payment and feature-interest messages, and the community link.
  - **Behaviour:** validated as the API does, and saved with `PUT`. A snackbar confirms the save, and an empty message falls back to the app's default copy.
  - **Preview:** a "Probar en WhatsApp" link opens the saved number with the support message.
  - **Fresh copy:** the page always refetches the config when it opens, even though the app's support links cache it for minutes. When the fresh copy arrives, an untouched form shows it, but typed edits are kept. A save replaces the whole config, so editing from a stale copy would undo another admin's change.
- **Demanda table:** feature, taps, distinct users and last tap, from `GET /api/admin/fake-door-taps`. It has a "since" date filter, defaulting to the last 30 days, and an empty state.
  - "Since" is midnight of that day in the founder's time zone. While a date is half typed, the table keeps the last full one.
  - The API lists every feature, at zero when untapped, so the empty state shows when no feature has a tap.
  - On a phone the "last tap" column is hidden, and the table scrolls inside its card, never the page.
- **Number input:** spaces, `+`, `-` and brackets are stripped before validating, so `+52 1 33 1234-5678` saves as `5213312345678`. A field the API still refuses (422) shows the error on that field.

## Effort

S.

## Acceptance

- [x] A non-admin never sees the menu entry, is redirected from the route, and gets 403 from the API (tests).
- [x] An admin saves each field, and an invalid number or link is refused with a field error.
- [x] The table matches the API for a fixture with taps across two dates, and the "since" filter narrows it.
- [ ] The founder edits the Soporte message in the browser and sees it in WhatsApp (human).
- [ ] Tests for the new code pass in CI.
