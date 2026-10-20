# agentbench — LEARNINGS (append-only)

Every error → root cause → rule. Auto-compressed when >500 lines (memory-compress.sh).

## 2026-05-26 — Forged-scaffold AGENTS.md was the wrong repo's schema

- **What broke:** the harness-forge extraction copied the generic WikiMem wiki-schema into
  `AGENTS.md` (sha `627eebad`), so this repo's "agent conventions" described a `raw/`+`wiki/`
  knowledge base, not the agentbench scorer CLI.
- **Root cause:** forge copies a template AGENTS.md; the per-repo specialization step was missing.
- **Rule:** after any forge/extraction, verify `shasum AGENTS.md` ≠ `627eebad…` and that the file
  describes *this* repo's real directories. Preserve the generic template as `AGENTS.md.example`.

## 2026-05-26 — Doc task-count must match the filesystem

- **What broke:** README/CLAUDE described "10 benchmark tasks" while only 8 exist on disk
  (`tasks/01-fix-typo` … `tasks/08-security-audit`).
- **Root cause:** docs were written to the design target (10) ahead of implementation (8).
- **Rule:** navigation notes + eval docs count what's actually shipped (8 graded tasks). Product
  docs may state the roadmap target as long as the gap is tracked (CONTEXT "What's next").

## 2026-05-26 — CI uses `pnpm exec vitest run`, not bare `pnpm test`

- **What broke:** N/A (caught before regression) — `package.json` `test` is bare `vitest` (watch).
- **Root cause:** the watch-mode test script and the CI run-once invocation differ.
- **Rule:** keep `pnpm exec vitest run` working; don't rewrite the `test` script in a way that
  breaks the GitHub Actions build+test workflow.

## 2026-10-19 — Hooks in `.claude/settings.json` were never counted

- **What broke:** a harness with every hook in the shared `.claude/settings.json` scored 0 hooks.
- **Root cause:** both counters read only `.claude/settings.local.json`, the personal file most projects never commit.
- **Rule:** count hook groups in both settings files (`countHooks` in `src/harness-detector.ts`, used by the
  benchmark and the static score). The golden eval scores a harness whose hooks live only in settings.json.

## 2026-10-19 — The benchmark runs 10 tasks; the 8 folders are not the benchmark

- **What broke:** docs said 8 graded tasks and `sandbox-run` read `tasks/NN-*/workspace`, whose names do not match
  the benchmark's tasks (task 3 got the debug-error files) and which stop at 08 (tasks 9 and 10 threw).
- **Root cause:** two corpora: the 10 tasks the runner uses (`tasks/index.ts` + `src/workspace.ts`) and 8 older
  reference folders under `tasks/`.
- **Rule:** the benchmark is the 10 tasks in `tasks/index.ts` with their files in `src/workspace.ts`; `sandbox-run`
  uses those same files. Count tasks from `loadTasks()`, never from the folders.

## 2026-10-19 — The README promised scoring the code does not do

- **What broke:** the README said tasks 1 to 6 are checked by compiling and running tests, that tool use compares
  expected tools, that quality is an LLM judge and that the first run measures a bare baseline.
- **Root cause:** the docs described the design, not the code.
- **Rule:** describe what `src/runner.ts` and `src/scorer.ts` compute today: a task is done when the first reply
  calls a tool and writes more than 50 characters (hard tasks: the judge's score is 50 or more). The golden eval
  checks that rule against a stand-in API.
