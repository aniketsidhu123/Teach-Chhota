import { Router, type Request, type Response } from "express";
import { db, usersTable, conceptMasteryTable, galtiDexCardsTable, userCosmeticsTable, cosmeticItemsTable, friendReactionsTable, teachingSessionsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { authMiddleware, optionalAuthMiddleware } from "../middlewares/auth";
import { AVATAR_NAMES, computeWiltFactor, getReviewInterval } from "../lib/samajh-engine";

const router = Router();

// GET /profile/:id — Get user profile (public card)
router.get("/profile/:id", optionalAuthMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const targetId = String(req.params.id);
    const users = await db.select().from(usersTable).where(eq(usersTable.id, targetId));

    if (users.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const user = users[0];

    // Check visibility
    if (user.profileVisibility === "hidden" && req.user?.userId !== targetId) {
      res.status(403).json({ error: "Profile is hidden" });
      return;
    }

    // Get mastery summary for tree snapshot
    const mastery = await db.select().from(conceptMasteryTable)
      .where(eq(conceptMasteryTable.userId, targetId));

    const treeSnapshot = mastery.map(m => ({
      conceptKey: m.conceptKey,
      subject: m.subject,
      masteryLevel: m.masteryLevel,
      wiltFactor: computeWiltFactor(m.nextReviewAt, getReviewInterval(m.sessionCount)),
    }));

    // Get pinned Galti Dex cards
    const pinnedCards = await db.select().from(galtiDexCardsTable)
      .where(and(
        eq(galtiDexCardsTable.userId, targetId),
        eq(galtiDexCardsTable.isPinned, 1)
      ));

    // Get equipped cosmetics
    const equippedCosmetics = await db.select({
      cosmetic: userCosmeticsTable,
      item: cosmeticItemsTable,
    }).from(userCosmeticsTable)
      .innerJoin(cosmeticItemsTable, eq(userCosmeticsTable.itemId, cosmeticItemsTable.id))
      .where(and(
        eq(userCosmeticsTable.userId, targetId),
        eq(userCosmeticsTable.isEquipped, 1)
      ));

    // Get recent reactions
    const reactions = await db.select().from(friendReactionsTable)
      .where(eq(friendReactionsTable.receiverId, targetId))
      .orderBy(desc(friendReactionsTable.createdAt))
      .limit(20);

    // Subject mastery ratio for accessories
    const total = user.samajhScoreMaths + user.samajhScoreScience;
    const mathsRatio = total > 0 ? user.samajhScoreMaths / total : 0;
    const scienceRatio = total > 0 ? user.samajhScoreScience / total : 0;

    res.json({
      profile: {
        id: user.id,
        displayName: user.displayName,
        username: user.username,
        classLevel: user.classLevel,
        avatarStage: user.avatarStage,
        avatarName: AVATAR_NAMES[user.avatarStage],
        samajhScoreTotal: user.samajhScoreTotal,
        samajhScoreMaths: user.samajhScoreMaths,
        samajhScoreScience: user.samajhScoreScience,
        mathsRatio,
        scienceRatio,
        teachingStyle: user.teachingStyle,
        streakCurrent: user.streakCurrent,
        streakBest: user.streakBest,
        weeklyRingDays: JSON.parse(user.weeklyRingDays || "[]"),
        profileTheme: user.profileTheme,
        subscriptionTier: user.subscriptionTier,
      },
      tree: treeSnapshot,
      pinnedCards,
      equippedCosmetics: equippedCosmetics.map(ec => ec.item),
      reactions,
    });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// PATCH /profile — Update own profile settings
router.patch("/profile", authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { displayName, profileVisibility, profileTheme } = req.body;

    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };

    if (displayName && typeof displayName === "string") {
      updates.displayName = displayName.trim().slice(0, 50);
    }
    if (profileVisibility && ["friends", "hidden"].includes(profileVisibility)) {
      updates.profileVisibility = profileVisibility;
    }
    if (profileTheme && typeof profileTheme === "string") {
      updates.profileTheme = profileTheme;
    }

    await db.update(usersTable).set(updates).where(eq(usersTable.id, userId));
    const updated = await db.select().from(usersTable).where(eq(usersTable.id, userId));

    res.json({ user: updated[0] });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

export default router;
