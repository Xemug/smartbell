---
id: edit-group-and-bull-availability-from-the-animal-profile
title: Edit group and bull availability from the animal profile
summary: From a cow's profile, move her to another potrero; from a bull's profile, change his availability, with a confirmation that freezes his records when he goes to Solo semen.
verifiedAt: 2026-11-27
---

# Edit group and bull availability from the animal profile

## Problem

On the animal profile (PR #37), the founder can see a cow's potrero and a
bull's availability but can't change either there. To move one cow or switch
one bull, they have to leave the profile and go through the potrero screens or
the full edit form. (The founder asked for this while testing staging.)

## Why

The profile is where the founder looks at one animal. Groups (#36) and bull
availability (#35) are shipped, and the API already supports both changes, so
this is mostly screens on top of existing services.

## What it touches

- Web: `app/web/src/features/animals/profile/` (`ProfileSummary.tsx`,
  `AnimalProfilePage.tsx` and tests).
- API, reused:
  - The `GROUP_CHANGE` event (`schemas/events.py`, `services/events.py`). It
    already refuses AUTO potreros and writes the bitácora entry.
  - `PATCH /api/animals/{id}` for `bull_availability` (`services/animals.py`).
- API, new: a rule that refuses events recorded *on* a `SEMEN` bull (the
  "frozen records" below), in `services/events.py`.
- Regenerate `schema.d.ts` if any API shape changes.

## Approach

**Cow, change potrero.**
- An action on the potrero fact in the profile opens a sheet listing the
  ranch's MANUAL cow potreros, with the current one marked and AUTO ones
  hidden.
- Saving records a `GROUP_CHANGE` event, so it shows in the bitácora and in
  history. Reuse the potreros "Cambiar de potrero" component if it fits.
- Cows only. Heifers move by age, and bull groups are their own card
  (`put-bulls-on-the-ranch-into-bull-groups`).

**Bull, change availability.**
- An action on the availability fact opens a picker: En rancho, Solo semen,
  Ambos.
- Switching **to Solo semen** asks for confirmation first. The dialog
  explains that he leaves head counts, his open alerts and tasks close (that's
  already done by #35), and his records freeze. Freezing means:
  - No new events can be recorded on him. The API refuses with
    `bull_semen_only`.
  - Past records stay readable.
  - His services as a sire (IA) keep working.
- Switching back to En rancho or Ambos unfreezes his records. It needs no
  confirmation.
- The change is saved through `PATCH`, so history records it.

**Permissions.** Both actions follow the existing edit permissions. A viewer
doesn't see the actions.

**Out of scope.** Bull groups; editing other fields from the profile.

**Design.** Check Figma for these actions before building. If there is no
design, use the profile's existing sheet and dialog patterns, and flag it on
the PR.

## Effort

S–M. It's two profile actions plus one API rule, with tests.

## Acceptance

- [ ] From a cow's profile, the user moves her to another manual potrero. The profile, the potrero lists and her bitácora reflect it. AUTO potreros aren't offered.
- [ ] From a bull's profile, the user changes availability. Switching to Solo semen shows a confirmation first, and cancelling leaves him unchanged.
- [ ] A Solo semen bull can't have new events recorded on him (API `bull_semen_only`, and no record action in the UI). His past records stay visible, and he can still be picked as the sire for IA.
- [ ] Switching him back to En rancho or Ambos lets events be recorded again.
- [ ] Users without edit permission don't see either action.
- [ ] API and web tests cover the above, and CI is green.
- [ ] The founder moves a cow, and switches a bull to Solo semen and back, on staging (human).
