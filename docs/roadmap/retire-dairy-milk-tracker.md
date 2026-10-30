---
id: retire-dairy-milk-tracker
title: Retire dairy-milk-tracker
summary: Delete the old dairy-milk-tracker app once auth is ported and the new app runs, and point hyperspace.json at the new app.
---

# Retire dairy-milk-tracker

## Problem

Two apps in one repo confuse agents and scripts.

## Why

Keeps the repo honest after the stack decision.

**Depends on:** `auth`.

## What it touches

`dairy-milk-tracker/` (removed), `hyperspace.json`, root `README.md`.

**Figma:** n/a (no UI)
**Inventory:** n/a (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Delete `dairy-milk-tracker/` once the new app runs; nothing from it is ported (auth uses Firebase Auth). Point hyperspace.json at the new app.

## Effort

S.

## Acceptance

- [ ] `dairy-milk-tracker/` is gone, the run script starts the new app, CI green.
- [ ] Tests for the new code pass in CI.
