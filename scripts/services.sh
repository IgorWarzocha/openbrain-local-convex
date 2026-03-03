#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
USER_SYSTEMD_DIR="${HOME}/.config/systemd/user"
WORKDIR="${OPENBRAIN_WORKDIR:-$ROOT_DIR}"
LMSTUDIO_BIN="${LMSTUDIO_BIN:-$HOME/.lmstudio/bin/lms}"
DEFAULT_MODEL="text-embedding-embeddinggemma-300m-qat"
LMSTUDIO_MODEL="${LMSTUDIO_MODEL:-$DEFAULT_MODEL}"
DEFAULT_RUNTIME_ALIAS="llama.cpp-linux-x86_64-vulkan-avx2"
LMSTUDIO_RUNTIME_ALIAS="${LMSTUDIO_RUNTIME_ALIAS:-$DEFAULT_RUNTIME_ALIAS}"
LMSTUDIO_GPU_OFFLOAD="${LMSTUDIO_GPU_OFFLOAD:-max}"
LMSTUDIO_REQUIRE_VULKAN="${LMSTUDIO_REQUIRE_VULKAN:-1}"
LMSTUDIO_BASE_URL="${LMSTUDIO_BASE_URL:-http://127.0.0.1:1234/v1}"
LMSTUDIO_STARTUP_TIMEOUT_SECONDS="${LMSTUDIO_STARTUP_TIMEOUT_SECONDS:-45}"
LMSTUDIO_HEALTH_INTERVAL_SECONDS="${LMSTUDIO_HEALTH_INTERVAL_SECONDS:-5}"

if [ -f "$WORKDIR/.env" ]; then
  # Optional override from .env.
  model_from_env="$(grep -E '^LMSTUDIO_EMBED_MODEL=' "$WORKDIR/.env" | tail -n1 | cut -d'=' -f2- || true)"
  if [ -n "$model_from_env" ]; then
    LMSTUDIO_MODEL="$model_from_env"
  fi
  runtime_from_env="$(grep -E '^LMSTUDIO_RUNTIME_ALIAS=' "$WORKDIR/.env" | tail -n1 | cut -d'=' -f2- || true)"
  if [ -n "$runtime_from_env" ]; then
    LMSTUDIO_RUNTIME_ALIAS="$runtime_from_env"
  fi
  gpu_from_env="$(grep -E '^LMSTUDIO_GPU_OFFLOAD=' "$WORKDIR/.env" | tail -n1 | cut -d'=' -f2- || true)"
  if [ -n "$gpu_from_env" ]; then
    LMSTUDIO_GPU_OFFLOAD="$gpu_from_env"
  fi
  require_vulkan_from_env="$(grep -E '^LMSTUDIO_REQUIRE_VULKAN=' "$WORKDIR/.env" | tail -n1 | cut -d'=' -f2- || true)"
  if [ -n "$require_vulkan_from_env" ]; then
    LMSTUDIO_REQUIRE_VULKAN="$require_vulkan_from_env"
  fi
  base_url_from_env="$(grep -E '^LMSTUDIO_BASE_URL=' "$WORKDIR/.env" | tail -n1 | cut -d'=' -f2- || true)"
  if [ -n "$base_url_from_env" ]; then
    LMSTUDIO_BASE_URL="$base_url_from_env"
  fi
  startup_timeout_from_env="$(grep -E '^LMSTUDIO_STARTUP_TIMEOUT_SECONDS=' "$WORKDIR/.env" | tail -n1 | cut -d'=' -f2- || true)"
  if [ -n "$startup_timeout_from_env" ]; then
    LMSTUDIO_STARTUP_TIMEOUT_SECONDS="$startup_timeout_from_env"
  fi
  health_interval_from_env="$(grep -E '^LMSTUDIO_HEALTH_INTERVAL_SECONDS=' "$WORKDIR/.env" | tail -n1 | cut -d'=' -f2- || true)"
  if [ -n "$health_interval_from_env" ]; then
    LMSTUDIO_HEALTH_INTERVAL_SECONDS="$health_interval_from_env"
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
  local escaped_workdir escaped_home escaped_lms_bin escaped_model escaped_runtime_alias escaped_gpu_offload escaped_require_vulkan escaped_base_url escaped_startup_timeout escaped_health_interval
  escaped_workdir="$(escape_sed_replacement "$WORKDIR")"
  escaped_home="$(escape_sed_replacement "$HOME")"
  escaped_lms_bin="$(escape_sed_replacement "$LMSTUDIO_BIN")"
  escaped_model="$(escape_sed_replacement "$LMSTUDIO_MODEL")"
  escaped_runtime_alias="$(escape_sed_replacement "$LMSTUDIO_RUNTIME_ALIAS")"
  escaped_gpu_offload="$(escape_sed_replacement "$LMSTUDIO_GPU_OFFLOAD")"
  escaped_require_vulkan="$(escape_sed_replacement "$LMSTUDIO_REQUIRE_VULKAN")"
  escaped_base_url="$(escape_sed_replacement "${LMSTUDIO_BASE_URL%/}")"
  escaped_startup_timeout="$(escape_sed_replacement "$LMSTUDIO_STARTUP_TIMEOUT_SECONDS")"
  escaped_health_interval="$(escape_sed_replacement "$LMSTUDIO_HEALTH_INTERVAL_SECONDS")"
  sed \
    -e "s/__WORKDIR__/${escaped_workdir}/g" \
    -e "s/__USER_HOME__/${escaped_home}/g" \
    -e "s/__LMSTUDIO_BIN__/${escaped_lms_bin}/g" \
    -e "s/__LMSTUDIO_MODEL__/${escaped_model}/g" \
    -e "s/__LMSTUDIO_RUNTIME_ALIAS__/${escaped_runtime_alias}/g" \
    -e "s/__LMSTUDIO_GPU_OFFLOAD__/${escaped_gpu_offload}/g" \
    -e "s/__LMSTUDIO_REQUIRE_VULKAN__/${escaped_require_vulkan}/g" \
    -e "s/__LMSTUDIO_BASE_URL__/${escaped_base_url}/g" \
    -e "s/__LMSTUDIO_STARTUP_TIMEOUT_SECONDS__/${escaped_startup_timeout}/g" \
    -e "s/__LMSTUDIO_HEALTH_INTERVAL_SECONDS__/${escaped_health_interval}/g" \
    "$template" >"$output"
}

