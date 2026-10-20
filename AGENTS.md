# AGENTS.md: agentbench

> The one set of instructions for every coding agent (Codex, Cursor, OpenCode, Copilot, Gemini CLI, Claude Code) and
> for the people steering them. `CLAUDE.md` and `GEMINI.md` import this file.

## What it does

agentbench puts a number on a coding agent's harness: its `CLAUDE.md`, skills, rules and hooks. It has two scores.
The **static score** reads the harness files and scores them out of 100 with no API call. The **benchmark** holds
the model fixed, sends 10 coding tasks to the Anthropic API with your `CLAUDE.md` in the system prompt, and scores
the replies on five dimensions. Its agent employee is **Lumen** ([identity/SOUL.md](identity/SOUL.md)), whose job is
**evals**. Use it to measure a harness change instead of arguing about it.

## Tools and how to call them

**Command line** (`agentbench`, TypeScript, built to `dist/src/index.js`):

| Command | What it does |
| --- | --- |
| `agentbench score [path] --json` | the static score: CLAUDE.md length, skills, rules, hooks, 25 points each; no API call |
| `agentbench` or `agentbench benchmark` | the benchmark: 10 tasks through the Anthropic API (needs `ANTHROPIC_API_KEY`, costs money) |
| `agentbench --task <n>` | one task of the benchmark (1 to 10) |
| `agentbench --json` · `--verbose` · `--compare <CLAUDE.md>` · `--no-cache` | report as JSON, show each task, score another CLAUDE.md, skip the cache |
| `agentbench --model <id>` · `--judge-model <id>` | the two models are settings; or set `AGENTBENCH_MODEL` and `AGENTBENCH_JUDGE_MODEL` |
| `agentbench sandbox-run --task <n>` | boot an E2B microVM with a task's starting files (needs `E2B_API_KEY`) |
| `agentbench memory-search "<query>"` | BM25 search over the memory and docs of the folder you run it in |
| `agentbench --help` · `agentbench --version` | help and version |

Every benchmark task and sandbox boot appends a line with tokens and an estimated cost to `.agentbench/runs.jsonl`
in the folder you ran it in.

**MCP server** (`agentbench-mcp`, stdio, 1 tool): `score-a-harness` returns the static score for the current folder
or a `targetPath`. Start it with `npx -y -p github:naman10parikh/agentbench agentbench-mcp`.

**Skills** ([skills/](skills/)): `benchmark-harness` scores a harness; `add-benchmark-task` grows the benchmark;
`sandbox-run` checks a task's files in a microVM; `memory-search` searches this repository's memory.

**Sub-agents** ([.claude/agents/](.claude/agents/)): `bench-runner` scores a harness and explains the number;
`task-author` adds or fixes a benchmark task.

## How the benchmark scores (what the code does today)

Each task is one Messages API call. The system prompt holds the first 4,000 characters of your `CLAUDE.md` and the
list of the task's files; skills, rules and hooks are counted in the report but not sent. The tools the call offers
are never run: only the first reply is read.

| Dimension | How it is computed |
| --- | --- |
| Completion | share of tasks done. A task is done when the reply calls a tool and the reply, with one `[tool: name(input)]` line per call, is longer than 50 characters. The 4 hard tasks also need an LLM judge score of 50 or more. |
| Efficiency | baseline tokens divided by your tokens. No baseline is measured yet, so it is 50 on every run. |
| Tool use | 15 points per distinct tool called across all tasks, up to 100. |
| Recovery | of the replies that mention "error", "failed" or "exception", the share of tasks done; 50 when none do. |
| Quality | the average of the done rate and the share of replies with none of those words. |

The overall score is the average of the five. The "baseline" score in the report is a fixed 50.

## What not to do

- Never let `pnpm eval` or a test call the real API: they run against `eval/stub-api.mjs`.
- Never run the paid benchmark for someone without their consent; offer the static score first.
- Never write a model ID into a file or a script. The defaults live in `src/index.ts` and `src/evaluator.ts`; change
  a model with a flag or an environment variable.
