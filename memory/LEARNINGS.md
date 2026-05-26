# agentbench — LEARNINGS (append-only)

Every error → root cause → rule. Auto-compressed when >500 lines (memory-compress.sh).

## 2026-05-26 — Forged-scaffold AGENTS.md was the wrong repo's schema

- **What broke:** the harness-forge extraction copied the generic WikiMem wiki-schema into
  `AGENTS.md` (sha `627eebad`), so this repo's "agent conventions" described a `raw/`+`wiki/`
  knowledge base, not the agentbench scorer CLI.
- **Root cause:** forge copies a template AGENTS.md; the per-repo specialization step was missing.
- **Rule:** after any forge/extraction, verify `shasum AGENTS.md` ≠ `627eebad…` and that the file
  describes *this* repo's real directories. Preserve the generic template as `AGENTS.md.example`.

## 2026-05-26 — Doc task-count must match the filesystem

- **What broke:** README/CLAUDE described "10 benchmark tasks" while only 8 exist on disk
  (`tasks/01-fix-typo` … `tasks/08-security-audit`).
- **Root cause:** docs were written to the design target (10) ahead of implementation (8).
- **Rule:** navigation notes + eval docs count what's actually shipped (8 graded tasks). Product
  docs may state the roadmap target as long as the gap is tracked (CONTEXT "What's next").

## 2026-05-26 — CI uses `pnpm exec vitest run`, not bare `pnpm test`

- **What broke:** N/A (caught before regression) — `package.json` `test` is bare `vitest` (watch).
- **Root cause:** the watch-mode test script and the CI run-once invocation differ.
- **Rule:** keep `pnpm exec vitest run` working; don't rewrite the `test` script in a way that
  breaks the GitHub Actions build+test workflow.
