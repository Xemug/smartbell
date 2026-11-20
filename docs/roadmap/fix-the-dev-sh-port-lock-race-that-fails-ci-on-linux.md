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

## Root cause (found 2026-11-19)

The `ubuntu-latest` runner is Ubuntu 26.04. Its `/usr/bin/mkdir` is uutils coreutils 0.10.0 (Rust), and two racing `mkdir`s can both succeed there. The `mkdir` lock in `with_port_lock` therefore let two pickers in at once. A traced loop on the runner collided in 22 of 60 runs, with two "GOT lock" lines and no stale break between them. macOS's `mkdir` is atomic, which is why it passed there.

The fix takes the lock with bash's `noclobber` (O_CREAT|O_EXCL, built in from bash 3.2 up), as a file at `.pick-lock`. The new name means a `.lock` directory left by an older dev.sh can't block it.

Still open: breaking a stale lock (after a dev.sh crash, or after 10 s) is check-then-remove, so two waiters could both break it. This is rare and was already there before this fix.

## Effort

S.

## Acceptance

- [x] `scripts/test-dev-checks.sh` passes 50 runs in a row on Linux (CI or a container) and on macOS `/bin/bash` 3.2.
- [x] The concurrency test still fails if the lock is removed (shown once in the PR).
- [ ] Main's `scripts` job is green after merge.
- [x] Tests for the new code pass in CI.
