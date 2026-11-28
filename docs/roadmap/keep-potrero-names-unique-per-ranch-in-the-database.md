---
id: keep-potrero-names-unique-per-ranch-in-the-database
title: Keep potrero names unique per ranch in the database
summary: The app already refuses a second potrero with the same name in a ranch, but two saves at the same moment can both slip through. A database rule closes that gap, the refusal message names the clashing potrero, and the legacy import has rules for names that already clash.
verifiedAt: 2026-11-28
---

# Keep potrero names unique per ranch in the database

## Problem

Within one ranch, potrero names must be unique, ignoring upper/lower case. The API checks this
before saving (`_check_name` in `app/api/smartbell/services/groups.py`) and refuses with 409
`group_name_taken`. The check reads first and writes after, so two people saving the same name at
the same moment (two creates, or a create and a rename) can both pass. The ranch then has two
potreros it can't tell apart in "Cambiar de potrero", the list filters and history lines such as
"se enviaron a potrero Y".

The old FlutterFlow app never checked names, so a ranch's old data may already have duplicates.

## Why

This adds no new rule for farmers. It makes the database enforce a rule the app already promises.
Different ranches can always use the same names. The database rule must be in place before the
legacy import runs for real, because that is when old duplicates show up.

**Depends on:** `groups` (shipped). **Feeds:** `legacy-firestore-import` (the import rules below).

## What it touches

- `app/api/smartbell/models/animals.py`: `Group.__table_args__` gets a unique index on
  `(ranch_id, lower(name))`, next to `uq_groups_ranch_id_preset`.
- `app/api/migrations/versions/0009_group_name_unique.py`: creates the index. New-app data can't
  have duplicates unless the race already happened. If it did, the migration renames the later
  ones with the import's " (2)" rule first (see Decisions below).
- `app/api/smartbell/services/groups.py`: `create_group` and `update_group` turn the index's
  `IntegrityError` into the same 409 `group_name_taken` the pre-check returns. A savepoint
  around the flush keeps the session usable. Keep the pre-check, because it gives the usual
  answer without a database error.
- `app/web/src/features/groups/NewGroupPage.tsx`, `GroupDetailPage.tsx`, and
  `groups.detail.nameTaken` in `app/web/src/i18n/locales/es-MX.json`: the clearer message.
- `docs/roadmap/legacy-firestore-import.md`: add the import rules below to its spec.

## Approach

### The rule

- **Scope:** one ranch. Ranches never clash.
- **Same name means:** equal after trimming spaces at the start and end (the schema already
  trims) and ignoring upper/lower case. Accents count as different, so "Recien paridas" and
  "Recién paridas" are two names (founder, 2026-11-27).
- **Deleted potreros** are removed completely, so their names can be reused at once.
- **Presets:** the rule covers preset and custom potreros alike. A custom potrero called "Secas"
  blocks adding the Secas preset later, as it does today.

### The message (founder: make it clear)

When a save is refused, by the pre-check or by the database during a same-moment save, the name
field shows the same message, naming the potrero and telling the user what to do:

> Ya hay un potrero llamado «Lote 3» en este rancho. Elige otro nombre.

The name in the message is the existing potrero's name as saved, with its own capitalisation.
The 409 body carries it (for example `existing_name`) so the web doesn't guess. The user's typing
stays in the field so they can edit it. This replaces "Ya hay un potrero con ese nombre" in the
wizard (create) and in the detail page (rename).

### Legacy import rules (founder, 2026-11-27)

The import moves each ranch's own potreros from the old app, so these rules apply within one
ranch at a time:

1. **Duplicates in the old app** (two "Secas"): import both and rename the later one by
   creation date to "Secas (2)", then "(3)" and so on, skipping any suffix already taken.
   Every cow stays in its potrero.
2. **Old potrero called "General"** (any case): merge it into the new app's General. Its cows
   go to General, and no second potrero is created.
3. **Old potrero named like a preset** ("Secas", "Alta producción", "Recién paridas",
   "Enfermas", any case): import it as that preset, so it gets the preset's behaviour and the
   farmer can't add the preset a second time.
4. **Re-running the import after go-live** (the rancher has created "Lote 5" in the new app and
   the old data also has "Lote 5"): the imported one becomes "Lote 5 (2)", as in rule 1.
   Re-runs stay idempotent by Firestore doc id, so a potrero imported before isn't renamed again.
5. **Report:** the dry run and the real run list every rename and merge, one line per ranch in
   plain Spanish that support can pass on: «Rancho X: el potrero "Secas" se importó como
   "Secas (2)" porque ya había uno con ese nombre.»

### Decisions while building (2026-11-27)

- **Migration 0009 renames rather than fails.** Failing on a duplicate would block a deploy on
  data nobody can fix from the app, so the upgrade renames the later duplicates with the import's
  rule 1 (" (2)", " (3)", skipping taken suffixes, cut to fit the 60-character column). One
  exception: a **preset keeps its name** even when a custom potrero with that name is older,
  because a preset can't be renamed in the app. Downgrade drops the index and leaves the names.
- **The index matches `_check_name`:** `(ranch_id, lower(name))` over every group, presets
  included. Names are already trimmed by the schema, so the index doesn't trim again.
- **The 409 body:** the field error keeps `type: group_name_taken` and adds
  `ctx: {"existing_name": "<as saved>"}`, the shape FastAPI uses for validation details. `msg`
  is the Spanish message above.
- **Savepoint:** the insert or rename runs inside `session.begin_nested()` (as `ensure_general`
  does), so after the index refuses it the service can still read the existing potrero's name.
- **Web:** the wizard goes back to its first step and shows the message under the name field (or
  the preset select); the detail page shows it under the name field. Other save errors still use
  the banner.

### Out of scope

- **Creating potreros offline.** Not possible today. If the offline work adds it, a sync can be
  refused with `group_name_taken` and has to show the message above. That's for a separate
  conversation.
- **Merging two ranches.** No feature moves potreros between ranches. If one is built, it needs
  its own naming rule.
- **Treating accents as the same letter.**

## Effort

S. One index and migration, error mapping in two service calls, one message change, and the
import rules written into another spec (that spec builds them).

Board: backlog at low priority. Pick it up before the legacy import's real run, or when an agent
is idle.

## Acceptance

- [ ] The `groups` table has a unique index on `(ranch_id, lower(name))`. Inserting "lote 3" next
      to "Lote 3" in the same ranch fails at the database. The same name in another ranch works.
- [ ] A test that skips the pre-check (or runs two creates at once) gets 409 `group_name_taken`
      with the existing potrero's name, not a 500. The same holds for a rename.
- [ ] Creating or renaming into a taken name shows «Ya hay un potrero llamado «X» en este rancho.
      Elige otro nombre.» under the name field, with the typed text kept. Covered by
      `groups.test.tsx`.
- [ ] The migration upgrades and downgrades cleanly on a copy of staging data.
- [ ] `legacy-firestore-import.md` lists the five import rules above.
- [ ] Try to create a potrero with the name of one that already exists, in different
      capitalisation, on phone and on computer. The message names the existing potrero and is
      clear (human).
- [ ] Tests for the new code pass in CI.

## Verify

- `grep -n "_check_name\|group_name_taken" app/api/smartbell/services/groups.py` still finds the
  pre-check this card backs up.
- `ls app/api/migrations/versions` to pick the next revision number (0009 when written).
- Check that `legacy-firestore-import` hasn't built group import yet. If it has, these rules
  become changes to its code, not to its spec.
