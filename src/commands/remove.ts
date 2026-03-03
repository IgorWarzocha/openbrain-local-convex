import { api, createConvexClient } from "../convexClient";
import type { Id } from "../../convex/_generated/dataModel";
import type { LocalOpenBrainConfig } from "../config";

export async function removeThought(cfg: LocalOpenBrainConfig, id: string): Promise<{ id: string; removedAt: number }> {
  const thoughtId = id.trim();
  if (!thoughtId) {
    throw new Error("thought id is required");
  }
  const client = createConvexClient(cfg.convexUrl);
  return (await client.mutation(api.brain.removeThought, {
    id: thoughtId as Id<"thoughts">,
  })) as { id: string; removedAt: number };
}
