import http from "node:http";
import { URL } from "node:url";
import { getConfig } from "./config";
import { captureThought } from "./commands/capture";
import { getStats } from "./commands/stats";
import { listRecentThoughts } from "./commands/recent";
import { searchThoughts } from "./commands/search";
import { checkLmStudioHealth } from "./lmstudio";

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

async function main() {
  const cfg = getConfig();

  const server = http.createServer(async (req, res) => {
    try {
      if (!req.url || !req.method) {
        sendJson(res, 400, { ok: false, error: "missing request url or method" });
        return;
      }

      const url = new URL(req.url, `http://${req.headers.host ?? `${cfg.apiHost}:${cfg.apiPort}`}`);

      if (req.method === "GET" && url.pathname === "/health") {
        const stats = await getStats(cfg);
        const lm = await checkLmStudioHealth(cfg.lmStudioEmbedModel, cfg.lmStudioBaseUrl);
        sendJson(res, 200, {
          ok: true,
          stats,
          lmStudioEmbeddingDimensions: lm.dimensions,
        });
        return;
      }

      if (req.method === "GET" && url.pathname === "/stats") {
        sendJson(res, 200, { ok: true, data: await getStats(cfg) });
        return;
      }

      if (req.method === "GET" && url.pathname === "/recent") {
        const limit = Number.parseInt(url.searchParams.get("limit") ?? "20", 10);
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
        const tags = Array.isArray(body.tags)
          ? body.tags.map((tag) => String(tag).trim()).filter(Boolean)
          : [];
        const source = String(body.source ?? "api") as "cli" | "manual" | "api";
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
        const limit = Number.parseInt(String(body.limit ?? "8"), 10);
        const threshold = Number.parseFloat(String(body.threshold ?? "0.2"));
        const result = await searchThoughts(cfg, { query, limit, threshold });
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

