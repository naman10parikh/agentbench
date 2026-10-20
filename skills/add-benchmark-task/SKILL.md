---
name: add-benchmark-task
description: Add a graded coding task to the agentbench benchmark. Use when asked to "add a task", "extend the benchmark", "create a new benchmark case" or cover a new kind of coding work. The task goes in tasks/index.ts and its starting files in src/workspace.ts; the eval proves it runs end to end with no paid call.
---

# add-benchmark-task: grow the benchmark by one task

The benchmark is the list returned by `loadTasks()` in `tasks/index.ts`. Each task's starting files live in
`TASK_FIXTURES` in `src/workspace.ts`; the runner writes them to a temporary folder, and `sandbox-run` writes the
same files into an E2B microVM. The folders `tasks/NN-*/` are older reference material: the code does not read them.

## Steps

1. **Pick the next id** (`loadTasks().length + 1`) and a difficulty. A `hard` task is also graded by the LLM judge
   (`src/evaluator.ts`), so it costs one more API call per run.
2. **Add the definition** to `tasks/index.ts`: `id`, `name`, `category`, `difficulty`, `description`, the exact
   `prompt`, `expectedTools`, `hasInjectedError` and a `scoringRubric` (completion criteria, quality checks,
   expected token range).
3. **Add the starting files** under the same id in `TASK_FIXTURES` (`src/workspace.ts`): every file the prompt
   names, plus a `tsconfig.json` for TypeScript tasks.
4. **Build and run the evals**, which run every task against a stand-in API, so nothing is spent:
   ```bash
   pnpm build && pnpm test && pnpm eval
   ```
5. **Optional, with an E2B key:** `node dist/src/index.js sandbox-run --task <id>` boots a microVM with the new
   task's files.
6. **Update the docs** that count tasks: the README task table and `identity/SOUL.md`.

## Output

A new task in `tasks/index.ts` with its files in `src/workspace.ts`, `pnpm eval` passing with the new task count,
and the README table updated. Commit it as `feat(task): <name>`.
