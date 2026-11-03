---
id: whatsapp-support
title: WhatsApp support, community link and fake-door tracking
summary: Configurable WhatsApp support number and prefilled messages (support, payment, feature interest), the community-group link, and counting fake-door taps per feature.
---

# WhatsApp support, community link and fake-door tracking

## Problem

V4 routes support and unbuilt features to WhatsApp; the team needs to know which features users ask for.

## Why

Cheap demand signal for the deferred modules.

**Depends on:** `app-shell-navigation`.

## What it touches

`app/api/smartbell/routes/support.py` (fake-door event log and config routes), `app/api/smartbell/models/support.py`, migration `0003`, and in the web app `src/app/support.ts`, used by app-shell's fake-door modal and the avatar menu's Soporte link.

> Groomed 2026-11-02: the spec named `smartbell/api/support.py`, but routes live in `smartbell/routes/`. `app-shell-navigation` has landed (fake-door modal, Soporte link, a build-time `VITE_WHATSAPP_NUMBER`), so its premise holds.

**Figma:** [V 3133-9276](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=3133-9276), [V 3133-9263](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=3133-9263), [V 3557-9789](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=3557-9789)
**Inventory:** v4-onboarding-dashboard-tasks.md §1.13–1.14, §3.5 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Per v4-onboarding-dashboard-tasks.md §1.13–1.14, §3.5 and v4-animal-registration-profile.md §1.15.

- **Config without a deploy.** One `support_settings` row (id 1): WhatsApp number (digits, as wa.me takes them; default 523334056398), the support, payment and feature messages, and the community-group link. `GET /api/support/config` is public, so the link can also serve people who can't sign in. `PUT /api/admin/support/config` replaces the whole row. A null message means the app shows its own translated copy, so the English locale keeps working; an override is shown as written. The feature message must contain `{nombre}`. The community link must be https.
- **Fake-door taps.** `POST /api/support/fake-door-taps {feature}` needs a signed-in account and logs one row (feature, user, time). Features are an allowlist (`FakeDoorFeature`: GRUPOS, REPORTES, USUARIOS, RANCHOS), so a new fake door is a one-line enum change. A repeat tap on the same door by the same user within 10 s is dropped as a double-click. The web shell counts on the tap itself, best effort: a failed count never blocks the modal.
- **Admin view.** `GET /api/admin/fake-door-taps?since=` returns taps, distinct users and last tap per feature, most wanted first, with zero rows for untapped features.
- **Web.** `useSupportLinks()` builds the Soporte, payment and fake-door wa.me links from the served config, falling back to the build's number and the i18n copy until it answers.

### Assumptions (no answer needed to proceed; all reversible)

- "Admin" means Smartbell staff, not a ranch's ADMINISTRADOR role: a token whose **verified** email is in the `ADMIN_EMAILS` setting. Unverified emails are refused because Firebase lets anyone register an unconfirmed address. There is no admin UI; staff call the endpoints directly (curl or the OpenAPI docs page).
- The community link is served in the config, but no screen shows it yet: inventory §1.15 calls the group icons marketing assets and the avatar menu (§1.13) has no community item. A later card can place it.
- The payment prefill is served and has a `support.paymentPrefill` default, but its button belongs to `plans-billing`.

## Effort

S.

## Acceptance

- [x] Each fake-door tap is counted by feature and viewable by an admin endpoint.
- [x] The number and messages are configurable without a deploy.
- [x] Tests for the new code pass in CI.
