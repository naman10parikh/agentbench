# agentbench — Session Context

- **Forged:** 2026-05-25 from Energy (CP103 multi-repo extraction); agent-native doc
  standard applied 2026-05-26 (CP104).
- **Status:** v1.0.0. Product source is live in `src/` (9 modules: CLI runner, harness
  detector, isolated-workspace runner, LLM-as-judge evaluator, 5-dimension scorer, terminal/JSON
  reporter, baseline cache). 8 graded benchmark tasks shipped in `tasks/` (01-fix-typo through
  08-security-audit), each with `workspace/` + `expected/`. CI builds and runs `pnpm exec vitest run`.
- **What's next:** expand from 8 → 10 tasks (07-09 multi-file/end-to-end), tighten the placeholder
  recovery + quality scoring in `src/scorer.ts`, record the demo GIF referenced in `README.md`,
  and publish to npm.

## Where to go deeper

- Agent operating brief + commit grammar → [`CLAUDE.md`](CLAUDE.md)
- This repo's directory map + how to add a task → [`AGENTS.md`](AGENTS.md)
- Human/OSS front door (install, what it measures, the 5 dimensions) → [`README.md`](README.md)
- Navigation graph hub → [`brain/MOC - agentbench.md`](brain/MOC%20-%20agentbench.md)
- Release history → [`CHANGELOG.md`](CHANGELOG.md)
