# Lane Map

## Runtime Lanes

- `convex/`
  - Backend data model and functions.
  - `schema.ts`: table/index contract.
  - `brain.ts`: capture/search/recent/stats behavior.

- `src/commands/`
  - Thin use-case wrappers around Convex functions and LM Studio embeddings.

- `src/domain/`
  - Pure input parsing/validation shared by CLI + HTTP API.

- `src/cli.ts`
  - User-facing CLI entrypoint.

- `src/server.ts`
  - Local HTTP API entrypoint.

## Ops Lanes

- `scripts/deploy-server.sh`
  - Rsync + dependency install + bootstrap validation.

- `scripts/bootstrap-server-interactive.sh`
  - One-time interactive Convex local deployment setup on remote host.

- `scripts/services.sh`
  - systemd user service lifecycle manager (`install/start/stop/restart/status/logs/uninstall`).

- `scripts/tmux-start.sh`
  - Optional tmux-based runtime for non-systemd operation.

