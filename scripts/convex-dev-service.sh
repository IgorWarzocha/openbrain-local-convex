#!/usr/bin/env bash
set -euo pipefail

# Local Convex deployments occasionally require a backend upgrade prompt.
# Use Convex's built-in non-interactive upgrade path so systemd can restart cleanly.
exec npx convex dev --local --tail-logs disable --local-force-upgrade
