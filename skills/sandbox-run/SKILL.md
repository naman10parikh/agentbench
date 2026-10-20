---
name: sandbox-run
description: Boot an isolated E2B Firecracker microVM with a benchmark task's starting files and run a command there, instead of on the host. Use when asked to "run a task in the sandbox", "check the task files in isolation", or before running untrusted code from a task. Needs E2B_API_KEY.
---

# sandbox-run: a task's files in an isolated microVM

`agentbench sandbox-run` creates an E2B sandbox, writes the starting files of one benchmark task (the same files
the benchmark uses, from `src/workspace.ts`) under `/home/user/work`, runs a check there, logs the boot to
`.agentbench/runs.jsonl` and kills the sandbox. The check prints the Node version and lists the folder, and it
runs `tsc --noEmit` only when the template has `tsc`; the default template does not, so today it proves the files
arrive in isolation, not that they compile.

## Steps

1. **Set the key** in the environment, by name, never in a file you commit: `export E2B_API_KEY=...`. Without it the
   command stops with a clear message and never falls back to the host.
2. **Build** if `dist/` is old: `pnpm build`.
3. **Run it for a task** (1 to 10, default 1):
   ```bash
   node dist/src/index.js sandbox-run --task 1
   node dist/src/index.js sandbox-run --task 1 --json
   ```
4. **Read the result:** the sandbox id, the exit code (PASS when 0), the duration, and the output from inside the
   microVM. Then `tail -1 .agentbench/runs.jsonl` shows the `"kind":"sandbox"` line.

## Output

The sandbox id, the exit code, the captured output and the new run-log line. Quote the sandbox id when you report
that a task's files were checked in isolation.
