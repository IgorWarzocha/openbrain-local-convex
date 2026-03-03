import test from "node:test";
import assert from "node:assert/strict";
import { buildRemoteUrl, parseApiEnvelope } from "../src/remoteApi";

test("buildRemoteUrl joins base and path and encodes query", () => {
  const url = buildRemoteUrl("http://192.168.0.113:8787/", "/recent", {
    limit: 20,
    q: "launch risk",
  });
  assert.equal(url, "http://192.168.0.113:8787/recent?limit=20&q=launch+risk");
});

test("parseApiEnvelope validates success payload", () => {
  const parsed = parseApiEnvelope({
    ok: true,
    data: { totalThoughts: 5 },
  });
  assert.deepEqual(parsed, { ok: true, data: { totalThoughts: 5 } });
});

test("parseApiEnvelope returns error payload when ok=false", () => {
  const parsed = parseApiEnvelope({
    ok: false,
    error: "unauthorized",
  });
  assert.deepEqual(parsed, { ok: false, error: "unauthorized" });
});

test("parseApiEnvelope fails for invalid shape", () => {
  assert.throws(() => parseApiEnvelope({ data: {} }), /Invalid remote API response shape/);
});

