import { embedText } from "../lmstudio";
import { api, createConvexClient } from "../convexClient";
import type { LocalOpenBrainConfig } from "../config";
import type { PresentedThought } from "../presenters";
import { toDisplayDate } from "../presenters";
import type { Id } from "../../convex/_generated/dataModel";

type RemovalCandidate = PresentedThought & {
  id: string;
};

type RankedRemovalCandidate = PresentedThought & {
  id: string;
};

export type RemoveThoughtInput =
  | {
      content: string;
      query?: never;
      recent?: never;
      threshold?: never;
    }
  | {
      content?: never;
      query: string;
      recent?: never;
      threshold?: number;
    }
  | {
      content?: never;
      query?: never;
      recent: number;
      threshold?: never;
    };

export type RemoveThoughtResult = {
  removedAt: string;
  removed: PresentedThought;
};

function buildAmbiguousRemovalError(
  mode: "exact content" | "semantic query",
  candidates: PresentedThought[],
): Error {
  const preview = candidates
    .slice(0, 3)
    .map((candidate, index) => `${index + 1}. [${candidate.createdAt}] ${candidate.content}`)
    .join("\n");
  return new Error(
    `remove is ambiguous for ${mode}. Narrow it down or use --recent.\n${preview}`,
  );
}

export async function removeThought(
  cfg: LocalOpenBrainConfig,
  input: RemoveThoughtInput,
): Promise<RemoveThoughtResult> {
  const client = createConvexClient(cfg.convexUrl);

  let target: RemovalCandidate | RankedRemovalCandidate | null = null;

  if ("recent" in input) {
    const recent = await client.query(api.brain.listRecentThoughtsForRemoval, {
      limit: input.recent,
    }) as RemovalCandidate[];
    target = recent[input.recent - 1] ?? null;
    if (!target) {
      throw new Error(`recent position ${input.recent} does not exist`);
    }
  } else if ("content" in input) {
    const matches = await client.query(api.brain.findThoughtsByExactContent, {
      content: input.content,
    }) as RemovalCandidate[];
    if (matches.length === 0) {
      throw new Error("no thought matched that exact content");
    }
    if (matches.length > 1) {
      throw buildAmbiguousRemovalError("exact content", matches);
    }
    target = matches[0] ?? null;
  } else {
    const queryEmbedding = await embedText(input.query, cfg.lmStudioEmbedModel, cfg.lmStudioBaseUrl);
    const matches = await client.query(api.brain.searchThoughtsForRemoval, {
      queryEmbedding,
      limit: 3,
      threshold: input.threshold ?? 0.35,
    }) as RankedRemovalCandidate[];
    if (matches.length === 0) {
      throw new Error("no thought matched that query strongly enough");
    }
    if (matches.length > 1) {
      throw buildAmbiguousRemovalError("semantic query", matches);
    }
    target = matches[0] ?? null;
  }

  if (!target) {
    throw new Error("failed to resolve removal target");
  }

  const result = await client.mutation(api.brain.removeThought, {
    id: target.id as Id<"thoughts">,
  }) as { removedAt: number };

  return {
    removedAt: toDisplayDate(result.removedAt),
    removed: {
      content: target.content,
      createdAt: target.createdAt,
    },
  };
}
