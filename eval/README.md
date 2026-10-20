# eval/

The evals of agentbench itself. They gate every push and pull request in CI, and the nightly improvement loop runs
them. They never call a paid API.

| File | What it checks |
| --- | --- |
| [`run.sh`](run.sh) | runs both suites below, in order; `pnpm eval` calls it |
| [`surfaces.py`](surfaces.py) | every surface a coding agent uses is present and well formed: the required docs, the JSON files, the bins and the `prepare` script, a stranger-safe `.mcp.json`, the plugin, the hook scripts, the skills, the sub-agents, `MEMORY.md` within 2,000 tokens, the `llms.txt` links and the DSIP shape (it reads files only) |
| [`golden.sh`](golden.sh) | the built CLI and MCP server for real, with the model replaced by `stub-api.mjs`; each task must pass K rounds in a row (`AG_EVAL_K`, default 3) |
| [`stub-api.mjs`](stub-api.mjs) | a stand-in for the Messages API on a local port; the API key picks its answer: a tool call with a long reply, text only, or a tool call with a short reply |

The golden tasks: the CLI answers `--help` and `--version`; without a key the benchmark stops before any request; the
static score gives an empty folder 0 and a full harness 100, with hooks in `.claude/settings.json` counted; the whole
benchmark scores every task, with one judge call per hard task; the run log records tokens and cost; a task is done
only for a tool call with a reply over 50 characters; both models follow the environment and a flag wins; another
agent scores a harness through the MCP server; memory search finds a learned rule. The report and the scorecard show
efficiency and the baseline as not measured, never as a made-up 50.

Results go to `.agentbench/eval-golden.json` (gitignored). `scripts/improve.mjs` compares its time with
[`baseline.json`](baseline.json) once that file exists.
