# agentbench — TODOS

Human- and agent-readable checklist for contributors and automated agents.
Each item has a unique ID so PRs can reference a specific gap.

## Completed

- [x] **SCORE-001** — Unit tests for scorer.ts with real assertions on known inputs (`src/scorer.test.ts`)
- [x] **MCP-001** — MCP server exposing a `score-a-harness` tool (`src/mcp-server.ts`)
- [x] **MCP-002** — `.claude-plugin/manifest.json` declaring the MCP server as a Claude Code plugin

## Open

- [ ] **SCORE-002** — Fill `scoreToolUse` TODO: compare actual tools against `task.expectedTools` (currently scores by diversity only)
- [ ] **SCORE-003** — Fill `scoreQuality` TODO: wire LLM-as-judge scores from `evaluator.ts` into the quality dimension (currently placeholder)
- [ ] **EVAL-001** — `eval/` surface: add a golden eval script (`eval/run.ts`) that runs all 8 tasks and asserts overall score ≥ 60 as a regression gate
- [ ] **TASK-009** — Add task 09: multi-file refactor (medium difficulty)
- [ ] **TASK-010** — Add task 10: end-to-end integration test harness setup (hard)
- [ ] **CACHE-001** — Add TTL to `src/cache.ts` (currently cached indefinitely; stale baselines skew results)
- [ ] **CI-001** — Add GitHub Actions workflow for `pnpm build && pnpm exec vitest run` on every push

## How to contribute

1. Pick an item, open a PR referencing the ID (e.g. `fix(scorer): close SCORE-002`).
2. Unit-test your change (Hamel L1 assertion test minimum).
3. Run `pnpm build && pnpm test` — both must be green before merging.
4. Mark the checkbox `[x]` in this file and include it in your commit.
