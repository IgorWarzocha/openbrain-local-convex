# Open Brain on Convex - TODO

## Phase 0 - Decisions (Blockers)
- [ ] Confirm LM Studio API endpoint on `192.168.0.113` for embeddings.
- [ ] Confirm embedding model:
  - `google/embeddinggemma-300m`
  - Record exact output dimensions from a real embedding call and lock schema to that value.
- [ ] Confirm single-user MVP scope.

## Phase 1 - Project Bootstrap
- [ ] Initialize project files:
  - `package.json`
  - `.gitignore`
  - `README.md`
  - `docs/PRD.md`
  - `docs/TODO.md`
- [ ] Initialize Convex project and deploy baseline.
- [ ] Add local `.env` file template for runtime config:
  - `LMSTUDIO_BASE_URL`
  - `LMSTUDIO_EMBED_MODEL=google/embeddinggemma-300m`

## Phase 2 - Convex Data Layer
- [ ] Implement `convex/schema.ts` with:
  - `thoughts` table + vector index (dims = selected local model output).
- [ ] Add indexes:
  - `thoughts.by_createdAt`
- [ ] Write core mutations/queries:
  - `captureThought`
  - `searchByVector`
  - `listRecentThoughts`
  - `getStats`

## Phase 3 - Enrichment Pipeline
- [ ] Implement LM Studio embeddings client utility (HTTP call to local LM Studio endpoint).
- [ ] Add startup/runtime health check for LM Studio connectivity and model availability.
- [ ] Implement capture orchestration path using LM Studio embeddings + Convex mutation.
- [ ] Add strict validation and explicit error surfaces (no silent fallbacks).

## Phase 4 - Retrieval API (Convex)
- [ ] Implement `searchThoughts` action:
  - query embedding from LM Studio
  - vector search
  - threshold + limit
- [ ] Implement recent/browse endpoint logic.
- [ ] Implement stats logic (total + 7d + 30d).

## Phase 5 - Local Host Setup (`192.168.0.113`)
- [ ] Install Convex CLI on host.
- [ ] Install and configure LM Studio headless Vulkan runtime on host.
- [ ] Load `google/embeddinggemma-300m` in LM Studio and verify embeddings endpoint.
- [ ] Deploy Open Brain runtime process on host.
- [ ] Create and enable systemd service for Open Brain runtime.
- [ ] Smoke-test service restart behavior.

## Phase 6 - Local CLI Workflow
- [ ] Add minimal local CLI commands/scripts:
  - `capture`
  - `search`
  - `recent`
  - `stats`
- [ ] Validate coding agents can call Convex functions directly via CLI/workflow scripts.

## Phase 7 - E2E Validation
- [ ] CLI/local capture test.
- [ ] Semantic retrieval test with paraphrased query.
- [ ] Process restart test (`systemctl restart` then capture/search works).

## Phase 8 - Handoff Docs
- [ ] Add `docs/SETUP.md` (local Convex + LM Studio + local CLI workflow).
- [ ] Add `docs/CLI_USAGE.md` (capture/search/recent/stats commands).
- [ ] Add `docs/TROUBLESHOOTING.md` (common failures + quick fixes).
- [ ] Add `docs/CREDENTIAL_TRACKER_TEMPLATE.md`.
