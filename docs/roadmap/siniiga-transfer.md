---
id: siniiga-transfer
title: Transfer a SINIIGA when the seller hasn't recorded the sale
summary: A buyer whose number is refused because the seller still has the animal active can ask for it; the seller's ranch confirms the sale, which removes their animal and gives the buyer the number.
---

# Transfer a SINIIGA when the seller hasn't recorded the sale

## Problem

An animal keeps its SINIIGA for life, including after a sale. If the seller hasn't recorded the sale, the buyer's registration is refused and the buyer has no way forward.

## Why

Requested by the user on 2026-10-31. A buyer must never have to drop or change a valid number.

**Depends on:** `animal-api`, `siniiga-compliance`.

## What it touches

A `SiniigaTransferRequest` table (number, requesting ranch and animal, status, created_at), `POST /siniiga-transfers`, confirm and decline endpoints, a task for the holding ranch's owner, and the animal form's refusal message.

**Inventory:** `docs/domain-model.md` §7.7. No Figma frame exists: reuse the existing form, modal and task components, and get the copy approved in the PR.

## Approach

When a number is refused because an ACTIVE animal holds it, the form offers "Compré este animal". The buyer's animal saves without the number and a request is created. The holding ranch's owner gets a task showing the number and their own animal, and neither side sees the other ranch's name, owner or data. Confirming records REMOVAL with VENDIDA_OTRO_RANCHO on their animal, using the normal event path, and sets the number on the buyer's animal. Declining closes the request and tells the buyer to contact support. Numbers retired by death or slaughter offer no request.

## Effort

S.

## Acceptance

- [ ] A buyer's request saves the animal without the number and creates one task for the holder's owner.
- [ ] Confirming removes the seller's animal as VENDIDA_OTRO_RANCHO and gives the buyer the number, in one transaction.
- [ ] Declining changes neither animal, and the buyer sees the support message.
- [ ] Neither ranch can read the other's name, owner or animal data (test).
- [ ] A retired number offers no request.
- [ ] Copy approved (human).
- [ ] Tests for the new code pass in CI.
