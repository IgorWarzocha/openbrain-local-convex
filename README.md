# OpenBrain (Convex + LM Studio, No MCP)

Local-first 2nd brain:
- Convex stores thoughts and serves semantic search.
- LM Studio (headless Vulkan) generates embeddings with `google/embeddinggemma-300m`.
- Access through local CLI and optional local HTTP API.

## Architecture

- `src/cli.ts`: capture/search/recent/stats commands.
- `src/server.ts`: optional HTTP API (`/capture`, `/search`, `/recent`, `/stats`, `/health`).
- `convex/brain.ts`: Convex mutation/query functions.
- `convex/schema.ts`: Convex data model.

Embeddings are generated client-side (CLI/API process), then sent to Convex.

## Prerequisites

- Node.js 20+
- Convex CLI available via `npx convex ...`
- LM Studio headless runtime (`lms`) installed and exposing OpenAI-compatible embeddings API
- Access to `google/embeddinggemma-300m` in LM Studio (identifier usually `text-embedding-embeddinggemma-300m-qat`)

## Quick Start (Local)

1. Install dependencies:

```bash
npm install
```

2. Initialize local Convex deployment and codegen:

```bash
npx convex dev --once
```

3. Configure LM Studio values:

```bash
cp .env.example .env
# edit .env if needed
```

4. Health check:

```bash
npm run health
```

5. Capture and search:

```bash
npm run openbrain -- capture "Decided to move launch by one week" --tags planning,release
npm run openbrain -- search "What did I say about the launch timeline?"
npm run openbrain -- recent --limit 10
npm run openbrain -- stats
```

## HTTP API

Run:

```bash
npm run start:api
```

Endpoints:
- `GET /health`
- `GET /stats`
- `GET /recent?limit=20`
- `POST /capture` with `{ "content": "...", "tags": ["..."], "source": "api" }`
- `POST /search` with `{ "query": "...", "limit": 8, "threshold": 0.2 }`

Example:

```bash
curl -s -X POST http://127.0.0.1:8787/capture \
  -H 'content-type: application/json' \
  -d '{"content":"Remember: Marcus wants platform team transfer","source":"api"}' | jq
```

## Run Persistently on Server (192.168.0.113)

From your workstation:

```bash
bash scripts/deploy-server.sh 192.168.0.113 ~/openbrain
```

On the server:

```bash
cd ~/openbrain
# install lms/llmster once (headless runtime)
curl -fsSL https://lmstudio.ai/install.sh | bash
# download embedding model once
~/.lmstudio/bin/lms get embeddinggemma -n 20 -y
# install and start user services
bash scripts/install-systemd-user-services.sh
```

Service status:

```bash
systemctl --user status lmstudio.service convex-local.service openbrain-api.service
journalctl --user -u lmstudio.service -u convex-local.service -u openbrain-api.service -f
```

## tmux Option

If you prefer tmux over systemd:

```bash
bash scripts/tmux-start.sh openbrain
tmux attach -t openbrain
```

## Notes

- First saved thought locks embedding dimension implicitly; later writes must match.
- If LM Studio model output dimension changes, clear/rebuild thought data.
- No Slack, no ChatGPT web connector, no MCP.
