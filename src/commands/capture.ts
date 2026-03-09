import { embedText } from "../lmstudio";
import { api, createConvexClient } from "../convexClient";
import type { LocalOpenBrainConfig } from "../config";
import type { ThoughtSource } from "../domain/inputs";
import type { PresentedThought } from "../presenters";
import { toIsoTimestamp } from "../presenters";

export async function captureThought(
  cfg: LocalOpenBrainConfig,
  input: {
    content: string;
    source?: ThoughtSource;
    tags?: string[];
  },
): Promise<{ saved: PresentedThought }> {
  const client = createConvexClient(cfg.convexUrl);
  const tags = Array.from(new Set((input.tags ?? []).map((tag) => tag.trim()).filter(Boolean)));
  const source = input.source ?? "cli";
  const embedding = await embedText(input.content, cfg.lmStudioEmbedModel, cfg.lmStudioBaseUrl);
  const result = (await client.mutation(api.brain.captureThought, {
    content: input.content,
    embedding,
    source,
    tags,
  })) as { createdAt: number };
  return {
    saved: {
      content: input.content.trim(),
      tags,
      source,
      createdAt: toIsoTimestamp(result.createdAt),
    },
  };
}
