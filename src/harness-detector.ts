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

  // Count hooks from settings.json
  let hookCount = 0;
  const settingsPath = `${cwd}/.claude/settings.local.json`;
  if (existsSync(settingsPath)) {
    try {
      const settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
      if (settings.hooks) {
        hookCount = Object.values(settings.hooks).reduce(
          (sum: number, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
          0,
        );
      }
    } catch {
      // Intentionally silent: settings.json may be malformed
    }
  }

  return {
    hasClaudeMd,
    claudeMdLines,
    skillCount: skills.length,
    ruleCount: rules.length,
    hookCount,
    hasSettingsJson,
  };
}
