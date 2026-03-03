#!/usr/bin/env bash
set -euo pipefail

LMSTUDIO_BIN="${LMSTUDIO_BIN:-$HOME/.lmstudio/bin/lms}"
LMSTUDIO_MODEL="${LMSTUDIO_MODEL:-text-embedding-embeddinggemma-300m-qat}"
LMSTUDIO_RUNTIME_ALIAS="${LMSTUDIO_RUNTIME_ALIAS:-llama.cpp-linux-x86_64-vulkan-avx2}"
LMSTUDIO_GPU_OFFLOAD="${LMSTUDIO_GPU_OFFLOAD:-max}"
LMSTUDIO_REQUIRE_VULKAN="${LMSTUDIO_REQUIRE_VULKAN:-1}"
LMSTUDIO_BASE_URL="${LMSTUDIO_BASE_URL:-http://127.0.0.1:1234/v1}"
LMSTUDIO_STARTUP_TIMEOUT_SECONDS="${LMSTUDIO_STARTUP_TIMEOUT_SECONDS:-45}"
LMSTUDIO_HEALTH_INTERVAL_SECONDS="${LMSTUDIO_HEALTH_INTERVAL_SECONDS:-5}"

log() {
  echo "[lmstudio-supervisor] $*"
}

models_url() {
  printf "%s/models" "${LMSTUDIO_BASE_URL%/}"
}

wait_for_models_endpoint() {
  local deadline now
  deadline=$(( $(date +%s) + LMSTUDIO_STARTUP_TIMEOUT_SECONDS ))
  while true; do
    if curl -fsS --max-time 3 "$(models_url)" >/dev/null 2>&1; then
      return 0
    fi
    now=$(date +%s)
    if [ "$now" -ge "$deadline" ]; then
      log "LM Studio API did not become ready within ${LMSTUDIO_STARTUP_TIMEOUT_SECONDS}s"
      return 1
    fi
    sleep 1
  done
}

if ! [[ "$LMSTUDIO_HEALTH_INTERVAL_SECONDS" =~ ^[0-9]+$ ]] || [ "$LMSTUDIO_HEALTH_INTERVAL_SECONDS" -lt 1 ]; then
  log "LMSTUDIO_HEALTH_INTERVAL_SECONDS must be a positive integer"
  exit 1
fi

log "starting LM Studio daemon/server"
"$LMSTUDIO_BIN" daemon up
"$LMSTUDIO_BIN" runtime select "$LMSTUDIO_RUNTIME_ALIAS"
"$LMSTUDIO_BIN" load "$LMSTUDIO_MODEL" --gpu "$LMSTUDIO_GPU_OFFLOAD" --yes
"$LMSTUDIO_BIN" server start

if [ "$LMSTUDIO_REQUIRE_VULKAN" = "1" ]; then
  "$LMSTUDIO_BIN" runtime survey | grep -qi "Survey by .*vulkan"
fi

wait_for_models_endpoint
log "LM Studio API ready at ${LMSTUDIO_BASE_URL}"

while true; do
  if ! curl -fsS --max-time 3 "$(models_url)" >/dev/null 2>&1; then
    log "LM Studio API health check failed; exiting so systemd can restart"
    exit 1
  fi
  sleep "$LMSTUDIO_HEALTH_INTERVAL_SECONDS"
done
