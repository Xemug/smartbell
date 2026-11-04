#!/usr/bin/env bash
# Run the whole stack: Postgres (docker compose; stops if Docker is missing), the Firebase Auth
# emulator, migrations, the FastAPI app and the Vite dev server. Ctrl-C stops everything.
#
# Auth runs on the emulator with the demo-smartbell project, which can't reach any real Firebase
# project. SKIP_AUTH_EMULATOR=1 leaves it to you (e.g. one already running on 9099).
#
# Ports left unset default to 8000 (api), 5173 (web), 9099 (auth emulator) and 5432 (Postgres),
# or the next free port when that one is taken (another checkout, say), so checkouts can run at once.
#
#   API_PORT / WEB_PORT   put the api / web on this port
#   POSTGRES_PORT         put the compose Postgres on this port (DATABASE_URL follows it)
#   DATABASE_URL          use another Postgres (set SKIP_DOCKER=1 to not start the compose one)
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=dev-checks.sh
source "$root/scripts/dev-checks.sh"

# Node 22 for this machine's CPU, before anything starts (see .nvmrc).
check_node || exit 1

api_port="${API_PORT:-$(pick_port 8000 "the api")}"
web_port="${WEB_PORT:-$(pick_port 5173 "the web app")}"

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
  compose=(docker compose -f "$root/docker-compose.yml")
  # The port of this checkout's Postgres if it's already running (from an earlier dev.sh).
  running="$("${compose[@]}" port db 5432 2>/dev/null | head -n 1 || true)"
  running="${running##*:}"
  if [[ -n "${POSTGRES_PORT:-}" ]]; then
    # Stop before compose recreates a working container on a port it can't have.
    if [[ "$POSTGRES_PORT" != "$running" ]] && port_in_use "$POSTGRES_PORT"; then
      echo "dev.sh: POSTGRES_PORT=$POSTGRES_PORT is in use. Pick another, or unset it and dev.sh picks a free one." >&2
      exit 1
    fi
  else
    if [[ "$running" =~ ^[1-9][0-9]*$ ]]; then
      POSTGRES_PORT="$running"
    else
      POSTGRES_PORT="$(first_free_port 5432)"
      if [[ "$POSTGRES_PORT" != 5432 ]]; then
        echo "dev.sh: port 5432 is in use (another checkout's Postgres?), so this one runs on $POSTGRES_PORT."
      fi
    fi
    export POSTGRES_PORT
  fi
  if ! "${compose[@]}" up -d --wait db; then
    if [[ "$POSTGRES_PORT" == "$running" ]]; then
      # compose kept the container that was already running on this port: leave it alone.
      echo "dev.sh: this checkout's Postgres on port $POSTGRES_PORT isn't healthy (see above). It's left as it was; check it with 'docker compose logs db'." >&2
    else
      # Compose made this container in this run: remove the half-made one so the next run starts
      # clean (the data volume stays).
      "${compose[@]}" rm --stop --force db >/dev/null 2>&1 || true
      echo "dev.sh: Postgres didn't start on port $POSTGRES_PORT (see above). Its container is removed; run dev.sh again." >&2
    fi
    exit 1
  fi
fi

if [[ -n "${POSTGRES_PORT:-}" && -z "${DATABASE_URL:-}" ]]; then
  export DATABASE_URL="postgresql+asyncpg://smartbell:smartbell@localhost:$POSTGRES_PORT/smartbell"
fi

pids=()
tmp_config_dir=""
cleanup() {
  # The odd expansion keeps macOS's bash 3.2 from calling an empty array unbound under set -u.
  kill ${pids[@]+"${pids[@]}"} 2>/dev/null || true
  if [[ -n "$tmp_config_dir" ]]; then rm -rf "$tmp_config_dir"; fi
}
trap cleanup EXIT INT TERM

if [[ -z "${SKIP_AUTH_EMULATOR:-}" ]]; then
  auth_port="$(pick_port 9099 "the auth emulator")"
  firebase_config="$root/app/firebase.json"
  if [[ "$auth_port" != 9099 ]]; then
    # firebase.json fixes the emulator's port, so start it from a copy with the free one.
    tmp_config_dir="$(mktemp -d)"
    firebase_config="$tmp_config_dir/firebase.json"
    node -e 'const c = require(process.argv[1]); c.emulators.auth.port = Number(process.argv[2]);
      console.log(JSON.stringify(c, null, 2));' "$root/app/firebase.json" "$auth_port" >"$firebase_config"
  fi
  # Same firebase-tools version as legacy/firebase.
  # exec, so the PID is firebase-tools itself, which shuts its emulator down on SIGTERM.
  (cd "$root/app" && exec npx --yes firebase-tools@13.35.1 emulators:start --only auth \
    --project demo-smartbell --config "$firebase_config") &
  pids+=($!)
  if [[ "$auth_port" != 9099 ]]; then
    # The api and the web app look for the emulator here instead of 127.0.0.1:9099.
    export FIREBASE_AUTH_EMULATOR_HOST="127.0.0.1:$auth_port"
    export VITE_FIREBASE_AUTH_EMULATOR_URL="http://127.0.0.1:$auth_port"
  fi
fi

cd "$root/app/api"
uv run alembic upgrade head
uv run uvicorn --factory smartbell.main:create_app --reload --port "$api_port" &
pids+=($!)

cd "$root/app/web"
API_URL="http://localhost:$api_port" WEB_PORT="$web_port" npm run dev
