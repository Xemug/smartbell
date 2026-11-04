#!/usr/bin/env bash
# Tests for scripts/dev-checks.sh and the Node check at the top of scripts/dev.sh. A stub `node`
# on PATH stands in for the wrong version or CPU. Run: bash scripts/test-dev-checks.sh
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=dev-checks.sh
source "$root/scripts/dev-checks.sh"

tmp="$(mktemp -d)"
listener=""
cleanup() {
  if [[ -n "$listener" ]]; then
    kill "$listener" 2>/dev/null || true
    wait "$listener" 2>/dev/null || true
  fi
  rm -rf "$tmp"
}
trap cleanup EXIT
failures=0

pass() { echo "ok   $1"; }
fail() {
  echo "FAIL $1" >&2
  failures=$((failures + 1))
}

# A node that prints "$1" for any arguments (dev-checks.sh asks it one question).
stub_node() {
  mkdir -p "$tmp/bin"
  printf '#!/bin/sh\necho "%s"\n' "$1" >"$tmp/bin/node"
  chmod +x "$tmp/bin/node"
}

arch="$(machine_arch)"
if [[ "$arch" == arm64 ]]; then other=x64; else other=arm64; fi

# check_node <stub output> <expected status> <text the message must contain> <name>
expect_check() {
  local out status=0
  stub_node "$1"
  out="$(PATH="$tmp/bin:$PATH" check_node 2>&1)" || status=$?
  if [[ "$status" != "$2" ]]; then
    fail "$4: exit $status, want $2. Output: $out"
  elif [[ -n "$3" && "$out" != *"$3"* ]]; then
    fail "$4: message lacks '$3'. Output: $out"
  else
    pass "$4"
  fi
}

expect_check "v22.23.4 $arch" 0 "" "Node 22 for this CPU passes"
expect_check "v24.1.0 $arch" 1 "needs Node 22, but $tmp/bin/node is v24.1.0" "Node 24 stops"
expect_check "v20.18.0 $arch" 1 "nvm alias default 22" "Node 20 stops with the fix"
expect_check "v22.14.0 $other" 1 "is built for $other, but this machine is $arch" "wrong CPU stops"

# dev.sh itself stops before starting anything (no Docker, no servers) under the wrong Node.
stub_node "v24.1.0 $arch"
status=0
out="$(PATH="$tmp/bin:$PATH" bash "$root/scripts/dev.sh" 2>&1)" || status=$?
if [[ "$status" == 1 && "$out" == "dev.sh: needs Node 22"* ]]; then
  pass "dev.sh stops first under the wrong Node"
else
  fail "dev.sh under Node 24: exit $status. Output: $out"
fi

# first_free_port skips a port something listens on.
port=$(first_free_port 47000)
python3 -c 'import socket, sys, time
s = socket.socket(); s.bind(("127.0.0.1", int(sys.argv[1]))); s.listen(); time.sleep(60)' "$port" &
listener=$!
for _ in $(seq 50); do port_in_use "$port" && break || sleep 0.1; done
if ! port_in_use "$port"; then
  fail "port_in_use doesn't see the listener on $port"
else
  next=$(first_free_port "$port")
  if [[ "$next" -gt "$port" ]] && ! port_in_use "$next"; then
    pass "first_free_port skips a taken port ($port -> $next)"
  else
    fail "first_free_port $port returned $next"
  fi
fi

if [[ "$failures" -gt 0 ]]; then
  echo "$failures failed" >&2
  exit 1
fi
echo "all passed"
