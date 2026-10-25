import { Router, type Request, type Response } from "express";
import { db, usersTable, friendshipsTable, teachingSessionsTable } from "@workspace/db";
import { eq, and, or, gte, sql, desc } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

// GET /leaderboard/friends — Weekly growth leaderboard among friends
router.get("/leaderboard/friends", authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    // Get all accepted friends
    const friendships = await db.select().from(friendshipsTable)
      .where(and(
        eq(friendshipsTable.status, "accepted"),
        or(
          eq(friendshipsTable.requesterId, userId),
          eq(friendshipsTable.addresseeId, userId)
        )
      ));

    const friendIds = friendships.map(f =>
      f.requesterId === userId ? f.addresseeId : f.requesterId
    );
    friendIds.push(userId); // Include self

    if (friendIds.length <= 1) {
      res.json({ leaderboard: [], message: "Add friends to see the leaderboard!" });
      return;
    }

    // Calculate weekly growth for each friend
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const allUsers = await db.select().from(usersTable);
    const relevantUsers = allUsers.filter(u => friendIds.includes(u.id));

    // Get each user's sessions from the past week
    const leaderboardEntries = await Promise.all(
      relevantUsers.map(async (user) => {
        // Don't show hidden users
        if (user.profileVisibility === "hidden" && user.id !== userId) return null;

        const weekSessions = await db.select().from(teachingSessionsTable)
          .where(and(
            eq(teachingSessionsTable.userId, user.id),
            gte(teachingSessionsTable.createdAt, oneWeekAgo)
          ));

        const weeklyGrowth = weekSessions.reduce((sum, s) => sum + s.samajhDelta, 0);

        return {
          userId: user.id,
          displayName: user.displayName,
          username: user.username,
          avatarStage: user.avatarStage,
          teachingStyle: user.teachingStyle,
          weeklyGrowth: Math.round(weeklyGrowth * 100) / 100,
          sessionsThisWeek: weekSessions.length,
          isCurrentUser: user.id === userId,
        };
      })
    );

    const filtered = leaderboardEntries.filter(Boolean) as NonNullable<typeof leaderboardEntries[number]>[];
    filtered.sort((a, b) => b!.weeklyGrowth - a!.weeklyGrowth);

    // Assign league names
    const withLeagues = filtered.map((entry, idx) => {
      const rank = idx + 1;
      const total = filtered.length;
      let league: string;

      if (rank === 1) league = "🏆 Vidyarthi of the Week";
      else if (rank <= 3) league = "⭐ Shining Stars";
      else if (rank <= Math.ceil(total / 2)) league = "🌱 Growing Strong";
      else league = "🌿 Steady Learners";

      return { ...entry, rank, league };
    });

    res.json({ leaderboard: withLeagues });
  } catch (error) {
    console.error("Leaderboard error:", error);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

export default router;
