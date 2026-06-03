import { describe, it, expect } from "vitest";
import { scoreResults } from "./scorer.js";
import type { TaskResult } from "./types.js";

// ---------------------------------------------------------------------------
// Helpers — factories for TaskResult so tests are readable
// ---------------------------------------------------------------------------

function makeResult(overrides: Partial<TaskResult> = {}): TaskResult {
  return {
    taskId: 1,
    taskName: "test-task",
    completed: true,
    tokensUsed: 1000,
    toolsUsed: ["Read", "Edit"],
    errorsEncountered: 0,
    errorsRecovered: 0,
    output: "done",
    durationMs: 500,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// scoreResults — shape
// ---------------------------------------------------------------------------

describe("scoreResults — output shape", () => {
  it("returns exactly 5 dimension scores", () => {
    const results = [makeResult()];
    const baseline = [makeResult()];
    const dims = scoreResults(results, baseline);
    expect(dims).toHaveLength(5);
  });

  it("returns dimensions named completion, efficiency, toolUse, recovery, quality", () => {
    const dims = scoreResults([makeResult()], [makeResult()]);
    const names = dims.map((d) => d.name);
    expect(names).toEqual([
      "completion",
      "efficiency",
      "toolUse",
      "recovery",
      "quality",
    ]);
  });

  it("every dimension has score ≥ 0 and ≤ maxScore", () => {
    const results = [makeResult(), makeResult({ completed: false, tokensUsed: 5000 })];
    const baseline = [makeResult(), makeResult()];
    const dims = scoreResults(results, baseline);
    for (const d of dims) {
      expect(d.score).toBeGreaterThanOrEqual(0);
      expect(d.score).toBeLessThanOrEqual(d.maxScore);
    }
  });
});

// ---------------------------------------------------------------------------
// completion dimension
// ---------------------------------------------------------------------------

describe("completion dimension", () => {
  it("scores 100 when all tasks completed", () => {
    const results = [makeResult(), makeResult(), makeResult()];
    const dims = scoreResults(results, results);
    const completion = dims.find((d) => d.name === "completion")!;
    expect(completion.score).toBe(100);
  });

  it("scores 0 when no tasks completed", () => {
    const results = [
      makeResult({ completed: false }),
      makeResult({ completed: false }),
    ];
    const dims = scoreResults(results, results);
    const completion = dims.find((d) => d.name === "completion")!;
    expect(completion.score).toBe(0);
  });

  it("scores 50 when half tasks completed", () => {
    const results = [
      makeResult({ completed: true }),
      makeResult({ completed: false }),
    ];
    const dims = scoreResults(results, results);
    const completion = dims.find((d) => d.name === "completion")!;
    expect(completion.score).toBe(50);
  });

  it("details string reflects completed/total ratio", () => {
    const results = [makeResult({ completed: true }), makeResult({ completed: false })];
    const dims = scoreResults(results, results);
    const completion = dims.find((d) => d.name === "completion")!;
    expect(completion.details).toContain("1/2");
  });
});

// ---------------------------------------------------------------------------
// efficiency dimension
// ---------------------------------------------------------------------------

describe("efficiency dimension", () => {
  it("defaults to 50 when baseline tokens are 0", () => {
    const results = [makeResult({ tokensUsed: 1000 })];
    const emptyBaseline = [makeResult({ tokensUsed: 0 })];
    const dims = scoreResults(results, emptyBaseline);
    const efficiency = dims.find((d) => d.name === "efficiency")!;
    expect(efficiency.score).toBe(50);
  });

  it("scores 100 when actual tokens equal baseline (same efficiency)", () => {
    const result = makeResult({ tokensUsed: 1000 });
    const baseline = makeResult({ tokensUsed: 1000 });
    const dims = scoreResults([result], [baseline]);
    const efficiency = dims.find((d) => d.name === "efficiency")!;
    // ratio = 1000/1000 = 1 → score = 100
    expect(efficiency.score).toBe(100);
  });

  it("scores 50 when actual tokens are 2x the baseline (half as efficient)", () => {
    const result = makeResult({ tokensUsed: 2000 });
    const baseline = makeResult({ tokensUsed: 1000 });
    const dims = scoreResults([result], [baseline]);
    const efficiency = dims.find((d) => d.name === "efficiency")!;
    // ratio = 1000/2000 = 0.5 → score = 50
    expect(efficiency.score).toBe(50);
  });

  it("caps at 100 when actual tokens are fewer than baseline", () => {
    const result = makeResult({ tokensUsed: 500 });
    const baseline = makeResult({ tokensUsed: 2000 });
    const dims = scoreResults([result], [baseline]);
    const efficiency = dims.find((d) => d.name === "efficiency")!;
    // ratio = 2000/500 = 4 → would be 400 but capped at 100
    expect(efficiency.score).toBe(100);
  });

  it("details string contains token counts", () => {
    const result = makeResult({ tokensUsed: 800 });
    const baseline = makeResult({ tokensUsed: 1000 });
    const dims = scoreResults([result], [baseline]);
    const efficiency = dims.find((d) => d.name === "efficiency")!;
    expect(efficiency.details).toContain("800");
    expect(efficiency.details).toContain("1000");
  });
});

// ---------------------------------------------------------------------------
// toolUse dimension
// ---------------------------------------------------------------------------

describe("toolUse dimension", () => {
  it("scores 0 when no tools used", () => {
    const results = [makeResult({ toolsUsed: [] })];
    const dims = scoreResults(results, results);
    const toolUse = dims.find((d) => d.name === "toolUse")!;
    expect(toolUse.score).toBe(0);
  });

  it("scores 15 per unique tool up to 100", () => {
    // 3 unique tools → 45
    const results = [makeResult({ toolsUsed: ["Read", "Edit", "Bash"] })];
    const dims = scoreResults(results, results);
    const toolUse = dims.find((d) => d.name === "toolUse")!;
    expect(toolUse.score).toBe(45);
  });

  it("caps at 100 with 7+ unique tools", () => {
    const results = [
      makeResult({
        toolsUsed: ["Read", "Edit", "Bash", "Write", "Grep", "Glob", "Task", "Web"],
      }),
    ];
    const dims = scoreResults(results, results);
    const toolUse = dims.find((d) => d.name === "toolUse")!;
    // 8 tools × 15 = 120 → capped at 100
    expect(toolUse.score).toBe(100);
  });

  it("deduplicates tools across multiple task results", () => {
    const results = [
      makeResult({ toolsUsed: ["Read", "Edit"] }),
      makeResult({ toolsUsed: ["Read", "Bash"] }), // "Read" appears in both
    ];
    const dims = scoreResults(results, results);
    const toolUse = dims.find((d) => d.name === "toolUse")!;
    // unique: Read, Edit, Bash → 3 tools → 45
    expect(toolUse.score).toBe(45);
    expect(toolUse.details).toContain("3 unique tools");
  });
});

// ---------------------------------------------------------------------------
// recovery dimension
// ---------------------------------------------------------------------------

describe("recovery dimension", () => {
  it("defaults to 50 when no errors encountered", () => {
    const results = [makeResult({ errorsEncountered: 0 })];
    const dims = scoreResults(results, results);
    const recovery = dims.find((d) => d.name === "recovery")!;
    expect(recovery.score).toBe(50);
    expect(recovery.details).toContain("not tested");
  });

  it("scores 100 when all errors are recovered", () => {
    const results = [
      makeResult({ errorsEncountered: 3, errorsRecovered: 3 }),
      makeResult({ errorsEncountered: 1, errorsRecovered: 1 }),
    ];
    const dims = scoreResults(results, results);
    const recovery = dims.find((d) => d.name === "recovery")!;
    expect(recovery.score).toBe(100);
  });

  it("scores 0 when no errors are recovered", () => {
    const results = [
      makeResult({ errorsEncountered: 2, errorsRecovered: 0 }),
    ];
    const dims = scoreResults(results, results);
    const recovery = dims.find((d) => d.name === "recovery")!;
    expect(recovery.score).toBe(0);
  });

  it("scores 50 when half the errored tasks are recovered", () => {
    const results = [
      makeResult({ errorsEncountered: 1, errorsRecovered: 1 }), // recovered
      makeResult({ errorsEncountered: 1, errorsRecovered: 0 }), // not recovered
    ];
    const dims = scoreResults(results, results);
    const recovery = dims.find((d) => d.name === "recovery")!;
    expect(recovery.score).toBe(50);
  });

  it("details string reflects recovered/errored ratio", () => {
    const results = [
      makeResult({ errorsEncountered: 2, errorsRecovered: 2 }),
      makeResult({ errorsEncountered: 1, errorsRecovered: 0 }),
    ];
    const dims = scoreResults(results, results);
    const recovery = dims.find((d) => d.name === "recovery")!;
    expect(recovery.details).toContain("1/2");
  });
});

// ---------------------------------------------------------------------------
// quality dimension
// ---------------------------------------------------------------------------

describe("quality dimension", () => {
  it("scores 100 when all tasks completed and error-free", () => {
    const results = [
      makeResult({ completed: true, errorsEncountered: 0 }),
      makeResult({ completed: true, errorsEncountered: 0 }),
    ];
    const dims = scoreResults(results, results);
    const quality = dims.find((d) => d.name === "quality")!;
    expect(quality.score).toBe(100);
  });

  it("scores 0 when nothing completed and all errored", () => {
    const results = [
      makeResult({ completed: false, errorsEncountered: 1 }),
      makeResult({ completed: false, errorsEncountered: 1 }),
    ];
    const dims = scoreResults(results, results);
    const quality = dims.find((d) => d.name === "quality")!;
    expect(quality.score).toBe(0);
  });

  it("scores 50 when half completed and all errored (partial credit)", () => {
    // 1 completed out of 2 + 0 error-free out of 2 → (1+0)/(2*2) = 0.25 → 25
    const results = [
      makeResult({ completed: true,  errorsEncountered: 1 }),
      makeResult({ completed: false, errorsEncountered: 1 }),
    ];
    const dims = scoreResults(results, results);
    const quality = dims.find((d) => d.name === "quality")!;
    expect(quality.score).toBe(25);
  });
});
