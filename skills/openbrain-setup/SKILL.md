---
name: openbrain-setup
description: Set up openbrain-local-convex from a cloned repository on localhost, a LAN server, or LAN client machines. Use when the user asks to install, bootstrap, deploy, repair services, validate health, or make `brain` work end-to-end without handwaving.
---

# OpenBrain Setup

## Overview

Set up this repo with fail-fast validation and no silent assumptions. Pick one mode, run exact commands, validate live behavior, and stop immediately on first broken dependency.

Primary references:
- `docs/SETUP.md`
- `docs/TROUBLESHOOTING.md`
- `scripts/deploy-server.sh`
- `scripts/services.sh`
- `scripts/link-global.sh`

## Mode Selection

Choose exactly one setup path first:
- `localhost`: user wants everything on one machine.
- `server`: user wants always-on runtime on another host.
- `lan-client`: user wants `brain` from another LAN machine without SSH.

## Preflight

Run and fail fast:

```bash
node -v
npm -v
```

If `brain` is unavailable globally, either run `npm run link:global` once or use:

```bash
npm run brain -- <command>
```

If dependencies are missing, stop and report exact missing command.

## Localhost Setup

Run from repo root:

```bash
npm ci
npx convex dev --configure new --dev-deployment local --once
cp .env.example .env
~/.lmstudio/bin/lms daemon up
~/.lmstudio/bin/lms runtime select llama.cpp-linux-x86_64-vulkan-avx2
~/.lmstudio/bin/lms load text-embedding-embeddinggemma-300m-qat --gpu max --yes
~/.lmstudio/bin/lms server start
npm run health
npm run brain -- stats
```

Optional global command:

```bash
npm run link:global
brain stats
```

## Server Setup (LAN Host)

From local machine:

```bash
bash scripts/deploy-server.sh <host> <remote_dir>
bash scripts/bootstrap-server-interactive.sh <host> <remote_dir>
ssh <host> "curl -fsSL https://lmstudio.ai/install.sh | bash"
ssh <host> "~/.lmstudio/bin/lms get embeddinggemma -n 20 -y"
ssh <host> "cd <remote_dir> && bash scripts/services.sh install"
```

Set server `.env` for LAN API access:

```env
OPENBRAIN_API_HOST=0.0.0.0
OPENBRAIN_API_PORT=8787
LMSTUDIO_BASE_URL=http://127.0.0.1:1234/v1
LMSTUDIO_EMBED_MODEL=text-embedding-embeddinggemma-300m-qat
LMSTUDIO_RUNTIME_ALIAS=llama.cpp-linux-x86_64-vulkan-avx2
LMSTUDIO_GPU_OFFLOAD=max
LMSTUDIO_REQUIRE_VULKAN=1
```

Then restart and verify:

```bash
ssh <host> "cd <remote_dir> && bash scripts/services.sh restart"
ssh <host> "cd <remote_dir> && npm run health"
curl -sS http://<server-ip>:8787/health
```

## LAN Client Setup (No SSH for Daily Use)

On each client machine:

```bash
npm ci
cp .env.example .env
```

Set `.env`:

```env
OPENBRAIN_REMOTE_URL=http://<server-ip>:8787
# OPENBRAIN_API_KEY=<shared-secret-if-server-enforces-key>
```

Validate:

```bash
npm run brain -- stats
npm run brain -- capture "setup smoke test" --tags smoke,setup
npm run brain -- search "setup smoke test" --limit 1
```

Optional:

```bash
npm run link:global
brain stats
```

## Fail-Fast Diagnostics

- If `brain` is not found:
```bash
npm run link:global
echo "$PATH"
```
- If LAN client cannot connect:
```bash
curl -v http://<server-ip>:8787/health
ssh <host> "cd <remote_dir> && bash scripts/services.sh status"
```
- If auth fails (`401`):
  - Ensure `OPENBRAIN_API_KEY` matches on server and client.
- If LM Studio/Vulkan issues:
```bash
~/.lmstudio/bin/lms runtime ls
~/.lmstudio/bin/lms runtime survey
```

## Completion Criteria

Do not declare success until all are true:
- `npm run health` succeeds in target mode.
- `brain capture` succeeds.
- `brain search` returns the new capture.
- For LAN mode, direct `curl http://<server-ip>:8787/health` succeeds from a client machine.
