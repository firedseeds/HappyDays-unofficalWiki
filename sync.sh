#!/usr/bin/env bash
set -u

ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$ROOT/logs"
LOG_FILE="${SYNC_LOG_FILE:-$LOG_DIR/sync.log}"
SYNC_SSH_COMMAND="${SYNC_SSH_COMMAND:-ssh -o BatchMode=yes -o ConnectTimeout=8}"
SYNC_TIMEZONE="${SYNC_TIMEZONE:-Asia/Shanghai}"

mkdir -p "$LOG_DIR"

log() {
  printf '[%s] %s\n' "$(TZ="$SYNC_TIMEZONE" date '+%Y-%m-%dT%H:%M:%S%z')" "$*" >>"$LOG_FILE"
}

git_sync() {
  local label="$1"
  shift
  if [ ! -d "$ROOT/.git" ]; then
    log "skip git $label: not a Git repository"
    return 0
  fi
  log "git $label start"
  if command -v timeout >/dev/null 2>&1; then
    timeout 35 env GIT_TERMINAL_PROMPT=0 GIT_SSH_COMMAND="$SYNC_SSH_COMMAND" \
      git -C "$ROOT" "$@" >>"$LOG_FILE" 2>&1
  else
    env GIT_TERMINAL_PROMPT=0 GIT_SSH_COMMAND="$SYNC_SSH_COMMAND" \
      git -C "$ROOT" "$@" >>"$LOG_FILE" 2>&1
  fi
  local code=$?
  if [ "$code" -eq 0 ]; then
    log "git $label success"
  else
    log "git $label failed (exit $code)"
  fi
  return "$code"
}

sync_pull() {
  local label="${1:-manual}"
  if ! git_sync "$label-pull" pull --rebase --autostash; then
    git -C "$ROOT" rebase --abort >>"$LOG_FILE" 2>&1 || true
    log "git $label-pull aborted local rebase state"
    return 1
  fi
}

sync_push() {
  local label="${1:-manual}"
  sync_pull "$label-before-push" || return 1
  git_sync "$label-push" push
}

next_sync_event() {
  local now today12
  now="$(date +%s)"
  today12="$(TZ="$SYNC_TIMEZONE" date -d 'today 12:00' +%s)"
  if [ "$now" -lt "$today12" ]; then
    printf '%s %s\n' "$today12" "push"
  else
    printf '%s %s\n' "$(TZ="$SYNC_TIMEZONE" date -d 'tomorrow 12:00' +%s)" "push"
  fi
}

sync_loop() {
  log "sync scheduler started (timezone=$SYNC_TIMEZONE, daily push only)"
  while true; do
    local event next delay
    event="$(next_sync_event)"
    next="${event% *}"
    delay=$((next - $(date +%s)))
    if [ "$delay" -lt 1 ]; then
      delay=1
    fi
    sleep "$delay"
    sync_push "daily-push" || true
    sleep 60
  done
}

case "${1:-}" in
  -pull)
    sync_pull "${2:-manual}"
    ;;
  -push)
    sync_push "${2:-manual}"
    ;;
  -loop)
    sync_loop
    ;;
  *)
    printf 'usage: %s -pull [label] | -push [label] | -loop\n' "$0" >&2
    exit 1
    ;;
esac
