import { api, createConvexClient } from "../convexClient";
import type { LocalOpenBrainConfig } from "../config";

export async function listRecentThoughts(
  cfg: LocalOpenBrainConfig,
  input: { limit?: number; date?: string } = {},
) {
  const client = createConvexClient(cfg.convexUrl);
  const args: {
    limit?: number;
    date?: string;
  } = {};
  if (input.limit !== undefined) {
    args.limit = input.limit;
  }
  if (input.date !== undefined) {
    args.date = input.date;
  }
  return (await client.query(api.brain.listRecentThoughts, args)) as {
    thoughts: Array<{
      content: string;
      createdAt: string;
    }>;
  };
}
