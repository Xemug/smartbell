---
id: sms-whatsapp-alerts
title: SMS and WhatsApp alert channels (parked)
summary: Plan-gated SMS (≤260 chars, sender Smartbell Alerts) and WhatsApp alert delivery through a provider.
---

# SMS and WhatsApp alert channels (parked)

## Problem

Some farmers live on WhatsApp/SMS; designs include both but gate SMS behind the paid plan.

## Why

Parked until plans-billing exists.

**Depends on:** `email-digest`, `plans-billing`.

## What it touches

`app/api/app/notifications/channels/{sms,whatsapp}.py`.

**Figma:** [W 816-1866](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=816-1866)
**Inventory:** alerts-dashboard-reports.md 1.6 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Per alerts-dashboard-reports.md 1.6. Provider: Twilio (needs account).

## Effort

M.

## Acceptance

- [ ] Spec to be expanded when unparked.
- [ ] Tests for the new code pass in CI.