preflight() {
  require_cmd systemctl
  require_cmd sed
  require_cmd curl
  if ! systemctl --user --version >/dev/null 2>&1; then
    die "systemctl --user is unavailable in this environment"
  fi
  [ -d "$WORKDIR" ] || die "workdir does not exist: $WORKDIR"
  [ -x "$LMSTUDIO_BIN" ] || die "LM Studio CLI not found or not executable: $LMSTUDIO_BIN"
  [ -x "$WORKDIR/scripts/lmstudio-supervisor.sh" ] || die "LM Studio supervisor script not found or not executable: $WORKDIR/scripts/lmstudio-supervisor.sh"
  if command -v loginctl >/dev/null 2>&1; then
    linger_state="$(loginctl show-user "$USER" -p Linger --value 2>/dev/null || true)"
    if [ "$linger_state" != "yes" ]; then
      log "warning: loginctl linger is not enabled for $USER (services may stop after logout)"
    fi
  fi
  case "$LMSTUDIO_GPU_OFFLOAD" in
    off|max) ;;
    *)
      if ! [[ "$LMSTUDIO_GPU_OFFLOAD" =~ ^0(\.[0-9]+)?$|^1(\.0+)?$ ]]; then
        die "LMSTUDIO_GPU_OFFLOAD must be 'off', 'max', or a value between 0 and 1"
      fi
      ;;
  esac
  case "$LMSTUDIO_REQUIRE_VULKAN" in
    0|1) ;;
    *)
      die "LMSTUDIO_REQUIRE_VULKAN must be 0 or 1"
      ;;
  esac
  if ! [[ "$LMSTUDIO_STARTUP_TIMEOUT_SECONDS" =~ ^[0-9]+$ ]] || [ "$LMSTUDIO_STARTUP_TIMEOUT_SECONDS" -lt 1 ]; then
    die "LMSTUDIO_STARTUP_TIMEOUT_SECONDS must be a positive integer"
  fi
  if ! [[ "$LMSTUDIO_HEALTH_INTERVAL_SECONDS" =~ ^[0-9]+$ ]] || [ "$LMSTUDIO_HEALTH_INTERVAL_SECONDS" -lt 1 ]; then
    die "LMSTUDIO_HEALTH_INTERVAL_SECONDS must be a positive integer"
  fi
  if ! "$LMSTUDIO_BIN" runtime ls | grep -Fq "$LMSTUDIO_RUNTIME_ALIAS"; then
    die "LM Studio runtime alias not installed: $LMSTUDIO_RUNTIME_ALIAS"
  fi
  if [ "$LMSTUDIO_REQUIRE_VULKAN" = "1" ] && [[ "$LMSTUDIO_RUNTIME_ALIAS" != *vulkan* ]]; then
    die "Vulkan enforcement is enabled but runtime alias is not Vulkan: $LMSTUDIO_RUNTIME_ALIAS"
  fi
  log "LM Studio runtime alias: $LMSTUDIO_RUNTIME_ALIAS (gpu offload: $LMSTUDIO_GPU_OFFLOAD)"
  log "LM Studio probe target: ${LMSTUDIO_BASE_URL%/}/models (startup timeout ${LMSTUDIO_STARTUP_TIMEOUT_SECONDS}s, interval ${LMSTUDIO_HEALTH_INTERVAL_SECONDS}s)"
}

install_units() {
  mkdir -p "$USER_SYSTEMD_DIR"
  render_template "$ROOT_DIR/deploy/systemd/lmstudio.service.tmpl" "$USER_SYSTEMD_DIR/lmstudio.service"
  render_template "$ROOT_DIR/deploy/systemd/convex-local.service.tmpl" "$USER_SYSTEMD_DIR/convex-local.service"
  render_template "$ROOT_DIR/deploy/systemd/openbrain-api.service.tmpl" "$USER_SYSTEMD_DIR/openbrain-api.service"
  systemctl --user daemon-reload
  log "installed unit files into $USER_SYSTEMD_DIR"
}

enable_units() {
  systemctl --user enable "${SERVICES[@]}"
  log "enabled ${SERVICES[*]}"
}

restart_units() {
  # Always restart on install so updated unit files and env settings take effect.
  systemctl --user restart "${SERVICES[@]}"
  log "restarted ${SERVICES[*]}"
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
    enable_units
    restart_units
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
