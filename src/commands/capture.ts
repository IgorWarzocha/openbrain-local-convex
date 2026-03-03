import { embedText } from "../lmstudio";
import { api, createConvexClient } from "../convexClient";
import type { LocalOpenBrainConfig } from "../config";
import type { ThoughtSource } from "../domain/inputs";

export async function captureThought(
  cfg: LocalOpenBrainConfig,
  input: {
    content: string;
    source?: ThoughtSource;
    tags?: string[];
  },
): Promise<{ id: string; createdAt: number; embeddingDimensions: number }> {
  const client = createConvexClient(cfg.convexUrl);
  const embedding = await embedText(input.content, cfg.lmStudioEmbedModel, cfg.lmStudioBaseUrl);
  return (await client.mutation(api.brain.captureThought, {
    content: input.content,
    embedding,
    source: input.source ?? "cli",
    tags: input.tags ?? [],
  })) as { id: string; createdAt: number; embeddingDimensions: number };
}
