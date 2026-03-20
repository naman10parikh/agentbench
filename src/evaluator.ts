import Anthropic from "@anthropic-ai/sdk";
import type { TaskDefinition } from "./types.js";

const JUDGE_MODEL = "claude-haiku-4-5-20251001";

export async function evaluateWithLlm(
  task: TaskDefinition,
  agentOutput: string,
): Promise<number> {
  const client = new Anthropic();

  const prompt = `You are evaluating the output of an AI coding agent.

## Task
${task.description}

## Agent Output
${agentOutput}

## Scoring Rubric
Rate the output 0-100 on:
1. **Correctness** (40 points): Does the output solve the task correctly?
2. **Completeness** (30 points): Are all edge cases handled?
3. **Code Quality** (20 points): Is the code clean, well-structured, and idiomatic?
4. **Edge Cases** (10 points): Does it handle unexpected inputs gracefully?

Respond with ONLY a JSON object:
{"score": <number>, "reasoning": "<one sentence>"}`;

  const response = await client.messages.create({
    model: JUDGE_MODEL,
    max_tokens: 200,
    temperature: 0,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  try {
    const parsed = JSON.parse(text) as {
      score: number;
      reasoning: string;
    };
    return parsed.score;
  } catch {
    console.warn(`[evaluator] Failed to parse LLM judge response: ${text}`);
    return 50; // Default to middle score on parse failure
  }
}
