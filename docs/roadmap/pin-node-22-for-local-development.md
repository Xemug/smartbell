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

## Decisions (groomed 2026-11-03)

- The checks live in `scripts/dev-checks.sh`, which `dev.sh` sources, so `scripts/test-dev-checks.sh`
  can test them with a stub `node` on PATH. A `scripts` job in CI runs that test.
- The architecture check compares Node's arch with the machine's real CPU, not plain `uname -m`:
  on an Apple silicon Mac it reads `sysctl hw.optional.arm64`, because `uname -m` says `x86_64`
  inside a Rosetta shell, where an Intel Node would "match" and still fail on arm64 `node_modules`.
- A fresh shell can still find `/usr/local/bin/node` (v24) first (planner note). The version check
  catches it, and the fix it prints (and the README) is `nvm install` from `.nvmrc`, then
  `nvm alias default 22`.
- Port: with `POSTGRES_PORT` unset, `dev.sh` keeps the port of this checkout's Postgres if it is
  already running, else uses 5432 or the first free port above it, and points `DATABASE_URL` at it.
  An explicit `POSTGRES_PORT` is used as given, but if something else already holds it, `dev.sh`
  stops before compose recreates this checkout's working container. A native Postgres on 127.0.0.1:5432 counts as taken
  (it did on the user's Mac). After a failed `compose up`, `compose rm --stop --force db` removes the
  container compose made in that run and keeps the data volume. A container that was already running
  on the same port (compose keeps it) is left as it was, with a pointer to `docker compose logs db`.
- "Two worktrees at once" needs every port free, not just the database's: the api (8000), web (5173)
  and auth emulator (9099) also move to the next free port when theirs is taken. `firebase.json`
  fixes the emulator's port, so `dev.sh` starts it from a temporary copy and points the api
  (`FIREBASE_AUTH_EMULATOR_HOST`) and web (`VITE_FIREBASE_AUTH_EMULATOR_URL`) at it.
- Ports count as taken on 127.0.0.1 or ::1: Vite on macOS listens on ::1 only.
- Ports are chosen when `dev.sh` starts, so two runs started within the same few seconds can still
  pick the same port; the one that loses fails clearly, and running it again works.

## Effort

S.

## Acceptance

- [x] On the user's Mac, `node -p process.arch` prints arm64 and `node -v` prints v22 after the steps (human; the user replaced nvm's Node with arm64 v22.23.4 on 2026-11-03).
- [x] `scripts/dev.sh` stops with a clear message under the wrong Node major version or architecture (test with a stub node on PATH).
- [x] Two worktrees can run `dev.sh` at once without a port clash, and a failed start leaves nothing to clean up.
- [x] Tests for the new code pass in CI.
