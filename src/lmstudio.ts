import { z } from "zod";

const EmbeddingsResponseSchema = z.object({
  data: z.array(
    z.object({
      embedding: z.array(z.number()),
      index: z.number().optional(),
    }),
  ),
});

export function parseEmbeddingsResponse(payload: unknown): number[] {
  const parsed = EmbeddingsResponseSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(`Invalid LM Studio embeddings response: ${parsed.error.message}`);
  }
  const embedding = parsed.data.data[0]?.embedding;
  if (!embedding || embedding.length === 0) {
    throw new Error("LM Studio returned an empty embedding");
  }
  return embedding;
}

export async function embedText(input: string, model: string, baseUrl: string): Promise<number[]> {
  const payload = {
    model,
    input,
    encoding_format: "float",
  };

  const response = await fetch(`${baseUrl}/embeddings`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`LM Studio embeddings request failed (${response.status}): ${body}`);
  }

  return parseEmbeddingsResponse(await response.json());
}

export async function checkLmStudioHealth(model: string, baseUrl: string): Promise<{ dimensions: number }> {
  const probe = await embedText("healthcheck", model, baseUrl);
  return { dimensions: probe.length };
}
