---
id: siniiga-compliance
title: Flag animals with no SINIIGA and ask at onboarding if the ranch has them all
summary: SINIIGA stays optional, but ranches see which animals are missing it: onboarding keeps the legacy yes-or-no question, lists mark and filter animals without one, and ranches that said they have them all get a task to finish.
---

# Flag animals with no SINIIGA and ask at onboarding if the ranch has them all

## Problem

SINIIGA is Mexico's national cattle ID. A farmer may not have every number, which is allowed, but today nothing tells them which records are incomplete.

## Why

Requested by the user on 2026-10-31. Ranches need to know what is missing from their records.

**Depends on:** `animal-lists`, `onboarding-hub`, `tasks-engine`.

## What it touches

`Ranch.has_siniiga_numbers` (boolean), a checkbox in onboarding, an animal-list badge and filter, a count on `GET /animals`, an automatic task.

**Inventory:** `docs/domain-model.md` §7.7. No Figma frame exists. The live app already has this: `onboarding_step03_insight1` (`/Users/juan/Development/smartbell-flutterflow/smartbell`, read-only) has a checkbox, "I have my cows SINIIGA numbers", saved to `Ranches.siniigaNumbers`. Reuse its wording with the existing form, chip and task components.

## Approach

Carries forward the live app's yes-or-no question, with its copy "Tengo los números SINIIGA de mis vacas", shown before the first cow as in the live app. It can be changed in ranch configuration.

One change from the live app: there, answering no hides the SINIIGA field and skips validation. Here the field always shows and stays optional, because the V4 unified form shows it for everyone and a ranch can get numbers later.

Every active animal without a number shows a "Sin SINIIGA" chip, and the list gets a "Sin SINIIGA" filter and count, whatever the answer. A ranch that answered yes also gets one automatic task, listing the count, that closes when none are missing.

## Effort

S.

## Acceptance

- [ ] Onboarding stores the yes-or-no answer before the first cow, and it can be changed in ranch configuration.
- [ ] The SINIIGA field shows and validates whatever the answer.
- [ ] An animal with no SINIIGA shows the chip, and the filter and count match the fixture herd.
- [ ] A ranch that answered yes gets one task, which closes when the last number is added.
- [ ] A ranch that answered no gets the chip and filter but no task.
- [ ] Chip wording approved (human).
- [ ] Tests for the new code pass in CI.
