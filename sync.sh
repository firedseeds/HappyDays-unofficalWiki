#!/usr/bin/env bash
set -u

ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$ROOT/logs"
LOG_FILE="${SYNC_LOG_FILE:-$LOG_DIR/sync.log}"
SYNC_SSH_COMMAND="${SYNC_SSH_COMMAND:-ssh}"
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
  GIT_SSH_COMMAND="$SYNC_SSH_COMMAND" git -C "$ROOT" "$@" >>"$LOG_FILE" 2>&1
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
  local now today0 today12
  now="$(date +%s)"
  today0="$(TZ="$SYNC_TIMEZONE" date -d 'today 00:00' +%s)"
  today12="$(TZ="$SYNC_TIMEZONE" date -d 'today 12:00' +%s)"
  if [ "$now" -lt "$today0" ]; then
    printf '%s %s\n' "$today0" "pull"
  elif [ "$now" -lt "$today12" ]; then
    printf '%s %s\n' "$today12" "push"
  else
    printf '%s %s\n' "$(TZ="$SYNC_TIMEZONE" date -d 'tomorrow 00:00' +%s)" "pull"
  fi
}

sync_loop() {
  log "sync scheduler started (timezone=$SYNC_TIMEZONE)"
  while true; do
    local event next action delay
    event="$(next_sync_event)"
    next="${event% *}"
    action="${event#* }"
    delay=$((next - $(date +%s)))
    if [ "$delay" -lt 1 ]; then
      delay=1
    fi
    sleep "$delay"
    if [ "$action" = "pull" ]; then
      sync_pull "daily-pull" || true
    else
      sync_push "daily-push" || true
    fi
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
