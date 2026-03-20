import type { DimensionScore, TaskResult } from "./types.js";

export function scoreResults(
  results: TaskResult[],
  baseline: TaskResult[],
): DimensionScore[] {
  return [
    scoreCompletion(results),
    scoreEfficiency(results, baseline),
    scoreToolUse(results),
    scoreRecovery(results),
    scoreQuality(results),
  ];
}

function scoreCompletion(results: TaskResult[]): DimensionScore {
  const completed = results.filter((r) => r.completed).length;
  const score = Math.round((completed / results.length) * 100);

  return {
    name: "completion",
    score,
    maxScore: 100,
    details: `${completed}/${results.length} tasks completed successfully`,
  };
}

function scoreEfficiency(
  results: TaskResult[],
  baseline: TaskResult[],
): DimensionScore {
  const totalTokens = results.reduce((sum, r) => sum + r.tokensUsed, 0);
  const baselineTokens = baseline.reduce((sum, r) => sum + r.tokensUsed, 0);

  // If baseline is 0 (no data yet), default to 50
  if (baselineTokens === 0) {
    return {
      name: "efficiency",
      score: 50,
      maxScore: 100,
      details: "No baseline data — run with --no-cache to establish baseline",
    };
  }

  // Lower tokens = higher score. Score = 100 * (baseline / actual), capped at 100
  const ratio = baselineTokens / Math.max(totalTokens, 1);
  const score = Math.min(100, Math.round(ratio * 100));

  return {
    name: "efficiency",
    score,
    maxScore: 100,
    details: `${totalTokens} tokens used (baseline: ${baselineTokens})`,
  };
}

function scoreToolUse(results: TaskResult[]): DimensionScore {
  // TODO: Compare actual tools used against expected tools from task definition
  // For now, score based on tool diversity (using multiple tools = good)
  const allTools = new Set(results.flatMap((r) => r.toolsUsed));
  const score = Math.min(100, allTools.size * 15);

  return {
    name: "toolUse",
    score,
    maxScore: 100,
    details: `${allTools.size} unique tools used across all tasks`,
  };
}

function scoreRecovery(results: TaskResult[]): DimensionScore {
  const tasksWithErrors = results.filter((r) => r.errorsEncountered > 0);
  if (tasksWithErrors.length === 0) {
    return {
      name: "recovery",
      score: 50,
      maxScore: 100,
      details: "No errors encountered — recovery not tested",
    };
  }

  const recovered = tasksWithErrors.filter(
    (r) => r.errorsRecovered >= r.errorsEncountered,
  ).length;
  const score = Math.round((recovered / tasksWithErrors.length) * 100);

  return {
    name: "recovery",
    score,
    maxScore: 100,
    details: `${recovered}/${tasksWithErrors.length} errors recovered`,
  };
}

function scoreQuality(results: TaskResult[]): DimensionScore {
  // TODO: Use LLM-as-judge scores from evaluator
  // Placeholder: score based on completion + low error rate
  const completed = results.filter((r) => r.completed).length;
  const errorFree = results.filter((r) => r.errorsEncountered === 0).length;
  const score = Math.round(
    ((completed + errorFree) / (results.length * 2)) * 100,
  );

  return {
    name: "quality",
    score,
    maxScore: 100,
    details: `Based on completion rate and error frequency`,
  };
}
