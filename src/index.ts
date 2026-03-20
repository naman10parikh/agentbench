#!/usr/bin/env node

import { Command } from "commander";
import { runBenchmark } from "./runner.js";
import { printScorecard, printJson, writeReport } from "./reporter.js";

const program = new Command();

program
  .name("agentbench")
  .description(
    "Lighthouse for AI coding harnesses. Benchmark your Claude Code setup.",
  )
  .version("1.0.0")
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
