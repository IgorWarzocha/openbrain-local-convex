#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
USER_SYSTEMD_DIR="${HOME}/.config/systemd/user"

mkdir -p "$USER_SYSTEMD_DIR"
cp "$ROOT_DIR/deploy/systemd/lmstudio.service" "$USER_SYSTEMD_DIR/lmstudio.service"
cp "$ROOT_DIR/deploy/systemd/convex-local.service" "$USER_SYSTEMD_DIR/convex-local.service"
cp "$ROOT_DIR/deploy/systemd/openbrain-api.service" "$USER_SYSTEMD_DIR/openbrain-api.service"

systemctl --user daemon-reload
systemctl --user enable --now lmstudio.service
systemctl --user enable --now convex-local.service
systemctl --user enable --now openbrain-api.service

echo "installed and started:"
systemctl --user --no-pager --full status lmstudio.service convex-local.service openbrain-api.service || true
