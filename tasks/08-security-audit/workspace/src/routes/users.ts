import type { Request, Response } from "express";

// Simulated database query function
async function query(sql: string): Promise<unknown[]> {
  // In production this would hit a real database
  console.log("Executing:", sql);
  return [];
}

export async function getUser(req: Request, res: Response): Promise<void> {
  const userId = req.params.id;

  // VULNERABILITY: SQL injection via string concatenation
  const sql = `SELECT * FROM users WHERE id = '${userId}'`;
  const rows = await query(sql);

  if (rows.length === 0) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(rows[0]);
}

export async function searchUsers(req: Request, res: Response): Promise<void> {
  const name = req.query.name as string;

  // VULNERABILITY: SQL injection via string concatenation
  const sql = `SELECT * FROM users WHERE name LIKE '%${name}%'`;
  const rows = await query(sql);

  res.json(rows);
}

export async function createUser(req: Request, res: Response): Promise<void> {
  // VULNERABILITY: No input validation at all
  const { name, email, age } = req.body;

  try {
    const sql = `INSERT INTO users (name, email, age) VALUES ('${name}', '${email}', ${age})`;
    await query(sql);
    res.status(201).json({ name, email, age });
  } catch (err) {
    // VULNERABILITY: Leaking full stack trace to client
    res.status(500).json({
      error: "Database error",
      details: (err as Error).message,
      stack: (err as Error).stack,
    });
  }
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  const userId = req.params.id;

  const sql = `DELETE FROM users WHERE id = '${userId}'`;
  await query(sql);

  res.json({ deleted: true });
}
