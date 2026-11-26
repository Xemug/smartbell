---
id: mark-each-bull-as-on-the-ranch-semen-only-or-both
title: Mark each bull as on the ranch, semen only, or both
summary: Bulls need to say whether they are physically on the ranch (natural service), available only as semen for IA, or both, so farmers see how each bull is used. Add the field, migration, API, the bull section of the animal form, and a Toros column and filter.
verifiedAt: 2026-11-26
---

# Mark each bull as on the ranch, semen only, or both

## Problem

A bull record doesn't say how the bull is available for reproduction. Today the domain only has the method (IA or MONTA) on each service event, so the Toros list can't show which bulls are physically on the ranch and which are only semen bought for insemination. The founder asked for this during animal-lists QA (2026-11-21).

## Why

Farmers pick a bull for each service, so they need to see which bulls can serve naturally and which are semen only. Semen-only bulls also aren't animals on the ranch.

**Depends on:** `animal-api`, `animal-lists`, `animal-forms`.

## What it touches

`Animal` model and a migration, the animal create and update schemas and routes, the bull section of the animal form, and the Toros list column and filter.

## Approach

- **Field:** `bull_availability` on bulls only: `EN_RANCHO` (physically on the ranch), `SEMEN` (semen only, for IA) or `AMBOS` (on the ranch, and its semen is also used). It's required for new bulls. Existing and imported bulls default to `EN_RANCHO`, because that's what a bull record meant in the live app.
- **Rules:**
  - A `SEMEN` bull can't be chosen for a MONTA service. An IA service accepts any bull.
  - A `SEMEN` bull doesn't count in head counts or ranch inventory, and doesn't get the alerts or tasks of a live animal.
- **UI:**
  - **Form:** the field is in the bull section of the animal form, using `src/ui` components.
  - **Toros list:** gets a "Disponibilidad" column and filter. Labels: "En rancho", "Solo semen", "Ambos".
- **Open item:** the founder confirms the three values (recommended) or just two.

## Effort

S.

## Acceptance

- [ ] A bull is created and edited with each value, and existing bulls read `EN_RANCHO` after the migration.
- [ ] A MONTA service with a `SEMEN` bull is refused; an IA service accepts it (tests).
- [ ] A `SEMEN` bull is left out of head counts (test).
- [ ] The Toros list shows the column and filters by it at both widths.
- [ ] The founder confirms the values (human).
- [ ] Tests for the new code pass in CI.
