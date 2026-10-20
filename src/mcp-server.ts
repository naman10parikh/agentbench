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

import { createInterface } from "node:readline";
import { scoreHarness } from "./static-score.js";

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
