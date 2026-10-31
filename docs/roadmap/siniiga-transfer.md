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

**Depends on:** `animal-api`, `siniiga-compliance`, `alert-engine`.

## What it touches

A `SiniigaTransferRequest` table (number, requesting ranch and animal, sale_date, note, status, created_at), `POST /siniiga-transfers`, confirm and decline endpoints, a task for the holding ranch's owner, and the animal form's refusal message.

**Inventory:** `docs/domain-model.md` §7.7. No Figma frame exists: reuse the existing form, modal and task components, and get the copy approved in the PR.

## Approach

Confirmed by the user on 2026-10-31.

When a number is refused because an ACTIVE animal holds it, the form offers "Compré este animal". The buyer enters the sale date (required) and a short note (optional), and is told their ranch name will be shared with the seller. The buyer's animal saves without the number and a request is created. The system finds the holder from the number, so the buyer never names the seller.

The holding ranch's owner gets a task showing the buyer's ranch name, the sale date, the note and their own animal. The buyer learns nothing about the seller, only whether the number was released.

- **Confirm:** records REMOVAL with VENDIDA_OTRO_RANCHO on the seller's animal, dated with the sale date, which the seller can correct, using the normal event path. The number goes on the buyer's animal.
- **Decline:** closes the request and tells the buyer to contact support.
- **No answer in 14 days:** the daily job marks the request ESCALATED, notifies support and tells the buyer. This matters because the buyer needs correct records for the authorities.

One open request per number, with a limit per ranch, so nobody can pester ranches or test numbers. Numbers retired by death or slaughter offer no request. Out of scope: the invoice a sale formally requires, which farmers issue outside Smartbell, and any price or document upload.

## Effort

S.

## Acceptance

- [ ] A buyer's request saves the animal without the number and creates one task for the holder's owner.
- [ ] Confirming removes the seller's animal as VENDIDA_OTRO_RANCHO and gives the buyer the number, in one transaction.
- [ ] Declining changes neither animal, and the buyer sees the support message.
- [ ] The seller sees only the buyer's ranch name, sale date and note; the buyer sees nothing about the seller at any point (test).
- [ ] The sale date is required, and it dates the seller's removal record.
- [ ] A request unanswered after 14 days is ESCALATED, and support and the buyer are notified (test).
- [ ] A second open request for a number is refused, and the per-ranch limit applies.
- [ ] A retired number offers no request.
- [ ] Copy approved (human).
- [ ] Tests for the new code pass in CI.
