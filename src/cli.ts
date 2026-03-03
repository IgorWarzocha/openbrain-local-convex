#!/usr/bin/env node
import { Command } from "commander";
import { getConfig } from "./config";
import { captureThought } from "./commands/capture";
import { searchThoughts } from "./commands/search";
import { listRecentThoughts } from "./commands/recent";
import { getStats } from "./commands/stats";
import { checkLmStudioHealth } from "./lmstudio";
import { normalizeTags, parseLimit, parseThreshold, parseThoughtSource } from "./domain/inputs";

const program = new Command();

program.name("openbrain").description("Local 2nd brain CLI (Convex + LM Studio)").version("0.1.0");

program
  .command("capture")
  .description("Capture a thought")
  .argument("<content>", "Thought content")
  .option("--source <source>", "Source label: cli|manual|api", "cli")
  .option("--tags <tags>", "Comma-separated tags", "")
  .action(async (content, options) => {
    const cfg = getConfig();
    const result = await captureThought(cfg, {
      content,
      source: parseThoughtSource(options.source, "cli"),
      tags: normalizeTags(options.tags),
    });
    console.log(
      JSON.stringify(
        {
          ok: true,
          thoughtId: result.id,
          createdAt: new Date(result.createdAt).toISOString(),
          embeddingDimensions: result.embeddingDimensions,
        },
        null,
        2,
      ),
    );
  });

program
  .command("search")
  .description("Semantic search thoughts")
  .argument("<query>", "Search query")
  .option("--limit <limit>", "Result limit", "8")
  .option("--threshold <threshold>", "Similarity threshold", "0.2")
  .action(async (query, options) => {
    const cfg = getConfig();
    const result = await searchThoughts(cfg, {
      query,
      limit: parseLimit(options.limit, 8),
      threshold: parseThreshold(options.threshold, 0.2),
    });
    console.log(JSON.stringify(result, null, 2));
  });

program
  .command("recent")
  .description("List recent thoughts")
  .option("--limit <limit>", "Result limit", "20")
  .action(async (options) => {
    const cfg = getConfig();
    const result = await listRecentThoughts(cfg, parseLimit(options.limit, 20));
    console.log(JSON.stringify(result, null, 2));
  });

program
  .command("stats")
  .description("Get thought stats")
  .action(async () => {
    const cfg = getConfig();
    const result = await getStats(cfg);
    console.log(JSON.stringify(result, null, 2));
  });

program
  .command("health")
  .description("Check Convex + LM Studio wiring")
  .action(async () => {
    const cfg = getConfig();
    const stats = await getStats(cfg);
    const lm = await checkLmStudioHealth(cfg.lmStudioEmbedModel, cfg.lmStudioBaseUrl);
    console.log(
      JSON.stringify(
        {
          ok: true,
          convexUrl: cfg.convexUrl,
          lmStudioBaseUrl: cfg.lmStudioBaseUrl,
          lmStudioModel: cfg.lmStudioEmbedModel,
          embeddingDimensions: lm.dimensions,
          stats,
        },
        null,
        2,
      ),
    );
  });

program.parseAsync(process.argv).catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
