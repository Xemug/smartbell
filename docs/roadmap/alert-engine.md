---
id: alert-engine
title: Alert engine: daily job, date-driven transitions, alert lifecycle
summary: Scheduled job that re-projects every cow daily, applies date-driven transitions (VWP end, dry-off, close-up), and opens/expires the internal alerts that tasks-engine turns into automatic tasks and the notifiers send.
---

# Alert engine: daily job, date-driven transitions, alert lifecycle

## Problem

Alerts must appear on the right day without a user action; date-driven transitions don't happen otherwise.

## Why

Powers the alert list, dashboard, reminders and notifications.

**Depends on:** `events-api`.

## What it touches

`app/api/app/jobs/daily.py` (APScheduler, ranch timezone aware), `app/api/app/services/alerts.py`, `/alerts` list + resolve endpoints, tests with frozen time.

**Figma:** n/a (no UI)
**Inventory:** domain-model.md §4; alerts-dashboard-reports.md §3.1–3.2 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Per domain-model §4 and alerts-dashboard-reports.md §3.1–3.2. Idempotent daily run per ranch at 05:00 local. Alert status PENDING → CONFIRMED/NEGATED (via resulting event) or EXPIRED (after follow-up day 5+, "Sistema ya no envía alertas"). VACCINE_DUE from the approved plan. DRY_OFF transition writes no event (documented). `GET /alerts?kind=&status=` and counts for the bell badge. Alerts are internal (reconciliation §4.3): the user sees them only as automatic tasks and off-app notifications. Add the V4 kinds: preg re-checks 90/180, CLOSE_UP, DIET_CHANGE at 120 DIM.

## Effort

M.

## Acceptance

- [ ] With time frozen, a cow inseminated 35 days ago gets a PREGNANCY_CHECK alert on the window start.
- [ ] A pregnant cow becomes SECA at expected calving −60 d after the job runs.
- [ ] Running the job twice in a day creates no duplicates.
- [ ] Unconfirmed HEAT alert expires after day 5+.
- [ ] Tests for the new code pass in CI.
