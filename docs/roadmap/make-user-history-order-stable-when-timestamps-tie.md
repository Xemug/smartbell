---
id: make-user-history-order-stable-when-timestamps-tie
title: Make user history order stable when timestamps tie
summary: test_user_admin::test_add_edit_and_remove_each_write_a_history_entry fails about 4 in 5 local SQLite runs because history rows written in the same second tie on created_at and then sort by random UUID. Add a tiebreak so the API's history order is deterministic, and keep the test strict.
verifiedAt: 2026-11-21
---

# Make user history order stable when timestamps tie

## Problem

History entries written in the same request or second share `created_at`. On SQLite, `created_at` has second precision, so the rows tie and then sort by random UUID. `tests/test_user_admin.py::test_add_edit_and_remove_each_write_a_history_entry` fails about 4 in 5 local runs. Postgres has microseconds, so CI passes, but two writes in one transaction can still tie there too (`now()` is per transaction).

## Why

The history list a user reads must show events in the order they happened, and a flaky test hides real failures.

**Depends on:** none.

## What it touches

`app/api/smartbell/services/history.py`, the history model, a migration if a column is added, `tests/test_user_admin.py`.

## Approach

- Add a deterministic tiebreak for history order: a monotonic sequence column (preferred) or another insert-order key. Order by `created_at` then that key, everywhere history is listed.
- Keep the test strict: it must assert the exact order.
- Show the flake before and after: run the test 20 times on SQLite before (fails) and after (passes).

## Effort

S.

## Acceptance

- [ ] The test passes 20 runs in a row on local SQLite and on Postgres.
- [ ] Two history writes in one transaction list in the order they were written (test).
- [ ] Tests for the new code pass in CI.
