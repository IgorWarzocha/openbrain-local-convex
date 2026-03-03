#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "[openbrain] installing dependencies"
npm install

echo "[openbrain] generating convex deployment + types (local)"
npx convex dev --once

echo "[openbrain] done"

