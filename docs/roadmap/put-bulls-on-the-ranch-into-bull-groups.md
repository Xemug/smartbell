---
id: put-bulls-on-the-ranch-into-bull-groups
title: Put bulls on the ranch into bull groups
summary: Bulls that are physically on the ranch (En rancho or Ambos) belong to a group; bull groups get their own tab next to the cow and heifer potreros.
verifiedAt: 2026-11-26
---

# Put bulls on the ranch into bull groups

## Problem

The groups card (PR #36) made potreros hold cows only. Heifers go through
their groups by age, and bulls have no group at all. But a bull that lives on
the ranch is in a real pen or pasture, and the founder wants to record and move
him like any other animal. (This came from the founder's QA on #36.)

## Why

The bull card (PR #35) says which bulls are physically present (`EN_RANCHO`
or `AMBOS`). Putting those bulls in groups makes the potrero view match the
ranch, and it sets up later work on monta planning: which bull runs with which
cows.

## What it touches

- `app/api/smartbell/services/groups.py` and `routes/groups.py`: a bull group
  kind. Today `describe` and `move_animals` filter to `AnimalKind.VACA`, and
  moves refuse with `not_a_cow`.
- `Group.type`/preset enums and an Alembic migration if a new group type is
  needed.
- `app/api/smartbell/services/animals.py` `_check_group`: a bull can only go
  into a bull group, and a cow only into a cow potrero.
- Web: `app/web/src/features/groups/` (a new tab beside Potreros vacas/vaquillas),
  the Toros list (Cambiar de potrero), and the animal form's potrero select
  for males.
- Regenerate `app/web/src/api/schema.d.ts`.

## Approach

- Add bull groups as their own group type. Only `EN_RANCHO` and `AMBOS` bulls
  can be members. A `SEMEN` bull is never in a group. When a bull switches to
  `SEMEN`, he leaves his group, and that is recorded in his history.
- Bull groups are manual only (no AUTO rules) in this card.
- A new "Toros" tab on the groups screen, with list, create, detail, delete and
  move, reusing the cow potrero components.
- Animals never mix across kinds. Moving a cow into a bull group, or a bull
  into a cow potrero, is refused.
- Out of scope: monta assignments between bull and cow groups, and heifer
  group changes.
- Check Figma for a bull-group design before building. If there is none, follow
  the cow potrero screens and flag it on the PR.

## Decisions made while building (2026-11-27)

The premise held: `describe` and `move_animals` filtered to `VACA` and refused `not_a_cow`, and
every file named above existed.

- **Group type.** `GroupType.TORO`. Only the CHECK on `groups.type` changes (migration 0010,
  chained after the potrero-name card's 0009 once that merges).
- **Who is a bull.** `kind == TORO`. Young males (novillos, becerros) keep today's behaviour.
- **No General for bulls.** A bull with no group is in none. Deleting a bull group leaves its bulls
  in no group, unless another bull group is picked. Each of them gets a GROUP_CHANGE with no
  destination.
- **Leaving on Solo semen.** `PATCH bull_availability: SEMEN` first writes a GROUP_CHANGE with no
  `to_group_id` on his bitácora (while his records can still take one), then freezes him. Only
  the server writes a move with no destination. A recorded GROUP_CHANGE must name a potrero.
- **Refusal codes.** `not_a_bull` for a non-bull going into a bull group, `not_a_cow` for a bull
  going into a cow potrero (also the old code for bulk moves), and `bull_semen_only` for a
  semen-only bull. These apply on register, on edit, on the profile's GROUP_CHANGE, on bulk move,
  and on delete-to target.
- **PATCH group_id now logs a GROUP_CHANGE** for any animal moved into a group, so an edit shows
  in his history as the profile move does. A cow PATCHed back to no group keeps the old plain
  update.
- **A sick bull isn't sent to Enfermas.** That preset is a cow potrero.
- **History copy.** Bull moves and deletes have their own keys (GROUP_BULLS_*), saying "toros".
  The cow keys say "vacas".
- **Picker filter.** `GET /animals?on_ranch=true` lists only EN_RANCHO and AMBOS bulls.
- **Design.** The docs' Figma inventory has no bull-group frames. The Toros tab, detail and
  two-step wizard (name, then bulls) follow the cow potrero screens.

## Effort

M. It reuses the potrero screens and services, and adds a group type, membership
rules and one tab.

## Acceptance

- [ ] An `EN_RANCHO` or `AMBOS` bull can be registered into, edited into or moved into a bull group, and the move appears in his history.
- [ ] A `SEMEN` bull can't join a bull group. Switching a grouped bull to `SEMEN` takes him out of it.
- [ ] Cows can't go into bull groups, and bulls can't go into cow potreros (API refuses with a clear code).
- [ ] The groups screen has a bull tab with list, create, detail, delete and move, with counts that include bulls on the ranch only.
- [ ] API and web tests cover the rules above, and CI is green.
- [ ] Founder creates a bull group, moves two bulls into it, then switches one to Solo semen and sees him leave the group (human).
