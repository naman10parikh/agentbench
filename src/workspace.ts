import { mkdirSync, writeFileSync, cpSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import type { TaskDefinition } from "./types.js";

/** Fixture files that go into each task workspace */
const TASK_FIXTURES: Record<number, Record<string, string>> = {
  1: {
    "src/utils.ts": `export function caclulateTotal(items: number[]): number {
  return items.reduce((sum, item) => sum + item, 0);
}

export function formatCurrency(amount: number): string {
  return \`$\${amount.toFixed(2)}\`;
}
`,
    "tsconfig.json": `{"compilerOptions":{"strict":true,"target":"ES2022","module":"NodeNext","moduleResolution":"NodeNext","outDir":"dist"},"include":["src/**/*.ts"]}`,
  },
  2: {
    "src/validators.ts": `export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
`,
    "tsconfig.json": `{"compilerOptions":{"strict":true,"target":"ES2022","module":"NodeNext","moduleResolution":"NodeNext","outDir":"dist"},"include":["src/**/*.ts"]}`,
  },
  3: {
    "src/orders.ts": `interface Order {
  id: string;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
  items: { name: string; qty: number; price: number }[];
  customer: { name: string; email: string; vip: boolean };
}

export function processOrder(order: Order): string {
  if (order.status !== "cancelled") {
    if (order.items.length > 0) {
      if (order.customer.email) {
        if (order.customer.vip) {
          const total = order.items.reduce((s, i) => s + i.qty * i.price, 0);
          const discounted = total * 0.9;
          return \`VIP order \${order.id}: $\${discounted.toFixed(2)}\`;
        } else {
          const total = order.items.reduce((s, i) => s + i.qty * i.price, 0);
          return \`Order \${order.id}: $\${total.toFixed(2)}\`;
        }
      } else {
        return "Error: missing email";
      }
    } else {
      return "Error: no items";
    }
  } else {
    return "Error: order cancelled";
  }
}
`,
  },
  4: {
    "src/string-utils.ts": `export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 3) + "...";
}

export function countWords(s: string): number {
  return s.trim().split(/\\s+/).filter(Boolean).length;
}

export function reverse(s: string): string {
  return [...s].reverse().join("");
}
`,
    "package.json": `{"name":"task-4","type":"module","devDependencies":{"vitest":"^3.0.0"}}`,
  },
  5: {
    "src/math.ts": `export function divide(a: number, b: number): number {
  return Math.floor(a / b);
}
`,
    "test/math.test.ts": `import { describe, it, expect } from "vitest";
import { divide } from "../src/math.js";

describe("divide", () => {
  it("divides integers", () => {
    expect(divide(10, 3)).toBe(3);
  });

  it("handles zero dividend", () => {
    expect(divide(0, 5)).toBe(0);
  });

  it("handles zero divisor", () => {
    expect(divide(10, 0)).toBe(Infinity);
  });
});
`,
    "package.json": `{"name":"task-5","type":"module","devDependencies":{"vitest":"^3.0.0"}}`,
  },
  6: {
    "src/api.ts": `interface User { id: string; name: string; email: string; }

export async function fetchUser(id: string): Promise<User> {
  const res = await fetch(\`https://api.example.com/users/\${id}\`);
  const data = await res.json();
  return data as User;
}
`,
  },
  7: {
    "src/config.ts": `<<<<<<< HEAD
export const config = {
  port: 3000,
  host: "localhost",
  apiVersion: "v2",
  rateLimit: 100,
};
=======
export const config = {
  port: 3000,
  host: "localhost",
  logLevel: "info",
  corsOrigins: ["http://localhost:3000"],
};
>>>>>>> feature/auth
`,
  },
  8: {
    "src/routes/users.ts": `import { db } from "../db.js";

export function getUserByName(name: string) {
  const query = \`SELECT * FROM users WHERE name = '\${name}'\`;
  return db.query(query);
}

export function searchUsers(term: string) {
  return db.query(\`SELECT * FROM users WHERE name LIKE '%\${term}%'\`);
}
`,
    "src/db.ts": `export const db = {
  query(sql: string) {
    console.log("Executing:", sql);
    return [];
  }
};
`,
  },
  9: {
    "src/orders.ts": `import { formatDate } from "./utils/legacy-date.js";
export function getOrderSummary(date: Date) {
  return \`Order placed on \${formatDate(date)}\`;
}
`,
    "src/invoices.ts": `import { formatDate } from "./utils/legacy-date.js";
export function getInvoiceHeader(date: Date) {
  return \`Invoice date: \${formatDate(date)}\`;
}
`,
    "src/reports.ts": `import { formatDate } from "./utils/legacy-date.js";
export function getReportTitle(date: Date) {
  return \`Report generated \${formatDate(date)}\`;
}
`,
    "src/utils/legacy-date.ts": `export function formatDate(d: Date): string {
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const y = d.getFullYear();
  return \`\${m}/\${day}/\${y}\`;
}
`,
  },
  10: {
    "src/routes/users.ts": `import { Router } from "express";
const router = Router();

router.get("/api/users", (_req, res) => {
  res.json([]);
});

export { router as userRouter };
`,
    "package.json": `{"name":"task-10","type":"module","dependencies":{"express":"^4.18.0","zod":"^3.22.0"},"devDependencies":{"vitest":"^3.0.0","@types/express":"^4.17.0"}}`,
    "tsconfig.json": `{"compilerOptions":{"strict":true,"target":"ES2022","module":"NodeNext","moduleResolution":"NodeNext","outDir":"dist","esModuleInterop":true},"include":["src/**/*.ts"]}`,
  },
};

export function createTaskWorkspace(task: TaskDefinition): string {
  const workDir = join(
    tmpdir(),
    `agentbench-${task.id}-${randomUUID().slice(0, 8)}`,
  );
  mkdirSync(workDir, { recursive: true });

  const fixtures = TASK_FIXTURES[task.id];
  if (fixtures) {
    for (const [relPath, content] of Object.entries(fixtures)) {
      const fullPath = join(workDir, relPath);
      mkdirSync(join(fullPath, ".."), { recursive: true });
      writeFileSync(fullPath, content);
    }
  }

  return workDir;
}

export function cleanupWorkspace(workDir: string): void {
  try {
    rmSync(workDir, { recursive: true, force: true });
  } catch {
    // Intentionally silent: cleanup failure is non-critical
  }
}
