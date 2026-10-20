# Changelog

## Unreleased

### Added

- `agentbench score [path]`: the free static score, the same one the MCP tool `score-a-harness` returns.
- Both models are settings: `--model` or `AGENTBENCH_MODEL`, and `--judge-model` or `AGENTBENCH_JUDGE_MODEL`.
- `agentbench-mcp` bin, a `prepare` script (the CLI runs straight from GitHub), a Claude Code plugin with a
  harness-change hook and two sub-agents, a Gemini CLI extension and an A2A agent card.
- Evals (`pnpm eval`: surfaces, then the whole CLI against a stand-in Messages API, pass^3) in CI, and a nightly
  improvement loop that writes proposals.

### Fixed

- Hooks in `.claude/settings.json` are counted; only `.claude/settings.local.json` was read before.
- `sandbox-run` uses the benchmark's own task files, so tasks 9 and 10 work and each task gets its own files.
- The E2B SDK loads only for `sandbox-run`, so every other command runs on Node 18.
- The docs describe what the code scores today.

## 0.1.0 (Unreleased)

### Added

- CLI with `--task`, `--json`, `--compare`, `--no-cache`, `--model`, `--verbose` flags
- 10 standardized benchmark tasks (bug fix, feature, refactor, testing, debug, hardening, git, security, multi-file, end-to-end)
- 5-dimension scoring: completion, efficiency, tool use, recovery, quality
- Terminal scorecard with colored progress bars
- JSON report output
- Baseline caching
- Harness config detection (CLAUDE.md, settings.json, skills, rules)
- LLM-as-judge evaluation for complex tasks
