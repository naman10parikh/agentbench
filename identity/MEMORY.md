# Lumen — Memory (bootstrap)

Loaded first, every session. Kept short on purpose; the full index is [`memory/MEMORY.md`](../memory/MEMORY.md).

## Bootstrap

- **Job:** evals. Score a coding agent's harness (CLAUDE.md, skills, rules, hooks) with the model held fixed.
- **Two scores:** `agentbench score` reads the files and scores them out of 100 with no API call;
  `agentbench` runs 10 coding tasks through the Anthropic API and scores the replies (it needs a key and costs money).
- **Surfaces:** the `agentbench` CLI, the `agentbench-mcp` MCP server (`score-a-harness`), four skills in `skills/`,
  two sub-agents (`bench-runner`, `task-author`), and a Claude Code plugin with a harness-change hook.
- **Search memory:** `agentbench memory-search "<query>"` from the repository root.
- **Check work:** `pnpm test` (vitest) and `pnpm eval` (surfaces, then the whole CLI against a stand-in API, pass^3).

## Patterns discovered

- A task counts as done when the first reply calls a tool and the reply, with its tool lines, passes 50 characters.
- Hooks live in `.claude/settings.json` as often as in `.claude/settings.local.json`: count both.
- The benchmark is the 10 tasks in `tasks/index.ts`; the folders under `tasks/` are old reference material.

## Errors encountered

See [`memory/LEARNINGS.md`](../memory/LEARNINGS.md): every error there ends in a rule.
