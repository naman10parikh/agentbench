---
type: moc
status: active
created: 2026-05-25
updated: 2026-05-26
tags: [agentbench, moc, harness]
related: ["[[ORG_CONTEXT]]", "[[ORG_MEMORY]]"]
---

# MOC — agentbench

Master hub for this harness's brain. agentbench is **"Lighthouse for AI coding harnesses"** — a
scorer CLI that holds the model constant and measures the *harness* (CLAUDE.md, skills, hooks,
rules) by running 8 graded coding tasks and scoring the output out of 100. This note wikilinks
every doc in the repo and names every top-level folder so nothing is orphaned.

## Doc spine (repo front doors)

- [[README]] — human / OSS front door: install, what it measures, the 5 dimensions, the task list
- [[CLAUDE]] — agent operating brief: what-it-is + harness-component → folder map + build/test + commit grammar
- [[AGENTS]] — this repo's orchestration conventions: directory map, how to add a benchmark task
- [[CONTEXT]] — current state + what's next + pointers to deeper docs
- [[QUICKSTART]] — the one command to run, inline (`npx agentbench`)
- [[CONTRIBUTING]] — how to add tasks, improve scoring, submit code changes
- [[CHANGELOG]] — release history (v1.0.0)

## Company Brain

- [[ORG_CONTEXT]] — what this harness is and the context every agent reads before acting
- [[ORG_MEMORY]] — what the fleet has learned (writes back here after acting)

## Architecture

- [[eval]] — the eval surface (the real eval lives one level up in `tasks/` + `src/`)
- Product source: `src/` — CLI (`index.ts`), `runner.ts`, `harness-detector.ts`, `workspace.ts`,
  `evaluator.ts`, `scorer.ts`, `reporter.ts`, `cache.ts`, `types.ts`
- Benchmark: `tasks/` — 8 graded tasks (`01-fix-typo` … `08-security-audit`), each `task.json` +
  `workspace/` + `expected/`, registered in `tasks/index.ts`

## Operations

- `scripts/` — maintenance: `memory-search.sh`, `memory-compress.sh`, `doc-health-check.sh`,
  `budget-manager.sh`, `auto-switch.sh`
- `.claude/` — inherited Claude Code harness: `rules/` (glob-loaded), `commands/`, `hooks/`, `agents/`, `skills/`
- `memory/` — `MEMORY.md` (long-term index) + `LEARNINGS.md` (append-only) + `topics/` `daily/` `archive/` `maintainer-prompts/`
- `identity/` — agent identity scaffold: `SOUL.md`, `BRAND.md`, `HEARTBEAT.md`, `MEMORY.md`
- `skills/` — repo-local agent skills (currently empty; see `skills/README.md`)
- `hooks/` — repo-local lifecycle hooks (currently empty; see `hooks/README.md`)
- `dist/` — build output (tsc); the published bin is `dist/src/index.js`
- `node_modules/` — installed dependencies (not tracked)

## Decisions

- AGENTS.md was the mis-copied WikiMem wiki-schema (sha `627eebad`); rewritten to be
  agentbench-specific (CP104), original preserved as `AGENTS.md.example`. See [[ORG_MEMORY]].
