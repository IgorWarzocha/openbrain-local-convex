import { api, createConvexClient } from "../convexClient";
import type { LocalOpenBrainConfig } from "../config";

export async function getStats(cfg: LocalOpenBrainConfig) {
  const client = createConvexClient(cfg.convexUrl);
  return await client.query(api.brain.getStats, {});
}
