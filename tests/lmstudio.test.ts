import test from "node:test";
import assert from "node:assert/strict";
import { parseEmbeddingsResponse } from "../src/lmstudio";

test("parseEmbeddingsResponse returns first embedding vector", () => {
  const vector = parseEmbeddingsResponse({
    data: [
      { embedding: [0.1, 0.2, 0.3], index: 0 },
      { embedding: [0.9, 1.0, 1.1], index: 1 },
    ],
  });
  assert.deepEqual(vector, [0.1, 0.2, 0.3]);
});

test("parseEmbeddingsResponse fails on invalid shape", () => {
  assert.throws(() => parseEmbeddingsResponse({ nope: true }), /Invalid LM Studio embeddings response/);
  assert.throws(() => parseEmbeddingsResponse({ data: [] }), /empty embedding/);
});

