# Troubleshooting

## `npm run health` fails with `fetch failed`

Cause:
- Convex local backend is not running, or
- LM Studio server is not running on configured base URL.

Fix:

```bash
npx convex dev --tail-logs disable
~/.lmstudio/bin/lms daemon up
~/.lmstudio/bin/lms server start
```

## Deploy script says `.env.local` missing on server

Cause:
- Convex local deployment has not been bootstrapped yet on that host.

Fix:

```bash
bash scripts/bootstrap-server-interactive.sh <host> <remote_dir>
```

## `systemctl --user` services stop after logout

Cause:
- User lingering is disabled.

Fix:

```bash
sudo loginctl enable-linger <username>
```

Then restart services:

```bash
bash scripts/services.sh restart
```

## LM Studio model mismatch errors

Cause:
- `LMSTUDIO_EMBED_MODEL` in `.env` differs from loaded model identifier.

Fix:

```bash
~/.lmstudio/bin/lms ps
~/.lmstudio/bin/lms load text-embedding-embeddinggemma-300m-qat --yes
```

Update `.env` if required.

## Convex service port conflict (`3210`)

Cause:
- Another Convex local backend is already running.

Fix:
- Stop conflicting process/session first.
- If using services: `bash scripts/services.sh restart`

