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

## Effort

M.

## Acceptance

- [ ] `docker compose up -d && <run script>` serves web on :5173 and api on :8000; web shows a placeholder page that calls `/api/health` and renders "ok".
- [ ] `pytest`, `ruff`, `mypy`, `npm run lint`, `npm run test`, `npm run build` all pass locally and in CI on a PR.
- [ ] `alembic upgrade head` runs against a fresh Postgres.
- [ ] `npm run api:gen` produces a typed client from the running api.
- [ ] Root README explains setup in under 10 commands.
- [ ] Tests for the new code pass in CI.
