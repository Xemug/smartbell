---
id: plans-billing
title: Plans, billing and plan limits (parked)
summary: Pricing beyond the existing RevenueCat Pro entitlement (monthly / annual / lifetime), additional users and the OTO discount (parked until pricing is settled).
---

# Plans, billing and plan limits (parked)

## Problem

Monetisation is designed but not needed to prove the product.

## Why

Parked until the core loop ships; needs a payment provider decision.

**Depends on:** `user-admin`.

## What it touches

Subscription models, Stripe (or local MX provider) integration, `features/config/plan/*`.

**Figma:** [V 2951-8498](https://www.figma.com/design/hmrArjwi6iI4cOlPkR5hQD/x?node-id=2951-8498), [K 40935-516](https://www.figma.com/design/61o8icnDCev7fz5IN4irtj/x?node-id=40935-516), [M 2559-148532](https://www.figma.com/design/gv5ugNqVKPF8N2Ol5cQCyV/x?node-id=2559-148532), [W 1010-41973](https://www.figma.com/design/6UCRP77ZAdWb1ut1A91yJX/x?node-id=1010-41973)
**Inventory:** mobile-core.md E3–E5; web-onboarding-registry.md 1.18 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Per reconciliation-v4.md §4.5. If the mobile client stays in the stores, billing must use store subscriptions (RevenueCat is the usual bridge); web can use Stripe or a Mexican provider. The OTO screen (onboarding card) links here.

**Upsell doors (user decision, 2026-11-03):** the avatar-menu items Mi perfil, Mis ranchos, Mensajes recibidos and Administrar usuarios become upsell doors, not fake doors that count interest. They follow the live FlutterFlow pattern, "Feature under development" with a "See Plans" button, and open the plans screen. Until this card lands they keep their placeholder pages.

**Open:** Mi perfil and Mis ranchos (profile, ranch switch and create, invites) are free in the live app today. Paywalling them would take features away from free users, which the parity check on `mobile-store-release` forbids unless the user approves. The planner recommends paywalling only Administrar usuarios (extra users) and Mensajes recibidos. Waiting for the user's answer.

## Effort

XL.

## Acceptance

- [ ] Spec to be expanded when unparked.
- [ ] Tests for the new code pass in CI.
