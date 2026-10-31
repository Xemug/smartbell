---
id: siniiga-compliance
title: Flag animals with no SINIIGA and ask at onboarding if the ranch has them all
summary: SINIIGA stays optional, but ranches see which animals are missing it: onboarding asks if they have them all, lists mark and filter animals without one, and ranches that said they have them all get a task to finish.
---

# Flag animals with no SINIIGA and ask at onboarding if the ranch has them all

## Problem

SINIIGA is Mexico's national cattle ID. A farmer may not have every number, which is allowed, but today nothing tells them which records are incomplete.

## Why

Requested by the user on 2026-10-31. Ranches need to know what is missing from their records.

**Depends on:** `animal-lists`, `onboarding-hub`, `tasks-engine`.

## What it touches

`Ranch.siniiga_declaration` (ALL, PARTIAL, NONE, null until answered), an onboarding step, an animal-list badge and filter, a count on `GET /animals`, an automatic task.

**Inventory:** `docs/domain-model.md` §7.7. No Figma frame exists: reuse the existing form, chip and task components, and get the copy approved in the PR.

## Approach

One onboarding question after the first cow: do you have the SINIIGA for all your animals? (all, some, none). It can be changed in ranch configuration. Every active animal without a number shows a "Sin SINIIGA" chip, and the list gets a "Sin SINIIGA" filter and count, whatever the answer. A ranch that answered ALL also gets one automatic task, listing the count, that closes when none are missing. Legacy ranches stay null, and are asked once on next sign-in.

## Effort

S.

## Acceptance

- [ ] Onboarding stores the answer, and it can be changed in ranch configuration.
- [ ] An animal with no SINIIGA shows the chip, and the filter and count match the fixture herd.
- [ ] A ranch that answered ALL gets one task, which closes when the last number is added.
- [ ] Ranches that answered PARTIAL or NONE get the chip and filter but no task.
- [ ] Question wording and chip approved (human).
- [ ] Tests for the new code pass in CI.
