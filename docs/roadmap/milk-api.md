---
id: milk-api
title: Milk records API: herd daily log and per-cow litres by destination
summary: MilkHerdLog (one per day, overwrite) and MilkCowLog (litres by destination: tanque, becerras, antibióticos) endpoints with aggregates by week/month/quarter/semester/year and litres per cow per day.
---

# Milk records API: herd daily log and per-cow litres by destination

## Problem

Milk logging is the shipped app's main feature; existing users need parity.

## Why

Feeds the milk screens, the dashboard tile and the profile's Lts tile.

**Depends on:** `animal-api`.

## What it touches

`app/api/app/api/milk.py`, `app/api/app/services/milk.py`, tests.

**Figma:** n/a (no UI)
**Inventory:** domain-model.md §7.3; v4-reports.md §1.2–1.6, §3; uikit-product.md S1–S2 (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Per domain-model.md §7.3 and v4-reports.md §3. Aggregation buckets: Monday-start weeks. Warn when antibiotic litres are logged for cows outside withdrawal, or when cows in withdrawal are logged to TANQUE.

## Effort

S.

## Acceptance

- [ ] Posting the same day twice overwrites the herd log.
- [ ] Weekly, monthly and quarterly aggregates match a fixture.
- [ ] Logging a cow in withdrawal to TANQUE returns a warning.
- [ ] Tests for the new code pass in CI.
