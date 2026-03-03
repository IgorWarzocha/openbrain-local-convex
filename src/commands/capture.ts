import { embedText } from "../lmstudio";
import { api, createConvexClient } from "../convexClient";
import type { OpenBrainConfig } from "../config";
import type { ThoughtSource } from "../domain/inputs";

export async function captureThought(
  cfg: OpenBrainConfig,
  input: {
    content: string;
    source?: ThoughtSource;
    tags?: string[];
  },
) {
  const client = createConvexClient(cfg.convexUrl);
  const embedding = await embedText(input.content, cfg.lmStudioEmbedModel, cfg.lmStudioBaseUrl);
  return await client.mutation(api.brain.captureThought, {
    content: input.content,
    embedding,
    source: input.source ?? "cli",
    tags: input.tags ?? [],
  });
}
