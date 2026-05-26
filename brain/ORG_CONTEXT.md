---
type: company-brain
status: active
created: 2026-05-25
updated: 2026-05-26
tags: [agentbench, company-brain, context]
related: ["[[MOC - agentbench]]", "[[ORG_MEMORY]]"]
---

# agentbench — ORG_CONTEXT (the company brain's context)

Every agent reads this before acting. "If it is recorded, it happened to the AI."

agentbench is **"Lighthouse for AI coding harnesses"**: a TypeScript CLI (`npx agentbench`) that
benchmarks a Claude Code setup and returns a score out of 100. Its core thesis is that the
*harness* — the `CLAUDE.md`, skills, hooks, and rules wrapped around a model — is what actually
moves agent performance, so the benchmark holds the model constant and measures the scaffold:
same model, different harness, 42% vs 78%.

It works by detecting a target harness (`src/harness-detector.ts`), running 8 graded coding tasks
(`tasks/01-fix-typo` … `tasks/08-security-audit`) in isolated temp workspaces so the user's real
code is never touched, then scoring the output across five dimensions — completion, efficiency,
tool use, recovery, and quality — via automated checks plus an LLM-as-judge (`src/evaluator.ts`,
Haiku). The first run caches a bare-defaults baseline so later runs report a delta.

This repo is itself an agent-native harness forged from Energy (CP103): Energy is the control
center and agentbench is a self-contained flavor that carries the same formula (identity / memory
+ brain / product source / eval / skills / hooks / subagents / rules). It is a PUBLIC OSS repo, so
no Energy-internal references, personal paths, or maintainer names leak into shipped docs.

## See also

- [[MOC - agentbench]] — navigation hub for every doc and folder
- [[ORG_MEMORY]] — durable learnings the fleet writes back
- [[CLAUDE]] — operating brief · [[AGENTS]] — directory map + how to add a task
