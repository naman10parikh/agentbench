# agentbench

Lighthouse for AI coding harnesses. Benchmark your Claude Code setup and get a score out of 100.

<!-- TODO: Record demo GIF with `vhs` and add here -->

## Why

You spend hours tweaking CLAUDE.md, skills, hooks, and rules — but have no way to measure if your changes actually help. People share configs on X and GitHub with no evidence they work better than the defaults.

Superpowers has 89K stars. Everyone has a different CLAUDE.md. Nobody can prove theirs is better.

agentbench gives you a number. Run it before and after every harness change. Share your score. Compete.

## Install

```bash
npx agentbench
```

Or install globally:

```bash
npm install -g agentbench
```

Or clone and run locally:

```bash
git clone https://github.com/naman10parikh/agentbench.git
cd agentbench
pnpm install
pnpm dev
```

## Quick Start

```bash
# Run the full benchmark (10 tasks, ~2 min, ~$0.50 API cost)
npx agentbench

# Run a single task to test quickly
npx agentbench --task 1

# Get JSON output for CI/scripts
npx agentbench --json

# Compare your harness against another CLAUDE.md
npx agentbench --compare ~/other-project/CLAUDE.md

# Re-run baseline from scratch (ignores cache)
npx agentbench --no-cache

# Use a specific model
npx agentbench --model claude-sonnet-4-6

# See detailed output for each task
npx agentbench --verbose
```

## Example Output

```
  ┌─────────────────────────────────────────────┐
  │                 agentbench                   │
  │                                              │
  │  HARNESS SCORE: 73 / 100                    │
  │                                              │
  │  Completion    ████████░░  82%              │
  │  Efficiency    ██████░░░░  61%              │
  │  Tool Use      ████████░░  78%              │
  │  Recovery      █████░░░░░  54%              │
  │  Quality       █████████░  91%              │
  │                                              │
  │  vs. baseline: +31 points                   │
  │  Top tip: Add error recovery skills          │
  └─────────────────────────────────────────────┘

  Full report: .agentbench/report-2026-03-17.json
```

## What It Measures

Your harness is scored across 5 dimensions (0-100 each):

| Dimension      | What It Measures                          | How It's Scored                        |
| -------------- | ----------------------------------------- | -------------------------------------- |
| **Completion** | Did the agent finish each task correctly? | Pass/fail per task, averaged           |
| **Efficiency** | How many tokens did it use vs. baseline?  | Ratio against bare defaults            |
| **Tool Use**   | Did it pick the right tools for the job?  | Expected vs. actual tool selection     |
| **Recovery**   | Did it recover from injected errors?      | Error recovery rate on seeded failures |
| **Quality**    | How good is the output code?              | LLM-as-judge evaluation (via Haiku)    |

The **overall score** is the average across all 5 dimensions.

## The 10 Benchmark Tasks

Each task runs in an isolated temporary workspace — your actual code is never touched.

| #   | Task                                         | Difficulty | What It Tests                       |
| --- | -------------------------------------------- | ---------- | ----------------------------------- |
| 1   | Fix a typo in a TypeScript file              | Easy       | Basic navigation + edit             |
| 2   | Add a function with a specific signature     | Easy       | Code generation accuracy            |
| 3   | Refactor a function to reduce complexity     | Medium     | Code understanding + simplification |
| 4   | Write unit tests for an existing module      | Medium     | Test generation quality             |
| 5   | Fix a failing test by reading error output   | Medium     | Error comprehension + debugging     |
| 6   | Add error handling to a throwing function    | Medium     | Recovery pattern knowledge          |
| 7   | Resolve a merge conflict in git              | Hard       | Multi-file coordination             |
| 8   | Find and fix a SQL injection vulnerability   | Hard       | Security awareness                  |
| 9   | Refactor 3 files to extract a shared utility | Hard       | Cross-file reasoning                |
| 10  | Add a REST endpoint with validation + tests  | Hard       | Full-stack completion               |

Tasks 1-6 use **automated checks** (compilation, test pass, diff comparison).
Tasks 7-10 use **LLM-as-judge** (Claude Haiku evaluates against a rubric).

## How It Works

```
1. Detect harness  →  Reads CLAUDE.md, settings.json, .claude/skills/, .claude/rules/
2. Run tasks       →  10 coding tasks in isolated temp workspaces via Claude API
3. Evaluate        →  Automated checks + LLM-as-judge scoring
4. Compare         →  Score vs. cached baseline (bare Claude Code defaults)
5. Report          →  Terminal scorecard + JSON report + recommendations
```

### Harness Detection

agentbench auto-detects your harness by reading:

