/**
 * Static harness score: reads a Claude Code harness (CLAUDE.md, .claude/skills, .claude/rules, hooks in
 * .claude/settings.json and .claude/settings.local.json) and scores it out of 100 with no API call.
 * Used by `agentbench score` and by the MCP tool `score-a-harness`.
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import fg from "fast-glob";
import { countHooks } from "./harness-detector.js";

// ---------------------------------------------------------------------------
// Tool implementation — score-a-harness
// ---------------------------------------------------------------------------

export interface HarnessScore {
  overallScore: number;
  maxScore: number;
  breakdown: {
    dimension: string;
    score: number;
    maxScore: number;
    detail: string;
  }[];
  harnessSummary: {
    hasClaudeMd: boolean;
    claudeMdLines: number;
    skillCount: number;
    ruleCount: number;
    hookCount: number;
    hasSettingsJson: boolean;
  };
  reportPath: string | null;
}

export async function scoreHarness(targetPath?: string): Promise<HarnessScore> {
  const cwd = targetPath ? resolve(targetPath) : process.cwd();

  // --- Detect harness structure ---
  const claudeMdPath = join(cwd, "CLAUDE.md");
  const hasClaudeMd = existsSync(claudeMdPath);
  let claudeMdLines = 0;
  if (hasClaudeMd) {
    claudeMdLines = readFileSync(claudeMdPath, "utf-8").split("\n").length;
  }

  const hasSettingsJson =
    existsSync(join(cwd, ".claude/settings.json")) ||
    existsSync(join(cwd, ".claude/settings.local.json"));

  const skills = await fg("**/*.md", {
    cwd: join(cwd, ".claude/skills"),
    onlyFiles: true,
    suppressErrors: true,
  });

  const rules = await fg("**/*.md", {
    cwd: join(cwd, ".claude/rules"),
    onlyFiles: true,
    suppressErrors: true,
  });

  const hookCount = countHooks(cwd);

  const harnessSummary = {
    hasClaudeMd,
    claudeMdLines,
    skillCount: skills.length,
    ruleCount: rules.length,
    hookCount,
    hasSettingsJson,
  };

  // --- Static scoring (no API calls — fast, safe for MCP context) ---
  const breakdown: HarnessScore["breakdown"] = [];

  // 1. CLAUDE.md presence + depth (25 pts)
  const claudeMdScore = (() => {
    if (!hasClaudeMd) return { score: 0, detail: "No CLAUDE.md found" };
    if (claudeMdLines < 20)
      return {
        score: 5,
        detail: `CLAUDE.md present but thin (${claudeMdLines} lines)`,
      };
    if (claudeMdLines < 60)
      return {
        score: 15,
        detail: `CLAUDE.md present (${claudeMdLines} lines)`,
      };
    return {
      score: 25,
      detail: `CLAUDE.md rich (${claudeMdLines} lines)`,
    };
  })();
  breakdown.push({
    dimension: "CLAUDE.md",
    score: claudeMdScore.score,
    maxScore: 25,
    detail: claudeMdScore.detail,
  });

  // 2. Skills (25 pts)
  const skillScore = (() => {
    if (skills.length === 0)
      return { score: 0, detail: "No skills found (.claude/skills/)" };
    if (skills.length < 3)
      return {
        score: 10,
        detail: `${skills.length} skill(s) — add more for coverage`,
      };
    if (skills.length < 8)
      return { score: 18, detail: `${skills.length} skills` };
    return { score: 25, detail: `${skills.length} skills — solid coverage` };
  })();
  breakdown.push({
    dimension: "skills",
    score: skillScore.score,
    maxScore: 25,
    detail: skillScore.detail,
  });

  // 3. Rules (25 pts)
  const ruleScore = (() => {
    if (rules.length === 0)
      return { score: 0, detail: "No rules found (.claude/rules/)" };
    if (rules.length < 3)
      return {
        score: 10,
        detail: `${rules.length} rule(s) — add more`,
      };
    if (rules.length < 8)
      return { score: 18, detail: `${rules.length} rules` };
    return { score: 25, detail: `${rules.length} rules — comprehensive` };
  })();
  breakdown.push({
    dimension: "rules",
    score: ruleScore.score,
    maxScore: 25,
    detail: ruleScore.detail,
  });

  // 4. Hooks + settings (25 pts)
  const hooksScore = (() => {
    const base = hasSettingsJson ? 10 : 0;
    const hookBonus = Math.min(15, hookCount * 3);
    return {
      score: base + hookBonus,
      detail: hasSettingsJson
        ? `settings.json present; ${hookCount} hooks configured`
        : "No settings.json — hooks/permissions not configured",
    };
  })();
  breakdown.push({
    dimension: "hooks & settings",
    score: hooksScore.score,
    maxScore: 25,
    detail: hooksScore.detail,
  });

  const overallScore = breakdown.reduce((sum, d) => sum + d.score, 0);
  const maxScore = breakdown.reduce((sum, d) => sum + d.maxScore, 0);

  // --- Persist a lightweight report ---
  let reportPath: string | null = null;
  try {
    const dir = join(cwd, ".agentbench");
    mkdirSync(dir, { recursive: true });
    const filename = `mcp-score-${new Date().toISOString().slice(0, 10)}.json`;
    const filepath = join(dir, filename);
    writeFileSync(
      filepath,
      JSON.stringify(
        { overallScore, maxScore, breakdown, harnessSummary, scoredAt: new Date().toISOString() },
        null,
        2,
      ),
    );
    reportPath = `.agentbench/${filename}`;
  } catch {
    // Intentionally silent — report write failure is non-fatal for MCP clients
  }

  return { overallScore, maxScore, breakdown, harnessSummary, reportPath };
}
