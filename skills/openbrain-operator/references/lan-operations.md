# LAN Operations

Use this reference only when active mode is `lan`.

## 1. Preflight

Check CLI entrypoint:

```bash
brain health
```

If `brain` is not found:

```bash
npm run brain -- health
```

Health must return JSON with:
- `"ok": true`
- `"mode": "remote"`
- `remoteUrl` set to server API (for example `http://192.168.0.113:8787`)

## 2. Connectivity Checks

API probe:

```bash
curl -fsS http://<server-ip>:8787/health
```

If key auth is enabled:

```bash
curl -fsS http://<server-ip>:8787/health -H "x-openbrain-key: <shared-secret>"
```

## 3. Core Operations

Capture:

```bash
brain capture "LAN memory write test" --source cli --tags lan,ops
```

Search:

```bash
brain search "LAN memory write test" --limit 8 --threshold 0.2
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

## 4. Direct API Calls

Capture via API:

```bash
curl -sS -X POST http://<server-ip>:8787/capture \
  -H 'content-type: application/json' \
  -d '{"content":"note from api","source":"api","tags":["ops"]}'
```

Capture via API with key:

```bash
curl -sS -X POST http://<server-ip>:8787/capture \
  -H 'x-openbrain-key: <shared-secret>' \
  -H 'content-type: application/json' \
  -d '{"content":"note from api","source":"api","tags":["ops"]}'
```

## 5. Retrieval Tuning

If too strict:

```bash
brain search "<query>" --limit 20 --threshold 0.0
```

If too noisy:

```bash
brain search "<query>" --limit 8 --threshold 0.3
```
