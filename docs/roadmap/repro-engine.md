---
id: repro-engine
title: Reproductive engine: state projection and computed dates
summary: Pure-Python module that folds a cow's events into her reproductive state, lactation, DIM, next heat / pregnancy-check / calving / dry-off windows and withdrawal dates, with table-driven tests.
---

# Reproductive engine: state projection and computed dates

## Problem

The product's core value is telling the farmer what each cow needs next; the rules are spread across Figma notes and need one tested implementation.

## Why

Events, alerts, dashboard and reports all read from it; getting it right once avoids divergent date math.

**Depends on:** `core-data-model`.

## What it touches

`app/api/app/domain/repro.py`, `app/api/app/domain/withdrawal.py`, `app/api/tests/domain/test_repro_*.py`, a projection writer `app/api/app/services/projection.py`.

**Figma:** n/a (no UI)
**Inventory:** domain-model.md §2–4, §7; event-flows.md §3.3–3.7 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Implement `docs/domain-model.md` §2 (state machine), §3 (rules 3.1–3.14) and §4 (what each event schedules, as a returned list of AlertSpec/ReminderSpec, not DB writes). Signature: `project(animal, events, settings, today) -> Projection`. No I/O in the domain module. All constants come from `RanchSettings`. Windows are ranges (start, end) rendered as "entre los días X al Y". Edge cases to test: heat ⑦ during VWP (allowed + warning flag), return to heat while SERVIDA, negative check, loss classification by days (41/42/259/260), dry-off at −60 d, heifer→cow on first calving, lactation number increments, DIM continues while dry, withdrawal with unknown description = maximum. Reproduce the 7 prototype cows' dates from event-flows.md where consistent with the defaults; document deviations. Also per domain-model.md §7.5: pregnancy re-checks at 90/180 days after a positive diagnosis, a CLOSE_UP ('Reto') at calving − close_up_days, DIET_CHANGE at 120 DIM, and the heat window width from settings (V4 shows 7 days). AUTO development stage derived from age + sex + state.

## Effort

L.

## Acceptance

- [ ] `pytest app/api/tests/domain` passes with ≥40 table cases covering every transition in domain-model §2.
- [ ] Projection is deterministic given (events, settings, today) and has no DB/network access (import-linted).
- [ ] Changing `gestation_days` in settings changes expected calving in tests.
- [ ] Fixture cows 00001–00007 project to the states shown in event-flows.md §3.5 (or deviations listed in the PR).
- [ ] Tests for the new code pass in CI.
