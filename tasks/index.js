"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadTasks = loadTasks;
function loadTasks() {
  return [
    {
      id: 1,
      name: "Fix a typo in a TypeScript file",
      category: "bug-fix",
      difficulty: "easy",
      description:
        "A TypeScript file has a misspelled variable name causing a compile error. Find and fix it.",
      prompt:
        "There's a typo in src/utils.ts causing a TypeScript compile error. Find and fix it.",
      expectedTools: ["Read", "Grep", "Edit"],
      hasInjectedError: false,
      scoringRubric: {
        completionCriteria: [
          "File compiles after fix",
          "Only the typo is changed",
        ],
        qualityChecks: ["No unnecessary changes", "Correct variable name used"],
        expectedTokenRange: { min: 200, max: 2000 },
      },
    },
    {
      id: 2,
      name: "Add a function with a specific signature",
      category: "feature",
      difficulty: "easy",
      description:
        "Add a new exported function that validates email addresses using a regex pattern.",
      prompt:
        "Add an exported function `validateEmail(email: string): boolean` to src/validators.ts that returns true for valid email addresses.",
      expectedTools: ["Read", "Edit"],
      hasInjectedError: false,
      scoringRubric: {
        completionCriteria: [
          "Function exists with correct signature",
          "Returns boolean",
          "Handles basic email patterns",
        ],
        qualityChecks: [
          "Uses reasonable regex",
          "Exported correctly",
          "TypeScript types present",
        ],
        expectedTokenRange: { min: 300, max: 3000 },
      },
    },
    {
      id: 3,
      name: "Refactor a function to reduce complexity",
      category: "refactor",
      difficulty: "medium",
      description:
        "A function has deeply nested if-else blocks. Refactor to early returns or guard clauses.",
      prompt:
        "Refactor the `processOrder` function in src/orders.ts to use early returns instead of nested if-else blocks. Maintain identical behavior.",
      expectedTools: ["Read", "Edit"],
      hasInjectedError: false,
      scoringRubric: {
        completionCriteria: [
          "Function behavior unchanged",
          "Nesting depth reduced",
          "Early returns used",
        ],
        qualityChecks: [
          "No new bugs introduced",
          "Readable code",
          "Same exported interface",
        ],
        expectedTokenRange: { min: 500, max: 5000 },
      },
    },
    {
      id: 4,
      name: "Write unit tests for an existing module",
      category: "testing",
      difficulty: "medium",
      description:
        "Write comprehensive unit tests for a string utility module with 5 functions.",
      prompt:
        "Write unit tests for all 5 functions in src/string-utils.ts. Use Vitest. Cover happy paths and edge cases.",
      expectedTools: ["Read", "Write", "Bash"],
      hasInjectedError: false,
      scoringRubric: {
        completionCriteria: [
          "Tests exist for all 5 functions",
          "Tests pass",
          "Edge cases covered",
        ],
        qualityChecks: [
          "Vitest used correctly",
          "Good test naming",
          "Assertions are meaningful",
        ],
        expectedTokenRange: { min: 800, max: 8000 },
      },
    },
    {
      id: 5,
      name: "Fix a failing test by reading error output",
      category: "debug",
      difficulty: "medium",
      description:
        "A test is failing with an assertion error. Read the error, find the bug in the source code, fix it.",
      prompt:
        "Run `npx vitest run` — one test is failing. Read the error output, find the bug in the source, and fix it.",
      expectedTools: ["Bash", "Read", "Edit"],
      hasInjectedError: true,
      scoringRubric: {
        completionCriteria: [
          "Test passes after fix",
          "Bug correctly identified",
          "Source code fixed (not test)",
        ],
        qualityChecks: [
          "Minimal change",
          "Root cause addressed",
          "No test modification",
        ],
        expectedTokenRange: { min: 500, max: 6000 },
      },
    },
    {
      id: 6,
      name: "Add error handling to a function that throws",
      category: "hardening",
      difficulty: "medium",
      description:
        "A function calls an external API without error handling. Add try-catch with proper error types.",
      prompt:
        "The `fetchUser` function in src/api.ts has no error handling. Add proper try-catch that handles network errors, 404s, and unexpected errors differently.",
      expectedTools: ["Read", "Edit"],
      hasInjectedError: true,
      scoringRubric: {
        completionCriteria: [
          "Error handling added",
          "Different error types handled",
          "Function still works for happy path",
        ],
        qualityChecks: [
          "Specific error types (not catch-all)",
          "Useful error messages",
          "No swallowed errors",
        ],
        expectedTokenRange: { min: 400, max: 5000 },
      },
    },
    {
      id: 7,
      name: "Resolve a merge conflict in a git repo",
      category: "git",
      difficulty: "hard",
      description:
        "Two branches modified the same file differently. Resolve the conflict preserving both changes.",
      prompt:
        "The repo has a merge conflict in src/config.ts between main and feature/auth. Resolve it by keeping both additions in logical order.",
      expectedTools: ["Bash", "Read", "Edit"],
      hasInjectedError: false,
      scoringRubric: {
        completionCriteria: [
          "Conflict markers removed",
          "Both changes preserved",
          "File compiles",
        ],
        qualityChecks: [
          "Logical ordering",
          "No duplicate code",
          "Git status clean after resolution",
        ],
        expectedTokenRange: { min: 600, max: 8000 },
      },
    },
    {
      id: 8,
      name: "Find and fix a SQL injection vulnerability",
      category: "security",
      difficulty: "hard",
      description:
        "A route handler concatenates user input into a SQL query. Find and fix the vulnerability.",
      prompt:
        "There's a SQL injection vulnerability somewhere in src/routes/. Find it and fix it using parameterized queries.",
      expectedTools: ["Grep", "Read", "Edit"],
      hasInjectedError: false,
      scoringRubric: {
        completionCriteria: [
          "Vulnerability found",
          "Parameterized query used",
          "Behavior unchanged for valid input",
        ],
        qualityChecks: [
          "Correct parameterization",
          "No other vulnerabilities introduced",
          "Input validation added",
        ],
        expectedTokenRange: { min: 500, max: 7000 },
      },
    },
    {
      id: 9,
      name: "Refactor 3 files to extract a shared utility",
      category: "multi-file",
      difficulty: "hard",
      description:
        "Three files have duplicated date formatting logic. Extract to a shared utility and update all callers.",
      prompt:
        "src/orders.ts, src/invoices.ts, and src/reports.ts all have duplicated date formatting. Extract it to src/utils/date-format.ts and update all three files.",
      expectedTools: ["Read", "Write", "Edit", "Grep"],
      hasInjectedError: false,
      scoringRubric: {
        completionCriteria: [
          "Utility file created",
          "All 3 files updated",
          "No duplicate logic remains",
          "All imports work",
        ],
        qualityChecks: [
          "Clean utility API",
          "Correct imports",
          "No behavior change",
          "TypeScript types correct",
        ],
        expectedTokenRange: { min: 1000, max: 10000 },
      },
    },
    {
      id: 10,
      name: "Add a REST endpoint with validation and tests",
      category: "end-to-end",
      difficulty: "hard",
      description:
        "Add a complete POST /api/users endpoint with Zod validation, error handling, and tests.",
      prompt:
        "Add a POST /api/users endpoint in src/routes/users.ts with Zod body validation (name: string, email: string, age: number 18-120). Include error responses for invalid input. Write tests.",
      expectedTools: ["Read", "Write", "Edit", "Bash"],
      hasInjectedError: false,
      scoringRubric: {
        completionCriteria: [
          "Endpoint exists",
          "Zod validation works",
          "Error responses correct",
          "Tests pass",
        ],
        qualityChecks: [
          "Proper HTTP status codes",
          "Zod schema is correct",
          "Tests cover happy + error paths",
        ],
        expectedTokenRange: { min: 1200, max: 12000 },
      },
    },
  ];
}
