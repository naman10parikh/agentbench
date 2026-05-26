---
type: company-brain
status: active
created: 2026-05-25
updated: 2026-05-26
tags: [agentbench, company-brain, memory]
related: ["[[MOC - agentbench]]", "[[ORG_CONTEXT]]"]
---

# agentbench — ORG_MEMORY (the company brain's memory)

Every agent writes back here after acting. The fleet inherits every workflow's learnings.

## Learnings

- **The eval surface IS the product.** agentbench is itself an eval harness, so its "eval" lives
  one level up in `tasks/` + `src/` rather than in `eval/`. The `eval/README.md` is a pointer, not
  a second copy — don't duplicate the benchmark into `eval/`.
- **AGENTS.md must describe *this* repo.** The forged scaffold shipped the generic WikiMem
  wiki-schema in `AGENTS.md` (sha `627eebad`). It was rewritten to agentbench's real directory map +
  how-to-add-a-task; the generic template is preserved as `AGENTS.md.example`. Verify any future
  AGENTS.md change still describes the scorer CLI, not a wiki.
- **README says 10 tasks; the repo ships 8.** `01-fix-typo` … `08-security-audit` exist on disk.
  Docs that count tasks must match the filesystem — the navigation graph and `eval/README.md` say
  8 graded tasks. Closing the 8→10 gap is tracked in [[CONTEXT]] "What's next".
- **CI invokes `pnpm exec vitest run` (not bare `pnpm test`).** `package.json` `test` is bare
  `vitest`; don't change it in a way that breaks the CI invocation.
- **Public repo → 0 Energy-internal residuals.** "Energy" the brand is kept; internal maintainer
  names, personal paths, vision-doc names, and customer names must be 0 in shipped docs
  (`scripts/harness-forge/scrub-public.sh` enforces this).

## See also

- [[MOC - agentbench]] · [[ORG_CONTEXT]] · [[CONTEXT]]
