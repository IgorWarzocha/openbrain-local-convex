# Troubleshooting

## `npm run health` fails with `fetch failed`

Cause:
- Convex local backend is not running, or
- LM Studio server is not running on configured base URL.

Fix:

```bash
bash scripts/services.sh status
bash scripts/services.sh restart
journalctl --user -u lmstudio.service -u convex-local.service -u openbrain-api.service -n 100 --no-pager
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

## `lmstudio.service` shows `active (exited)`

Cause:
- Stale or invalid user unit install (including missing `scripts/lmstudio-supervisor.sh`) left LM Studio in legacy startup mode.

Fix:

```bash
bash scripts/services.sh install
systemctl --user status lmstudio.service --no-pager
systemctl --user show lmstudio.service -p Type,Restart,ActiveState,SubState --no-pager
```

Expected:
- `Type=simple`
- `Restart=always`
- `ActiveState=active`
- `SubState=running`

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
