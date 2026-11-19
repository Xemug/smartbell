---
id: fix-the-dev-sh-port-lock-race-that-fails-ci-on-linux
title: Fix the dev.sh port-lock race that fails CI on Linux
summary: "Since #16, main's scripts CI job fails 'concurrent picks collided' (two pickers got 47300) on Ubuntu while it passes on macOS. Make the reservation atomic on Linux and macOS, keep the test strict, and get main green."
---

# Fix the dev.sh port-lock race that fails CI on Linux

## Problem

Since PR #16 merged, main's `scripts` CI job fails on every push. The failing test is `scripts/test-dev-checks.sh`, with "concurrent picks collided: 47300 47300 …": two concurrent pickers reserved the same port. It passes on macOS and passed on the PR branch, so it's a race that shows on the Ubuntu runner. Every open PR now shows a red check.

## Why

A red main hides real failures and blocks the green-CI acceptance item on every card.

**Depends on:** none.

## What it touches

`scripts/dev-checks.sh` (port reservation and lock), `scripts/test-dev-checks.sh`, `.github/workflows/ci.yml` only if the job needs a tool.

## Approach

Find why the lock isn't exclusive on Linux. For example, a check-then-create that isn't atomic, `mkdir` versus `flock` behaviour, or a stale-lock reclaim racing a live holder. Make the reservation atomic on both macOS bash 3.2 and Linux bash 5, with no new dependency macOS lacks. Keep the test strict, and don't loosen or skip it. Run it many times in a loop on both systems to show it no longer flakes.

## Effort

S.

## Acceptance

- [ ] `scripts/test-dev-checks.sh` passes 50 runs in a row on Linux (CI or a container) and on macOS `/bin/bash` 3.2.
- [ ] The concurrency test still fails if the lock is removed (shown once in the PR).
- [ ] Main's `scripts` job is green after merge.
- [ ] Tests for the new code pass in CI.