- Never claim the benchmark compiles or tests the model's code: it reads one reply per task.
- Never count tasks from the folders under `tasks/`: the benchmark is `loadTasks()` in `tasks/index.ts`.
- Never commit a key, a home path or a run log (`.agentbench/`).
- Never merge a change that fails `pnpm test` or `pnpm eval`.

## Directory map (this repo's actual structure)

```
src/                      # The product — the scorer CLI
  index.ts                #   CLI entry (commander): score, benchmark (default), sandbox-run, memory-search
  runner.ts               #   Sends each task to the Messages API with the harness in the system prompt
  harness-detector.ts     #   Reads CLAUDE.md, settings, skills and rules; counts hooks in both settings files
  static-score.ts         #   The free static score (used by `agentbench score` and the MCP tool)
  workspace.ts            #   Each task's starting files, written to a temporary folder
  evaluator.ts            #   The LLM judge for the hard tasks
  scorer.ts               #   Turns task results into 5 dimension scores + overall /100
  reporter.ts             #   Terminal scorecard, JSON output, report file
  observability.ts        #   Append-only run log with tokens and estimated cost (.agentbench/runs.jsonl)
  sandbox.ts              #   E2B microVM boot with a task's starting files
  memory-index.ts         #   BM25 index behind memory-search
  mcp-server.ts           #   The `agentbench-mcp` stdio server
  cache.ts                #   Baseline cache (sha256 of task-suite + model version)
  types.ts                #   Shared TaskDefinition / report types
tasks/index.ts            # The benchmark: the 10 tasks (definitions, prompts, rubrics)
tasks/NN-<name>/          # Older reference folders (starting state + a solution); the code does not read them
eval/                     # Evals of agentbench itself: surfaces.py, golden.sh, stub-api.mjs, run.sh
scripts/                  # improve.mjs (one turn of the improvement loop) + inherited maintenance scripts
skills/ hooks/            # The plugin's skills and hooks
identity/                 # Agent identity: SOUL.md, BRAND.md, HEARTBEAT.md, MEMORY.md
memory/                   # Long-term memory: MEMORY.md (index) + LEARNINGS.md + topics/daily/archive
brain/                    # Obsidian navigation graph: MOC + ORG_CONTEXT + ORG_MEMORY
.claude/                  # Claude Code harness: rules/, commands/, hooks/, agents/, skills/
.claude-plugin/           # Claude Code plugin manifest and one-plugin marketplace
dist/                     # Build output (tsc, also run by `prepare` on install)
```

## How to extend the benchmark (the most common agent task)

Follow [`skills/add-benchmark-task/SKILL.md`](skills/add-benchmark-task/SKILL.md): add the task to
`tasks/index.ts`, add its starting files to `TASK_FIXTURES` in `src/workspace.ts`, then run
`pnpm build && pnpm test && pnpm eval`. The golden eval runs every task against a stand-in API.

## Build & test (keep these green)

```bash
pnpm install
pnpm build          # tsc → dist/
pnpm test           # vitest run
pnpm eval           # surfaces, then the whole CLI against a stand-in API, pass^3 (no paid call)
pnpm lint           # tsc --noEmit
pnpm dev            # tsx src/index.ts  (run the CLI from source)
```

CI (`.github/workflows/ci.yml`) runs build, test and eval on every push and pull request.

## Commit grammar (so git snap-back works at 3 granularities)

This repo follows Conventional Commits, with these benchmark-specific scopes:

- `feat(task):` — add or change a benchmark task
- `feat(scorer):` / `feat(evaluator):` — change how harnesses are graded
- `feat(detector):` — change what `harness-detector.ts` reads from a harness
- `fix:` / `refactor:` / `docs:` / `ci:` / `test:` — standard scopes

One concern per commit so a single task, scorer change, or doc pass can be reverted independently.

## Operating rules (inherited)

Rules in `.claude/rules/` are glob-loaded every session (TypeScript style, Socratic gate, test-before-signal, error
post-mortem). Read them before non-trivial changes. Test as a user: run the CLI and read the output. "It compiles"
is not "it works".
