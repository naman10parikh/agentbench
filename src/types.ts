export interface TaskDefinition {
  id: number;
  name: string;
  category:
    | "bug-fix"
    | "feature"
    | "refactor"
    | "testing"
    | "debug"
    | "hardening"
    | "git"
    | "security"
    | "multi-file"
    | "end-to-end";
  difficulty: "easy" | "medium" | "hard";
  description: string;
  prompt: string;
  expectedTools: string[];
  hasInjectedError: boolean;
  scoringRubric: ScoringRubric;
}

export interface ScoringRubric {
  completionCriteria: string[];
  qualityChecks: string[];
  expectedTokenRange: { min: number; max: number };
}

export interface TaskResult {
  taskId: number;
  taskName: string;
  completed: boolean;
  tokensUsed: number;
  toolsUsed: string[];
  errorsEncountered: number;
  errorsRecovered: number;
  output: string;
  durationMs: number;
}

export interface DimensionScore {
  name: "completion" | "efficiency" | "toolUse" | "recovery" | "quality";
  score: number;
  maxScore: number;
  details: string;
}

export interface BenchmarkReport {
  version: string;
  timestamp: string;
  model: string;
  harnessConfig: HarnessConfig;
  taskResults: TaskResult[];
  dimensions: DimensionScore[];
  overallScore: number;
  baselineScore: number;
  recommendations: string[];
}

export interface HarnessConfig {
  hasClaudeMd: boolean;
  claudeMdLines: number;
  skillCount: number;
  ruleCount: number;
  hookCount: number;
  hasSettingsJson: boolean;
}

export interface CacheEntry {
  taskSuiteVersion: string;
  modelVersion: string;
  baselineResults: TaskResult[];
  cachedAt: string;
}
