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

If using LAN client mode (`OPENBRAIN_REMOTE_URL` set), this means client cannot reach server API.
Check:
- Server IP/port in `OPENBRAIN_REMOTE_URL`
- `OPENBRAIN_API_HOST=0.0.0.0` on server
- firewall allows TCP `8787`
- `openbrain-api` service is running

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
~/.lmstudio/bin/lms runtime select llama.cpp-linux-x86_64-vulkan-avx2
~/.lmstudio/bin/lms load text-embedding-embeddinggemma-300m-qat --gpu max --yes
```

Update `.env` if required.

## LM Studio does not use Vulkan

Cause:
- A non-Vulkan runtime is selected or GPU offload is disabled.

Fix:

```bash
~/.lmstudio/bin/lms runtime ls
~/.lmstudio/bin/lms runtime select llama.cpp-linux-x86_64-vulkan-avx2
~/.lmstudio/bin/lms runtime survey
```

If you use systemd services, reinstall units so Vulkan enforcement is rendered into unit files:

```bash
bash scripts/services.sh install
```

## Convex service port conflict (`3210`)

Cause:
- Another Convex local backend is already running.

Fix:
- Stop conflicting process/session first.
- If using services: `bash scripts/services.sh restart`

## CLI gets `401 unauthorized`

Cause:
- Server has `OPENBRAIN_API_KEY` set, client does not.

Fix:
- Set same `OPENBRAIN_API_KEY` in client `.env`.
- Or disable key auth by removing `OPENBRAIN_API_KEY` on server and restarting services.
