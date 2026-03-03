# CLI Usage

Run all commands from repository root.

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
npm run brain -- capture "Your thought here" --source cli --tags planning,idea
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

## HTTP API

- `GET /health`
- `GET /stats`
- `GET /recent?limit=20`
- `POST /capture`
- `POST /search`

Example:

```bash
curl -s -X POST http://127.0.0.1:8787/capture \
  -H 'content-type: application/json' \
  -d '{"content":"note from api","source":"api","tags":["ops"]}'
```
