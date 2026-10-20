#!/usr/bin/env node
// eval/stub-api.mjs: a stand-in for the Anthropic Messages API, so the golden eval runs the whole benchmark with no
// paid call. Point the CLI at it with ANTHROPIC_BASE_URL. The API key picks how the stand-in model answers:
//   stub-tool   calls a tool and writes more than 50 characters (a task the benchmark counts as done)
//   stub-text   writes more than 50 characters but calls no tool
//   stub-short  calls a tool, but the reply with its tool line ([tool: read_file({})]) stays under 50 characters
// A request without tools is the LLM judge; it always answers {"score": 80}.
// Prints the port on its first line, then appends one JSON line per request to STUB_LOG.
import { createServer } from "node:http";
import { appendFileSync } from "node:fs";

const LONG = "I read src/utils.ts, found the misspelled name and fixed it so the file compiles again.";
const SHORT = "Done.";

const server = createServer((req, res) => {
  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", () => {
    const request = JSON.parse(body || "{}");
    const mode = String(req.headers["x-api-key"] ?? "stub-tool");
    const judge = !Array.isArray(request.tools) || request.tools.length === 0;
    if (process.env.STUB_LOG) {
      appendFileSync(process.env.STUB_LOG, JSON.stringify({ path: req.url, model: request.model, judge, mode }) + "\n");
    }
    const content = judge
      ? [{ type: "text", text: '{"score": 80, "reasoning": "stand-in judge"}' }]
      : [
          { type: "text", text: mode === "stub-short" ? SHORT : LONG },
          ...(mode === "stub-text"
            ? []
            : [{ type: "tool_use", id: "toolu_stub", name: "read_file", input: mode === "stub-short" ? {} : { path: "src/utils.ts" } }]),
        ];
    res.writeHead(200, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        id: "msg_stub",
        type: "message",
        role: "assistant",
        model: request.model,
        content,
        stop_reason: content.some((c) => c.type === "tool_use") ? "tool_use" : "end_turn",
        stop_sequence: null,
        usage: { input_tokens: 100, output_tokens: 50 },
      }),
    );
  });
});

server.listen(0, "127.0.0.1", () => {
  console.log(server.address().port);
});
