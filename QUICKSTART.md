# agentbench — Quickstart

agentbench is "Lighthouse for AI coding harnesses": it scores your Claude Code setup out of 100.

## Run it (the one command)

```bash
npx agentbench
```

That runs the full benchmark (8 graded coding tasks in isolated temp workspaces — your real code
is never touched) and prints a scorecard. You need `ANTHROPIC_API_KEY` set; a typical run is ~$0.50.

## From a local clone

```bash
git clone https://github.com/naman10parikh/agentbench.git
cd agentbench
pnpm install
pnpm build          # tsc → dist/
pnpm dev            # run the CLI from source (tsx src/index.ts)
# e.g. quick single-task smoke test:
pnpm dev --task 1
```

## Useful flags

```bash
npx agentbench --task 1                    # run one task by number
npx agentbench --json                      # machine-readable report
npx agentbench --compare ~/other/CLAUDE.md # score a different harness
npx agentbench --no-cache                  # re-run the baseline from scratch
npx agentbench --model claude-sonnet-4-6   # pick the model
npx agentbench --verbose                   # detailed per-task output
```

## Where everything lives

The harness-component → folder map and the full directory layout are in
[`CLAUDE.md`](CLAUDE.md) ("Harness components") and [`AGENTS.md`](AGENTS.md). The full flag
reference, the 5 scoring dimensions, and the task list are in [`README.md`](README.md).
