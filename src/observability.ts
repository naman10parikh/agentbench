/**
 * observability.ts — Append-only run/cost tracking for agentbench.
 *
 * Pattern ported from Energy's helios (`helios log` → logs/runs.jsonl wired into
 * the main dispatch path). Every benchmark run and every per-task model call is a
 * state-mutating, money-spending action (it hits the Anthropic API), so the
 * product itself appends a JSON line to `.agentbench/runs.jsonl` on each one —
 * this is wired into the runner's dispatch path, not a passive hook.
 *
 * Token cost is estimated from per-model $/MTok rates so each line carries a
 * `costUsd` figure for "$ per benchmark run" observability.
 */

import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const RUNS_DIR = ".agentbench";
const RUNS_FILE = "runs.jsonl";

/** USD per million tokens (input, output). Conservative public list prices. */
const MODEL_PRICING: Record<string, { in: number; out: number }> = {
  "claude-sonnet-4-6": { in: 3, out: 15 },
  "claude-sonnet-4-5": { in: 3, out: 15 },
  "claude-haiku-4-5": { in: 1, out: 5 },
  "claude-haiku-4-5-20251001": { in: 1, out: 5 },
  "claude-opus-4-1": { in: 15, out: 75 },
};

/** Fallback when a model id isn't in the table (use Sonnet-class rates). */
const DEFAULT_PRICING = { in: 3, out: 15 };

export function estimateCostUsd(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const price = MODEL_PRICING[model] ?? DEFAULT_PRICING;
  const usd =
    (inputTokens / 1_000_000) * price.in +
    (outputTokens / 1_000_000) * price.out;
  // Round to 6 decimals — sub-cent precision matters at benchmark scale.
  return Math.round(usd * 1_000_000) / 1_000_000;
}

export interface RunEvent {
  /** "task" for a single graded task call, "benchmark" for the whole run. */
  kind: "task" | "benchmark" | "sandbox" | "judge";
  model: string;
  taskId?: number;
  taskName?: string;
  inputTokens?: number;
  outputTokens?: number;
  toolsUsed?: string[];
  completed?: boolean;
  durationMs?: number;
  /** Free-form extra fields (e.g. overallScore for a benchmark summary). */
  meta?: Record<string, unknown>;
}

export interface LoggedRun extends RunEvent {
  ts: string;
  totalTokens: number;
  costUsd: number;
}

/**
 * Append one run event to `.agentbench/runs.jsonl`. Returns the logged record so
 * callers (and tests) can assert on the computed cost. Never throws — telemetry
 * must not break a benchmark — but it does compute real numbers.
 */
export function logRun(event: RunEvent, baseDir = process.cwd()): LoggedRun {
  const inputTokens = event.inputTokens ?? 0;
  const outputTokens = event.outputTokens ?? 0;
  const record: LoggedRun = {
    ts: new Date().toISOString(),
    totalTokens: inputTokens + outputTokens,
    costUsd: estimateCostUsd(event.model, inputTokens, outputTokens),
    ...event,
  };

  try {
    const dir = join(baseDir, RUNS_DIR);
    mkdirSync(dir, { recursive: true });
    appendFileSync(join(dir, RUNS_FILE), JSON.stringify(record) + "\n");
  } catch (err) {
    console.warn(
      `[observability] failed to write runs.jsonl: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  return record;
}

/** Absolute path to the runs log, for help text and tests. */
export function runsLogPath(baseDir = process.cwd()): string {
  return join(baseDir, RUNS_DIR, RUNS_FILE);
}
