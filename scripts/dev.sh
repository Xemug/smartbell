#!/usr/bin/env bash
# Run the whole stack: Postgres (docker compose, when docker is installed), migrations, the
# FastAPI app and the Vite dev server. Ctrl-C stops everything.
#
#   API_PORT / WEB_PORT   override 8000 / 5173
#   DATABASE_URL          use another Postgres (set SKIP_DOCKER=1 to not start the compose one)
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
api_port="${API_PORT:-8000}"
web_port="${WEB_PORT:-5173}"

if [[ -z "${SKIP_DOCKER:-}" ]] && command -v docker >/dev/null 2>&1; then
  docker compose -f "$root/docker-compose.yml" up -d --wait db
fi

cd "$root/app/api"
uv run alembic upgrade head
uv run uvicorn --factory smartbell.main:create_app --reload --port "$api_port" &
api_pid=$!
trap 'kill "$api_pid" 2>/dev/null || true' EXIT INT TERM

cd "$root/app/web"
API_URL="http://localhost:$api_port" WEB_PORT="$web_port" npm run dev
