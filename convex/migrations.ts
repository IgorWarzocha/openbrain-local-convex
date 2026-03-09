import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

type LegacyThought = {
  _id: string;
  content: string;
  embedding: number[];
  tags: string[];
  createdAt: number;
  source?: "cli" | "manual" | "api";
};

export const countThoughtsWithLegacySource = query({
  args: {},
  handler: async (ctx) => {
    const thoughts = (await ctx.db.query("thoughts").collect()) as LegacyThought[];
    return thoughts.filter((thought) => thought.source !== undefined).length;
  },
});

export const stripLegacyThoughtSource = mutation({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(Math.floor(args.limit ?? 256), 1), 1024);
    const thoughts = (await ctx.db.query("thoughts").collect()) as LegacyThought[];
    const candidates = thoughts.filter((thought) => thought.source !== undefined).slice(0, limit);

    for (const thought of candidates) {
      await ctx.db.replace(thought._id as Id<"thoughts">, {
        content: thought.content,
        embedding: thought.embedding,
        tags: thought.tags,
        createdAt: thought.createdAt,
      });
    }

    return {
      updated: candidates.length,
      remaining: thoughts.filter((thought) => thought.source !== undefined).length - candidates.length,
    };
  },
});
