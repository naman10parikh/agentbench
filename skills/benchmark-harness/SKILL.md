---
name: benchmark-harness
description: Score a Claude Code harness (CLAUDE.md, skills, rules, hooks) with agentbench. Use when someone asks "how good is my setup", "score my harness", "did this CLAUDE.md change help", or wants a number to compare two setups. Starts with the free static score and runs the paid benchmark only after the person agrees to the cost.
---

# benchmark-harness: put a number on a harness

agentbench has two scores. `agentbench score` reads the harness files and scores them out of 100 with no API call.
`agentbench` (the benchmark) sends 10 coding tasks to the Anthropic API with the first 4,000 characters of the
harness's `CLAUDE.md` in the system prompt and scores the replies; it needs `ANTHROPIC_API_KEY` and costs money on every run.

## Steps

1. **Static score first (free).** From the harness's root folder, or with its path:
   ```bash
   npx -y -p github:naman10parikh/agentbench agentbench score [path] --json
   ```
   It scores four parts, 25 points each: CLAUDE.md length, the number of skills in `.claude/skills/`, the number
   of rules in `.claude/rules/`, and hooks in `.claude/settings.json` and `.claude/settings.local.json`. From
   another coding agent, the MCP tool `score-a-harness` returns the same result.
2. **Ask before the benchmark.** Tell the person it calls the Anthropic API about 14 times (10 tasks, plus an LLM
   judge on the 4 hard tasks) and that the run log estimates the cost afterwards. Run it only if they agree.
3. **Run the benchmark** in the harness's root folder:
   ```bash
   agentbench --json            # all 10 tasks
   agentbench --task 1 --json   # one task, the cheapest check
   ```
   The models are settings: `--model` or `AGENTBENCH_MODEL`, `--judge-model` or `AGENTBENCH_JUDGE_MODEL`.
4. **Read what the number means.** A task counts as done when the first reply calls a tool and the reply, with one
   `[tool: name(input)]` line per call, is longer than 50 characters; a hard task also needs a judge score of 50
   or more. Efficiency stays at 50 until a measured baseline exists. Say this when you report the score.
5. **Compare** two setups by running the same command in each folder, or `--compare <other CLAUDE.md>`.

## Output

The static score with its four parts, and, when the person agreed to the cost, the benchmark's overall score, its
five dimensions, the weakest dimension, and the cost line from `.agentbench/runs.jsonl`.
