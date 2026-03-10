type BaseThought = {
  _id: string;
  _creationTime: number;
  content: string;
};

export type PresentedThought = {
  content: string;
  createdAt: string;
};

export function toDisplayDate(epochMs: number): string {
  return new Date(epochMs).toISOString().slice(0, 10);
}

export function presentThought(thought: BaseThought): PresentedThought {
  return {
    content: thought.content,
    createdAt: toDisplayDate(thought._creationTime),
  };
}

export function presentMatch(thought: BaseThought): PresentedThought {
  return presentThought(thought);
}
