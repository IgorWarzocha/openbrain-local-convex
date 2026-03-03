import { config as loadEnv } from "dotenv";
import { z } from "zod";

const OptionalUrlSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().url().optional(),
);

const OptionalStringSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().optional(),
);

const EnvironmentSchema = z.object({
  CONVEX_URL: OptionalUrlSchema,
  OPENBRAIN_REMOTE_URL: OptionalUrlSchema,
  OPENBRAIN_API_KEY: OptionalStringSchema,
  LMSTUDIO_BASE_URL: z.string().url().default("http://127.0.0.1:1234/v1"),
  LMSTUDIO_EMBED_MODEL: z.string().default("text-embedding-embeddinggemma-300m-qat"),
  OPENBRAIN_API_HOST: z.string().default("127.0.0.1"),
  OPENBRAIN_API_PORT: z
    .string()
    .default("8787")
    .transform((value) => Number.parseInt(value, 10))
    .pipe(z.number().int().min(1).max(65535)),
});

type SharedConfig = {
  lmStudioBaseUrl: string;
  lmStudioEmbedModel: string;
  apiHost: string;
  apiPort: number;
  apiKey?: string;
};

export type LocalOpenBrainConfig = SharedConfig & {
  mode: "local";
  convexUrl: string;
  remoteUrl: null;
};

export type RemoteOpenBrainConfig = SharedConfig & {
  mode: "remote";
  convexUrl: null;
  remoteUrl: string;
};

export type OpenBrainConfig = LocalOpenBrainConfig | RemoteOpenBrainConfig;

export function loadEnvironment(): void {
  // Priority order: .env then .env.local overrides.
  loadEnv({ path: ".env", quiet: true });
  loadEnv({ path: ".env.local", override: true, quiet: true });
}

export function parseEnvironment(env: NodeJS.ProcessEnv): OpenBrainConfig {
  const parsed = EnvironmentSchema.safeParse(env);
  if (!parsed.success) {
    throw new Error(`Invalid environment: ${parsed.error.message}`);
  }

  const {
    CONVEX_URL,
    OPENBRAIN_REMOTE_URL,
    OPENBRAIN_API_KEY,
    LMSTUDIO_BASE_URL,
    LMSTUDIO_EMBED_MODEL,
    OPENBRAIN_API_HOST,
    OPENBRAIN_API_PORT,
  } = parsed.data;

  if (!CONVEX_URL && !OPENBRAIN_REMOTE_URL) {
    throw new Error(
      "Set CONVEX_URL for local mode or OPENBRAIN_REMOTE_URL for LAN client mode.",
    );
  }

  const shared: SharedConfig = {
    lmStudioBaseUrl: LMSTUDIO_BASE_URL.replace(/\/+$/, ""),
    lmStudioEmbedModel: LMSTUDIO_EMBED_MODEL,
    apiHost: OPENBRAIN_API_HOST,
    apiPort: OPENBRAIN_API_PORT,
  };
  const normalizedApiKey = OPENBRAIN_API_KEY?.trim();
  if (normalizedApiKey) {
    shared.apiKey = normalizedApiKey;
  }

  if (OPENBRAIN_REMOTE_URL) {
    return {
      mode: "remote",
      convexUrl: null,
      remoteUrl: OPENBRAIN_REMOTE_URL.replace(/\/+$/, ""),
      ...shared,
    };
  }

  if (!CONVEX_URL) {
    throw new Error("CONVEX_URL is required for local mode.");
  }

  return {
    mode: "local",
    convexUrl: CONVEX_URL,
    remoteUrl: null,
    ...shared,
  };
}

export function assertLocalConfig(
  cfg: OpenBrainConfig,
  context: string,
): asserts cfg is LocalOpenBrainConfig {
  if (cfg.mode !== "local") {
    throw new Error(
      `${context} needs local runtime. Unset OPENBRAIN_REMOTE_URL and set CONVEX_URL on the server.`,
    );
  }
}

export function getConfig(): OpenBrainConfig {
  loadEnvironment();
  return parseEnvironment(process.env);
}
