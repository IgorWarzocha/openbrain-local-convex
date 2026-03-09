import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { presentMatch, presentThought } from "../src/presenters";

type RankedThought = {
  _id: string;
  _creationTime: number;
  content: string;
  tags: string[];
  source: "cli" | "manual" | "api";
  score: number;
};

type StoredThought = {
  _id: string;
  _creationTime: number;
  content: string;
  tags: string[];
  source: "cli" | "manual" | "api";
  embedding: number[];
  createdAt: number;
};

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    return -1;
  }
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i += 1) {
    const av = a[i]!;
    const bv = b[i]!;
    dot += av * bv;
    magA += av * av;
    magB += bv * bv;
  }
  if (magA === 0 || magB === 0) {
    return -1;
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function normalizeExactContentMatch(content: string): string {
  return content.trim();
}

function rankThoughts(
  thoughts: StoredThought[],
  queryEmbedding: number[],
  limit: number,
  threshold: number,
): RankedThought[] {
  return thoughts
    .map(
      (thought): RankedThought => ({
        _id: thought._id,
        _creationTime: thought._creationTime,
        content: thought.content,
        tags: thought.tags,
        source: thought.source,
        score: cosineSimilarity(queryEmbedding, thought.embedding),
      }),
    )
    .filter((row) => row.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export const captureThought = mutation({
  args: {
    content: v.string(),
    embedding: v.array(v.number()),
    tags: v.optional(v.array(v.string())),
    source: v.optional(v.union(v.literal("cli"), v.literal("manual"), v.literal("api"))),
  },
  handler: async (ctx, args) => {
    const content = args.content.trim();
    if (content.length === 0) {
      throw new Error("content cannot be empty");
    }
    if (args.embedding.length === 0) {
      throw new Error("embedding cannot be empty");
    }

    const firstThought = await ctx.db.query("thoughts").first();
    if (firstThought && firstThought.embedding.length !== args.embedding.length) {
      throw new Error(
        `embedding dimension mismatch: expected ${firstThought.embedding.length}, got ${args.embedding.length}`,
      );
    }

    const createdAt = Date.now();
    const thoughtId = await ctx.db.insert("thoughts", {
      content,
      embedding: args.embedding,
      tags: Array.from(new Set((args.tags ?? []).map((tag) => tag.trim()).filter(Boolean))),
      source: args.source ?? "cli",
      createdAt,
    });

    const insertedThought = await ctx.db.get(thoughtId);
    if (!insertedThought) {
      throw new Error("failed to read inserted thought");
    }

    return {
      id: thoughtId,
      createdAt: insertedThought._creationTime,
      embeddingDimensions: args.embedding.length,
    };
  },
});

export const searchThoughts = query({
  args: {
    queryEmbedding: v.array(v.number()),
    limit: v.optional(v.number()),
    threshold: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.queryEmbedding.length === 0) {
      throw new Error("queryEmbedding cannot be empty");
    }

    const limit = Math.min(Math.max(Math.floor(args.limit ?? 8), 1), 50);
    const threshold = args.threshold ?? 0.2;
    const thoughts = await ctx.db.query("thoughts").collect();

    const ranked = rankThoughts(thoughts as StoredThought[], args.queryEmbedding, limit, threshold);

    return {
      thoughts: ranked.map((thought) => presentMatch(thought)),
    };
  },
});

export const listRecentThoughts = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(Math.floor(args.limit ?? 20), 1), 100);
    const thoughts = await ctx.db.query("thoughts").withIndex("by_createdAt").order("desc").take(limit);
    return {
      thoughts: thoughts.map((thought) => presentThought(thought)),
    };
  },
});

export const listRecentThoughtsForRemoval = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(Math.floor(args.limit ?? 20), 1), 100);
    const thoughts = await ctx.db.query("thoughts").withIndex("by_createdAt").order("desc").take(limit);
    return thoughts.map((thought) => ({
      id: thought._id,
      ...presentThought(thought),
    }));
  },
});

export const findThoughtsByExactContent = query({
  args: {
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedContent = normalizeExactContentMatch(args.content);
    if (!normalizedContent) {
      throw new Error("content cannot be empty");
    }
    const thoughts = await ctx.db.query("thoughts").collect();
    return thoughts
      .filter((thought) => thought.content.trim() === normalizedContent)
      .sort((a, b) => b._creationTime - a._creationTime)
      .map((thought) => ({
        id: thought._id,
        ...presentThought(thought),
      }));
  },
});

export const searchThoughtsForRemoval = query({
  args: {
    queryEmbedding: v.array(v.number()),
    limit: v.optional(v.number()),
    threshold: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.queryEmbedding.length === 0) {
      throw new Error("queryEmbedding cannot be empty");
    }
    const limit = Math.min(Math.max(Math.floor(args.limit ?? 3), 1), 10);
    const threshold = args.threshold ?? 0.35;
    const thoughts = await ctx.db.query("thoughts").collect();
    const ranked = rankThoughts(thoughts as StoredThought[], args.queryEmbedding, limit, threshold);
    return ranked.map((thought) => ({
      id: thought._id,
      ...presentMatch(thought),
    }));
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const thoughts = await ctx.db.query("thoughts").collect();
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    let inLast7Days = 0;
    let inLast30Days = 0;
    for (const thought of thoughts) {
      if (thought.createdAt >= sevenDaysAgo) {
        inLast7Days += 1;
      }
      if (thought.createdAt >= thirtyDaysAgo) {
        inLast30Days += 1;
      }
    }

    return {
      totalThoughts: thoughts.length,
      inLast7Days,
      inLast30Days,
    };
  },
});

export const removeThought = mutation({
  args: {
    id: v.id("thoughts"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("thought not found");
    }
    await ctx.db.delete(args.id);
    return {
      removedAt: Date.now(),
    };
  },
});
