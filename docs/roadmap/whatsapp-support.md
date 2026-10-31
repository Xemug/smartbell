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

`app/api/smartbell/api/support.py` (fake-door event log), config for the number and copy, used by app-shell's modal.

**Figma:** [V 3133-9276](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=3133-9276), [V 3133-9263](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=3133-9263), [V 3557-9789](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=3557-9789)
**Inventory:** v4-onboarding-dashboard-tasks.md §1.13–1.14, §3.5 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Per v4-onboarding-dashboard-tasks.md §1.13–1.14, §3.5 and v4-animal-registration-profile.md §1.15.

## Effort

S.

## Acceptance

- [ ] Each fake-door tap is counted by feature and viewable by an admin endpoint.
- [ ] The number and messages are configurable without a deploy.
- [ ] Tests for the new code pass in CI.
