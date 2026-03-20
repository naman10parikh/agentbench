import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import type { CacheEntry, TaskResult } from "./types.js";

const CACHE_DIR = ".agentbench/cache";
const SUITE_VERSION = "0.1.0";

function getCacheKey(modelVersion: string): string {
  const hash = createHash("sha256")
    .update(`${SUITE_VERSION}:${modelVersion}`)
    .digest("hex")
    .slice(0, 12);
  return `baseline-${hash}.json`;
}

export function loadCache(modelVersion: string): CacheEntry | null {
  const key = getCacheKey(modelVersion);
  const path = `${CACHE_DIR}/${key}`;

  if (!existsSync(path)) {
    return null;
  }

  try {
    const raw = readFileSync(path, "utf-8");
    return JSON.parse(raw) as CacheEntry;
  } catch {
    console.warn(`[cache] Failed to read cache at ${path}`);
    return null;
  }
}

export function saveCache(modelVersion: string, results: TaskResult[]): void {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }

  const entry: CacheEntry = {
    taskSuiteVersion: SUITE_VERSION,
    modelVersion,
    baselineResults: results,
    cachedAt: new Date().toISOString(),
  };

  const key = getCacheKey(modelVersion);
  writeFileSync(`${CACHE_DIR}/${key}`, JSON.stringify(entry, null, 2));
}
