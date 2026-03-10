import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeTags,
  parseDateFilter,
  parseLimit,
  parseRecent,
  parseThreshold,
} from "../src/domain/inputs";

test("normalizeTags deduplicates and trims string input", () => {
  const tags = normalizeTags(" alpha, beta,alpha , ,gamma ");
  assert.deepEqual(tags, ["alpha", "beta", "gamma"]);
});

test("parseLimit and parseThreshold enforce valid ranges", () => {
  assert.equal(parseLimit("10", 8), 10);
  assert.equal(parseThreshold("0.4", 0.2), 0.4);
  assert.throws(() => parseLimit("0", 8), /integer between 1 and 100/);
  assert.throws(() => parseThreshold("2", 0.2), /number between -1 and 1/);
});

test("parseRecent rejects malformed selectors instead of truncating them", () => {
  assert.equal(parseRecent("1"), 1);
  assert.throws(() => parseRecent("1.5"), /recent must be an integer between 1 and 100/);
  assert.throws(() => parseRecent("1abc"), /recent must be an integer between 1 and 100/);
});

test("parseDateFilter normalizes human date tokens", () => {
  const now = new Date("2026-03-10T12:00:00.000Z");
  assert.equal(parseDateFilter("today", now), "2026-03-10");
  assert.equal(parseDateFilter("yesterday", now), "2026-03-09");
  assert.equal(parseDateFilter("2026-03-08", now), "2026-03-08");
  assert.equal(parseDateFilter(undefined, now), undefined);
  assert.throws(() => parseDateFilter("tomorrow", now), /today, yesterday, or YYYY-MM-DD/);
  assert.throws(() => parseDateFilter("2026-02-30", now), /today, yesterday, or YYYY-MM-DD/);
});
