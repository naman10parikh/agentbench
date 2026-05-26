# agentbench — Long-Term Memory (index)

> Inherited memory-harness structure from Energy. One line per durable fact.
> Layers: this index → topics/ deep-dives → daily/ logs → archive/ (compressed >30d, never deleted).

## Architecture Decisions

- **The harness is the unit under test.** agentbench holds the model constant and scores the
  scaffold (CLAUDE.md, skills, hooks, rules). Same model, different harness: 42% vs 78%.
- **The eval surface is the product.** The real eval lives in `tasks/` + `src/evaluator.ts` +
  `src/scorer.ts`, not in `eval/` (which is a pointer note for harness-formula completeness).
- **Isolation by design.** Each task runs in a throwaway temp workspace (`src/workspace.ts`) so a
  user's real code is never touched.

## Key Patterns

- **5-dimension score:** completion · efficiency · tool use · recovery · quality → averaged to /100
  (`src/scorer.ts`). Recovery and quality currently use placeholder heuristics — tighten next.
- **Two-track grading:** automated checks (compile/test/diff vs `expected/`) for simple tasks;
  LLM-as-judge via Haiku (`src/evaluator.ts`) for complex tasks.
- **Baseline caching:** first run benchmarks bare defaults and caches by
  `sha256(task_suite_version + model_version)` (`src/cache.ts`); later runs report a delta.

## Technology Choices

- TypeScript + `commander` CLI; `@anthropic-ai/sdk`; `vitest` for tests; `tsx` for dev.
- Default benchmark model `claude-sonnet-4-6`; judge model `claude-haiku-4-5`.
- Build: `tsc` → `dist/`; published bin `dist/src/index.js`. CI runs `pnpm exec vitest run`.

## People & Resources

- See [[brain/MOC - agentbench]] for the full navigation graph and per-doc notes.

## What NOT to Do

- Don't duplicate the benchmark into `eval/` — it points at `tasks/` + `src/`.
- Don't change the `test` script in a way that breaks the CI `pnpm exec vitest run` invocation.
- Don't let AGENTS.md drift back to the generic WikiMem schema (sha `627eebad`) — it must describe
  this repo's scorer CLI. The generic template is preserved as `AGENTS.md.example`.

## Operating Model

- Public OSS repo: no Energy-internal references, personal paths, or maintainer names in shipped
  docs. "Energy" the brand is fine. `scripts/harness-forge/scrub-public.sh` enforces this.

## Topic Files Index

- (none yet — add deep-dives under `memory/topics/` as they emerge)
