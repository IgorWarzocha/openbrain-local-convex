---
name: openbrain-operator
description: Operate and troubleshoot OpenBrain memory through the `brain` CLI and OpenBrain HTTP API. Use when the user asks to capture thoughts, run semantic search, review recent/history, check stats/health, tune retrieval, or diagnose why memory read/write is failing.
---

# OpenBrain Operator

## Overview

Run OpenBrain reliably from repo root or global `brain`, then verify stored semantic memory behavior instead of guessing. Treat every operation as: execute, verify, report evidence.

Primary references:
- `docs/CLI_USAGE.md`
- `docs/TROUBLESHOOTING.md`
- `README.md`

## Preflight

Detect active mode:
- Local mode: `CONVEX_URL` set, no `OPENBRAIN_REMOTE_URL`.
- Remote mode: `OPENBRAIN_REMOTE_URL` set.

If `brain` is unavailable globally, use:

```bash
npm run brain -- <command>
```

Run:

```bash
brain health
```

If health fails, stop and diagnose before capture/search.

## Core Commands

Capture:

```bash
brain capture "Decided to delay launch for QA blockers" --source cli --tags planning,qa
```

Search:

```bash
brain search "What did I note about QA blockers?" --limit 8 --threshold 0.2
```

Recent:

```bash
brain recent --limit 20
```

Stats:

```bash
brain stats
```

## Retrieval Tuning Playbook

When search feels too strict:
- Lower threshold (`0.2` -> `0.1` -> `0.0`).
- Increase limit (`8` -> `20`).
- Rephrase query semantically.

Example:

```bash
brain search "career transition notes" --limit 20 --threshold 0.1
```

## API Usage (When CLI Is Not Enough)

Health:

```bash
curl -s http://<server-ip>:8787/health
```

Capture:

```bash
curl -s -X POST http://<server-ip>:8787/capture \
  -H 'content-type: application/json' \
  -d '{"content":"note from api","source":"api","tags":["ops"]}'
```

With key auth:

```bash
curl -s -X POST http://<server-ip>:8787/capture \
  -H 'x-openbrain-key: <shared-secret>' \
  -H 'content-type: application/json' \
  -d '{"content":"note from api","source":"api","tags":["ops"]}'
```

## Fail-Fast Troubleshooting

- `brain: command not found`:

```bash
npm run link:global
which brain
```

- `fetch failed` in remote mode:
  - Check `OPENBRAIN_REMOTE_URL`.
  - Check server bind is `0.0.0.0:8787`.
  - Check `bash scripts/services.sh status` on server.
- `401 unauthorized`:
  - Align `OPENBRAIN_API_KEY` between server and client.
- No search hits after capture:
  - Confirm capture succeeded.
  - Retry with lower threshold.
  - Check `brain stats` incremented.

## Response Contract

When running this skill for a user:
- Show exact commands executed.
- Show key outputs (health, capture id, match count).
- State current mode (`local` or `remote`).
- End with clear next action only if something is still broken.
