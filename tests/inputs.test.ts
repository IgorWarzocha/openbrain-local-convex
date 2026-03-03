import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeTags,
  parseLimit,
  parseThreshold,
  parseThoughtSource,
} from "../src/domain/inputs";

test("normalizeTags deduplicates and trims string input", () => {
  const tags = normalizeTags(" alpha, beta,alpha , ,gamma ");
  assert.deepEqual(tags, ["alpha", "beta", "gamma"]);
});

test("parseThoughtSource validates source values", () => {
  assert.equal(parseThoughtSource("cli"), "cli");
  assert.equal(parseThoughtSource(undefined, "manual"), "manual");
  assert.throws(() => parseThoughtSource("desktop"), /invalid source/);
});

test("parseLimit and parseThreshold enforce valid ranges", () => {
  assert.equal(parseLimit("10", 8), 10);
  assert.equal(parseThreshold("0.4", 0.2), 0.4);
  assert.throws(() => parseLimit("0", 8), /integer between 1 and 100/);
  assert.throws(() => parseThreshold("2", 0.2), /number between -1 and 1/);
});

