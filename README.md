# OpenBrain

Local-first second brain stack:
- Convex local deployment for storage/search.
- LM Studio headless embeddings runtime.
- Local CLI + HTTP API.
- No Slack, no ChatGPT connector, no MCP.

## What You Get

- `captureThought` / `searchThoughts` / `listRecentThoughts` / `getStats`
- Semantic search over stored thoughts
- Linux server deployment scripts (sync, bootstrap, systemd, tmux)

## Prerequisites

- Node.js `>=20`
- `ssh` and `rsync` (for remote deploy)
- LM Studio headless runtime (`lms`) for embeddings
- Embedding model available in LM Studio:
  - target HF model family: `google/embeddinggemma-300m`
  - typical LM Studio loaded identifier: `text-embedding-embeddinggemma-300m-qat`

## Quick Start (Local, Deterministic)

1. Install dependencies:

```bash
npm ci
```

2. Bootstrap Convex local deployment (interactive on first run):

```bash
npx convex dev --configure new --dev-deployment local --once
```

3. Configure env:

```bash
cp .env.example .env
```

4. Start LM Studio runtime and model:

```bash
~/.lmstudio/bin/lms daemon up
~/.lmstudio/bin/lms load text-embedding-embeddinggemma-300m-qat --yes
~/.lmstudio/bin/lms server start
```

5. Validate:

```bash
npm run health
```

6. Use CLI:

```bash
npm run openbrain -- capture "Decided to move launch by one week" --tags planning,release
npm run openbrain -- search "What did I say about the launch timeline?"
npm run openbrain -- recent --limit 10
npm run openbrain -- stats
```

## Server Deploy

1. Sync code and install deps:

```bash
bash scripts/deploy-server.sh <host> <remote_dir>
```

2. Run one-time interactive Convex bootstrap on server:

```bash
bash scripts/bootstrap-server-interactive.sh <host> <remote_dir>
```

3. Install LM Studio headless runtime + model on server:

```bash
ssh <host> "curl -fsSL https://lmstudio.ai/install.sh | bash"
ssh <host> "~/.lmstudio/bin/lms get embeddinggemma -n 20 -y"
```

4. Install and start services:

```bash
ssh <host> "cd <remote_dir> && bash scripts/services.sh install"
```

5. Verify:

```bash
ssh <host> "cd <remote_dir> && npm run health"
```

## Service Lifecycle

```bash
bash scripts/services.sh install
bash scripts/services.sh status
bash scripts/services.sh logs
bash scripts/services.sh restart
bash scripts/services.sh stop
bash scripts/services.sh uninstall
```

## Optional tmux Runtime

```bash
bash scripts/tmux-start.sh openbrain
tmux attach -t openbrain
```

## Quality Gates

```bash
npm run typecheck
npm run test
npm run check
```

## Docs

- [Setup](/home/igorw/Frameworks/openbrain/docs/SETUP.md)
- [CLI Usage](/home/igorw/Frameworks/openbrain/docs/CLI_USAGE.md)
- [Troubleshooting](/home/igorw/Frameworks/openbrain/docs/TROUBLESHOOTING.md)
- [Credential Template](/home/igorw/Frameworks/openbrain/docs/CREDENTIAL_TRACKER_TEMPLATE.md)
- [Lane Map](/home/igorw/Frameworks/openbrain/docs/LANE_MAP.md)
