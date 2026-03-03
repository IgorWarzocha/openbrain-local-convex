import { embedText } from "../lmstudio";
import { api, createConvexClient } from "../convexClient";
import type { OpenBrainConfig } from "../config";

export async function searchThoughts(
  cfg: OpenBrainConfig,
  input: {
    query: string;
    limit?: number;
    threshold?: number;
  },
) {
  const client = createConvexClient(cfg.convexUrl);
  const queryEmbedding = await embedText(input.query, cfg.lmStudioEmbedModel, cfg.lmStudioBaseUrl);
  const args: {
    queryEmbedding: number[];
    limit?: number;
    threshold?: number;
  } = {
    queryEmbedding,
  };
  if (input.limit !== undefined) {
    args.limit = input.limit;
  }
  if (input.threshold !== undefined) {
    args.threshold = input.threshold;
  }
  return await client.query(api.brain.searchThoughts, args);
}
