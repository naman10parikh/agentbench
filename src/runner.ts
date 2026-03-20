import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { loadTasks } from "../tasks/index.js";
import { detectHarness } from "./harness-detector.js";
import { scoreResults } from "./scorer.js";
import { loadCache, saveCache } from "./cache.js";
import { evaluateWithLlm } from "./evaluator.js";
import { createTaskWorkspace, cleanupWorkspace } from "./workspace.js";
import type { BenchmarkReport, TaskResult, TaskDefinition } from "./types.js";

interface RunOptions {
  taskNumber?: number;
  useCache: boolean;
  model: string;
  verbose: boolean;
  comparePath?: string;
}

export async function runBenchmark(
  options: RunOptions,
): Promise<BenchmarkReport> {
  const harness = await detectHarness(options.comparePath);
  const allTasks = loadTasks();

  const tasks =
    options.taskNumber !== undefined
      ? allTasks.filter((t) => t.id === options.taskNumber)
      : allTasks;

  if (tasks.length === 0) {
    throw new Error(
      `Task ${options.taskNumber} not found. Available: 1-${allTasks.length}`,
    );
  }

  // Load or run baseline
  let baselineResults: TaskResult[];
  const cached = options.useCache ? loadCache(options.model) : null;

  if (cached) {
    baselineResults = cached.baselineResults;
  } else {
    baselineResults = tasks.map((t) => createPlaceholderResult(t));
    saveCache(options.model, baselineResults);
  }

  // Run tasks with user's harness
  const results: TaskResult[] = [];
  for (const task of tasks) {
    if (options.verbose) {
      console.log(`Running task ${task.id}: ${task.name}...`);
    }
    const result = await runSingleTask(task, options);
    results.push(result);
    if (options.verbose) {
      const status = result.completed ? "PASS" : "FAIL";
      console.log(
        `  ${status} — ${result.tokensUsed} tokens, ${result.toolsUsed.length} tools, ${result.durationMs}ms`,
      );
    }
  }

  // Score across 5 dimensions
  const dimensions = scoreResults(results, baselineResults);
  const overallScore = Math.round(
    dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length,
  );
  const baselineScore = 50;

  // Generate recommendations
  const recommendations = generateRecommendations(dimensions);

  return {
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    model: options.model,
    harnessConfig: harness,
    taskResults: results,
    dimensions,
    overallScore,
    baselineScore,
    recommendations,
  };
}

async function runSingleTask(
  task: TaskDefinition,
  options: RunOptions,
): Promise<TaskResult> {
  const start = Date.now();
  const workDir = createTaskWorkspace(task);

  try {
    const client = new Anthropic();

    // Build system prompt incorporating the user's harness
    const systemPrompt = buildSystemPrompt(workDir, options.comparePath);

    // Send the task prompt to Claude
    const response = await client.messages.create({
      model: options.model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: task.prompt }],
      tools: buildToolDefinitions(),
    });

    // Extract metrics from the response
    const toolsUsed = extractToolsUsed(response);
    const tokensUsed =
      (response.usage?.input_tokens ?? 0) +
      (response.usage?.output_tokens ?? 0);
    const output = extractTextOutput(response);

    // Check completion criteria
    let completed = false;
    const completionSignals = task.scoringRubric.completionCriteria;
    const outputLower = output.toLowerCase();

    // Basic heuristic: if the model used tools and produced output, consider potentially complete
    if (toolsUsed.length > 0 && output.length > 50) {
      completed = true;
    }

    // For hard tasks, use LLM-as-judge for better evaluation
    let qualityScore = 0;
    if (task.difficulty === "hard") {
      qualityScore = await evaluateWithLlm(task, output);
      completed = qualityScore >= 50;
    }

    // Count errors (tool_use blocks that mention errors)
    const errorsEncountered = countErrors(output);
    const errorsRecovered =
      completed && errorsEncountered > 0 ? errorsEncountered : 0;

    return {
      taskId: task.id,
      taskName: task.name,
      completed,
      tokensUsed,
      toolsUsed,
      errorsEncountered,
      errorsRecovered,
      output: output.slice(0, 2000),
      durationMs: Date.now() - start,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      taskId: task.id,
      taskName: task.name,
      completed: false,
      tokensUsed: 0,
      toolsUsed: [],
      errorsEncountered: 1,
      errorsRecovered: 0,
      output: `Runner error: ${message}`,
      durationMs: Date.now() - start,
    };
  } finally {
    cleanupWorkspace(workDir);
  }
}

