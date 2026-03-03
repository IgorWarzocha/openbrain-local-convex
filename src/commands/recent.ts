import { api, createConvexClient } from "../convexClient";
import type { LocalOpenBrainConfig } from "../config";

export async function listRecentThoughts(cfg: LocalOpenBrainConfig, limit?: number) {
  const client = createConvexClient(cfg.convexUrl);
  if (limit === undefined) {
    return await client.query(api.brain.listRecentThoughts, {});
  }
  return await client.query(api.brain.listRecentThoughts, { limit });
}
