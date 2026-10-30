---
id: legacy-firestore-import
title: Import legacy Firestore data into Postgres
summary: One-off, re-runnable import of the FlutterFlow app's Firestore data (users, ranches, members, cows, bulls, groups, weights, diets, milk logs, prices, tasks) into the new schema, keyed by Firebase uid, with value normalisation.
---

# Import legacy Firestore data into Postgres

## Problem

Existing users (about 24 active) must keep their herds and milk history when the new app replaces the old one in the stores.

## Why

It lets the new app ship as an update under the same bundle id, without data loss.

**Depends on:** `core-data-model`, `auth`, `milk-api`, `animal-api`.

## What it touches

`app/api/app/migrations/legacy_firestore/*` (read-only Firestore reader, mappers, dry-run report).

**Figma:** n/a (no UI)
**Inventory:** spikes/flutterflow-audit.md §2, §8 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Per `docs/spikes/flutterflow-audit.md` §2 and §8. Read with a read-only credential. Normalise values stored as translated dropdown text (mixed English/Spanish, trailing spaces) into our enums. Report the ones that don't map. Cows and Bulls become Animal; diet, weight, group and removal records become events; the herd milk log by destination becomes MilkHerdLog; MilkPrices becomes a new ranch setting history. SINIIGA: keep the legacy value in a `legacy_siniiga` field when it doesn't match our format. Idempotent by Firestore doc id. A dry run prints counts and anomalies.

## Effort

M.

## Acceptance

- [ ] A dry run against a Firestore export prints counts per collection and the unmapped values.
- [ ] A re-run creates no duplicates.
- [ ] A migrated test user sees the same animals and milk history in the new app (human).
- [ ] Tests for the new code pass in CI.
