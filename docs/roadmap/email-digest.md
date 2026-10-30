---
id: email-digest
title: Notification service and daily email digest
summary: Notification abstraction (templates, channels, preferences) with in-app and email channels, and the daily multi-ranch alert digest email.
---

# Notification service and daily email digest

## Problem

Farmers don't open the app every morning; the design's main off-app channel is the daily digest.

## Why

Delivers alert value outside the app; base for push/SMS.

**Depends on:** `alert-engine`.

## What it touches

`app/api/app/notifications/{service,channels/email,templates}/*`, provider via SMTP/Resend env config, MJML or plain HTML templates.

**Figma:** [W 816-1866](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=816-1866), [W 1045-32](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=1045-32)
**Inventory:** alerts-dashboard-reports.md 1.6, §3.3 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Per alerts-dashboard-reports.md 1.6 and §3.3. Digest per user across their ranches: sick, in heat, to confirm pregnancy, about to calve, with deep links. Respect NotificationPreference. Template vars per §3.3. Log Notification rows. Dev: mail to a local catcher (Mailpit in docker-compose). V4: the digest lists the day's open automatic tasks (they mirror the alerts).

## Effort

M.

## Acceptance

- [ ] The daily job sends one digest per opted-in user listing each ranch's pending alerts (Mailpit test).
- [ ] Users without EMAIL get none.
- [ ] Digest matches W 816-1866 email frame (human).
- [ ] Tests for the new code pass in CI.
