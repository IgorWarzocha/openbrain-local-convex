# OpenBrain (Convex + LM Studio)

Personal second-brain memory you can run:
1. On your own machine (`localhost`)
2. On a dedicated local server (for example `192.168.x.x`)

No Slack. No MCP. No cloud embedding bill.

## What It Does

- Save thoughts (`capture`)
- Find thoughts by meaning (`search`)
- List recent notes (`recent`)
- Show memory stats (`stats`)

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
~/.lmstudio/bin/lms load text-embedding-embeddinggemma-300m-qat --yes
~/.lmstudio/bin/lms server start
```

5. Verify:

```bash
npm run health
```

6. Start using it:

```bash
npm run openbrain -- capture "Decided to move launch by one week" --tags planning,release
npm run openbrain -- search "What did I say about launch timeline?"
```

## 2) Local Server Mode (separate machine on your LAN)

Use this when you want OpenBrain always on in your network.

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

## Everyday Commands

```bash
npm run openbrain -- capture "your thought"
npm run openbrain -- search "your query"
npm run openbrain -- recent --limit 20
npm run openbrain -- stats
```

## API Endpoints

- `GET /health`
- `GET /stats`
- `GET /recent?limit=20`
- `POST /capture`
- `POST /search`

## Credits

This project is inspired by Nate B. Jones’ “Build Your Open Brain” guide and companion prompt work:
- https://promptkit.natebjones.com/20260224_uq1_guide_main

Attribution notes:
- The guide explicitly states it is “Built by Nate B. Jones.”
- Nate’s public profile positions him as an AI educator/analyst focused on practical AI workflows.

This repository is an implementation variant (Convex + LM Studio, no Slack/MCP) based on that direction.

## More Docs

- [Setup](/home/igorw/Frameworks/openbrain/docs/SETUP.md)
- [CLI Usage](/home/igorw/Frameworks/openbrain/docs/CLI_USAGE.md)
- [Troubleshooting](/home/igorw/Frameworks/openbrain/docs/TROUBLESHOOTING.md)
