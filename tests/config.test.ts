import test from "node:test";
import assert from "node:assert/strict";
import { parseEnvironment } from "../src/config";

test("parseEnvironment uses defaults and trims trailing slash on LM Studio URL", () => {
  const cfg = parseEnvironment({
    CONVEX_URL: "http://127.0.0.1:3210",
    LMSTUDIO_BASE_URL: "http://127.0.0.1:1234/v1/",
  });

  assert.equal(cfg.mode, "local");
  assert.equal(cfg.convexUrl, "http://127.0.0.1:3210");
  assert.equal(cfg.remoteUrl, null);
  assert.equal(cfg.lmStudioBaseUrl, "http://127.0.0.1:1234/v1");
  assert.equal(cfg.lmStudioEmbedModel, "text-embedding-embeddinggemma-300m-qat");
  assert.equal(cfg.apiHost, "127.0.0.1");
  assert.equal(cfg.apiPort, 8787);
});

test("parseEnvironment supports remote mode without CONVEX_URL", () => {
  const cfg = parseEnvironment({
    OPENBRAIN_REMOTE_URL: "http://192.168.0.113:8787/",
    OPENBRAIN_API_KEY: "  secret  ",
  });

  assert.equal(cfg.mode, "remote");
  assert.equal(cfg.convexUrl, null);
  assert.equal(cfg.remoteUrl, "http://192.168.0.113:8787");
  assert.equal(cfg.apiKey, "secret");
});

test("parseEnvironment prefers remote mode when both remote and local are set", () => {
  const cfg = parseEnvironment({
    CONVEX_URL: "http://127.0.0.1:3210",
    OPENBRAIN_REMOTE_URL: "http://192.168.0.113:8787",
  });
  assert.equal(cfg.mode, "remote");
  assert.equal(cfg.remoteUrl, "http://192.168.0.113:8787");
  assert.equal(cfg.convexUrl, null);
});

test("parseEnvironment fails when neither CONVEX_URL nor OPENBRAIN_REMOTE_URL is set", () => {
  assert.throws(() => parseEnvironment({}), /Set CONVEX_URL for local mode or OPENBRAIN_REMOTE_URL/);
});

test("parseEnvironment treats empty remote URL as missing", () => {
  assert.throws(() => parseEnvironment({ OPENBRAIN_REMOTE_URL: "   " }), /Set CONVEX_URL/);
});
