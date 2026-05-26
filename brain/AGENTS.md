---
type: architecture
status: active
created: 2026-05-26
updated: 2026-05-26
tags: [agentbench, orchestration, directory-map]
source: ../AGENTS.md
related: ["[[MOC - agentbench]]", "[[CLAUDE]]", "[[eval]]"]
---

# AGENTS (navigation note)

This repo's agent-orchestration conventions. Read the canonical file at [`../AGENTS.md`](../AGENTS.md).

It covers: the full real directory map (`src/` scorer CLI, `tasks/` benchmark, `eval/` pointer,
`identity/` `memory/` `brain/` `skills/` `hooks/` `scripts/` `.claude/` `dist/`), the most common
agent task (add a `tasks/NN-task-name/` with `task.json` + `workspace/` + `expected/`, register in
`tasks/index.ts`), the build/test commands (CI uses `pnpm exec vitest run`), and the commit grammar.
The generic WikiMem wiki-schema that previously occupied AGENTS.md is preserved as `AGENTS.md.example`.

## Related Notes

- [[MOC - agentbench]] — navigation hub
- [[CLAUDE]] — operating brief
- [[eval]] — eval surface pointer
