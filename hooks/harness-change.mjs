#!/usr/bin/env node
// PostToolUse hook (Write|Edit): when an edit touches the harness itself (CLAUDE.md, AGENTS.md, or anything in
// .claude/skills, .claude/rules, .claude/agents or .claude/settings*.json), remind the agent that the change can be
// measured. It never blocks and never runs the benchmark: the benchmark costs money, so a person decides.
let raw = "";
process.stdin.on("data", (chunk) => (raw += chunk));
process.stdin.on("end", () => {
  let file = "";
  try {
    file = String(JSON.parse(raw || "{}")?.tool_input?.file_path ?? "");
  } catch {
    process.exit(0); // Intentionally silent: a payload we cannot read is not ours to judge
  }
  const harness = /(^|\/)(CLAUDE|AGENTS)\.md$|(^|\/)\.claude\/(skills|rules|agents)\/|(^|\/)\.claude\/settings(\.local)?\.json$/;
  if (!harness.test(file)) process.exit(0);
  const context =
    `You changed the harness (${file}). To measure the change for free, run \`agentbench score\`; ` +
    "the full benchmark (`agentbench`) calls the Anthropic API and costs money, so ask the person first.";
  process.stdout.write(
    JSON.stringify({ hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: context } }),
  );
});
