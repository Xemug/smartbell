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

`app/api/alembic/legacy_firestore/*` (read-only Firestore reader, mappers, dry-run report).

**Figma:** n/a (no UI)
**Inventory:** spikes/flutterflow-audit.md §2, §8 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Per `docs/spikes/flutterflow-audit.md` §2 and §8. Read with a read-only credential. Normalise values stored as translated dropdown text (mixed English/Spanish, trailing spaces) into our enums. Report the ones that don't map. Cows and Bulls become Animal; diet, weight, group and removal records become events; the herd milk log by destination becomes MilkHerdLog; MilkPrices becomes a new ranch setting history. SINIIGA: keep the legacy value in a `legacy_siniiga` field when it doesn't match our format. Idempotent by Firestore doc id. A dry run prints counts and anomalies.

SINIIGA: convert `484-00-…` to `MX-00-…` (domain-model §7.7). Values that don't parse, or that two active animals share, import as empty and are listed in the dry-run report, so the import never stops on them and the owner can fix them. `Ranches.siniigaNumbers` becomes `has_siniiga_numbers`, with missing as false, so nobody is asked again.

Roles: map each `workesList.rol` value, in English or Spanish, to a role in domain-model §7.8. A value that doesn't map imports as Nutriólogo, the role with the least access, and is listed in the report.

Report how many users without an active Pro own more than one ranch (see `plans-billing`).

Potrero names (founder, 2026-11-27; from `keep-potrero-names-unique-per-ranch-in-the-database`).
The database refuses two potreros with the same name in a ranch (trimmed, ignoring case; accents
count), presets included. The import moves each ranch's own potreros, so these rules apply within
one ranch at a time:

1. **Duplicates in the old app** (two "Secas"): import both and rename the later one by creation
   date to "Secas (2)", then "(3)" and so on, skipping any suffix already taken. Every cow stays in
   its potrero.
2. **Old potrero called "General"** (any case): merge it into the new app's General. Its cows go to
   General, and no second potrero is created.
3. **Old potrero named like a preset** ("Secas", "Alta producción", "Recién paridas", "Enfermas",
   any case): import it as that preset, so it gets the preset's behaviour and the farmer can't add
   the preset a second time.
4. **Re-running the import after go-live** (the rancher has created "Lote 5" in the new app and the
   old data also has "Lote 5"): the imported one becomes "Lote 5 (2)", as in rule 1. Re-runs stay
   idempotent by Firestore doc id, so a potrero imported before isn't renamed again.
5. **Report:** the dry run and the real run list every rename and merge, one line per ranch in
   plain Spanish that support can pass on: «Rancho X: el potrero "Secas" se importó como
   "Secas (2)" porque ya había uno con ese nombre.»

## Effort

M.

## Acceptance

- [ ] A dry run against a Firestore export prints counts per collection and the unmapped values.
- [ ] A re-run creates no duplicates.
- [ ] Potrero names follow the five rules above, and the report lists every rename and merge.
- [ ] A migrated test user sees the same animals and milk history in the new app (human).
- [ ] Tests for the new code pass in CI.
