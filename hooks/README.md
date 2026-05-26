# hooks/

Repo-local lifecycle hooks for agentbench. **Currently empty** — agentbench's active hooks are the
inherited Claude Code hooks under [`../.claude/hooks/`](../.claude/hooks/) (session-start context,
pre-compact memory flush, quality-check, protect-secrets, block-dangerous-commands, etc.).

Add a repo-specific hook here only when it must be scoped to agentbench rather than shared via the
`.claude/` layer. See [`../AGENTS.md`](../AGENTS.md) and
[`../brain/MOC - agentbench.md`](../brain/MOC%20-%20agentbench.md).
