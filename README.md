# openbrain-local-convex

> This project exists because Nate B. Jones shared the original “Build Your Open Brain” idea in a way that made people actually ship it.  
> Big credit to Nate for the concept and teaching work: https://promptkit.natebjones.com/20260224_uq1_guide_main

Personal second-brain memory you can run:
1. On your own machine (`localhost`)
2. On a dedicated local server (for example `192.168.x.x`)

No Slack. No MCP. No cloud embedding bill.

## What It Does

- Save thoughts (`capture`)
- Find thoughts by meaning (`search`)
- List recent notes (`recent`)
- Show memory stats (`stats`)
- Remove a thought by selector (`remove`)

![openbrain](https://github.com/user-attachments/assets/95eaa96a-77c6-4d19-8600-72dd05a98d16)

## Choose Your Install Mode

## 1) Localhost Mode (single machine)

Use this if you just want everything running on your own laptop/desktop.

### Steps

1. Install dependencies:

```bash
npm ci
```

2. Bootstrap Convex local deployment (first run is interactive):

```bash
npx convex dev --configure new --dev-deployment local --once
```

3. Create env file:

```bash
cp .env.example .env
```

4. Start LM Studio runtime and load embedding model:

```bash
~/.lmstudio/bin/lms daemon up
~/.lmstudio/bin/lms runtime select llama.cpp-linux-x86_64-vulkan-avx2
~/.lmstudio/bin/lms load text-embedding-embeddinggemma-300m-qat --gpu max --yes
~/.lmstudio/bin/lms server start
```

5. Verify:

```bash
npm run health
```

6. Start using it:

```bash
npm run brain -- capture "Decided to move launch by one week" --tags planning,release
npm run brain -- search "What did I say about launch timeline?"
```

## Enable `brain` Everywhere

Recommended (no sudo, per-user install):

```bash
npm run link:global
```

Optional (sudo, system-wide install):

```bash
npm run link:global:system
```

Then from any directory:

```bash
brain capture "your thought"
brain search "your query"
brain recent --limit 20
brain stats
brain remove --recent 1
```

## 2) Local Server Mode (separate machine on your LAN)

Use this when you want it always on in your network.

### Steps

1. Deploy code to server:

```bash
bash scripts/deploy-server.sh <host> <remote_dir>
```

2. Run one-time Convex bootstrap on server:

```bash
bash scripts/bootstrap-server-interactive.sh <host> <remote_dir>
```

3. Install LM Studio headless runtime + model on server:

```bash
ssh <host> "curl -fsSL https://lmstudio.ai/install.sh | bash"
ssh <host> "~/.lmstudio/bin/lms get embeddinggemma -n 20 -y"
```

4. Install/start services:

```bash
ssh <host> "cd <remote_dir> && bash scripts/services.sh install"
```

5. Verify:

```bash
ssh <host> "cd <remote_dir> && npm run health"
```

6. Make API reachable on LAN:

- On the server `.env`, set:
  - `OPENBRAIN_API_HOST=0.0.0.0`
  - `OPENBRAIN_API_PORT=8787`
  - Optional: `OPENBRAIN_API_KEY=<shared-secret>`
- Restart server services:

```bash
ssh <host> "cd <remote_dir> && bash scripts/services.sh restart"
```

## 3) LAN Client Mode (no SSH for daily usage)

Use this on any LAN computer that should query/capture thoughts against your server.

1. Clone the repo and install deps:

```bash
npm ci
```

2. Create `.env` with remote target:

```bash
cp .env.example .env
```

Then set:
- `OPENBRAIN_REMOTE_URL=http://192.168.0.113:8787`
- `OPENBRAIN_API_KEY=<shared-secret>` (only if server requires it)

3. Use `brain` normally from that machine:

```bash
npm run brain -- stats
npm run brain -- capture "note from another laptop"
npm run brain -- search "what did I write about launch?"
```

Optional for from-any-folder usage on that client:

```bash
npm run link:global
brain stats
```

When `OPENBRAIN_REMOTE_URL` is set, the CLI talks to the remote API directly and does not require local Convex/LM Studio.

## Everyday Commands

```bash
npm run brain -- capture "your thought"
npm run brain -- search "your query"
npm run brain -- search "your query" today
npm run brain -- recent --limit 20
npm run brain -- recent today
npm run brain -- stats
npm run brain -- remove --recent 1
```

## API Endpoints

- `GET /health`
- `GET /stats`
- `GET /recent?limit=20`
- `POST /capture`
- `POST /search`
- `POST /remove`

## More Docs

- [Setup](./docs/SETUP.md)
- [CLI Usage](./docs/CLI_USAGE.md)
- [Troubleshooting](./docs/TROUBLESHOOTING.md)
