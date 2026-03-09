# CLI Usage

Run all commands from repository root.

Mode selection:

- Local mode: set `CONVEX_URL` (default behavior).
- Remote LAN mode: set `OPENBRAIN_REMOTE_URL=http://<server-ip>:8787` and optionally `OPENBRAIN_API_KEY`.

To use commands globally from anywhere:

```bash
npm run link:global
```

System-wide (requires sudo):

```bash
npm run link:global:system
```

## Health

```bash
npm run health
```

## Capture

```bash
npm run brain -- capture "Your thought here" --tags planning,idea
```

## Semantic Search

```bash
npm run brain -- search "what did I write about launch risk?" --limit 8 --threshold 0.2
```

## Recent Thoughts

```bash
npm run brain -- recent --limit 20
```

## Stats

```bash
npm run brain -- stats
```

## Remove Thought

```bash
npm run brain -- remove --recent 1
npm run brain -- remove --content "Your exact thought here"
npm run brain -- remove --query "the thought about launch risk"
```

## HTTP API

- `GET /health`
- `GET /stats`
- `GET /recent?limit=20`
- `POST /capture`
- `POST /search`
- `POST /remove`

Example:

```bash
curl -s -X POST http://127.0.0.1:8787/capture \
  -H 'content-type: application/json' \
  -d '{"content":"note from api","tags":["ops"]}'
```

With key auth enabled on server:

```bash
curl -s -X POST "http://192.168.0.113:8787/capture" \
  -H 'x-openbrain-key: <shared-secret>' \
  -H 'content-type: application/json' \
  -d '{"content":"note from api","tags":["ops"]}'
```

Remove by recent position:

```bash
curl -s -X POST "http://192.168.0.113:8787/remove" \
  -H 'x-openbrain-key: <shared-secret>' \
  -H 'content-type: application/json' \
  -d '{"recent":1}'
```

Remove by exact content:

```bash
curl -s -X POST "http://192.168.0.113:8787/remove" \
  -H 'x-openbrain-key: <shared-secret>' \
  -H 'content-type: application/json' \
  -d '{"content":"Your exact thought here"}'
```
