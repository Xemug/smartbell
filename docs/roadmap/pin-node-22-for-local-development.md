---
id: pin-node-22-for-local-development
title: Pin Node 22 for local development
summary: The user's Mac is Apple silicon but nvm's Node 22 is an Intel build, so npm and dev.sh fail against the arm64 node_modules. Give the user steps to install an arm64 Node 22, then add an .nvmrc, package.json engines and a dev.sh check that stops with a clear message on the wrong Node or architecture. Also make dev.sh pick a free database port.
---

# Pin Node 22 for local development

## Problem

Every local test has hit setup trouble. On the user's MacBook (Apple silicon), the first `node` on PATH is nvm's v22.14.0, an Intel (x64) build. `/usr/local/bin/node` is arm64 v24, under which three AppShell router tests fail. `node_modules` are arm64, so `npm test` and `scripts/dev.sh` fail with "Cannot find module @rollup/rollup-darwin-x64". The user has had to run `PATH="/usr/local/bin:$PATH" arch -arm64 /bin/bash ./scripts/dev.sh`. Separately, `dev.sh`'s compose database collided with another worktree's on port 5433. The failed run left a container with no published port, which had to be deleted by hand.

## Why

The user tests every PR in their own Terminal and is learning as they go. Setup failures cost them time on every hand-off.

**Depends on:** none.

## What it touches

`.nvmrc`, `app/web/package.json` (`engines`), `scripts/dev.sh`, README setup section.

## Approach

- **User steps (done by the user on 2026-11-03; keep them in the README for a new machine):** numbered steps for a non-technical founder to install an arm64 Node 22 with nvm from an arm64 shell, make it the default, and check it with `node -p process.arch`, which should print `arm64`. Then reinstall `node_modules` in the main checkout. Never write x64 packages into any folder.
- **`.nvmrc`:** `22`. **`engines`:** `>=22 <23`, matching CI.
- **`dev.sh` checks before starting:**
  - Node's major version is 22, or it stops with the exact fix.
  - `node -p process.arch` matches `uname -m`, or it stops with the exact fix.
- **`dev.sh` database port:** when `POSTGRES_PORT` isn't set and 5432 or the chosen port is in use, pick a free port and print it. After a failed compose start, remove the half-made container so a retry works.

## Effort

S.

## Acceptance

- [x] On the user's Mac, `node -p process.arch` prints arm64 and `node -v` prints v22 after the steps (human; the user replaced nvm's Node with arm64 v22.23.4 on 2026-11-03).
- [ ] `scripts/dev.sh` stops with a clear message under the wrong Node major version or architecture (test with a stub node on PATH).
- [ ] Two worktrees can run `dev.sh` at once without a port clash, and a failed start leaves nothing to clean up.
- [ ] Tests for the new code pass in CI.
