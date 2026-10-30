---
id: golden-path-e2e
title: End-to-end golden path test
summary: A Playwright suite: sign-up → first cow → tasks home → heat via automatic task → pregnancy → calving → milk log → General dashboard, at mobile and web widths.
---

# End-to-end golden path test

## Problem

Individual cards test their slice; nothing proves the whole cycle works together.

## Why

Release gate for v1.

**Depends on:** `tasks-home`, `dashboard`, `milk-screens`, `calving-flow`, `health-flows`, `abortion-flow`, `mobile-store-release`.

## What it touches

`app/web/e2e/golden-path.spec.ts`, CI job with docker-compose services and frozen clock.

**Figma:** n/a (no UI)
**Inventory:** n/a (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Use the API clock override (test-only header or env) to jump time across windows. Run at 360 and 1280 widths.

## Effort

M.

## Acceptance

- [ ] The suite passes in CI at both widths.
- [ ] A broken projection rule makes it fail (verified by temporarily changing gestation_days).
- [ ] Tests for the new code pass in CI.
