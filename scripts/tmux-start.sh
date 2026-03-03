#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SESSION_NAME="${1:-openbrain-local-convex}"
LMSTUDIO_MODEL="${LMSTUDIO_EMBED_MODEL:-text-embedding-embeddinggemma-300m-qat}"

if [ -f "$ROOT_DIR/.env" ]; then
  model_from_env="$(grep -E '^LMSTUDIO_EMBED_MODEL=' "$ROOT_DIR/.env" | tail -n1 | cut -d'=' -f2- || true)"
  if [ -n "$model_from_env" ]; then
    LMSTUDIO_MODEL="$model_from_env"
  fi
fi

command -v tmux >/dev/null 2>&1 || {
  echo "tmux is required"
  exit 1
}

if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
  echo "tmux session '$SESSION_NAME' already exists"
  exit 0
fi

tmux new-session -d -s "$SESSION_NAME" -c "$ROOT_DIR"
tmux send-keys -t "$SESSION_NAME:0" "cd '$ROOT_DIR' && npx convex dev --tail-logs disable" C-m
tmux rename-window -t "$SESSION_NAME:0" convex

tmux new-window -t "$SESSION_NAME:1" -c "$ROOT_DIR"
tmux send-keys -t "$SESSION_NAME:1" "cd '$ROOT_DIR' && npm run start:api" C-m
tmux rename-window -t "$SESSION_NAME:1" api

if [ -x "$HOME/.lmstudio/bin/lms" ]; then
  tmux new-window -t "$SESSION_NAME:2" -c "$ROOT_DIR"
  tmux send-keys -t "$SESSION_NAME:2" "$HOME/.lmstudio/bin/lms daemon up && $HOME/.lmstudio/bin/lms load $LMSTUDIO_MODEL --yes && $HOME/.lmstudio/bin/lms server start" C-m
  tmux rename-window -t "$SESSION_NAME:2" lmstudio
fi

echo "started tmux session '$SESSION_NAME'"
echo "attach: tmux attach -t $SESSION_NAME"
