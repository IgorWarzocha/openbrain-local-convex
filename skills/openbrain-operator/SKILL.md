---
name: openbrain-operator
description: Operate and troubleshoot OpenBrain memory through the `brain` CLI and OpenBrain HTTP API. Use when the user asks to capture thoughts, run semantic search, review recent/history, check stats/health, tune retrieval, or diagnose why memory read/write is failing.
---

# OpenBrain Operator

This is the primary operator workflow and is optimized for `localhost` installations.
Use this file as the default source of truth. Do not use repo-wide docs.

## LAN Switch Rule (Required)

- `references/lan-operations.md`
- `references/troubleshooting.md`

1. Run:

```bash
brain health
```

If `brain` is unavailable:

```bash
npm run brain -- health
```

2. If health JSON shows `"mode": "remote"`:
   - Switch to LAN workflow by loading `references/lan-operations.md`.
   - For this run, treat localhost instructions in this file as deleted.
   - Continue with LAN commands only.
3. If health JSON shows `"mode": "local"`:
   - Stay in this file and run localhost workflow below.
4. If both `CONVEX_URL` and `OPENBRAIN_REMOTE_URL` exist, remote wins (`lan`).

## Localhost Workflow (Default)

### 1. Preflight

```bash
node -v
npm -v
brain health
```

If `brain` is not found:

```bash
npm run brain -- health
```

Health must return JSON containing:
- `"ok": true`
- `"mode": "local"`

### 2. Core Operations

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

Remove:

```bash
brain remove "<thought_id>"
```

### 3. Remove Validation

1. Get ID from:

```bash
brain recent --limit 20
```

2. Remove:

```bash
brain remove "<thought_id>"
```

3. Verify ID is gone:

```bash
brain recent --limit 20
brain search "<same content>" --limit 20 --threshold 0.0
```

### 4. Retrieval Tuning

If too strict:

```bash
brain search "<query>" --limit 20 --threshold 0.0
```

If too noisy:

```bash
brain search "<query>" --limit 8 --threshold 0.3
```

## Localhost Troubleshooting (Fast Path)

- `brain: command not found`:

```bash
npm run link:global
which brain
```

- Health fails:
  - Run `npm run brain -- health`.
  - If still failing, load `references/troubleshooting.md`.
- `401 unauthorized`:
  - Align `OPENBRAIN_API_KEY`.
  - See `references/troubleshooting.md`.

## Execution Contract

1. Execute only commands for the active mode.
2. Verify each step with concrete evidence (`ok`, IDs, counts, or HTTP responses).
3. On first failure, switch to `references/troubleshooting.md` and run the matching fix path.
4. Re-run health after each fix before continuing.

## Response Contract

1. Report active mode (`localhost` or `lan`).
2. Show exact commands executed.
3. Show key outputs:
   - Health status.
   - Capture/remove thought ID when applicable.
   - Search hit count or empty result.
4. If unresolved, provide one next action with the exact command.
