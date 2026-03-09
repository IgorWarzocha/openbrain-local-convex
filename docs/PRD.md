# Open Brain on Convex - PRD

## 1) Product Summary
Build a personal "open brain" on Convex with:
- Convex as the single backend + database.
- Local capture and retrieval flows for coding CLIs.
- Local embeddings to avoid per-token embedding cost.
- Direct Convex function calls from local tooling.

No Slack dependency. No ChatGPT web connector. No MCP in MVP.

## 2) Goals
- Store thoughts in one durable Convex database.
- Retrieve thoughts semantically (meaning-based search).
- Keep implementation KISS: minimal moving parts, minimal schema, minimal tooling.
- Support local coding agents via direct Convex function calls.

## 3) Non-Goals (MVP)
- No Slack ingestion.
- No multi-user auth model.
- No advanced taxonomy/classification engine.
- No ChatGPT web connector.
- No MCP protocol integration.
- No enterprise-grade ops stack.

## 4) Success Criteria
- A thought can be captured from:
  - local CLI/agent workflow.
- Semantic query returns relevant paraphrase matches.
- Core tools work:
  - `captureThought`
  - `searchThoughts`
  - `listRecentThoughts`
  - `getStats`
- No hidden failures: invalid inputs and provider failures return explicit errors.

## 5) Architecture
### Core
- Convex
  - schema + vector index
  - mutations/actions/queries
  - env var storage for keys
  - deployed locally (self-hosted/local deployment target)
- Local server (`192.168.0.113`)
  - runs LM Studio in headless Vulkan mode
  - runs Open Brain local process as a system service
  - runs Convex CLI tooling for project workflow

### Embeddings
- Runtime: LM Studio local API.
- Model: `google/embeddinggemma-300m`.
- Embedding dimensionality is read from real runtime output during setup and enforced in schema.
- Embeddings happen on `192.168.0.113`, not via paid remote API.

### Access Pattern
- Local CLI and agents call Convex functions directly.
- Optional thin local command wrapper can provide:
  - `openbrain capture "..."`
  - `openbrain search "..."`
  - `openbrain recent`
  - `openbrain stats`

## 6) Data Model (KISS)
- `thoughts`
  - `content: string`
  - `embedding: number[]` (model-specific fixed length)
  - `tags: string[]` (optional, default `[]`, internal metadata only)
  - `createdAt: number`
  - indexes:
    - `by_createdAt`
  - vector index:
    - `by_embedding`

No ingestion event table in MVP.

## 7) Functional Requirements
### FR1: Capture Thought
- Accept plain text content.
- Generate embedding via local embeddings service.
- Persist thought row.
- Return a human-readable saved-thought summary with timestamp.

### FR2: Search Thoughts
- Embed query text via local embeddings service.
- Run vector search.
- Return the best matching thoughts only.
- Support optional limit + threshold.

### FR3: List Recent
- Return latest N thoughts sorted by `createdAt desc`.

### FR4: Stats
- Return total thought count.
- Return count in last 7 and 30 days.

### FR5: Local Function Interface
- `captureThought(content, tags?)`
- `searchThoughts(query, limit?, threshold?)`
- `listRecentThoughts(limit?)`
- `removeThought(content|query|recent)`
- `getStats()`

## 8) Security Requirements
- Convex env vars:
  - `LMSTUDIO_BASE_URL`
  - `LMSTUDIO_EMBED_MODEL` (default `google/embeddinggemma-300m`)
- Do not log secret values.
- Keep local services LAN-scoped unless explicitly exposed.

## 9) Failure Behavior
- Fail fast on invalid args (4xx-style tool errors).
- Fail fast on missing env vars.
- Fail fast on LM Studio connectivity/model errors with clear messages.
- No silent retries in MVP.

## 10) Rollout Plan
- Phase 1: Convex schema + core capture/search functions.
- Phase 2: local Convex function interface + CLI workflow.
- Phase 3: LM Studio integration on `192.168.0.113`.
- Phase 4: systemd service setup and lightweight docs.

## 11) Acceptance Tests
- `captureThought` stores a row with correct fixed-length embedding for the selected model.
- `searchThoughts` finds a semantically similar thought using paraphrased query.
- `listRecentThoughts` returns correct order.
- `getStats` returns expected counts.