function buildSystemPrompt(workDir: string, comparePath?: string): string {
  const parts: string[] = [
    "You are a coding assistant being benchmarked on a task.",
    `Working directory: ${workDir}`,
    "Complete the task using the tools provided. Be precise and minimal.",
  ];

  // Include user's CLAUDE.md if present (this is what we're benchmarking)
  const claudeMdPath = comparePath ?? join(process.cwd(), "CLAUDE.md");
  if (existsSync(claudeMdPath)) {
    const content = readFileSync(claudeMdPath, "utf-8");
    parts.push(
      "\n## User's Harness Configuration (CLAUDE.md)\n" +
        content.slice(0, 4000),
    );
  }

  // Include a file listing of the workspace
  const files = listFilesRecursive(workDir);
  if (files.length > 0) {
    parts.push(
      "\n## Workspace Files\n" + files.map((f) => `- ${f}`).join("\n"),
    );
  }

  return parts.join("\n");
}

function listFilesRecursive(dir: string, prefix = ""): string[] {
  const results: string[] = [];
  try {
    for (const entry of readdirSync(dir)) {
      const fullPath = join(dir, entry);
      const relPath = prefix ? `${prefix}/${entry}` : entry;
      if (entry === "node_modules" || entry === ".git") continue;
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        results.push(...listFilesRecursive(fullPath, relPath));
      } else {
        results.push(relPath);
      }
    }
  } catch {
    // Intentionally silent: directory may not exist
  }
  return results;
}

function buildToolDefinitions(): Anthropic.Messages.Tool[] {
  return [
    {
      name: "read_file",
      description: "Read the contents of a file",
      input_schema: {
        type: "object" as const,
        properties: {
          path: { type: "string", description: "File path to read" },
        },
        required: ["path"],
      },
    },
    {
      name: "write_file",
      description: "Write content to a file (creates or overwrites)",
      input_schema: {
        type: "object" as const,
        properties: {
          path: { type: "string", description: "File path to write" },
          content: { type: "string", description: "Content to write" },
        },
        required: ["path", "content"],
      },
    },
    {
      name: "edit_file",
      description: "Replace a string in a file",
      input_schema: {
        type: "object" as const,
        properties: {
          path: { type: "string", description: "File path to edit" },
          old_string: { type: "string", description: "Text to find" },
          new_string: { type: "string", description: "Text to replace with" },
        },
        required: ["path", "old_string", "new_string"],
      },
    },
    {
      name: "search_files",
      description: "Search for a pattern across files using regex",
      input_schema: {
        type: "object" as const,
        properties: {
          pattern: {
            type: "string",
            description: "Regex pattern to search for",
          },
          path: { type: "string", description: "Directory to search in" },
        },
        required: ["pattern"],
      },
    },
    {
      name: "run_command",
      description: "Run a shell command",
      input_schema: {
        type: "object" as const,
        properties: {
          command: { type: "string", description: "Command to execute" },
        },
        required: ["command"],
      },
    },
  ];
}

function extractToolsUsed(response: Anthropic.Messages.Message): string[] {
  const tools = new Set<string>();
  for (const block of response.content) {
    if (block.type === "tool_use") {
      tools.add(block.name);
    }
  }
  return [...tools];
}

function extractTextOutput(response: Anthropic.Messages.Message): string {
  const parts: string[] = [];
  for (const block of response.content) {
    if (block.type === "text") {
      parts.push(block.text);
    } else if (block.type === "tool_use") {
      parts.push(
        `[tool: ${block.name}(${JSON.stringify(block.input).slice(0, 200)})]`,
      );
    }
  }
  return parts.join("\n");
}

function countErrors(output: string): number {
  const errorPatterns = [/error/gi, /failed/gi, /exception/gi];
  let count = 0;
  for (const pattern of errorPatterns) {
    const matches = output.match(pattern);
    if (matches) count += matches.length;
  }
  return Math.min(count, 10); // Cap at 10 to avoid noise
}

function createPlaceholderResult(task: TaskDefinition): TaskResult {
  return {
    taskId: task.id,
    taskName: task.name,
    completed: false,
    tokensUsed: 0,
    toolsUsed: [],
    errorsEncountered: 0,
    errorsRecovered: 0,
    output: "",
    durationMs: 0,
  };
}

function generateRecommendations(
  dimensions: { name: string; score: number }[],
): string[] {
  const recs: string[] = [];

  for (const dim of dimensions) {
    if (dim.score < 50) {
      switch (dim.name) {
        case "completion":
          recs.push(
            "Add more specific instructions to your CLAUDE.md about task completion criteria",
          );
          break;
        case "efficiency":
          recs.push(
            "Add model routing rules to use cheaper models for simple subtasks",
          );
          break;
        case "toolUse":
          recs.push(
            "Add tool preference rules (e.g., 'Use Read instead of cat')",
          );
          break;
        case "recovery":
          recs.push(
            "Add error recovery skills or an error escalation protocol to your harness",
          );
          break;
        case "quality":
          recs.push("Add code style rules and a pre-commit quality gate hook");
          break;
      }
    }
  }

  if (recs.length === 0) {
    recs.push("Your harness is performing well across all dimensions.");
  }

  return recs;
}
