import { embedText } from "../lmstudio";
import { api, createConvexClient } from "../convexClient";
import type { LocalOpenBrainConfig } from "../config";

export async function searchThoughts(
  cfg: LocalOpenBrainConfig,
  input: {
    query: string;
    limit?: number;
    threshold?: number;
    date?: string;
  },
) {
  const client = createConvexClient(cfg.convexUrl);
  const queryEmbedding = await embedText(input.query, cfg.lmStudioEmbedModel, cfg.lmStudioBaseUrl);
  const args: {
    queryEmbedding: number[];
    limit?: number;
    threshold?: number;
    date?: string;
  } = {
    queryEmbedding,
  };
  if (input.limit !== undefined) {
    args.limit = input.limit;
  }
  if (input.threshold !== undefined) {
    args.threshold = input.threshold;
  }
  if (input.date !== undefined) {
    args.date = input.date;
  }
  return (await client.query(api.brain.searchThoughts, args)) as {
    thoughts: Array<{
      content: string;
      createdAt: string;
    }>;
  };
}
