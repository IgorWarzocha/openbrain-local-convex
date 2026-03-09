import http from "node:http";
import { timingSafeEqual } from "node:crypto";
import { URL } from "node:url";
import { assertLocalConfig, getConfig } from "./config";
import { captureThought } from "./commands/capture";
import { getStats } from "./commands/stats";
import { listRecentThoughts } from "./commands/recent";
import { searchThoughts } from "./commands/search";
import { removeThought } from "./commands/remove";
import { checkLmStudioHealth } from "./lmstudio";
import { normalizeTags, parseLimit, parseThreshold, parseThoughtSource } from "./domain/inputs";

type JsonObject = Record<string, unknown>;

async function readJson(req: http.IncomingMessage): Promise<JsonObject> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) {
    return {};
  }
  const parsed = JSON.parse(raw);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("invalid JSON body");
  }
  return parsed as JsonObject;
}

function sendJson(res: http.ServerResponse, status: number, body: JsonObject): void {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

function safeEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function getHeaderValue(headers: http.IncomingHttpHeaders, key: string): string | null {
  const value = headers[key];
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (Array.isArray(value)) {
    const first = value.find((entry) => entry.trim().length > 0)?.trim();
    return first ?? null;
  }
  return null;
}

async function main() {
  const cfg = getConfig();
  assertLocalConfig(cfg, "openbrain api server");

  const server = http.createServer(async (req, res) => {
    try {
      if (!req.url || !req.method) {
        sendJson(res, 400, { ok: false, error: "missing request url or method" });
        return;
      }

      const url = new URL(req.url, `http://${req.headers.host ?? `${cfg.apiHost}:${cfg.apiPort}`}`);
      if (cfg.apiKey) {
        const headerKey = getHeaderValue(req.headers, "x-openbrain-key");
        const queryKey = url.searchParams.get("key")?.trim() || null;
        const providedKey = headerKey ?? queryKey;
        if (!providedKey || !safeEquals(providedKey, cfg.apiKey)) {
          sendJson(res, 401, { ok: false, error: "unauthorized" });
          return;
        }
      }

      if (req.method === "GET" && url.pathname === "/health") {
        const stats = await getStats(cfg);
        await checkLmStudioHealth(cfg.lmStudioEmbedModel, cfg.lmStudioBaseUrl);
        sendJson(res, 200, {
          ok: true,
          data: {
            stats,
          },
        });
        return;
      }

      if (req.method === "GET" && url.pathname === "/stats") {
        sendJson(res, 200, { ok: true, data: await getStats(cfg) });
        return;
      }

      if (req.method === "GET" && url.pathname === "/recent") {
        const limit = parseLimit(url.searchParams.get("limit") ?? undefined, 20);
        sendJson(res, 200, { ok: true, data: await listRecentThoughts(cfg, limit) });
        return;
      }

      if (req.method === "POST" && url.pathname === "/capture") {
        const body = await readJson(req);
        const content = String(body.content ?? "").trim();
        if (!content) {
          sendJson(res, 400, { ok: false, error: "content is required" });
          return;
        }
        const tags = normalizeTags(body.tags);
        const source = parseThoughtSource(body.source, "api");
        const result = await captureThought(cfg, { content, tags, source });
        sendJson(res, 200, { ok: true, data: result });
        return;
      }

      if (req.method === "POST" && url.pathname === "/search") {
        const body = await readJson(req);
        const query = String(body.query ?? "").trim();
        if (!query) {
          sendJson(res, 400, { ok: false, error: "query is required" });
          return;
        }
        const limit = parseLimit(body.limit, 8);
        const threshold = parseThreshold(body.threshold, 0.2);
        const result = await searchThoughts(cfg, { query, limit, threshold });
        sendJson(res, 200, { ok: true, data: result });
        return;
      }

      if (req.method === "POST" && url.pathname === "/remove") {
        const body = await readJson(req);
        const content = typeof body.content === "string" ? body.content.trim() : "";
        const query = typeof body.query === "string" ? body.query.trim() : "";
        const recentRaw = body.recent;
        const thresholdRaw = body.threshold;

        const hasContent = content.length > 0;
        const hasQuery = query.length > 0;
        const hasRecent = recentRaw !== undefined;
        const selectionCount = Number(hasContent) + Number(hasQuery) + Number(hasRecent);
        if (selectionCount !== 1) {
          sendJson(res, 400, {
            ok: false,
            error: "provide exactly one of content, query, or recent",
          });
          return;
        }
        let result;
        if (hasContent) {
          result = await removeThought(cfg, { content });
        } else if (hasQuery) {
          const threshold = parseThreshold(thresholdRaw, 0.35);
          result = await removeThought(cfg, { query, threshold });
        } else {
          const recent = parseLimit(recentRaw, 1);
          result = await removeThought(cfg, { recent });
        }
        sendJson(res, 200, { ok: true, data: result });
        return;
      }

      sendJson(res, 404, { ok: false, error: "not found" });
    } catch (error) {
      sendJson(res, 500, {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  server.listen(cfg.apiPort, cfg.apiHost, () => {
    // Keeping stdout plain for systemd journald.
    console.log(`openbrain api listening on http://${cfg.apiHost}:${cfg.apiPort}`);
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
