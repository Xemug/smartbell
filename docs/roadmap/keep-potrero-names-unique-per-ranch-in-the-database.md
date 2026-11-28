---
id: keep-potrero-names-unique-per-ranch-in-the-database
title: Keep potrero names unique per ranch in the database
summary: Add a unique (ranch_id, lower(name)) index on groups so two potreros can't share a name even under concurrent creates; the API check alone can race.
---

# Keep potrero names unique per ranch in the database

## Problem

`services/groups.py` `_check_name` looks for a group with the same name
(case-insensitive) before create or rename, and answers 409 `group_name_taken`.
It's check-then-insert, so two concurrent creates (a double tap, or two users)
can both pass and leave two potreros with the same name. Flagged by the groups
worker after PR #36.

## Why

Duplicate names make the potrero pickers ambiguous (profile Cambiar, animal
form, move dialog). The legacy import will also create groups in bulk, so the
database should enforce the rule.

## What it touches

- New Alembic migration `0009_group_name_unique` in `app/api/migrations/versions/`.
- `app/api/smartbell/models` Group (`__table_args__` index).
- `services/groups.py` create and rename: turn the `IntegrityError` into the
  same 409 `group_name_taken`.
- `tests/test_groups.py`, `tests/test_migrations.py`.

## Approach

- Before adding the index, check how preset groups (General, the heifer age
  groups, etc.) are named. If presets have a NULL name, or share names across
  group types on purpose, scope the index to match today's `_check_name`
  rule (a partial index, or include the type), and record the decision here.
- The migration first finds existing duplicates and renames the later ones
  (`"<name> (2)"`), so the upgrade can't fail on real data. Downgrade drops the
  index.
- Keep `_check_name` for the friendly 409. Catch the `IntegrityError` on flush
  as the fallback for the race.
- Coordinate with `put-bulls-on-the-ranch-into-bull-groups`, which may also add
  a migration. Whichever merges second rechains its revision.

## Effort

S. One migration, one index, and the error mapping.

## Acceptance

- [ ] A unique index on (ranch_id, lower(name)), scoped to match `_check_name`, exists after `alembic upgrade head`. Downgrade removes it.
- [ ] The migration renames existing duplicates instead of failing (test with seeded duplicates).
- [ ] Two concurrent creates with the same name give one 201 and one 409 `group_name_taken`, never a 500 (test).
- [ ] CI is green.
