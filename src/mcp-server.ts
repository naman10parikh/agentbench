#!/usr/bin/env node
/**
 * agentbench MCP Server — exposes a `score-a-harness` tool so Claude Code
 * (or any MCP client) can score the current harness without running the full
 * CLI benchmark.
 *
 * Transport: stdio (standard MCP pattern for local servers).
 *
 * Usage (standalone):
 *   node dist/src/mcp-server.js
 *
 * In .claude-plugin/manifest.json this file is registered under `mcp_servers`.
 */

import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { createInterface } from "node:readline";
import fg from "fast-glob";

// ---------------------------------------------------------------------------
// Lightweight MCP types — we avoid adding an MCP SDK dep just for stdin/stdout
// ---------------------------------------------------------------------------

interface McpRequest {
  jsonrpc: "2.0";
  id: number | string;
  method: string;
  params?: Record<string, unknown>;
}

interface McpResponse {
  jsonrpc: "2.0";
  id: number | string;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

function respond(id: number | string, result: unknown): void {
  const msg: McpResponse = { jsonrpc: "2.0", id, result };
  process.stdout.write(JSON.stringify(msg) + "\n");
}

function respondError(
  id: number | string,
  code: number,
  message: string,
): void {
  const msg: McpResponse = { jsonrpc: "2.0", id, error: { code, message } };
  process.stdout.write(JSON.stringify(msg) + "\n");
}

// ---------------------------------------------------------------------------
// Tool implementation — score-a-harness
// ---------------------------------------------------------------------------

interface HarnessScore {
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

async function scoreHarness(targetPath?: string): Promise<HarnessScore> {
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

  let hookCount = 0;
  const settingsPath = join(cwd, ".claude/settings.local.json");
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
      // Intentionally silent — malformed settings.json is not fatal
    }
  }

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

// ---------------------------------------------------------------------------
// MCP protocol dispatch
// ---------------------------------------------------------------------------

const TOOLS = [
  {
    name: "score-a-harness",
    description:
      "Score a Claude Code harness (CLAUDE.md + .claude/skills + .claude/rules + hooks) and return a breakdown out of 100. No API calls — static analysis only. Optionally target a different directory.",
    inputSchema: {
      type: "object",
      properties: {
        targetPath: {
          type: "string",
          description:
            "Absolute or relative path to the harness root directory. Defaults to the current working directory.",
        },
      },
      required: [],
    },
  },
];

async function handleRequest(req: McpRequest): Promise<void> {
  const { id, method, params } = req;

  if (method === "initialize") {
    respond(id, {
      protocolVersion: "2024-11-05",
      capabilities: { tools: {} },
      serverInfo: { name: "agentbench", version: "1.0.0" },
    });
    return;
  }

  if (method === "tools/list") {
    respond(id, { tools: TOOLS });
    return;
  }

  if (method === "tools/call") {
    const toolName = (params as { name?: string; arguments?: Record<string, unknown> })?.name;
    const args = (params as { name?: string; arguments?: Record<string, unknown> })?.arguments ?? {};

    if (toolName !== "score-a-harness") {
      respondError(id, -32602, `Unknown tool: ${toolName}`);
      return;
    }

    try {
      const targetPath =
        typeof args.targetPath === "string" ? args.targetPath : undefined;
      const result = await scoreHarness(targetPath);

      const summary =
        `Harness score: ${result.overallScore}/${result.maxScore}\n\n` +
        result.breakdown
          .map((d) => `• ${d.dimension}: ${d.score}/${d.maxScore} — ${d.detail}`)
          .join("\n") +
        (result.reportPath ? `\n\nReport saved to: ${result.reportPath}` : "");

      respond(id, {
        content: [{ type: "text", text: summary }],
        structuredContent: result,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      respondError(id, -32603, `score-a-harness failed: ${message}`);
    }
    return;
  }

  // Unknown method — return error but keep the server alive
  respondError(id, -32601, `Method not found: ${method}`);
}

// ---------------------------------------------------------------------------
// Main — read JSON-RPC lines from stdin
// ---------------------------------------------------------------------------

const rl = createInterface({ input: process.stdin, terminal: false });

rl.on("line", (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  try {
    const req = JSON.parse(trimmed) as McpRequest;
    void handleRequest(req);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Can't recover id without a valid parse, use -1 sentinel
    respondError(-1, -32700, `Parse error: ${message}`);
  }
});
