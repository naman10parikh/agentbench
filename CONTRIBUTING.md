# Contributing to agentbench

Thanks for your interest in improving agentbench.

## How to Contribute

### Report Bugs

Open an issue with: what you expected, what happened, your Node.js version, and OS.

### Add Benchmark Tasks

The most impactful contribution. Each task lives in `tasks/NN-task-name/` with:

- `task.json` — description, expected behavior, scoring rubric
- `workspace/` — initial repo state the agent operates on
- `expected/` — reference solution for automated comparison

See existing tasks for the format.

### Improve Scoring

The scorer (`src/scorer.ts`) can always be more accurate. If you find a case where the score doesn't match your intuition, open an issue with the task output and expected score.

### Code Changes

1. Fork the repo
2. Create a branch (`git checkout -b my-fix`)
3. Make changes
4. Run tests (`pnpm test`)
5. Open a PR

## Code Style

- TypeScript strict mode
- No `any`
- Named exports only
- Files under 300 lines

## License

By contributing, you agree your contributions are licensed under MIT.
