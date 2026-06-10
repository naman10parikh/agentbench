/**
 * memory-index.ts — A real queryable BM25 index over agentbench's OWN corpus.
 *
 * This is the in-code counterpart to Energy's `scripts/memory-search.sh`
 * (term-frequency × source-weight × recency), ported to TypeScript and scoped to
 * THIS repo: brain/, memory/, identity/, and the root knowledge docs
 * (MEMORY.md / README / AGENTS / CLAUDE / CONTEXT). It builds a proper inverted
 * index and ranks documents with Okapi BM25 — not grep, not a flat key/value
 * lookup.
 *
 * Wired into the CLI as `agentbench memory-search <query>` (see index.ts).
 */

import { readFileSync, existsSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import fg from "fast-glob";

// ---------------------------------------------------------------------------
// Corpus discovery — the folders that make up agentbench's "brain"
// ---------------------------------------------------------------------------

interface CorpusRoot {
  glob: string;
  weight: number;
}

/** Glob roots, each paired with a source weight (more authoritative = higher). */
function corpusRoots(repoRoot: string): CorpusRoot[] {
  return [
    { glob: "memory/**/*.md", weight: 4 }, // long-term memory + learnings
    { glob: "identity/**/*.md", weight: 3 }, // SOUL/BRAND/HEARTBEAT/MEMORY
    { glob: "brain/**/*.md", weight: 3 }, // Obsidian navigation graph
    { glob: "MEMORY.md", weight: 4 },
    { glob: "README.md", weight: 2 },
    { glob: "AGENTS.md", weight: 2 },
    { glob: "CLAUDE.md", weight: 2 },
    { glob: "CONTEXT.md", weight: 2 },
  ].map((r) => ({ ...r, glob: join(repoRoot, r.glob) }));
}

export interface IndexedDoc {
  path: string; // repo-relative path
  absPath: string; // absolute path (for snippet extraction)
  weight: number; // source weight
  ageDays: number; // file mtime age in days
  termFreqs: Map<string, number>; // term -> count in this doc
  length: number; // total token count in this doc
}

export interface SearchHit {
  path: string;
  score: number;
  snippet: string;
}

// ---------------------------------------------------------------------------
// Tokenization — lowercase, alphanumeric words, length >= 2, stopword-filtered
// ---------------------------------------------------------------------------

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "of", "to", "in", "is", "it", "for", "on",
  "with", "as", "at", "by", "be", "this", "that", "are", "was", "from", "but",
  "not", "we", "you", "your", "if", "so", "do", "via",
]);

export function tokenize(text: string): string[] {
  const out: string[] = [];
  for (const raw of text.toLowerCase().split(/[^a-z0-9]+/)) {
    if (raw.length < 2) continue;
    if (STOPWORDS.has(raw)) continue;
    out.push(raw);
  }
  return out;
}

function ageDaysOf(absPath: string): number {
  try {
    return Math.max(0, (Date.now() - statSync(absPath).mtimeMs) / 86_400_000);
  } catch {
    return 9999;
  }
}

/** Recency multiplier mirroring memory-search.sh's recency buckets. */
function recencyWeight(ageDays: number): number {
  if (ageDays <= 1) return 1.5;
  if (ageDays <= 7) return 1.3;
  if (ageDays <= 30) return 1.1;
  return 1.0;
}

// ---------------------------------------------------------------------------
// Build the inverted index across the corpus
// ---------------------------------------------------------------------------

export function buildIndex(repoRoot: string): IndexedDoc[] {
  const seen = new Set<string>();
  const docs: IndexedDoc[] = [];

  for (const root of corpusRoots(repoRoot)) {
    const matches = fg.sync(root.glob, {
      onlyFiles: true,
      suppressErrors: true,
      ignore: ["**/.obsidian/**", "**/node_modules/**"],
    });
    for (const abs of matches) {
      if (seen.has(abs)) continue;
      seen.add(abs);
      if (!existsSync(abs)) continue;

      let content = "";
      try {
        content = readFileSync(abs, "utf-8");
      } catch {
        continue;
      }
      const tokens = tokenize(content);
      if (tokens.length === 0) continue;

      const termFreqs = new Map<string, number>();
      for (const t of tokens) termFreqs.set(t, (termFreqs.get(t) ?? 0) + 1);

      docs.push({
        path: relative(repoRoot, abs),
        absPath: abs,
        weight: root.weight,
        ageDays: ageDaysOf(abs),
        termFreqs,
        length: tokens.length,
      });
    }
  }
  return docs;
}

// ---------------------------------------------------------------------------
// Okapi BM25 ranking (pure — operates on a prebuilt index, easy to unit test)
// ---------------------------------------------------------------------------

const BM25_K1 = 1.5;
const BM25_B = 0.75;

export function rankDocs(
  docs: IndexedDoc[],
  query: string,
  limit = 5,
): SearchHit[] {
  const queryTerms = [...new Set(tokenize(query))];
  if (queryTerms.length === 0 || docs.length === 0) return [];

  const N = docs.length;
  const avgdl = docs.reduce((s, d) => s + d.length, 0) / N || 1;

  // Document frequency per query term (how many docs contain it).
  const df = new Map<string, number>();
  for (const term of queryTerms) {
    let n = 0;
    for (const d of docs) if (d.termFreqs.has(term)) n++;
    df.set(term, n);
  }

  const scored: SearchHit[] = [];
  for (const d of docs) {
    let score = 0;
    for (const term of queryTerms) {
      const n = df.get(term) ?? 0;
      if (n === 0) continue;
      const f = d.termFreqs.get(term) ?? 0;
      if (f === 0) continue;
      // BM25 IDF (Robertson/Spärck-Jones, +1 smoothing keeps it positive).
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
      const denom = f + BM25_K1 * (1 - BM25_B + (BM25_B * d.length) / avgdl);
      score += idf * ((f * (BM25_K1 + 1)) / denom);
    }
    if (score <= 0) continue;
    // Apply source authority + recency on top of the raw BM25 relevance.
    score *= d.weight * recencyWeight(d.ageDays);
    scored.push({ path: d.path, score, snippet: bestSnippet(d.absPath, queryTerms) });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

/** Best-matching single line in a file, for the result snippet. */
export function bestSnippet(absPath: string, queryTerms: string[]): string {
  let content = "";
  try {
    content = readFileSync(absPath, "utf-8");
  } catch {
    return "";
  }
  let bestLine = "";
  let bestHits = 0;
  for (const line of content.split("\n")) {
    const lineTokens = new Set(tokenize(line));
    let hits = 0;
    for (const t of queryTerms) if (lineTokens.has(t)) hits++;
    if (hits > bestHits) {
      bestHits = hits;
      bestLine = line.trim();
    }
  }
  return bestLine.slice(0, 200);
}

/** Build the index for a repo root and run a query in one call (CLI entry). */
export function searchRepo(
  repoRoot: string,
  query: string,
  limit = 5,
): SearchHit[] {
  return rankDocs(buildIndex(repoRoot), query, limit);
}
