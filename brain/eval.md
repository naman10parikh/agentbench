---
type: architecture
status: active
created: 2026-05-26
updated: 2026-05-26
tags: [agentbench, eval, architecture]
source: ../eval/README.md
related: ["[[MOC - agentbench]]", "[[AGENTS]]", "[[ORG_MEMORY]]"]
---

# eval (navigation note)

The eval surface for agentbench. Read the canonical file at [`../eval/README.md`](../eval/README.md).

agentbench *is* an eval harness, so its evaluation surface is the product itself: the benchmark
tasks live in `../tasks/` (8 graded coding tasks, each with `workspace/` + `expected/`), the
evaluator in `../src/evaluator.ts` (LLM-as-judge via Haiku + diff vs `expected/`), and the scorer
in `../src/scorer.ts` (task results → score out of 100). The `eval/` directory exists only so the
inherited harness formula is complete; the real eval lives one level up.

## Related Notes

- [[MOC - agentbench]] — navigation hub
- [[AGENTS]] — directory map
- [[ORG_MEMORY]] — "the eval surface IS the product" learning
