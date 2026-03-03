#!/usr/bin/env bash
set -euo pipefail

TARGET_HOST="${1:-192.168.0.113}"
TARGET_DIR="${2:-$HOME/openbrain-local-convex}"

echo "[openbrain] interactive server bootstrap on $TARGET_HOST:$TARGET_DIR"
echo "[openbrain] this opens an interactive Convex setup flow if needed"

ssh -tt "$TARGET_HOST" "bash -lc 'cd $TARGET_DIR && npx convex dev --configure new --dev-deployment local --once'"
