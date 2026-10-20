# hooks/

Hooks that ship with the Claude Code plugin.

- [`hooks.json`](hooks.json): the plugin's hook map, loaded by Claude Code when the plugin is installed.
- [`harness-change.mjs`](harness-change.mjs): a `PostToolUse` hook on Write and Edit. When an edit touches the harness
  itself (`CLAUDE.md`, `AGENTS.md`, `.claude/skills`, `.claude/rules`, `.claude/agents` or a settings file), it tells
  the agent the change can be measured with the free `agentbench score`, and that the full benchmark costs money, so
  the person decides. It never blocks and never runs anything.

The hooks for contributors working inside this repository live in `.claude/settings.json` (session context, a
dangerous-command block and a secret guard).
