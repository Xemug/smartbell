---
id: find-and-fix-the-intermittent-api-test-failure
title: Find and fix the intermittent API test failure
summary: About 1 in 4 full API runs on local Postgres shows one failed test (seen on PR #26 and PR #30 heads), then passes on rerun. Run the suite repeatedly with -rf to name it, fix the cause, and prove 20 clean runs.
---

# Find and fix the intermittent API test failure

## Problem

On 2026-11-20 and 2026-11-21, full API runs on a local Postgres (`TEST_DATABASE_URL=… uv run pytest -q`) sometimes ended with "1 failed" and then passed on the next run. This happened on the PR #26 and PR #30 heads. The failing test wasn't captured. A flaky suite hides real failures and costs every reviewer a rerun.

## Why

Every worker and the Planner rely on the full suite to verify PRs.

**Depends on:** none.

## What it touches

`app/api/tests/` (whichever test is flaky), and the code under it if the cause is a real bug such as ordering, time or concurrency.

## Approach

- **Find the test:** run the full suite on local Postgres in a loop with `-rf -p no:randomly` (if used) until it fails, and record the test name and error. Also try `pytest-xdist` off/on and random order if the project uses it.
- **Fix the root cause:** if it's a real code bug (ordering, timezone or midnight boundaries, or a race), fix the code. If only the test is wrong, fix the test. Never just retry or loosen the assertion.
- **Report:** if more than one flaky test turns up, fix each one or list them in the PR.

## Effort

S.

## Acceptance

- [ ] The PR names the flaky test(s) and the cause.
- [ ] 20 full-suite runs in a row on local Postgres pass.
- [ ] Tests for the new code pass in CI.
