---
name: memory-search
description: Query agentbench's own memory/brain/identity corpus with the in-code BM25 index instead of grep. Use when you need "what did we decide about X", "where is the scorer rationale", "search the brain", or any recall over this repo's durable docs before changing code. Ported from Energy's scripts/memory-search.sh.
allowed-tools: Bash(node dist/src/index.js memory-search:*), Bash(./node_modules/.bin/tsx src/index.ts memory-search:*)
---

# Memory Search (BM25 over agentbench's own corpus)

agentbench carries a real queryable index (`src/memory-index.ts`) over its own brain: `memory/`,
`identity/`, `brain/`, and the root knowledge docs (MEMORY.md / README / AGENTS / CLAUDE / CONTEXT).
It builds an inverted index and ranks documents with Okapi BM25, then multiplies by source authority
and recency — this is the in-code counterpart to Energy's `scripts/memory-search.sh`. Use it instead
of `grep` so you get *ranked, snippet-bearing* recall, not a flat substring dump.

## Trigger

- "Did we already decide how <X> is scored / cached / isolated?"
- "Where is the rationale for the 5-dimension score?"
- "Search agentbench's memory/brain for <topic>" — before editing, to avoid re-deriving a decision.
- Any recall step in the deep-ingest gate (`.claude/rules/deep-ingest.md`).

## Steps

1. **Run the query** (built CLI):
   ```bash
   node dist/src/index.js memory-search "<your query>" --limit 5
   ```
   or, without a build, via tsx:
   ```bash
   ./node_modules/.bin/tsx src/index.ts memory-search "<your query>"
   ```

2. **Read the ranked hits.** Each line is `[rank] path (score)` + the best-matching snippet. The
   score already folds in BM25 relevance × source weight (memory/MEMORY.md = 4, identity/brain = 3,
   root docs = 2) × recency.

3. **Open the top file** for full context before you act. The snippet is a pointer, not the answer.

4. **`--json`** for programmatic use (e.g. feeding hits into another step):
   ```bash
   node dist/src/index.js memory-search "<query>" --json
   ```

## Verify

```bash
node dist/src/index.js memory-search "harness model constant scaffold"
# Top hit should be identity/SOUL.md or memory/MEMORY.md with score > 15.
```

## Expected output

A ranked list of repo-relative paths with BM25 scores and one-line snippets. Cite the top hit's path
when you use what you found.
