---
id: offline-event-queue
title: Offline event capture (spike)
summary: Investigate queuing event writes offline in the PWA and syncing when back online, given barns with poor signal.
---

# Offline event capture (spike)

## Problem

Event entry happens in the barn where connectivity is unreliable.

## Why

Decides whether v1.1 needs offline writes.

**Depends on:** `event-launcher`.

## What it touches

Spike notes in `docs/spikes/offline.md`.

**Figma:** n/a (no UI)
**Inventory:** n/a (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Evaluate TanStack Query persisted mutations + Workbox background sync vs. a local-first store; conflict rules for re-projection.

## Effort

M.

## Acceptance

- [ ] A written recommendation with a prototype branch.
- [ ] Tests for the new code pass in CI.
