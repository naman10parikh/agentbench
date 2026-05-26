# eval/

agentbench **is** an eval harness, so its evaluation surface is the product itself:

- **Benchmark tasks** live in [`../tasks/`](../tasks/) — 8 graded coding tasks (fix-typo, add-function, debug-error, refactor, write-tests, api-integration, performance, security-audit), each with a `workspace/` (starting state) and `expected/` (golden solution).
- **The evaluator** lives in [`../src/evaluator.ts`](../src/evaluator.ts) — diffs an agent's output against `expected/` and scores it.
- **The scorer** lives in [`../src/scorer.ts`](../src/scorer.ts) — turns task results into a score out of 100.

To run the benchmark against your own harness:

```bash
npx agentbench
```

This directory exists so the inherited harness layer (`identity/ · memory/ + brain/ · skills/ + .claude/ · eval/`) is complete. For agentbench, the canonical eval lives one level up in `tasks/` + `src/`.
