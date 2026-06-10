#!/usr/bin/env node

import { Command } from "commander";
import { runBenchmark } from "./runner.js";
import { printScorecard, printJson, writeReport } from "./reporter.js";
import { searchRepo } from "./memory-index.js";
import { sandboxRun } from "./sandbox.js";
import { runsLogPath } from "./observability.js";

const program = new Command();

program
  .name("agentbench")
  .description(
    "Lighthouse for AI coding harnesses. Benchmark your Claude Code setup.",
  )
  .version("1.0.0");

// ---------------------------------------------------------------------------
// memory-search — query agentbench's own corpus via the in-code BM25 index.
// (the in-code counterpart to Energy's scripts/memory-search.sh)
// ---------------------------------------------------------------------------
program
  .command("memory-search <query...>")
  .description(
    "Search agentbench's own memory/brain/identity corpus (BM25-ranked).",
  )
  .option("--limit <n>", "Max results", (v) => parseInt(v, 10), 5)
  .option("--json", "Output results as JSON", false)
  .action((queryParts: string[], opts: { limit: number; json: boolean }) => {
    const query = queryParts.join(" ");
    const hits = searchRepo(process.cwd(), query, opts.limit);
    if (opts.json) {
      console.log(JSON.stringify(hits, null, 2));
      return;
    }
    if (hits.length === 0) {
      console.log(`No results for: "${query}"`);
      return;
    }
    console.log(`=== Memory Search: "${query}" ===\n`);
    hits.forEach((h, i) => {
      console.log(`[${i + 1}] ${h.path}  (score: ${h.score.toFixed(2)})`);
      if (h.snippet) console.log(`    ${h.snippet}`);
      console.log();
    });
  });

// ---------------------------------------------------------------------------
// sandbox-run — run a benchmark task's verification inside an E2B microVM.
// This is the isolated-execution integration point for untrusted code.
// ---------------------------------------------------------------------------
program
  .command("sandbox-run")
  .description("Run a benchmark task's verification inside an isolated E2B sandbox.")
  .option("--task <number>", "Task number to run (default: 1)", (v) => parseInt(v, 10))
  .option("--json", "Output result as JSON", false)
  .action(async (opts: { task?: number; json: boolean }) => {
    try {
      const result = await sandboxRun(opts.task);
      if (opts.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }
      console.log(`=== E2B sandbox-run: task ${result.taskId} (${result.taskName}) ===`);
      console.log(`Sandbox ID: ${result.sandboxId}`);
      console.log(`Exit code:  ${result.exitCode}  (${result.passed ? "PASS" : "FAIL"})`);
      console.log(`Duration:   ${result.durationMs}ms`);
      console.log(`Logged to:  ${runsLogPath()}`);
      console.log(`\n--- stdout ---\n${result.stdout}`);
      if (result.stderr) console.log(`\n--- stderr ---\n${result.stderr}`);
    } catch (err) {
      console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  });

// ---------------------------------------------------------------------------
// default benchmark command (no subcommand) — the original CLI behavior.
// ---------------------------------------------------------------------------
program
  .command("benchmark", { isDefault: true })
  .description("Run the full harness benchmark (default).")
  .option("--task <number>", "Run a single task by number (1-10)", parseInt)
  .option("--json", "Output results as JSON", false)
  .option("--compare <path>", "Compare against another CLAUDE.md")
  .option("--no-cache", "Ignore cached baseline, re-run from scratch")
  .option("--model <id>", "Model to benchmark with", "claude-sonnet-4-6")
  .option("--verbose", "Show detailed task output", false)
  .action(async (options) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error(
        "Error: ANTHROPIC_API_KEY environment variable is required.",
      );
      console.error("Set it with: export ANTHROPIC_API_KEY=your-key-here");
      process.exit(1);
    }

    try {
      const report = await runBenchmark({
        taskNumber: options.task,
        useCache: options.cache !== false,
        model: options.model,
        verbose: options.verbose,
        comparePath: options.compare,
      });

      if (options.json) {
        writeReport(report);
        printJson(report);
      } else {
        printScorecard(report);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Error: ${message}`);
      process.exit(1);
    }
  });

program.parse();
