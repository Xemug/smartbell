---
id: alert-engine
title: Alert engine: daily job, date-driven transitions, alert lifecycle
summary: Scheduled job that re-projects every cow daily, applies date-driven transitions (VWP end, dry-off, close-up), and opens/expires the internal alerts that tasks-engine turns into automatic tasks and the notifiers send.
verifiedAt: 2026-11-21
---

# Alert engine: daily job, date-driven transitions, alert lifecycle

## Problem

Alerts must appear on the right day without a user action; date-driven transitions don't happen otherwise.

## Why

Powers the alert list, dashboard, reminders and notifications.

**Depends on:** `events-api`.

## What it touches

`app/api/smartbell/jobs/daily.py` (APScheduler, ranch timezone aware), `app/api/smartbell/services/alerts.py`, `/alerts` list + resolve endpoints, tests with frozen time.

Audit (2026-11-21): `events-api` and `repro-engine` already shipped most of the machinery this card leans on. `domain/repro.py` projects every alert kind, including the V4 ones (PREG_RECHECK 90/180, CLOSE_UP, DIET_CHANGE at `diet_change_dim`), and applies the date-driven transitions inside the fold (VWP end → ABIERTA, dry-off date → SECA). `services/alert_sync.py` opens and closes alerts per event and left a `TODO(alert-engine)` seam for reminders. So this card adds: the job that runs the fold daily and calls the same sync, the lifecycle (follow-up day, expiry), VACCINE_DUE, reminder tasks on the seam, and the routes. Also `app/api/smartbell/domain/vaccines.py` (pure VACCINE_DUE rules), `app/api/smartbell/routes/alerts.py`, `app/api/smartbell/schemas/alerts.py`. No migration: the `alerts` and `tasks` tables already have every column.

**Figma:** n/a (no UI)
**Inventory:** domain-model.md §4; alerts-dashboard-reports.md §3.1–3.2 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Per domain-model §4 and alerts-dashboard-reports.md §3.1–3.2. Idempotent daily run per ranch at 05:00 local. Alert status PENDING → CONFIRMED/NEGATED (via resulting event) or EXPIRED (after follow-up day 5+, "Sistema ya no envía alertas"). VACCINE_DUE from the approved plan. DRY_OFF transition writes no event (documented). `GET /alerts?kind=&status=` and counts for the bell badge. Alerts are internal (reconciliation §4.3): the user sees them only as automatic tasks and off-app notifications. Add the V4 kinds: preg re-checks 90/180, CLOSE_UP, DIET_CHANGE at 120 DIM.

### Decisions and assumptions (recorded while building)

- **Ranch timezone.** No ranch stores a zone; every ranch is in Mexico, so "ranch time" is `America/Mexico_City` (`services.animals.RANCH_TIMEZONE`, already used for `today`). A per-ranch zone column is a later card if ranches outside that zone appear.
- **Where the job runs.** Cloud Run scales to zero, so an in-process 05:00 trigger would usually not fire. APScheduler runs it in-process only when `DAILY_JOB_ENABLED=true` (off by default; dev or a min-instance deploy). Hosted deploys should run `python -m smartbell.jobs.daily` as a Cloud Run job from Cloud Scheduler at 05:00 America/Mexico_City: an infra follow-up, not done here. No HTTP trigger was added, so nothing public can start the job.
- **Follow-up and expiry.** `follow_up_day` = days since the window opened, capped at 5 ("Hoy … Hace 5+ días"). A pending alert expires once today is past both its window end and window start + 5 days. It also expires once its window has ended and a later alert of the same kind for the same animal has opened (the 10/5/0-day dry-off reminders give way to each other). An expired alert never reopens on its own, and its open task is deleted with it.
- **VACCINE_DUE.** From the ranch's latest APROBADO plan: one alert per animal per due date (the alerts table has no vaccine column, so two vaccines due the same day share one alert). First dose by AGE_MONTHS (birth + months), WEIGHT_KG (first WEIGHT event at or over it) or EVENT (first heat, first insemination, first positive check, dry-off date). Then UNICA = one dose, REFUERZOS = 1 + `booster_count` doses every `booster_every_months`, CADA_6_MESES / ANUAL repeat from the last dose. A missing start value means never due. Doses count across plan versions by vaccine name. A dose already overdue when first seen (plan approved late) is surfaced once, dated today; a pending or expired alert covers it from then on, a confirmed one doesn't. A VACCINATION from 30 days before the alert's date on confirms it on the next daily run (the events API doesn't sync vaccines). VACCINE_DUE alerts never supersede each other.
- **Reminders → tasks** (the `alert_sync` seam): MILK_WITHDRAWAL ("Separar la leche de vaca {ID} hasta el {fecha}", SALUD) and HEIFER_TO_REGISTER ("Registrar la cría de vaca {ID}", REPRODUCCION) become automatic Tasks, once per (animal, kind, due date); an open one the projection drops is deleted, and reopened if it asks again. A done one stays done. WAIT_NEXT_CYCLE stays heat-form copy: the next HEAT alert's task covers it. Tasks for the alerts themselves stay with `tasks-engine`.
- **Routes.** `GET /alerts?kind=&status=` and `GET /alerts/counts` (pending alerts whose window has opened, for the bell badge) need ANIMALS_VIEW. `POST /alerts/{id}/resolve` `{status: CONFIRMED|NEGATED, event_id?}` needs EVENTS_RECORD, only closes a PENDING alert of the caller's ranch, and checks the event belongs to the same animal.
- **Concurrency.** The job locks each animal row (`FOR UPDATE`, as the events API does) and reads her events under it, so a concurrent event write can't be overwritten by a stale projection.
- **DRY_OFF writes no event**: the SECA state comes from the fold, so the job only re-writes the projection.

## Effort

M.

## Acceptance

- [x] With time frozen, a cow inseminated 35 days ago gets a PREGNANCY_CHECK alert on the window start.
- [x] A pregnant cow becomes SECA at expected calving −60 d after the job runs.
- [x] Running the job twice in a day creates no duplicates.
- [x] Unconfirmed HEAT alert expires after day 5+.
- [x] Tests for the new code pass in CI.
