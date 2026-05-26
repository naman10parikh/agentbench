---
type: operations
status: active
created: 2026-05-26
updated: 2026-05-26
tags: [agentbench, contributing]
source: ../CONTRIBUTING.md
related: ["[[MOC - agentbench]]", "[[AGENTS]]"]
---

# CONTRIBUTING (navigation note)

How to contribute to agentbench. Read the canonical file at [`../CONTRIBUTING.md`](../CONTRIBUTING.md).

It covers: reporting bugs, adding benchmark tasks (the most impactful contribution — `tasks/NN-name/`
with `task.json` + `workspace/` + `expected/`), improving the scorer (`src/scorer.ts`) when a score
doesn't match intuition, and the code-change flow (fork → branch → change → `pnpm test` → PR).

## Related Notes

- [[MOC - agentbench]] — navigation hub
- [[AGENTS]] — directory map + task format