| File/Dir                | What It Extracts                      |
| ----------------------- | ------------------------------------- |
| `CLAUDE.md`             | System prompt, rules, operating model |
| `.claude/settings.json` | Hook definitions, permissions         |
| `.claude/skills/*.md`   | Skill count and content               |
| `.claude/rules/*.md`    | Rule count and content                |

This config is injected into the Claude API system prompt when running each task, exactly as Claude Code would use it.

### Baseline Caching

The first time you run agentbench, it benchmarks bare Claude Code defaults and caches the result. Subsequent runs only benchmark your harness and compare against the cache. The cache key is `sha256(task_suite_version + model_version)`.

Clear cache: `npx agentbench --no-cache`

### Cost Estimate

| Component                        | Cost        |
| -------------------------------- | ----------- |
| 10 tasks via Sonnet              | ~$0.30-0.60 |
| LLM-as-judge (4 tasks via Haiku) | ~$0.05-0.10 |
| Baseline run (first time only)   | ~$0.30-0.60 |
| **Typical run**                  | **~$0.50**  |

## Configuration

| Flag               | Default             | Description                                 |
| ------------------ | ------------------- | ------------------------------------------- |
| `--task <n>`       | all                 | Run a single task by number (1-10)          |
| `--json`           | false               | Output results as JSON                      |
| `--compare <path>` | none                | Compare against another CLAUDE.md           |
| `--no-cache`       | false               | Ignore cached baseline, re-run from scratch |
| `--model <id>`     | `claude-sonnet-4-6` | Model to benchmark with                     |
| `--verbose`        | false               | Show detailed per-task output               |

## JSON Output

With `--json`, agentbench outputs a structured report:

```json
{
  "version": "0.1.0",
  "timestamp": "2026-03-17T10:30:00Z",
  "model": "claude-sonnet-4-6",
  "overallScore": 73,
  "baselineScore": 50,
  "dimensions": [
    { "name": "completion", "score": 82, "details": "8/10 tasks completed" },
    {
      "name": "efficiency",
      "score": 61,
      "details": "12,400 tokens (baseline: 18,200)"
    },
    { "name": "toolUse", "score": 78, "details": "7 unique tools used" },
    { "name": "recovery", "score": 54, "details": "2/4 errors recovered" },
    { "name": "quality", "score": 91, "details": "LLM judge average" }
  ],
  "recommendations": [
    "Add error recovery skills or an error escalation protocol to your harness"
  ],
  "harnessConfig": {
    "hasClaudeMd": true,
    "claudeMdLines": 142,
    "skillCount": 8,
    "ruleCount": 3,
    "hookCount": 5
  }
}
```

## Adding Custom Tasks

Each task is a directory under `tasks/` with:

```
tasks/NN-task-name/
├── task.json       # Task definition, prompt, scoring rubric
├── workspace/      # Initial repo state (the broken/incomplete code)
└── expected/       # Reference solution (for automated comparison)
```

### task.json Format

```json
{
  "id": 11,
  "name": "Your task name",
  "category": "bug-fix",
  "difficulty": "medium",
  "description": "What the task tests",
  "prompt": "The exact prompt sent to the agent",
  "expectedTools": ["Read", "Edit", "Bash"],
  "scoring": {
    "automated": true,
    "checks": ["tsc --noEmit exits 0", "specific check here"]
  }
}
```

## Improving Your Score

Common harness improvements by dimension:

| Low Score In | What to Add                                       |
| ------------ | ------------------------------------------------- |
| Completion   | Clearer task completion criteria in CLAUDE.md     |
| Efficiency   | Model routing rules (Haiku for simple subtasks)   |
| Tool Use     | Tool preference rules ("Use Read instead of cat") |
| Recovery     | Error escalation protocol, `/troubleshoot` skill  |
| Quality      | Code style rules, pre-commit quality gate hook    |

## Comparison to Existing Benchmarks

| Benchmark       | What It Tests                  | Our Difference                         |
| --------------- | ------------------------------ | -------------------------------------- |
| SWE-bench       | Model ability on GitHub issues | We test the **harness**, not the model |
| HumanEval       | Code generation                | Single-function, no tool use           |
| MBPP            | Python programming             | No harness awareness                   |
| Aider benchmark | Edit accuracy                  | Doesn't score efficiency or recovery   |

agentbench is the only benchmark that holds the **model constant** and measures the **harness**. Same model, different scaffold: 42% vs 78%. The harness IS the product.

## Requirements

- Node.js 18+
- `ANTHROPIC_API_KEY` environment variable
- ~$0.50 per benchmark run

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). We especially welcome:

- **New benchmark tasks** — the more diverse, the better the signal
- **Scoring improvements** — better rubrics, tighter automated checks
- **Bug reports** — if a score feels wrong, tell us

## License

MIT
