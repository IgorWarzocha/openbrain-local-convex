#!/usr/bin/env bash
set -euo pipefail

TARGET_HOST="${1:-192.168.0.113}"
TARGET_DIR="${2:-$HOME/openbrain}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "[openbrain] missing required command: $1" >&2
    exit 1
  }
}

require_cmd rsync
require_cmd ssh

echo "[openbrain] ensuring remote directory exists: $TARGET_DIR"
ssh "$TARGET_HOST" "mkdir -p '$TARGET_DIR'"

echo "[openbrain] syncing project to $TARGET_HOST:$TARGET_DIR"
rsync -az --delete \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude '.convex' \
  --exclude '.env.local' \
  "$ROOT_DIR/" "$TARGET_HOST:$TARGET_DIR/"

echo "[openbrain] installing dependencies on server"
ssh "$TARGET_HOST" "bash -lc 'cd $TARGET_DIR && if [ -f package-lock.json ]; then npm ci; else npm install; fi'"

echo "[openbrain] validating server bootstrap state"
if ! ssh "$TARGET_HOST" "test -f '$TARGET_DIR/.env.local'"; then
  cat >&2 <<EOF
[openbrain] server bootstrap is incomplete: $TARGET_DIR/.env.local not found
[openbrain] run this once interactively:
  ssh -tt $TARGET_HOST 'cd $TARGET_DIR && npx convex dev --configure new --dev-deployment local --once'
EOF
  exit 2
fi

echo "[openbrain] done"
