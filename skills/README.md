# skills/

Repo-local agent skills for agentbench. **Currently empty** — agentbench's active skills are the
inherited Claude Code skills under [`../.claude/skills/`](../.claude/skills/).

Add a repo-specific skill here as one file per skill (trigger → steps → expected output) when
agentbench needs a capability that shouldn't live in the shared `.claude/` layer — e.g. a
"add-benchmark-task" scaffolding skill. See [`../AGENTS.md`](../AGENTS.md) for the directory map
and [`../brain/MOC - agentbench.md`](../brain/MOC%20-%20agentbench.md) for navigation.
