import type { Request, Response } from "express";
import { z } from "zod";

// Simulated parameterized query function
async function query(sql: string, params: unknown[] = []): Promise<unknown[]> {
  console.log("Executing:", sql, "with params:", params);
  return [];
}

const CreateUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(254),
  age: z.number().int().min(0).max(150),
});

const UserIdSchema = z.string().regex(/^[a-zA-Z0-9-]+$/);
const SearchNameSchema = z.string().min(1).max(100);

function setSecurityHeaders(res: Response): void {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "0");
  res.setHeader("Cache-Control", "no-store");
}

function sanitizeError(err: unknown): string {
  if (err instanceof z.ZodError) {
    return "Validation failed";
  }
  return "Internal server error";
}

export async function getUser(req: Request, res: Response): Promise<void> {
  setSecurityHeaders(res);

  const parsed = UserIdSchema.safeParse(req.params.id);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid user ID format" });
    return;
  }

  const rows = await query("SELECT * FROM users WHERE id = $1", [parsed.data]);

  if (rows.length === 0) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(rows[0]);
}

export async function searchUsers(req: Request, res: Response): Promise<void> {
  setSecurityHeaders(res);

  const parsed = SearchNameSchema.safeParse(req.query.name);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid search query" });
    return;
  }

  const rows = await query("SELECT * FROM users WHERE name LIKE $1", [
    `%${parsed.data}%`,
  ]);

  res.json(rows);
}

export async function createUser(req: Request, res: Response): Promise<void> {
  setSecurityHeaders(res);

  const parsed = CreateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Validation failed",
      issues: parsed.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      })),
    });
    return;
  }

  const { name, email, age } = parsed.data;

  try {
    await query("INSERT INTO users (name, email, age) VALUES ($1, $2, $3)", [
      name,
      email,
      age,
    ]);
    res.status(201).json({ name, email, age });
  } catch (err) {
    console.warn("[users] createUser failed:", (err as Error).message);
    res.status(500).json({ error: sanitizeError(err) });
  }
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  setSecurityHeaders(res);

  const parsed = UserIdSchema.safeParse(req.params.id);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid user ID format" });
    return;
  }

  await query("DELETE FROM users WHERE id = $1", [parsed.data]);

  res.json({ deleted: true });
}
