# smartbell

Reproductive-management app for dairy and beef ranches. The new app lives in `app/` (stack A′,
see `docs/decision-memo-stack.md`):

- `app/api`: FastAPI, SQLAlchemy 2 (async), Alembic, PostgreSQL 16.
- `app/web`: Vite, React 18, TypeScript, Tailwind, TanStack Query, react-i18next (es-MX by
  default), PWA.

`dairy-milk-tracker/` is the earlier attempt, kept read-only as reference. Planning docs and the
roadmap specs are in `docs/`.

## Setup

Needs Docker (for Postgres), [uv](https://docs.astral.sh/uv/) and Node 22.

```bash
docker compose up -d                   # Postgres 16 on :5432
(cd app/api && uv sync)                # api dependencies
(cd app/web && npm ci)                 # web dependencies
./scripts/dev.sh                       # migrate, then api on :8000 and web on :5173
```

Open http://localhost:5173: the placeholder page shows the API health ("ok").

Without Docker, point `DATABASE_URL` at any Postgres and run `SKIP_DOCKER=1 ./scripts/dev.sh`.
`API_PORT` and `WEB_PORT` move the servers off 8000 and 5173.

## Checks

```bash
cd app/api && uv run ruff check . && uv run mypy && uv run pytest
cd app/web && npm run lint && npm run typecheck && npm run test && npm run build
```

API tests use in-memory SQLite unless `TEST_DATABASE_URL` points at Postgres (CI sets it); each
test then gets its own schema. With the api running, `npm run api:gen` (in `app/web`) regenerates
the typed client in `src/api/schema.d.ts` from `/openapi.json`.

Design tokens live in `app/web/src/styles/tokens.json`. After editing it, run `npm run tokens` (in
`app/web`) to regenerate `tokens.css`; a test fails while it is stale. http://localhost:5173/dev/tokens
previews every token.

Icons are SVG files in `app/web/src/ui/icons/` (`line/` follows the text colour, `color/` keeps its
colours); illustrations are in `app/web/public/illustrations/`. After adding one, run `npm run icons`
(in `app/web`) to regenerate `glyphs.ts` and `index.ts`; a test fails while they are stale. App code
imports icons by name from `glyphs.ts` (`<Icon icon={iconBell} />`), so only those ship; `index.ts`
holds the whole set for the gallery, and lint blocks it elsewhere. http://localhost:5173/dev/icons
previews them all.

The base components are in `app/web/src/ui/`; http://localhost:5173/dev/ui shows every variant. Each
form control takes `value`, `onChange`, `onBlur` and `error`, so `FormField` binds any of them to
`react-hook-form`.
