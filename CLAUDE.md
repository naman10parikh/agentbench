@AGENTS.md

# Claude Code in agentbench

Everything any coding agent needs is in `AGENTS.md`, imported above. This file holds only what is specific to Claude
Code.

## What loads when you open this repository

- **Hooks** (`.claude/settings.json`): `SessionStart` runs `.claude/hooks/session-start-context.sh`, which prints the
  session context for this repository; `PreToolUse` on Bash runs `.claude/hooks/block-dangerous-commands.cjs`, and on Read, Edit, Write
  and Bash runs `.claude/hooks/protect-secrets.cjs`, which keeps `.env` files and keys out of the session.
- **Sub-agents** (`.claude/agents/`): `bench-runner` and `task-author` are agentbench's own; the other seven
  (`architect`, `code-reviewer`, `test-writer` and the rest) are general reviewers for work on this codebase.
- **MCP** (`.mcp.json`): only agentbench's own server, `agentbench-mcp`. The inherited development servers (GitHub,
  Context7, a file-backed memory and an Obsidian vault over `brain/`) need a token or a relative path, so they live in
  `.mcp.dev.json`. Load them with `claude --mcp-config .mcp.dev.json`.
- **Rules** (`.claude/rules/`) are glob-loaded every session.

## The plugin

`.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` make this repository a Claude Code plugin: the
skills in `skills/`, the two sub-agents, the MCP server and the harness-change hook in `hooks/hooks.json`, which
reminds the agent that a harness edit can be measured with the free static score. Check it with
`claude plugin validate .` before you change any of those files.

## Working here

- Never run the real benchmark to test a change: it costs money. `pnpm eval` runs the whole CLI against a stand-in.
- Follow the commit grammar in `AGENTS.md` (`feat(task):`, `feat(scorer):` and the rest).
- Act, then test as a user: `pnpm build && pnpm test && pnpm eval`, then the command you changed.
- When you fix an error, add it to `memory/LEARNINGS.md` as what broke, the root cause, and the rule.
