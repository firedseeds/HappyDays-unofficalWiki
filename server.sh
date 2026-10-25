#!/usr/bin/env bash
set -u

ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT" || exit 1

HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-8000}"
PYTHON_BIN="${PYTHON:-python3}"
RUN_DIR="$ROOT/.run"
LOG_DIR="$ROOT/logs"
PID_FILE="$RUN_DIR/server.pid"
LOG_FILE="$LOG_DIR/server.log"

mkdir -p "$RUN_DIR" "$LOG_DIR"

fail() {
  printf 'fail: %s\n' "$*" >&2
  exit 1
}

is_running() {
  [ -f "$PID_FILE" ] || return 1
  local pid
  pid="$(cat "$PID_FILE" 2>/dev/null || true)"
  [ -n "$pid" ] || return 1
  kill -0 "$pid" 2>/dev/null
}

health_check() {
  if command -v curl >/dev/null 2>&1; then
    curl -fsS --max-time 2 "http://127.0.0.1:${PORT}/api/health" >/dev/null 2>&1
    return $?
  fi
  if command -v wget >/dev/null 2>&1; then
    wget -q -T 2 -O /dev/null "http://127.0.0.1:${PORT}/api/health" >/dev/null 2>&1
    return $?
  fi
  "$PYTHON_BIN" -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:${PORT}/api/health', timeout=2)" >/dev/null 2>&1
}

run_server() {
  if is_running; then
    fail "server is already running (PID $(cat "$PID_FILE"))"
  fi
  if [ -f "$PID_FILE" ]; then
    rm -f "$PID_FILE"
  fi

  if ! command -v "$PYTHON_BIN" >/dev/null 2>&1; then
    fail "python executable not found: $PYTHON_BIN"
  fi

  printf '\n[%s] server.sh -run host=%s port=%s\n' \
    "$(date '+%Y-%m-%d %H:%M:%S')" "$HOST" "$PORT" >>"$LOG_FILE"
  if [ "$HOST" = "0.0.0.0" ]; then
    printf 'warning: server is listening on all interfaces and the editor has no authentication.\n' >>"$LOG_FILE"
  fi

  nohup "$PYTHON_BIN" server.py --host "$HOST" --port "$PORT" >>"$LOG_FILE" 2>&1 &
  local pid=$!
  printf '%s\n' "$pid" >"$PID_FILE"

  local attempt
  for attempt in $(seq 1 60); do
    if ! kill -0 "$pid" 2>/dev/null; then
      rm -f "$PID_FILE"
      printf 'fail: server exited during startup\n' >&2
      tail -n 40 "$LOG_FILE" >&2
      exit 1
    fi
    if health_check; then
      printf 'Successful\n'
      return 0
    fi
    sleep 0.5
  done

  kill "$pid" 2>/dev/null || true
  rm -f "$PID_FILE"
  printf 'fail: server did not become ready at http://127.0.0.1:%s/\n' "$PORT" >&2
  tail -n 40 "$LOG_FILE" >&2
  exit 1
}

stop_server() {
  if [ ! -f "$PID_FILE" ]; then
    fail "server is not running (no PID file)"
  fi

  local pid
  pid="$(cat "$PID_FILE" 2>/dev/null || true)"
  if [ -z "$pid" ] || ! kill -0 "$pid" 2>/dev/null; then
    rm -f "$PID_FILE"
    fail "server is not running (stale PID file removed)"
  fi

  if [ -r "/proc/$pid/cmdline" ]; then
    local cmdline
    cmdline="$(tr '\0' ' ' <"/proc/$pid/cmdline" 2>/dev/null || true)"
    case "$cmdline" in
      *server.py*) ;;
      *) fail "PID $pid does not appear to be server.py" ;;
    esac
  fi

  kill "$pid" 2>/dev/null || fail "failed to stop PID $pid"
  local attempt
  for attempt in $(seq 1 20); do
    if ! kill -0 "$pid" 2>/dev/null; then
      rm -f "$PID_FILE"
      printf 'Successful\n'
      return 0
    fi
    sleep 0.5
  done

  kill -9 "$pid" 2>/dev/null || true
  sleep 0.5
  rm -f "$PID_FILE"
  if kill -0 "$pid" 2>/dev/null; then
    fail "server process $pid is still running"
  fi
  printf 'Successful\n'
}

restart_server() {
  if is_running; then
    stop_server >/dev/null
  else
    rm -f "$PID_FILE"
  fi
  run_server
}

show_logs() {
  if [ ! -f "$LOG_FILE" ]; then
    fail "log file not found: $LOG_FILE"
  fi
  if [ "${2:-}" = "-f" ]; then
    tail -n "${LOG_LINES:-200}" -f "$LOG_FILE"
  else
    tail -n "${LOG_LINES:-200}" "$LOG_FILE"
  fi
}

case "${1:-}" in
  -run)
    run_server
    ;;
  -stop)
    stop_server
    ;;
  -restart)
    restart_server
    ;;
  -logs)
    show_logs "$@"
    ;;
  *)
    fail "usage: $0 -run | -stop | -restart | -logs [-f]"
    ;;
esac
