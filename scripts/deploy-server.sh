#!/usr/bin/env bash
set -euo pipefail

TARGET_HOST="${1:-192.168.0.113}"
TARGET_DIR="${2:-~/openbrain}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "[openbrain] syncing project to $TARGET_HOST:$TARGET_DIR"
rsync -az --delete \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude '.convex' \
  --exclude '.env.local' \
  "$ROOT_DIR/" "$TARGET_HOST:$TARGET_DIR/"

echo "[openbrain] installing dependencies and bootstrapping on server"
ssh "$TARGET_HOST" "bash -lc 'cd $TARGET_DIR && npm install && npx convex dev --once'"

echo "[openbrain] done"

