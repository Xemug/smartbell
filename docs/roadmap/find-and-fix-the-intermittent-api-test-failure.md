---
id: find-and-fix-the-intermittent-api-test-failure
title: Find and fix the intermittent API test failure
summary: About 1 in 4 full API runs on local Postgres shows one failed test (seen on PR #26 and PR #30 heads), then passes on rerun. Run the suite repeatedly with -rf to name it, fix the cause, and prove 20 clean runs.
verifiedAt: 2026-11-21
---

# Find and fix the intermittent API test failure

## Problem

On 2026-11-20 and 2026-11-21, full API runs on a local Postgres (`TEST_DATABASE_URL=… uv run pytest -q`) sometimes ended with "1 failed" and then passed on the next run. This happened on the PR #26 and PR #30 heads. The failing test wasn't captured. A flaky suite hides real failures and costs every reviewer a rerun.

## Finding (2026-11-21)

- **The flaky test:** `tests/test_auth.py::test_two_sessions_at_once_make_one_account`, failing with `AccountConflict: email_in_use`.
- **Cause: a real race in `services/accounts.open_session`.** Two sign-ins for one Firebase uid: B's uid lookup misses, A commits the whole account, then B's email lookup finds A's row (already tied to that uid) and refuses it as someone else's. The `IntegrityError` path only covered the other interleaving, where B's insert collides. In the app, two tabs (or React strict mode) signing in at once could get a 409 instead of their account.
- **How it showed up:** it only fires when the machine is busy. It passed 40+ idle runs (Docker and native Postgres, 1 to 4 suites at once, monotonic uuid4 both ways) and failed in one of the runs with 14 CPU hogs on native Postgres. "1 in 4" was the Planner's runs right after a worker had just finished building and testing.
- **Fix:** an email match whose `firebase_uid` is this token's uid is the same account: return it as not created. A deterministic test forces the interleaving.

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

- [x] The PR names the flaky test(s) and the cause.
- [ ] 20 full-suite runs in a row on local Postgres pass.
- [ ] Tests for the new code pass in CI.
