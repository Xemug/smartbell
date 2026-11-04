# smartbell

Reproductive-management app for dairy and beef ranches. The new app lives in `app/` (stack A′,
see `docs/decision-memo-stack.md`):

- `app/api`: FastAPI, SQLAlchemy 2 (async), Alembic, PostgreSQL 16.
- `app/web`: Vite, React 18, TypeScript, Tailwind, TanStack Query, react-i18next (es-MX by
  default), PWA.

`dairy-milk-tracker/` is the earlier attempt, kept read-only as reference. Planning docs and the
roadmap specs are in `docs/`.

## Setup

Needs Docker (for Postgres), [uv](https://docs.astral.sh/uv/) and Node 22 (`.nvmrc`).

### Node 22 on a Mac

On an Apple silicon Mac, Node must be the arm64 build: an Intel (x64) build can't load the
installed packages. Do this once per machine, in Terminal:

1. Open a new Terminal window. Run `uname -m`; it should print `arm64`. If it prints `x86_64`,
   Terminal is running under Rosetta: quit it, untick "Open using Rosetta" in its Get Info window,
   and open it again.
2. Install [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) if `nvm --version` prints
   nothing, then open a new Terminal window.
3. Go to this folder and run `nvm install`. It reads `.nvmrc` and installs Node 22.
4. Run `nvm alias default 22`, so every new Terminal uses it ahead of any other Node (for example
   one in `/usr/local/bin`).
5. Open a new Terminal window, go to this folder and check: `node -v` prints `v22.` and something,
   and `node -p process.arch` prints `arm64`. Don't install packages until both are right; then
   run the setup below. If `node_modules` was installed with another Node, delete
   `app/web/node_modules` first.

Never install packages with an x64 Node or from a Rosetta shell. `dev.sh` stops with these steps
if the Node on your PATH is the wrong version or architecture.

### Install and run

```bash
(cd app/api && uv sync)                # api dependencies
(cd app/web && npm ci)                 # web dependencies
./scripts/dev.sh                       # Postgres, migrate, then api on :8000 and web on :5173
```

`dev.sh` uses ports 8000 (api), 5173 (web), 9099 (auth emulator) and 5432 (Postgres, via docker
compose), or the next free port for any that is taken (another checkout running, say), and prints
each port it moved. So two checkouts can run at once. If Postgres fails to start, it removes the
half-made container so running it again works.

Open http://localhost:5173: the placeholder page shows the API health ("ok").

Without Docker, point `DATABASE_URL` at any Postgres and run `SKIP_DOCKER=1 ./scripts/dev.sh`.
`API_PORT`, `WEB_PORT` and `POSTGRES_PORT` fix those ports instead.
`bash scripts/test-dev-checks.sh` tests the Node and port checks.

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

The base components are in `app/web/src/ui/`; http://localhost:5173/dev/ui shows every variant.
`FormField` binds the form controls to `react-hook-form`.
`SnackbarProvider` is mounted in `App.tsx`, so any screen can call `useSnackbar()`.
