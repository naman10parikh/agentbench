# AGENTS.md — agentbench Orchestration Conventions

> How an agent (Claude Code, or any LLM) should operate **inside this repo**.
> agentbench is "Lighthouse for AI coding harnesses": a scorer CLI that holds the
> model constant and measures the *harness* (CLAUDE.md, skills, hooks, rules) by
> running real coding tasks and grading the output. The benchmark IS the product,
> so this repo's "eval surface" is its own source — see the directory map below.

## What you are working on

A TypeScript CLI (`npx agentbench`) that:

1. Detects a target harness (`src/harness-detector.ts`) by reading its `CLAUDE.md`,
   `.claude/settings.json`, `.claude/skills/`, `.claude/rules/`.
2. Runs graded coding tasks (`tasks/`) in isolated temp workspaces (`src/workspace.ts`)
   via the Claude API (`src/runner.ts`), injecting the detected harness as the system prompt.
3. Evaluates output (`src/evaluator.ts` — LLM-as-judge via Haiku; automated diff vs `expected/`)
   and scores it across 5 dimensions (`src/scorer.ts`).
4. Reports a score out of 100 with a terminal scorecard + JSON (`src/reporter.ts`),
   caching the bare-defaults baseline (`src/cache.ts`).

## Directory map (this repo's actual structure)

```
src/                      # The product — the scorer CLI
  index.ts                #   CLI entry (commander; --task/--json/--compare/--no-cache/--model/--verbose)
  runner.ts               #   Runs each task against the Claude API with the harness injected
  harness-detector.ts     #   Reads CLAUDE.md/settings.json/skills/rules into a harness config
  workspace.ts            #   Spins up isolated temp workspaces (your real code is never touched)
  evaluator.ts            #   LLM-as-judge (Haiku) + automated checks against expected/
  scorer.ts               #   Turns task results into 5 dimension scores + overall /100
  reporter.ts             #   Terminal scorecard, JSON output, report file
  cache.ts                #   Baseline caching (sha256 of task-suite + model version)
  types.ts                #   Shared TaskDefinition / report types
tasks/                    # The benchmark itself — 8 graded coding tasks (01..08)
  NN-<name>/task.json     #   Task definition, prompt, expectedTools, scoring rubric
  NN-<name>/workspace/    #   Starting (broken/incomplete) repo state
  NN-<name>/expected/     #   Golden reference solution for automated diffing
  index.ts                #   Loads + exports the task suite
eval/                     # Eval-surface pointer note (the real eval lives in tasks/ + src/)
identity/                 # Agent identity scaffold (SOUL/BRAND/HEARTBEAT/MEMORY)
memory/                   # Long-term memory: MEMORY.md (index) + LEARNINGS.md (append-only) + topics/daily/archive
brain/                    # Obsidian navigation graph: MOC + ORG_CONTEXT + ORG_MEMORY
skills/                   # Repo-local agent skills (currently empty — see skills/README.md)
hooks/                    # Repo-local lifecycle hooks (currently empty — see hooks/README.md)
scripts/                  # Maintenance scripts (memory-search, memory-compress, doc-health-check, ...)
.claude/                  # Inherited Claude Code harness: rules/ (glob-loaded), commands/, hooks/, agents/, skills/
dist/                     # Build output (tsc); the published bin is dist/src/index.js
```

## How to extend the benchmark (the most common agent task)

Add a task as a new directory under `tasks/`:

```
tasks/NN-task-name/
├── task.json       # id, name, category, difficulty, description, prompt, expectedTools, scoring
├── workspace/      # initial repo state (the broken/incomplete code)
└── expected/       # reference solution for automated comparison
```

Then register it in `tasks/index.ts`. Automated tasks (`scoring.automated: true`) are graded by
diff/compile/test checks; complex tasks fall back to `src/evaluator.ts` (LLM-as-judge).

## Build & test (keep these green)

```bash
pnpm install
pnpm build          # tsc → dist/
pnpm test           # vitest  (CI runs: pnpm exec vitest run)
pnpm lint           # tsc --noEmit
pnpm dev            # tsx src/index.ts  (run the CLI from source)
```

CI (`.github/workflows/`) builds then runs `pnpm exec vitest run` — do not change the test
script in a way that breaks that invocation.

## Commit grammar (so git snap-back works at 3 granularities)

This repo follows Conventional Commits, with these benchmark-specific scopes:

- `feat(task):` — add or change a benchmark task under `tasks/`
- `feat(scorer):` / `feat(evaluator):` — change how harnesses are graded
- `feat(detector):` — change what `harness-detector.ts` reads from a harness
- `fix:` / `refactor:` / `docs:` / `ci:` / `test:` — standard scopes

One concern per commit so a single task, scorer change, or doc pass can be reverted independently.

## Operating rules (inherited)

Rules in `.claude/rules/` are glob-loaded every session (TypeScript style, Socratic gate,
test-before-signal, error post-mortem, etc.). Read them before non-trivial changes. Act, don't
ask; self-improve every session; test as a user (run the CLI, read the scorecard) — "it compiles"
is not "it works".

---

*The cross-repo WikiMem wiki-schema template that previously occupied this file is preserved as
[`AGENTS.md.example`](AGENTS.md.example) for reference; it does not describe this repo.*
