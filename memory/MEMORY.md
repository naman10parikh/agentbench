# agentbench — Long-Term Memory (index)

> Inherited memory-harness structure from Energy. One line per durable fact.
> Layers: this index → topics/ deep-dives → daily/ logs → archive/ (compressed >30d, never deleted).

## Architecture Decisions

- **The harness is the unit under test.** agentbench holds the model constant and scores the
  scaffold (CLAUDE.md, skills, hooks, rules): the harness goes in the system prompt, the model stays fixed.
- **Two evals.** The product benchmarks a harness (`tasks/index.ts`, `src/runner.ts`, `src/scorer.ts`); `eval/`
  checks the product itself against a stand-in API (`eval/golden.sh`), so it never spends money.
- **Isolation by design.** Each task runs in a throwaway temp workspace (`src/workspace.ts`) so a
  user's real code is never touched.

## Key Patterns

- **5-dimension score:** completion · efficiency · tool use · recovery · quality; the measured ones are averaged
  to /100 (`src/scorer.ts`). A task is done when the first reply calls a tool and writes more than 50 characters;
  recovery and quality are heuristics over that reply, and efficiency is not measured (`null`) until a real
  baseline exists.
- **One reply per task:** one Messages API call with five tool definitions; the tools are never run. The four
  hard tasks also need an LLM judge score of 50 or more (`src/evaluator.ts`).
- **Baseline cache:** keyed by `sha256(task_suite_version + model_version)` (`src/cache.ts`), but it holds
  placeholder results today, and the reported baseline score is `null` (not measured).

## Technology Choices

- TypeScript + `commander` CLI; `@anthropic-ai/sdk`; `vitest` for tests; `tsx` for dev.
- Both models are settings: `--model` or AGENTBENCH_MODEL, `--judge-model` or AGENTBENCH_JUDGE_MODEL
  (defaults in `src/index.ts` and `src/evaluator.ts`).
- Build: `tsc` → `dist/` (also on install, through `prepare`); bins `dist/src/index.js` and
  `dist/src/mcp-server.js`. CI runs build, `pnpm test` and `pnpm eval`.

## People & Resources

- See [[brain/MOC - agentbench]] for the full navigation graph and per-doc notes.

## What NOT to Do

- Don't let `pnpm eval` call the real API: it runs against `eval/stub-api.mjs`.
- Don't change the `test` script in a way that breaks the CI `pnpm exec vitest run` invocation.
- Don't let AGENTS.md drift back to the generic WikiMem schema (sha `627eebad`) — it must describe
  this repo's scorer CLI. The generic template is preserved as `AGENTS.md.example`.

## Operating Model

- Public OSS repo: no Energy-internal references, personal paths, or maintainer names in shipped
  docs. "Energy" the brand is fine. `scripts/harness-forge/scrub-public.sh` enforces this.

## Topic Files Index

- (none yet — add deep-dives under `memory/topics/` as they emerge)
