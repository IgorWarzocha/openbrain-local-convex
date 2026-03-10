import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const tsxBin = resolve(process.cwd(), "node_modules/.bin/tsx");
const cliPath = resolve(process.cwd(), "src/cli.ts");

test("recent rejects malformed date before loading runtime config", () => {
  const result = spawnSync(tsxBin, [cliPath, "recent", "tomorrow"], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: { ...process.env },
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /date must be today, yesterday, or YYYY-MM-DD/);
  assert.doesNotMatch(result.stderr, /Set CONVEX_URL|OPENBRAIN_REMOTE_URL/);
});

test("search rejects malformed date before loading runtime config", () => {
  const result = spawnSync(tsxBin, [cliPath, "search", "memory", "tomorrow"], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: { ...process.env },
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /date must be today, yesterday, or YYYY-MM-DD/);
  assert.doesNotMatch(result.stderr, /Set CONVEX_URL|OPENBRAIN_REMOTE_URL/);
});
