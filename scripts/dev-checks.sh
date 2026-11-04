# Helpers for scripts/dev.sh, sourced (not run). scripts/test-dev-checks.sh tests them.
# Keep to bash 3.2 (macOS's /bin/bash).

# The CPU the machine really has, in Node's spelling (arm64 or x64). uname -m alone would say
# x86_64 inside a Rosetta shell on Apple silicon, where an Intel Node "matches" but the arm64
# node_modules don't load.
machine_arch() {
  if [[ "$(uname -s)" == Darwin && "$(sysctl -n hw.optional.arm64 2>/dev/null)" == 1 ]]; then
    echo arm64
    return
  fi
  case "$(uname -m)" in
    x86_64 | amd64) echo x64 ;;
    aarch64 | arm64) echo arm64 ;;
    *) uname -m ;;
  esac
}

# Stops (returns 1) with the exact fix unless the first node on PATH is Node 22 built for this
# machine's CPU.
check_node() {
  local fix="Fix: open a new Terminal window (not one started with 'arch -x86_64' or Rosetta), go to
this folder and run:
  nvm install          # installs the Node version in .nvmrc (22)
  nvm alias default 22 # makes it the default in every new Terminal, ahead of /usr/local/bin
  node -v              # should print v22.something
  node -p process.arch # should print $(machine_arch)
then run ./scripts/dev.sh again. Don't install packages until both lines are right."
  if ! command -v node >/dev/null 2>&1; then
    printf 'dev.sh: node isn'\''t installed (or isn'\''t on PATH).\n%s\n' "$fix" >&2
    return 1
  fi
  local where info version arch major want
  where="$(command -v node)"
  # One call, so a stub node in the tests only has to print one line.
  if ! info="$(node -p 'process.version + " " + process.arch' 2>/dev/null)" || [[ -z "$info" ]]; then
    printf 'dev.sh: %s won'\''t run (often a Node built for another CPU).\n%s\n' "$where" "$fix" >&2
    return 1
  fi
  read -r version arch <<<"$info"
  major="${version#v}"
  major="${major%%.*}"
  if [[ "$major" != 22 ]]; then
    printf 'dev.sh: needs Node 22, but %s is %s.\n%s\n' "$where" "$version" "$fix" >&2
    return 1
  fi
  want="$(machine_arch)"
  if [[ "$arch" != "$want" ]]; then
    printf 'dev.sh: %s is built for %s, but this machine is %s, so the installed packages won'\''t load.\n%s\n' \
      "$where" "$arch" "$want" "$fix" >&2
    return 1
  fi
}

# True when something on this machine listens on TCP port $1, on IPv4 or IPv6 loopback (Vite on
# macOS listens on ::1 only).
port_in_use() {
  (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null || (exec 3<>"/dev/tcp/::1/$1") 2>/dev/null
}

# The first port from $1 upwards that nothing listens on.
first_free_port() {
  local port="$1"
  while port_in_use "$port"; do
    port=$((port + 1))
  done
  echo "$port"
}

# The first free port from $1 upwards; says so on stderr when it isn't $1 ($2 names the server).
pick_port() {
  local port
  port="$(first_free_port "$1")"
  if [[ "$port" != "$1" ]]; then
    echo "dev.sh: port $1 is in use (another checkout?), so $2 runs on $port." >&2
  fi
  echo "$port"
}
