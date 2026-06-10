---
name: sandbox-run
description: Grade a benchmark task's verification inside an isolated E2B Firecracker microVM instead of on the host. Use when asked to "run a task in the sandbox", "verify the output safely", "execute the agent's code in isolation", or whenever a task's check would run model-generated / untrusted code that must NOT touch the host. This is agentbench's isolated-execution path.
allowed-tools: Bash(node dist/src/index.js sandbox-run:*), Bash(./node_modules/.bin/tsx src/index.ts sandbox-run:*), Read
---

# Sandbox Run (E2B-isolated task verification)

agentbench grades coding tasks, and the honest way to grade is to actually *execute* the output
(materialize the workspace, run the verification command, read the exit code). Executing
model-generated / untrusted code on the host machine is exactly what E2B Firecracker microVMs exist
for. `src/sandbox.ts` boots a fresh `Sandbox`, writes the task's `workspace/` fixtures into it, runs
the verification command, and tears the microVM down — so the core "did the code pass?" action runs
isolated. This is the in-code counterpart to `energy/packages/runtime/src/sandbox/container-runner.ts`.

## Trigger

- "Run task N's check in a sandbox" / "verify the output in isolation."
- A task hands the agent code that, if executed on the host, could mutate or exfiltrate (anything
  graded by *running* it rather than diffing it).
- You want a reproducible, host-safe `did-it-compile / did-the-tests-pass` signal for a single task.

## Prerequisites

- `E2B_API_KEY` must be in the environment (it lives in this repo's gitignored `.env`). Load it first:
  ```bash
  set -a && . ./.env && set +a
  ```
  Without the key, `sandbox-run` exits 1 with a clear message — it never silently degrades to host
  execution.

## Steps

1. **Build (or use tsx)** so `dist/` is current:
   ```bash
   ./node_modules/.bin/tsc
   ```

2. **Boot the sandbox for a task** (defaults to task 1):
   ```bash
   node dist/src/index.js sandbox-run --task 1
   ```
   This calls `Sandbox.create()` → `sandbox.files.write()` per workspace file → `sandbox.commands.run()`
   for the verification command → `sandbox.kill()`. The numeric task prefix (`01-`, `02-`, …) is
   load-bearing — `taskDirFor()` matches the task directory by it.

3. **Read the result.** The CLI prints the sandbox id, the exit code (`PASS`/`FAIL`), the duration,
   and the captured stdout/stderr from inside the microVM. A non-zero exit code means the materialized
   workspace failed its check *inside isolation*.

4. **`--json`** for programmatic use (e.g. feeding the result into a report):
   ```bash
   node dist/src/index.js sandbox-run --task 1 --json
   ```

## Verify (do not skip)

```bash
set -a && . ./.env && set +a
node dist/src/index.js sandbox-run --task 1
# Expect: a real "Sandbox ID: <id>", "Exit code: 0 (PASS)", and a line in .agentbench/runs.jsonl
tail -1 .agentbench/runs.jsonl   # should show {"kind":"sandbox", ... "meta":{"sandboxId": ...}}
```

The same boot is also observable: `sandbox.ts` calls `logRun({ kind: "sandbox", ... })`, so every
microVM boot appends a cost/token/exit-code line to `.agentbench/runs.jsonl` — sandboxing and
observability are wired together, not bolted on.

## Expected output

A sandbox id, an exit code with PASS/FAIL, captured stdout/stderr from inside the microVM, and a
fresh `kind:"sandbox"` line in `.agentbench/runs.jsonl`. Cite the sandbox id and exit code when you
report the verification result.
