---
id: milk-api
title: Milk records API: herd daily log and per-cow litres by destination
summary: MilkHerdLog (one per day, overwrite) and MilkCowLog (litres by destination: tanque, becerras, antibióticos) endpoints with aggregates by week/month/quarter/semester/year and litres per cow per day.
verifiedAt: 2026-11-20
---

# Milk records API: herd daily log and per-cow litres by destination

## Problem

Milk logging is the shipped app's main feature; existing users need parity.

## Why

Feeds the milk screens, the dashboard tile and the profile's Lts tile.

**Depends on:** `animal-api`.

## What it touches

`app/api/smartbell/routes/milk.py`, `app/api/smartbell/services/milk.py`, `app/api/smartbell/schemas/milk.py`, two enums in `app/api/smartbell/enums.py`, migration `0006_milk_cow_log_unique.py` (unique cow log per cow, day and destination), `app/api/tests/test_milk.py`.

The `MilkHerdLog` / `MilkCowLog` models and tables already existed (migration 0002); this card adds the API over them.

**Figma:** n/a (no UI)
**Inventory:** domain-model.md §7.3; v4-reports.md §1.2–1.6, §3; uikit-product.md S1–S2 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Per domain-model.md §7.3 and v4-reports.md §3 (`docs/design-inventory/v4-reports.md`). Aggregation buckets: Monday-start weeks. Warn when antibiotic litres are logged for cows outside withdrawal, or when cows in withdrawal are logged to TANQUE.

### Endpoints (all under `/api`, scoped by `X-Ranch-Id`)

| Method | Path | Permission | Does |
|---|---|---|---|
| POST | `/milk/herd-logs` | EVENTS_RECORD | `{date?, total_liters}`; upsert on (ranch, day). `date` defaults to the ranch's today; future → 422 `date_in_future`. |
| GET | `/milk/herd-logs?start&end` | REPORTS_VIEW | Newest first; defaults to the last 7 days (shipped app S2 "Últimos 7 días"). |
| DELETE | `/milk/herd-logs/{date}` | EVENTS_RECORD | S2's delete; 404 `herd_log_not_found`. Editing is a re-POST. |
| POST | `/milk/cow-logs` | EVENTS_RECORD | `{date?, entries: [{animal_id, destination=TANQUE, liters}]}`; each cow named replaces her whole day (a destination left out is cleared, so a corrected destination isn't counted twice); returns `{logs, warnings}`. |
| GET | `/milk/cow-logs?date` | REPORTS_VIEW | One day's cow logs, so the per-cow screen can drop cows already logged. |
| GET | `/milk/summary?granularity&start&end` | REPORTS_VIEW | Buckets (DAY, WEEK, MONTH, QUARTER, SEMESTER, YEAR) plus `latest` (the KPI tile) and `lactating_cows`. Defaults: DAY over the last 7 days. |
| GET | `/milk/cows/{animal_id}` | REPORTS_VIEW | Per-cow average per logged day and peak day (date, litres, DIM). |

Warnings (saved anyway, not refusals): `WITHDRAWAL_TO_TANK`, `ANTIBIOTICS_OUTSIDE_WITHDRAWAL`.

### Assumptions (recorded while building)

- **Permissions.** No milk code exists in §7.8. Logging uses `EVENTS_RECORD` (field work, held by every preset) and reading uses `REPORTS_VIEW`.
- **Withdrawal.** A cow is in withdrawal on day *d* when `Animal.milk_withdrawal_until` (the projection) is set and *d* ≤ it. The projection keeps only the end date, so a back-dated log from before the treatment is also treated as in withdrawal.
- **Litres per cow** = herd total ÷ active female cows with `lactation_state = LACTANDO` **today**. There is no history of that count, so past buckets divide by today's count too.
- **Buckets** are whole calendar periods covering `start`..`end`, so the first and last may reach outside the range; empty buckets come back with zeros and `null` averages. `avg_daily_liters` averages over logged days only. `by_destination` sums the per-cow logs. Ranges are capped at 366 days for DAY and 3660 for the rest; query dates must fall in 1900–2999.
- **Back-dating** is allowed (the shipped app's S2 edits past days); only future dates are refused.
- **Cow entries.** Each must be an active female of the ranch: another ranch's id → 404, removed → 409, male → 422 `not_a_cow`, the same cow and destination twice in a body → 422 `duplicate_entry`. One bad entry refuses the whole body.
- Milk writes add no history-feed entries: `HistoryKey` has no milk keys and the history feed is deferred (reconciliation 4.2).

## Effort

S.

## Acceptance

- [ ] Posting the same day twice overwrites the herd log.
- [ ] Weekly, monthly and quarterly aggregates match a fixture.
- [ ] Logging a cow in withdrawal to TANQUE returns a warning.
- [ ] Tests for the new code pass in CI.
