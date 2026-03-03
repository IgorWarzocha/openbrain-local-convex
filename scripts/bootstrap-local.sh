#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "[openbrain] installing dependencies"
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

echo "[openbrain] generating convex deployment + types (local)"
npx convex dev --once

echo "[openbrain] done"
