import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import chalk from "chalk";
import boxen from "boxen";
import type { BenchmarkReport } from "./types.js";

export function printScorecard(report: BenchmarkReport): void {
  const scoreColor =
    report.overallScore >= 70
      ? chalk.green
      : report.overallScore >= 40
        ? chalk.yellow
        : chalk.red;

  const lines: string[] = [
    scoreColor.bold(`  HARNESS SCORE: ${report.overallScore} / 100`),
    "",
  ];

  for (const dim of report.dimensions) {
    const bar = buildProgressBar(dim.score, 10);
    const label = dim.name.padEnd(12);
    lines.push(`  ${label} ${bar}  ${dim.score}%`);
  }

  lines.push("");
  const delta = report.overallScore - report.baselineScore;
  const deltaStr =
    delta >= 0 ? chalk.green(`+${delta}`) : chalk.red(`${delta}`);
  lines.push(`  vs. baseline: ${deltaStr} points`);

  if (report.recommendations.length > 0) {
    lines.push(`  Top tip: ${report.recommendations[0]}`);
  }

  const card = boxen(lines.join("\n"), {
    padding: 1,
    borderStyle: "round",
    borderColor: "cyan",
    title: "agentbench",
    titleAlignment: "center",
  });

  console.log();
  console.log(card);
  const reportPath = writeReport(report);
  console.log();
  console.log(chalk.dim(`  Full report: ${reportPath}`));
  console.log();
}

function buildProgressBar(percent: number, width: number): string {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;

  const color =
    percent >= 70 ? chalk.green : percent >= 40 ? chalk.yellow : chalk.red;

  return color("█".repeat(filled)) + chalk.dim("░".repeat(empty));
}

export function writeReport(report: BenchmarkReport): string {
  const dir = join(process.cwd(), ".agentbench");
  mkdirSync(dir, { recursive: true });
  const filename = `report-${report.timestamp.slice(0, 10)}.json`;
  const filepath = join(dir, filename);
  writeFileSync(filepath, JSON.stringify(report, null, 2));
  return `.agentbench/${filename}`;
}

export function printJson(report: BenchmarkReport): void {
  console.log(JSON.stringify(report, null, 2));
}
