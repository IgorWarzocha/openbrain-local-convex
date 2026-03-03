import { api, createConvexClient } from "../convexClient";
import type { OpenBrainConfig } from "../config";

export async function getStats(cfg: OpenBrainConfig) {
  const client = createConvexClient(cfg.convexUrl);
  return await client.query(api.brain.getStats, {});
}

