# Setup

## Local Machine

1. Install deps:

```bash
npm ci
```

2. Bootstrap local Convex deployment (interactive on first run):

```bash
npx convex dev --configure new --dev-deployment local --once
```

3. Configure runtime env:

```bash
cp .env.example .env
```

4. Ensure LM Studio server is running and model is loaded:

```bash
~/.lmstudio/bin/lms daemon up
~/.lmstudio/bin/lms load text-embedding-embeddinggemma-300m-qat --yes
~/.lmstudio/bin/lms server start
```

5. Verify:

```bash
npm run health
```

## Server Deploy (Linux)

1. Sync repo to server:

```bash
bash scripts/deploy-server.sh <host> <remote_dir>
```

2. Bootstrap Convex once on server (interactive):

```bash
bash scripts/bootstrap-server-interactive.sh <host> <remote_dir>
```

3. Install LM Studio headless runtime and model on server:

```bash
ssh <host> "curl -fsSL https://lmstudio.ai/install.sh | bash"
ssh <host> "~/.lmstudio/bin/lms get embeddinggemma -n 20 -y"
```

4. Install and start user services:

```bash
ssh <host> "cd <remote_dir> && bash scripts/services.sh install"
```

5. Check health:

```bash
ssh <host> "cd <remote_dir> && npm run health"
```

