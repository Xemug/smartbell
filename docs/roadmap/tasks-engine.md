---
id: tasks-engine
title: Tasks engine: manual and automatic tasks with priority
summary: Task API and generator: manual tasks (name, date, frequency, animal, assignee, notes), automatic tasks generated from alerts and onboarding/promo rules, completion that records the linked event, and the V4 display priority.
---

# Tasks engine: manual and automatic tasks with priority

## Problem

V4 and the shipped app make tasks the daily driver, replacing the alert list and reminders.

## Why

Home, onboarding and every automatic prompt (heat, pregnancy, dry-off, calving, diet) are tasks.

**Depends on:** `alert-engine`.

## What it touches

`app/api/smartbell/api/tasks.py`, `app/api/smartbell/services/tasks.py` (generator from Alert rows and the onboarding/promo rules), tests.

**Figma:** n/a (no UI)
**Inventory:** domain-model.md §7.2; v4-onboarding-dashboard-tasks.md §3 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Per domain-model.md §7.2 and v4-onboarding-dashboard-tasks.md §3.1–3.4. Each open Alert has exactly one OPEN automatic task (idempotent upsert keyed by alert id); closing the alert closes the task and vice versa. Onboarding and promo rules: ONBOARDING_TUTORIAL, REGISTER_ANIMALS (until registered ≥ declared or a membership exists), BUY_PLAN, FIRST_EVENT. Manual tasks: frequency ONCE/DAILY/WEEKLY/MONTHLY; recurring tasks create the next instance on completion. Category enum from the shipped app (CAMBIO_POTRERO, DIETA, REPRODUCCION, SALUD, OTRA). `GET /tasks?from=&to=` returns tasks sorted by date, then by priority bucket (§3.3).

## Effort

M.

## Acceptance

- [ ] A HEAT alert produces one 'Observar el celo de vaca {ID}' task; completing it with 'No entró' negates the alert.
- [ ] Completing a daily recurring task creates tomorrow's instance.
- [ ] Within a day, a health task sorts before a reproduction task, which sorts before a user task.
- [ ] REGISTER_ANIMALS disappears once registered cows ≥ the declared count.
- [ ] Tests for the new code pass in CI.
