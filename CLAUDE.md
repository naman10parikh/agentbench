# agentbench — Agent-Native Harness

> Forged from Energy via harness-forge (CP103). One repo = one recursively self-improving
> agent-native harness. Energy is the control center; this is a self-contained flavor.

## What this is

agentbench is **"Lighthouse for AI coding harnesses"** — a TypeScript CLI (`npx agentbench`)
that benchmarks a Claude Code setup and returns a **score out of 100**. It holds the *model*
constant and measures the *harness* (your `CLAUDE.md`, skills, hooks, rules) by running 8 graded
coding tasks in isolated temp workspaces and scoring the output across 5 dimensions — completion,
efficiency, tool use, recovery, and quality. Same model, different scaffold: 42% vs 78%. The
harness is the product, so this benchmark measures the thing that actually moves the number.

## Harness components (where the formula maps to real folders)

| Component                       | Lives in                                      |
| ------------------------------- | --------------------------------------------- |
| identity                        | `identity/` (SOUL · BRAND · HEARTBEAT · MEMORY) |
| memory + brain                  | `memory/` (MEMORY.md index, LEARNINGS.md, topics/daily/archive) + `brain/` (Obsidian MOC graph) |
| product source (the scorer CLI) | `src/` (index · runner · harness-detector · workspace · evaluator · scorer · reporter · cache · types) |
| benchmark + eval surface        | `tasks/` (8 graded tasks: workspace/ + expected/ + task.json) + `eval/` (pointer note) |
| skills                          | `skills/` (repo-local, currently empty) + `.claude/skills/` (inherited) |
| hooks                           | `hooks/` (repo-local, currently empty) + `.claude/hooks/` (inherited lifecycle hooks) |
| subagents                       | `.claude/agents/` (code-reviewer, architect, security-reviewer, test-writer, research-agent, ...) |
| rules / commands                | `.claude/rules/` (glob-loaded every session) + `.claude/commands/` (slash commands) |
| scripts                         | `scripts/` (memory-search · memory-compress · doc-health-check · budget-manager · auto-switch) |
| build output                    | `dist/` (tsc; published bin = `dist/src/index.js`) |

Same formula as every Energy harness, different data. Full directory map + how-to-extend live in
[`AGENTS.md`](AGENTS.md); the navigation graph hub is [`brain/MOC - agentbench.md`](brain/MOC%20-%20agentbench.md).

## Build / test / run

```bash
pnpm install
pnpm build          # tsc → dist/
pnpm test           # vitest   (CI: pnpm exec vitest run)
pnpm lint           # tsc --noEmit
pnpm dev            # tsx src/index.ts — run the CLI from source
npx agentbench      # run the full benchmark against the current harness
```

Test as a user: run `pnpm dev --task 1` and read the scorecard. "It compiles" means nothing.

## Operating model

You are the user's co-founder. Act, don't ask. Self-improve every session. Test as a user.
Inherited rules in `.claude/rules/` are glob-loaded every session (TypeScript style, Socratic
gate, test-before-signal, error post-mortem).

## Commit convention

Conventional Commits. Benchmark-specific scopes so git snap-back works at all 3 granularities:
`feat(task):` (a benchmark task) · `feat(scorer):` / `feat(evaluator):` (grading) ·
`feat(detector):` (what a harness exposes) · plus `fix:` · `refactor:` · `docs:` · `ci:` · `test:`.
One concern per commit so a single task, scorer change, or doc pass reverts independently.
