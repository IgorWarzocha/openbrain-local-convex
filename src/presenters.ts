import type { ThoughtSource } from "./domain/inputs";

type BaseThought = {
  _id: string;
  _creationTime: number;
  content: string;
  tags: string[];
  source: ThoughtSource;
};

export type PresentedThought = {
  content: string;
  tags: string[];
  source: ThoughtSource;
  createdAt: string;
};

export function toIsoTimestamp(epochMs: number): string {
  return new Date(epochMs).toISOString();
}

export function presentThought(thought: BaseThought): PresentedThought {
  return {
    content: thought.content,
    tags: thought.tags,
    source: thought.source,
    createdAt: toIsoTimestamp(thought._creationTime),
  };
}

export function presentMatch(thought: BaseThought): PresentedThought {
  return presentThought(thought);
}
