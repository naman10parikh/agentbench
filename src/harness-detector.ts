import { readFileSync, existsSync } from "node:fs";
import fg from "fast-glob";
import type { HarnessConfig } from "./types.js";

export async function detectHarness(
  comparePath?: string,
): Promise<HarnessConfig> {
  const cwd = process.cwd();
  const claudeMdPath = comparePath ?? `${cwd}/CLAUDE.md`;

  const hasClaudeMd = existsSync(claudeMdPath);
  let claudeMdLines = 0;
  if (hasClaudeMd) {
    const content = readFileSync(claudeMdPath, "utf-8");
    claudeMdLines = content.split("\n").length;
  }

  const hasSettingsJson =
    existsSync(`${cwd}/.claude/settings.json`) ||
    existsSync(`${cwd}/.claude/settings.local.json`);

  const skills = await fg("**/*.md", {
    cwd: `${cwd}/.claude/skills`,
    onlyFiles: true,
    suppressErrors: true,
  });

  const rules = await fg("**/*.md", {
    cwd: `${cwd}/.claude/rules`,
    onlyFiles: true,
    suppressErrors: true,
  });

  const hookCount = countHooks(cwd);

  return {
    hasClaudeMd,
    claudeMdLines,
    skillCount: skills.length,
    ruleCount: rules.length,
    hookCount,
    hasSettingsJson,
  };
}

/**
 * Hook groups configured in a harness: the shared `.claude/settings.json` and the personal
 * `.claude/settings.local.json` both count. A malformed file counts as zero.
 */
export function countHooks(root: string): number {
  let total = 0;
  for (const name of ["settings.json", "settings.local.json"]) {
    const path = `${root}/.claude/${name}`;
    if (!existsSync(path)) continue;
    try {
      const settings = JSON.parse(readFileSync(path, "utf-8")) as { hooks?: Record<string, unknown> };
      for (const groups of Object.values(settings.hooks ?? {})) {
        if (Array.isArray(groups)) total += groups.length;
      }
    } catch {
      // Intentionally silent: a malformed settings file counts as no hooks
    }
  }
  return total;
}
