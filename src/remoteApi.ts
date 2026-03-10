import { z } from "zod";
import type { RemoteOpenBrainConfig } from "./config";
import type { PresentedThought } from "./presenters";

const ApiEnvelopeSchema = z.object({
  ok: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
});

type RequestInitLike = {
  method: "GET" | "POST";
  query?: Record<string, string | number | undefined>;
  body?: unknown;
};

export type CaptureResult = {
  saved: PresentedThought;
};

export type SearchResult = {
  thoughts: PresentedThought[];
};

export type RecentResult = {
  thoughts: PresentedThought[];
};

export type StatsResult = {
  totalThoughts: number;
  inLast7Days: number;
  inLast30Days: number;
};

export type HealthResult = {
  stats: StatsResult;
};

export type RemoveResult = {
  removedAt: string;
  removed: PresentedThought;
};

export function buildRemoteUrl(
  baseUrl: string,
  path: string,
  query?: Record<string, string | number | undefined>,
): string {
  const url = new URL(path, `${baseUrl.replace(/\/+$/, "")}/`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

export function parseApiEnvelope(
  payload: unknown,
): { ok: true; data: unknown } | { ok: false; error: string } {
  const parsed = ApiEnvelopeSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(`Invalid remote API response shape: ${parsed.error.message}`);
  }
  if (!parsed.data.ok) {
    return { ok: false, error: parsed.data.error ?? "remote API request failed" };
  }
  return { ok: true, data: parsed.data.data };
}

async function remoteRequest(
  cfg: RemoteOpenBrainConfig,
  path: string,
  init: RequestInitLike,
): Promise<unknown> {
  const url = buildRemoteUrl(cfg.remoteUrl, path, init.query);
  const headers: Record<string, string> = {
    accept: "application/json",
  };
  if (cfg.apiKey) {
    headers["x-openbrain-key"] = cfg.apiKey;
  }
  if (init.body !== undefined) {
    headers["content-type"] = "application/json";
  }

  const requestInit: RequestInit = {
    method: init.method,
    headers,
  };
  if (init.body !== undefined) {
    requestInit.body = JSON.stringify(init.body);
  }
  const response = await fetch(url, requestInit);

  let payload: unknown;
  const rawBody = await response.text();
  try {
    payload = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    throw new Error(`Remote API returned invalid JSON (${response.status}): ${rawBody}`);
  }

  if (!response.ok) {
    const parsed = ApiEnvelopeSchema.safeParse(payload);
    const reason = parsed.success ? parsed.data.error ?? "request failed" : rawBody || "request failed";
    throw new Error(`Remote API request failed (${response.status}): ${reason}`);
  }

  const envelope = parseApiEnvelope(payload);
  if (!envelope.ok) {
    throw new Error(`Remote API request failed: ${envelope.error}`);
  }
  return envelope.data;
}

export async function remoteCaptureThought(
  cfg: RemoteOpenBrainConfig,
  input: { content: string; tags?: string[] },
): Promise<CaptureResult> {
  return (await remoteRequest(cfg, "/capture", {
    method: "POST",
    body: {
      content: input.content,
      tags: input.tags,
    },
  })) as CaptureResult;
}

export async function remoteSearchThoughts(
  cfg: RemoteOpenBrainConfig,
  input: { query: string; limit?: number; threshold?: number; date?: string },
): Promise<SearchResult> {
  return (await remoteRequest(cfg, "/search", {
    method: "POST",
    body: {
      query: input.query,
      limit: input.limit,
      threshold: input.threshold,
      date: input.date,
    },
  })) as SearchResult;
}

export async function remoteListRecentThoughts(
  cfg: RemoteOpenBrainConfig,
  input: { limit?: number; date?: string } = {},
): Promise<RecentResult> {
  return (await remoteRequest(cfg, "/recent", {
    method: "GET",
    query: {
      limit: input.limit,
      date: input.date,
    },
  })) as RecentResult;
}

export async function remoteGetStats(cfg: RemoteOpenBrainConfig): Promise<StatsResult> {
  return (await remoteRequest(cfg, "/stats", {
    method: "GET",
  })) as StatsResult;
}

export async function remoteHealth(cfg: RemoteOpenBrainConfig): Promise<HealthResult> {
  return (await remoteRequest(cfg, "/health", {
    method: "GET",
  })) as HealthResult;
}

export async function remoteRemoveThought(
  cfg: RemoteOpenBrainConfig,
  input:
    | { content: string; query?: never; recent?: never; threshold?: never }
    | { content?: never; query: string; recent?: never; threshold?: number }
    | { content?: never; query?: never; recent: number; threshold?: never },
): Promise<RemoveResult> {
  return (await remoteRequest(cfg, "/remove", {
    method: "POST",
    body: input,
  })) as RemoveResult;
}
