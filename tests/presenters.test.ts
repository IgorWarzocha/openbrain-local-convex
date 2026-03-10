import test from "node:test";
import assert from "node:assert/strict";
import { presentThought } from "../src/presenters";

test("presentThought returns only content and normalized date", () => {
  const presented = presentThought({
    _id: "thoughts:123",
    _creationTime: Date.UTC(2026, 2, 9, 16, 54, 21, 492),
    content: "Good memory systems need both retention and forgetting.",
  });

  assert.deepEqual(presented, {
    content: "Good memory systems need both retention and forgetting.",
    createdAt: "2026-03-09",
  });
});
