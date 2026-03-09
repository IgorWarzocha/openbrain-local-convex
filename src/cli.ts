#!/usr/bin/env node
import { Command } from "commander";
import { getConfig } from "./config";
import { captureThought } from "./commands/capture";
import { searchThoughts } from "./commands/search";
import { listRecentThoughts } from "./commands/recent";
import { getStats } from "./commands/stats";
import { removeThought } from "./commands/remove";
import { checkLmStudioHealth } from "./lmstudio";
import { normalizeTags, parseLimit, parseRecent, parseThreshold, parseThoughtSource } from "./domain/inputs";
import {
  remoteCaptureThought,
  remoteGetStats,
  remoteHealth,
  remoteListRecentThoughts,
  remoteRemoveThought,
  remoteSearchThoughts,
} from "./remoteApi";

const program = new Command();

program
  .name("openbrain-local-convex")
  .description("Local 2nd brain CLI (Convex + LM Studio)")
  .version("0.1.0");

program
  .command("capture")
  .description("Capture a thought")
  .argument("<content>", "Thought content")
  .option("--source <source>", "Source label: cli|manual|api", "cli")
  .option("--tags <tags>", "Comma-separated tags", "")
  .action(async (content, options) => {
    const cfg = getConfig();
    const source = parseThoughtSource(options.source, "cli");
    const tags = normalizeTags(options.tags);
    const result =
      cfg.mode === "remote"
        ? await remoteCaptureThought(cfg, { content, source, tags })
        : await captureThought(cfg, { content, source, tags });
    console.log(JSON.stringify({ ok: true, mode: cfg.mode, ...result }, null, 2));
  });

program
  .command("search")
  .description("Semantic search thoughts")
  .argument("<query>", "Search query")
  .option("--limit <limit>", "Result limit", "8")
  .option("--threshold <threshold>", "Similarity threshold", "0.2")
  .action(async (query, options) => {
    const cfg = getConfig();
    const limit = parseLimit(options.limit, 8);
    const threshold = parseThreshold(options.threshold, 0.2);
    const result =
      cfg.mode === "remote"
        ? await remoteSearchThoughts(cfg, { query, limit, threshold })
        : await searchThoughts(cfg, { query, limit, threshold });
    console.log(JSON.stringify(result, null, 2));
  });

program
  .command("recent")
  .description("List recent thoughts")
  .option("--limit <limit>", "Result limit", "20")
  .action(async (options) => {
    const cfg = getConfig();
    const limit = parseLimit(options.limit, 20);
    const result =
      cfg.mode === "remote"
        ? await remoteListRecentThoughts(cfg, limit)
        : await listRecentThoughts(cfg, limit);
    console.log(JSON.stringify(result, null, 2));
  });

program
  .command("stats")
  .description("Get thought stats")
  .action(async () => {
    const cfg = getConfig();
    const result = cfg.mode === "remote" ? await remoteGetStats(cfg) : await getStats(cfg);
    console.log(JSON.stringify(result, null, 2));
  });

program
  .command("remove")
  .description("Remove a thought by exact content, semantic query, or recent position")
  .option("--content <content>", "Remove the one thought matching this exact content")
  .option("--query <query>", "Remove the one thought that best matches this semantic query")
  .option("--recent <number>", "Remove the Nth most recent thought")
  .option("--threshold <threshold>", "Semantic removal threshold", "0.35")
  .action(async (options) => {
    const content = typeof options.content === "string" ? options.content.trim() : "";
    const query = typeof options.query === "string" ? options.query.trim() : "";
    const hasRecent = options.recent !== undefined;
    const recent = hasRecent ? parseRecent(options.recent) : null;
    const selectors = Number(content.length > 0) + Number(query.length > 0) + Number(hasRecent);
    if (selectors !== 1) {
      throw new Error("provide exactly one of --content, --query, or --recent");
    }
    const cfg = getConfig();
    const result =
      cfg.mode === "remote"
        ? content
          ? await remoteRemoveThought(cfg, { content })
          : query
            ? await remoteRemoveThought(cfg, { query, threshold: parseThreshold(options.threshold, 0.35) })
            : await remoteRemoveThought(cfg, { recent: recent as number })
        : content
          ? await removeThought(cfg, { content })
          : query
            ? await removeThought(cfg, { query, threshold: parseThreshold(options.threshold, 0.35) })
            : await removeThought(cfg, { recent: recent as number });
    console.log(
      JSON.stringify(
        {
          ok: true,
          mode: cfg.mode,
          removedAt: new Date(result.removedAt).toISOString(),
          removed: result.removed,
        },
        null,
        2,
      ),
    );
  });

program
  .command("health")
  .description("Check local runtime or remote API wiring")
  .action(async () => {
    const cfg = getConfig();
    if (cfg.mode === "remote") {
      const result = await remoteHealth(cfg);
      console.log(
        JSON.stringify(
          {
            ok: true,
            mode: "remote",
            remoteUrl: cfg.remoteUrl,
            apiKeyEnabled: Boolean(cfg.apiKey),
            stats: result.stats,
          },
          null,
          2,
        ),
      );
      return;
    }
    const stats = await getStats(cfg);
    await checkLmStudioHealth(cfg.lmStudioEmbedModel, cfg.lmStudioBaseUrl);
    console.log(
      JSON.stringify(
        {
          ok: true,
          mode: "local",
          convexUrl: cfg.convexUrl,
          stats,
        },
        null,
        2,
      ),
    );
  });

program.parseAsync(process.argv).catch((error) => {
  if (error instanceof TypeError && /fetch/i.test(error.message)) {
    console.error(
      "Network error talking to OpenBrain API. Check OPENBRAIN_REMOTE_URL, LAN reachability, and server status.",
    );
    process.exit(1);
  }
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
