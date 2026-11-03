#!/usr/bin/env bash
# Run the whole stack: Postgres (docker compose; stops if Docker is missing), the Firebase Auth
# emulator, migrations, the FastAPI app and the Vite dev server. Ctrl-C stops everything.
#
# Auth runs on the emulator with the demo-smartbell project, which can't reach any real Firebase
# project. SKIP_AUTH_EMULATOR=1 leaves it to you (e.g. one already running on 9099).
#
#   API_PORT / WEB_PORT   override 8000 / 5173
#   POSTGRES_PORT         move the compose Postgres off 5432 (DATABASE_URL follows it)
#   DATABASE_URL          use another Postgres (set SKIP_DOCKER=1 to not start the compose one)
set -euo pipefail

if [[ -n "${POSTGRES_PORT:-}" && -z "${DATABASE_URL:-}" ]]; then
  export DATABASE_URL="postgresql+asyncpg://smartbell:smartbell@localhost:$POSTGRES_PORT/smartbell"
fi

root="$(cd "$(dirname "$0")/.." && pwd)"
api_port="${API_PORT:-8000}"
web_port="${WEB_PORT:-5173}"

if [[ -z "${SKIP_DOCKER:-}" ]]; then
  # Docker Desktop puts its CLI here and adds it to PATH only in new terminal windows.
  [[ -x "$HOME/.docker/bin/docker" ]] && export PATH="$PATH:$HOME/.docker/bin"
  if ! command -v docker >/dev/null 2>&1; then
    echo "dev.sh: docker isn't installed. Install Docker Desktop, or set SKIP_DOCKER=1 and DATABASE_URL." >&2
    exit 1
  fi
  if ! docker info >/dev/null 2>&1; then
    echo "dev.sh: Docker Desktop isn't running. Open it, wait for the whale icon to settle, retry." >&2
    exit 1
  fi
  docker compose -f "$root/docker-compose.yml" up -d --wait db
fi

pids=()
# The odd expansion keeps macOS's bash 3.2 from calling an empty array unbound under set -u.
trap 'kill ${pids[@]+"${pids[@]}"} 2>/dev/null || true' EXIT INT TERM

if [[ -z "${SKIP_AUTH_EMULATOR:-}" ]]; then
  # Same firebase-tools version as legacy/firebase.
  # exec, so the PID is firebase-tools itself, which shuts its emulator down on SIGTERM.
  (cd "$root/app" && exec npx --yes firebase-tools@13.35.1 emulators:start --only auth \
    --project demo-smartbell --config firebase.json) &
  pids+=($!)
fi

cd "$root/app/api"
uv run alembic upgrade head
uv run uvicorn --factory smartbell.main:create_app --reload --port "$api_port" &
pids+=($!)

cd "$root/app/web"
API_URL="http://localhost:$api_port" WEB_PORT="$web_port" npm run dev
