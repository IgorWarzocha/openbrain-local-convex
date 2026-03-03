#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
USER_SYSTEMD_DIR="${HOME}/.config/systemd/user"
WORKDIR="${OPENBRAIN_WORKDIR:-$ROOT_DIR}"
LMSTUDIO_BIN="${LMSTUDIO_BIN:-$HOME/.lmstudio/bin/lms}"
DEFAULT_MODEL="text-embedding-embeddinggemma-300m-qat"
LMSTUDIO_MODEL="${LMSTUDIO_MODEL:-$DEFAULT_MODEL}"

if [ -f "$WORKDIR/.env" ]; then
  # Optional override from .env.
  model_from_env="$(grep -E '^LMSTUDIO_EMBED_MODEL=' "$WORKDIR/.env" | tail -n1 | cut -d'=' -f2- || true)"
  if [ -n "$model_from_env" ]; then
    LMSTUDIO_MODEL="$model_from_env"
  fi
fi

SERVICES=("lmstudio.service" "convex-local.service" "openbrain-api.service")

log() {
  echo "[openbrain-services] $*"
}

die() {
  echo "[openbrain-services] ERROR: $*" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "required command '$1' not found"
}

escape_sed_replacement() {
  printf "%s" "$1" | sed -e 's/[\/&]/\\&/g'
}

render_template() {
  local template="$1"
  local output="$2"
  local escaped_workdir escaped_home escaped_lms_bin escaped_model
  escaped_workdir="$(escape_sed_replacement "$WORKDIR")"
  escaped_home="$(escape_sed_replacement "$HOME")"
  escaped_lms_bin="$(escape_sed_replacement "$LMSTUDIO_BIN")"
  escaped_model="$(escape_sed_replacement "$LMSTUDIO_MODEL")"
  sed \
    -e "s/__WORKDIR__/${escaped_workdir}/g" \
    -e "s/__USER_HOME__/${escaped_home}/g" \
    -e "s/__LMSTUDIO_BIN__/${escaped_lms_bin}/g" \
    -e "s/__LMSTUDIO_MODEL__/${escaped_model}/g" \
    "$template" >"$output"
}

preflight() {
  require_cmd systemctl
  require_cmd sed
  if ! systemctl --user --version >/dev/null 2>&1; then
    die "systemctl --user is unavailable in this environment"
  fi
  [ -d "$WORKDIR" ] || die "workdir does not exist: $WORKDIR"
  [ -x "$LMSTUDIO_BIN" ] || die "LM Studio CLI not found or not executable: $LMSTUDIO_BIN"
  if command -v loginctl >/dev/null 2>&1; then
    linger_state="$(loginctl show-user "$USER" -p Linger --value 2>/dev/null || true)"
    if [ "$linger_state" != "yes" ]; then
      log "warning: loginctl linger is not enabled for $USER (services may stop after logout)"
    fi
  fi
}

install_units() {
  mkdir -p "$USER_SYSTEMD_DIR"
  render_template "$ROOT_DIR/deploy/systemd/lmstudio.service.tmpl" "$USER_SYSTEMD_DIR/lmstudio.service"
  render_template "$ROOT_DIR/deploy/systemd/convex-local.service.tmpl" "$USER_SYSTEMD_DIR/convex-local.service"
  render_template "$ROOT_DIR/deploy/systemd/openbrain-api.service.tmpl" "$USER_SYSTEMD_DIR/openbrain-api.service"
  systemctl --user daemon-reload
  log "installed unit files into $USER_SYSTEMD_DIR"
}

enable_and_start() {
  systemctl --user enable --now "${SERVICES[@]}"
  log "enabled and started ${SERVICES[*]}"
}

stop_and_disable() {
  systemctl --user disable --now "${SERVICES[@]}" || true
  log "stopped and disabled ${SERVICES[*]}"
}

status_units() {
  systemctl --user --no-pager --full status "${SERVICES[@]}" || true
}

logs_units() {
  journalctl --user -u lmstudio.service -u convex-local.service -u openbrain-api.service -f
}

uninstall_units() {
  stop_and_disable
  rm -f \
    "$USER_SYSTEMD_DIR/lmstudio.service" \
    "$USER_SYSTEMD_DIR/convex-local.service" \
    "$USER_SYSTEMD_DIR/openbrain-api.service"
  systemctl --user daemon-reload
  log "removed unit files from $USER_SYSTEMD_DIR"
}

command="${1:-status}"
case "$command" in
  install)
    preflight
    install_units
    enable_and_start
    status_units
    ;;
  start)
    systemctl --user start "${SERVICES[@]}"
    status_units
    ;;
  stop)
    systemctl --user stop "${SERVICES[@]}"
    status_units
    ;;
  restart)
    systemctl --user restart "${SERVICES[@]}"
    status_units
    ;;
  status)
    status_units
    ;;
  logs)
    logs_units
    ;;
  uninstall)
    uninstall_units
    ;;
  *)
    die "unknown command '$command' (expected: install|start|stop|restart|status|logs|uninstall)"
    ;;
esac

