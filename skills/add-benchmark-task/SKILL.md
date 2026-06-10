---
name: add-benchmark-task
description: Scaffold a new graded coding task for the agentbench benchmark suite. Use when asked to "add a task", "extend the benchmark", "create a new benchmark case", or grow the harness eval surface (tasks/NN-name/). This is agentbench's single most common authoring task.
allowed-tools: Read, Write, Edit, Bash(ls:*), Bash(./node_modules/.bin/tsc:*), Bash(./node_modules/.bin/vitest:*)
---

# Add a Benchmark Task

agentbench scores a harness by running graded coding tasks in isolated temp workspaces and grading
the output. Each task is a directory under `tasks/` plus an entry in `tasks/index.ts`. This skill
adds one correctly so the new case actually flows through `src/runner.ts` → `src/evaluator.ts` →
`src/scorer.ts`.

## Trigger

- "Add a benchmark task for <category>"
- "The suite is missing a <hard/recovery/security> case — create it"
- "Extend the eval surface with task NN"

## Steps

1. **Pick the next number.** `ls tasks/` → the highest `NN-name` directory. New task is `NN+1`.
   The numeric prefix is load-bearing: `src/sandbox.ts` and the cache key match on it.

2. **Create the three required pieces** under `tasks/NN-task-name/`:
   - `task.json` — human-readable spec (mirrors the entry you add to `index.ts`).
   - `workspace/` — the *starting* (broken/incomplete) repo state the model is handed.
   - `expected/` — the golden reference solution, for automated diffing in `src/evaluator.ts`.

3. **Add the TaskDefinition to `tasks/index.ts`** (this is what actually loads — `task.json` is the
   readable copy). Required fields, matching `src/types.ts`:
   ```ts
   {
     id: NN,
     name: "<one line>",
     category: "bug-fix" | "feature" | "refactor" | "performance" | "security" | "testing",
     difficulty: "easy" | "medium" | "hard",
     description: "<what the task exercises>",
     prompt: "<the exact instruction the model receives>",
     expectedTools: ["Read", "Edit", ...],   // what a good harness should reach for
     hasInjectedError: false,                  // true only for recovery tasks
     scoringRubric: {
       completionCriteria: ["<binary, checkable>"],
       qualityChecks: ["No unnecessary changes", ...],
       expectedTokenRange: { min: <n>, max: <n> },
     },
   }
   ```

4. **Make completion binary.** A good task has a yes/no completion check the evaluator can verify
   automatically (compiles, a named export exists, a test passes, exactly one line changed). Avoid
   tasks whose only grade is taste — those inflate the LLM-judge's variance.

5. **Choose the grading track.** Simple tasks → automated (`scoring.automated: true`, diff vs
   `expected/`). Open-ended tasks → LLM-as-judge (Haiku) via `src/evaluator.ts`. State which in
   `task.json`.

## Verify (do not skip)

```bash
./node_modules/.bin/tsc                 # tasks/index.ts must still typecheck against src/types.ts
./node_modules/.bin/vitest run          # the suite stays green
node dist/src/index.js --task NN --json # the new task loads and runs end-to-end (needs ANTHROPIC_API_KEY)
```

## Expected output

A new `tasks/NN-task-name/` directory (task.json + workspace/ + expected/), a new entry in
`tasks/index.ts`, `tsc` clean, suite green, and the task selectable via `--task NN`. Report the new
task's id, category, and completion criteria.
