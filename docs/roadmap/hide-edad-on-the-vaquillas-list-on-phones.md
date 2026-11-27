---
id: hide-edad-on-the-vaquillas-list-on-phones
title: Hide Edad on the Vaquillas list on phones
summary: "The Vaquillas list scrolls sideways 39px at 360px. Founder decision: hide the Edad column below md (as on Toros); computer screens keep it."
---

# Hide Edad on the Vaquillas list on phones

## Problem

On a 360px phone the Vaquillas list scrolls sideways by 39px: its phone row
shows ID, Estado and Edad, and the three don't fit. Anyone checking heifers from
the field on a phone hits it.

## Why

Phones are the main way the list is used in the corral. Toros already drops Edad
below `md` for the same reason. Vaquillas should do the same.

## What it touches

- `app/web/src/features/animals/list/AnimalListPage.tsx`: the shared
  `ageColumn` used by the Vaquillas and Toros column sets.
- `app/web/src/features/animals/list/animalLists.test.tsx`: the phone-layout test.

Vacas has no Edad column (cows show DEL), so nothing changes there.

## Approach

Root cause: Toros opted the shared `ageColumn` into `hideOnMobile` with a spread
at the call site (`{ ...ageColumn, hideOnMobile: true }`), but Vaquillas used the
column without it. Every list that shows Edad now hides it on phones, so the
flag moves onto `ageColumn` itself and the Toros spread goes. Sorting by Edad
stays available. Computer screens (`md` and up) are unchanged.

## Effort

S. A one-line column flag and one test.

## Acceptance

- [x] On a phone, the Vaquillas table's Edad header carries `hidden`; ID and Estado stay visible (regression test in `animalLists.test.tsx`).
- [x] Toros on a phone still hides Edad (existing test).
- [ ] At 360px the Vaquillas list no longer scrolls sideways; at desktop width Edad still shows (human)

## Verify

`grep -n "hideOnMobile" app/web/src/features/animals/list/AnimalListPage.tsx`
should show the flag on `ageColumn`.
