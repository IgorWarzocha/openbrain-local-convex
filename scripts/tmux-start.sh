#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SESSION_NAME="${1:-openbrain}"

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
  tmux send-keys -t "$SESSION_NAME:2" "$HOME/.lmstudio/bin/lms daemon up && $HOME/.lmstudio/bin/lms load text-embedding-embeddinggemma-300m-qat --yes && $HOME/.lmstudio/bin/lms server start" C-m
  tmux rename-window -t "$SESSION_NAME:2" lmstudio
fi

echo "started tmux session '$SESSION_NAME'"
echo "attach: tmux attach -t $SESSION_NAME"
