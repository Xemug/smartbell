---
id: app-scaffold
title: Scaffold the new Smartbell app (web + api)
summary: New app/ monorepo: Vite React TS PWA shell and FastAPI + Postgres + Alembic API, with CI, lint, tests and one run script.
---

# Scaffold the new Smartbell app (web + api)

## Problem

There is no codebase that matches the designs; dairy-milk-tracker is CRA + SQLite with no migrations (see the decision memo).

## Why

Every other card builds on this skeleton. The user approved stack A′ in `docs/decision-memo-stack.md`.

**Depends on:** none.

## What it touches

New `app/web/`, `app/api/`, `docker-compose.yml` (Postgres 16), `hyperspace.json` (setup/run scripts), `.github/workflows/ci.yml`, root `README.md`.

**Figma:** n/a (no UI)
**Inventory:** n/a (files in `docs/design-inventory/`, except `domain-model.md` in `docs/`). Domain rules: `docs/domain-model.md` (§7 overrides earlier sections). Reconciliation: `docs/reconciliation-v4.md`. Screen index: `docs/screen-inventory.md`.

## Approach

Stack A′ (approved): `app/web` Vite + React + TS + Tailwind (Moon's Tailwind preset lands in `design-tokens`), PWA now and Capacitor later (`mobile-store-release`); `app/api` FastAPI + SQLAlchemy 2 + Alembic + Postgres; Firebase Auth for identity (`firebase-admin` in the api, wired in `auth`).
- `app/api`: FastAPI app factory, settings from env (`DATABASE_URL`, `SECRET_KEY` required outside dev), SQLAlchemy 2 async engine, Alembic initialised with an empty baseline, `/api/health`, pytest with a per-test Postgres schema (or SQLite fallback flagged in tests only), ruff + mypy.
- `app/web`: Vite + React 18 + TS strict, React Router, TanStack Query, Tailwind, `react-i18next` with an `es-MX` catalog (default) and `en` stub, vitest + Testing Library, Playwright config, ESLint + Prettier. PWA manifest (name Smartbell, icons placeholder).
- OpenAPI → TS client generation script (`npm run api:gen`) wired to the api's `/openapi.json`.
- `hyperspace.json` setup/run updated to start Postgres, api and web together. Keep `dairy-milk-tracker/` untouched.
- Out of scope: any domain model, auth, UI components, Capacitor.

### Decisions and assumptions made while building (2026-10-29)

- **Package layout:** the api is the `smartbell` package (`app/api/smartbell/`), so the repro module the decision memo places at `app/api/domain/repro.py` belongs at `app/api/smartbell/domain/repro.py`.
- **App factory only:** there is no module-level `app`. Run it with `uvicorn --factory smartbell.main:create_app`, so importing the package never reads env.
- **Settings:** `ENV` is `dev` (default), `test` or `prod`. Outside `dev`, a missing `DATABASE_URL` or `SECRET_KEY` fails at startup. Dev defaults match `docker-compose.yml`.
- **Test database:** pytest uses Postgres with one schema per test when `TEST_DATABASE_URL` is set (CI sets it), and in-memory SQLite otherwise. The `db_backend` fixture says which one a test got.
- **Tooling:** Python 3.12 managed with `uv` (`uv.lock` committed). Tailwind 3.4, because Moon's preset targets v3. Vitest 3, because Vitest 2 bundles Vite 5 types and clashes with Vite 6.
- **Typed client:** `openapi-typescript` generates the types and `openapi-fetch` calls the API. The generated `src/api/schema.d.ts` is committed so the build needs no running api.
- **Run script:** `scripts/dev.sh` starts the compose Postgres only when `docker` exists. `SKIP_DOCKER=1` with `DATABASE_URL` uses another Postgres; `API_PORT` and `WEB_PORT` move the servers. `hyperspace.json` calls it.
- **Playwright** is configured with one smoke spec (`e2e/health.spec.ts`) against a running stack. It is not in CI yet; `golden-path-e2e` adds that.
- **Root `.gitignore`** added: it ignores `.env*` (except `.env.example`), venvs, caches and `node_modules/`. Already-tracked files under `dairy-milk-tracker/` are unaffected.
- **Main checkout:** its untracked `hyperspace.json` (which still runs the old dairy-milk-tracker setup) blocks pulling this tracked one. Remove it before pulling. That old setup script is what ran `npm install` in `dairy-milk-tracker/frontend` when this worktree was created.

## Effort

M.

## Acceptance

- [x] `docker compose up -d && ./scripts/dev.sh` serves web on :5173 and api on :8000; web shows a placeholder page that calls `/api/health` and renders "ok".
- [x] `pytest`, `ruff`, `mypy`, `npm run lint`, `npm run test`, `npm run build` all pass locally and in CI on a PR.
- [x] `alembic upgrade head` runs against a fresh Postgres.
- [x] `npm run api:gen` produces a typed client from the running api.
- [x] Root README explains setup in under 10 commands.
- [x] Tests for the new code pass in CI.
