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
- **Open item:** the founder confirms the three values (recommended) or just two. All three are built.

## Decisions made while building (2026-11-26)

- **Which animals:** every male stores a value and females store none (DB check
  `ck_animals_bull_availability_iff_male`). A male calf that grows into a bull already says it.
  Migration `0008` backfills every existing male to `EN_RANCHO`.
- **Required:** a male can't be set to no value (`PATCH` with `null` is a 422). When a create
  leaves it out (an inline sire, an older client), the male is `EN_RANCHO`. A female given one gets
  a 422 `male_only`.
- **Form:** the field is a `Select` in `BullSection`, the seam `animal-forms` left in "Información
  adicional". It starts on "En rancho", so a bull registered in quick mode is on the ranch. There
  is no web edit form yet (`/vacas/:id` is still a placeholder), so editing is API-only until
  `cow-profile` builds it.
- **MONTA rule:** checked when a HEAT/INSEMINATED event is recorded and when one is edited (422
  `bull_semen_only` on `payload.bull_id`).
- **Head count:** "Vacas en Sistema" (`animal_count` on `/api/ranch`) leaves `SEMEN` bulls out,
  through `models.animals.on_ranch()`. The Toros tab badge still counts every bull listed, since
  it is the list's size, not the ranch's head count.
- **Alerts:** repro alerts are female-only already; a `SEMEN` bull gets no `VACCINE_DUE`.
- **List:** `GET /api/animals?availability=…`; the Toros list's "Disponibilidad" column shows at
  both widths, and the filter is `filtro=disponibilidad` in the URL.
- **Fixture herd:** TORO-1 is `EN_RANCHO`, TORO-2 `SEMEN`, TORO-3 `AMBOS` (its services are all IA).

## Effort

S.

## Acceptance

- [x] A bull is created and edited with each value, and existing bulls read `EN_RANCHO` after the migration.
- [x] A MONTA service with a `SEMEN` bull is refused; an IA service accepts it (tests).
- [x] A `SEMEN` bull is left out of head counts (test).
- [x] The Toros list shows the column and filters by it at both widths.
- [ ] The founder confirms the values (human).
- [x] Tests for the new code pass in CI.
