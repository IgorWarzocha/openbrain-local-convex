# Troubleshooting

Use this only after mode lock is complete. Keep fixes mode-specific.

## 1. `brain: command not found`

User-local link:

```bash
npm run link:global
which brain
```

If still missing, ensure `~/.local/bin` is on `PATH`.

## 2. Health Fails (`fetch failed` or network error)

### Localhost mode

1. Verify local CLI mode:
   - `npm run brain -- health`
2. If health still fails, local services are not healthy:
   - Convex local deployment missing or stopped.
   - LM Studio API not reachable at `LMSTUDIO_BASE_URL`.

### LAN mode

1. Verify remote URL in env:
   - `OPENBRAIN_REMOTE_URL=http://<server-ip>:8787`
2. Probe API:

```bash
curl -fsS http://<server-ip>:8787/health
```

3. If API key is required, include:
   - `OPENBRAIN_API_KEY` in client env.
   - `x-openbrain-key` in direct API calls.

## 3. `401 unauthorized`

Cause:
- Server requires key auth and client key is missing/wrong.

Fix:
- Set matching `OPENBRAIN_API_KEY` on client.
- For direct HTTP, send `x-openbrain-key: <shared-secret>`.

## 4. No Search Hits After Capture

1. Confirm capture returned `ok: true` and a `saved` thought.
2. Confirm stats changed:

```bash
brain stats
```

3. Retry broad search:

```bash
brain search "<query>" --limit 20 --threshold 0.0
```

## 5. Remove Fails or Appears Ineffective

1. Inspect recent thoughts:

```bash
brain recent --limit 20
```

2. Remove by selector:

```bash
brain remove --recent 1
brain remove --content "exact thought text"
brain remove --query "semantic description of the thought"
```

3. Re-check recent and search to confirm the thought is absent.

## 6. Mode Mismatch

If both env vars exist, remote mode wins:
- `OPENBRAIN_REMOTE_URL` takes precedence over `CONVEX_URL`.

For localhost operation, unset `OPENBRAIN_REMOTE_URL`.
For LAN operation, keep `OPENBRAIN_REMOTE_URL` and ignore `CONVEX_URL`.
