import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const tsxBin = resolve(process.cwd(), "node_modules/.bin/tsx");
const cliPath = resolve(process.cwd(), "src/cli.ts");

test("remove rejects malformed --recent before loading runtime config", () => {
  const result = spawnSync(tsxBin, [cliPath, "remove", "--recent", "1abc"], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: { ...process.env },
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /recent must be an integer between 1 and 100/);
  assert.doesNotMatch(result.stderr, /Set CONVEX_URL|OPENBRAIN_REMOTE_URL/);
});
