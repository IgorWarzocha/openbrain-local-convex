import test from "node:test";
import assert from "node:assert/strict";
import { parseEnvironment } from "../src/config";

test("parseEnvironment uses defaults and trims trailing slash on LM Studio URL", () => {
  const cfg = parseEnvironment({
    CONVEX_URL: "http://127.0.0.1:3210",
    LMSTUDIO_BASE_URL: "http://127.0.0.1:1234/v1/",
  });

  assert.equal(cfg.convexUrl, "http://127.0.0.1:3210");
  assert.equal(cfg.lmStudioBaseUrl, "http://127.0.0.1:1234/v1");
  assert.equal(cfg.lmStudioEmbedModel, "text-embedding-embeddinggemma-300m-qat");
  assert.equal(cfg.apiHost, "127.0.0.1");
  assert.equal(cfg.apiPort, 8787);
});

test("parseEnvironment fails when CONVEX_URL is missing", () => {
  assert.throws(() => parseEnvironment({}), /CONVEX_URL is required/);
});

