# skills/

agentbench's own skills, one folder each, with a `SKILL.md` that says when to use it, the steps and the output:

| Skill | When to use |
| --- | --- |
| [`benchmark-harness`](benchmark-harness/SKILL.md) | Score a harness: the free static score first, the paid benchmark only with consent. |
| [`add-benchmark-task`](add-benchmark-task/SKILL.md) | Add a graded coding task to the benchmark. |
| [`sandbox-run`](sandbox-run/SKILL.md) | Boot an E2B microVM with a task's starting files. |
| [`memory-search`](memory-search/SKILL.md) | Search this repository's memory and docs before changing code. |

The general skills under `.claude/skills/` (architect, deep-think, troubleshoot and the rest) are for working on this
codebase and are not part of the plugin. See [`../AGENTS.md`](../AGENTS.md).
