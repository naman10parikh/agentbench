# agentbench — Quickstart

agentbench is "Lighthouse for AI coding harnesses": it scores your Claude Code setup out of 100.

## Run it

```bash
npx -y -p github:naman10parikh/agentbench agentbench score        # free static score of this folder
npx -y -p github:naman10parikh/agentbench agentbench --task 1     # one benchmark task (needs ANTHROPIC_API_KEY)
```

The full benchmark (`agentbench`) runs 10 coding tasks, each with its starting files in a temporary folder, so your
real code is never touched. It calls the Anthropic API and costs money; `.agentbench/runs.jsonl` records the tokens
and the estimated cost of every call.

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
agentbench --task 1                    # run one task by number
agentbench --json                      # machine-readable report
agentbench --compare ~/other/CLAUDE.md # benchmark a different CLAUDE.md
agentbench --no-cache                  # ignore the cached baseline
agentbench --model <id>                # the model is a setting (or AGENTBENCH_MODEL)
agentbench --verbose                   # detailed per-task output
```

## Where everything lives

The harness-component → folder map and the full directory layout are in
[`CLAUDE.md`](CLAUDE.md) ("Harness components") and [`AGENTS.md`](AGENTS.md). The full flag
reference, the 5 scoring dimensions, and the task list are in [`README.md`](README.md).
