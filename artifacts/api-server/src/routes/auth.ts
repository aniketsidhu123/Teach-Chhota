import { Router, type Request, type Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken } from "../lib/auth";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

function generateFriendCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I,O,0,1 to avoid confusion
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function generateUsername(name: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12);
  const suffix = Math.floor(Math.random() * 9000 + 1000);
  return `${base || "learner"}${suffix}`;
}

// POST /auth/register — Create a new user account
router.post("/auth/register", async (req: Request, res: Response): Promise<void> => {
  try {
    const { displayName, classLevel } = req.body;

    if (!displayName || typeof displayName !== "string" || displayName.trim().length < 1) {
      res.status(400).json({ error: "displayName is required" });
      return;
    }
    if (!classLevel || typeof classLevel !== "number" || classLevel < 1 || classLevel > 12) {
      res.status(400).json({ error: "classLevel must be between 1 and 12" });
      return;
    }

    const id = uuidv4();
    const now = new Date().toISOString();
    const username = generateUsername(displayName.trim());

    // Generate unique friend code with retry
    let friendCode = generateFriendCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await db.select().from(usersTable).where(eq(usersTable.friendCode, friendCode));
      if (existing.length === 0) break;
      friendCode = generateFriendCode();
      attempts++;
    }

    await db.insert(usersTable).values({
      id,
      username,
      displayName: displayName.trim(),
      classLevel,
      friendCode,
      createdAt: now,
      updatedAt: now,
    });

    const token = signToken({ userId: id, username });
    const user = await db.select().from(usersTable).where(eq(usersTable.id, id));

    res.status(201).json({ token, user: user[0] });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

// POST /auth/login — Login by friend code
router.post("/auth/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { friendCode } = req.body;

    if (!friendCode || typeof friendCode !== "string") {
      res.status(400).json({ error: "friendCode is required" });
      return;
    }

    const users = await db.select().from(usersTable)
      .where(eq(usersTable.friendCode, friendCode.toUpperCase().trim()));

    if (users.length === 0) {
      res.status(404).json({ error: "No user found with this friend code" });
      return;
    }

    const user = users[0];
    const token = signToken({ userId: user.id, username: user.username });

    res.json({ token, user });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// GET /auth/me — Get current authenticated user
router.get("/auth/me", authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await db.select().from(usersTable)
      .where(eq(usersTable.id, req.user!.userId));

    if (users.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ user: users[0] });
  } catch (error) {
    console.error("Me error:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

export default router;
