#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MODE="${1:-user}"
USER_BIN_DIR="${OPENBRAIN_BIN_DIR:-$HOME/.local/bin}"
SYSTEM_BIN_DIR="/usr/local/bin"

link_in_dir() {
  local target_dir="$1"
  mkdir -p "$target_dir"
  ln -sfn "$ROOT_DIR/bin/brain" "$target_dir/brain"
  ln -sfn "$ROOT_DIR/bin/brain" "$target_dir/openbrain-local-convex"
}

if [ "$MODE" = "--system" ]; then
  command -v sudo >/dev/null 2>&1 || {
    echo "[openbrain-local-convex] sudo is required for --system mode" >&2
    exit 1
  }
  sudo mkdir -p "$SYSTEM_BIN_DIR"
  sudo ln -sfn "$ROOT_DIR/bin/brain" "$SYSTEM_BIN_DIR/brain"
  sudo ln -sfn "$ROOT_DIR/bin/brain" "$SYSTEM_BIN_DIR/openbrain-local-convex"
  echo "[openbrain-local-convex] system-wide links created:"
  echo "  $SYSTEM_BIN_DIR/brain"
  echo "  $SYSTEM_BIN_DIR/openbrain-local-convex"
  exit 0
fi

link_in_dir "$USER_BIN_DIR"

echo "[openbrain-local-convex] user-local links created:"
echo "  $USER_BIN_DIR/brain"
echo "  $USER_BIN_DIR/openbrain-local-convex"

if ! command -v brain >/dev/null 2>&1; then
  cat <<EOF
[openbrain-local-convex] 'brain' is not currently on PATH.
Add this line to your shell profile (~/.bashrc, ~/.zshrc, etc):

  export PATH="$USER_BIN_DIR:\$PATH"

Then restart your shell.
EOF
fi
