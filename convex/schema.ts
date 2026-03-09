import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  thoughts: defineTable({
    content: v.string(),
    embedding: v.array(v.number()),
    tags: v.array(v.string()),
    source: v.optional(v.union(v.literal("cli"), v.literal("manual"), v.literal("api"))),
    createdAt: v.number(),
  }).index("by_createdAt", ["createdAt"]),
});
