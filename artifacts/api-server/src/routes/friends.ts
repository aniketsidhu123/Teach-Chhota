import { Router, type Request, type Response } from "express";
import { db, usersTable, friendshipsTable, friendReactionsTable, conceptMasteryTable, galtiDexCardsTable, userCosmeticsTable, cosmeticItemsTable } from "@workspace/db";
import { eq, and, or, desc, ne } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

// POST /friends/request — Send friend request by friend code or username
router.post("/friends/request", authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { friendCode, username } = req.body;

    if (!friendCode && !username) {
      res.status(400).json({ error: "friendCode or username is required" });
      return;
    }

    // Find target user
    let targetUsers;
    if (friendCode) {
      targetUsers = await db.select().from(usersTable)
        .where(eq(usersTable.friendCode, friendCode.toUpperCase().trim()));
    } else {
      targetUsers = await db.select().from(usersTable)
        .where(eq(usersTable.username, username.trim()));
    }

    if (targetUsers.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const target = targetUsers[0];
    if (target.id === userId) {
      res.status(400).json({ error: "You cannot add yourself" });
      return;
    }

    // Check existing friendship in either direction
    const existing = await db.select().from(friendshipsTable)
      .where(or(
        and(eq(friendshipsTable.requesterId, userId), eq(friendshipsTable.addresseeId, target.id)),
        and(eq(friendshipsTable.requesterId, target.id), eq(friendshipsTable.addresseeId, userId))
      ));

    if (existing.length > 0) {
      const f = existing[0];
      if (f.status === "blocked") {
        res.status(400).json({ error: "Unable to send request" });
        return;
      }
      if (f.status === "accepted") {
        res.status(400).json({ error: "Already friends" });
        return;
      }
      if (f.status === "pending") {
        // If they already sent us a request, auto-accept
        if (f.requesterId === target.id) {
          await db.update(friendshipsTable)
            .set({ status: "accepted" })
            .where(eq(friendshipsTable.id, f.id));
          res.json({ friendship: { ...f, status: "accepted" }, message: "Friend request accepted!" });
          return;
        }
        res.status(400).json({ error: "Friend request already sent" });
        return;
      }
    }

    // Create new friendship
    const now = new Date().toISOString();
    await db.insert(friendshipsTable).values({
      requesterId: userId,
      addresseeId: target.id,
      status: "pending",
      createdAt: now,
    });

    res.status(201).json({ message: "Friend request sent", targetUser: { displayName: target.displayName, username: target.username } });
  } catch (error) {
    console.error("Friend request error:", error);
    res.status(500).json({ error: "Failed to send friend request" });
  }
});

// PATCH /friends/:id/accept — Accept friend request
router.patch("/friends/:id/accept", authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const friendshipId = parseInt(String(req.params.id));

    const friendships = await db.select().from(friendshipsTable)
      .where(eq(friendshipsTable.id, friendshipId));

    if (friendships.length === 0) {
      res.status(404).json({ error: "Friend request not found" });
      return;
    }

    const f = friendships[0];
    if (f.addresseeId !== userId) {
      res.status(403).json({ error: "Not your request to accept" });
      return;
    }
    if (f.status !== "pending") {
      res.status(400).json({ error: "Request is not pending" });
      return;
    }

    await db.update(friendshipsTable)
      .set({ status: "accepted" })
      .where(eq(friendshipsTable.id, friendshipId));

    res.json({ message: "Friend request accepted" });
  } catch (error) {
    console.error("Accept friend error:", error);
    res.status(500).json({ error: "Failed to accept request" });
  }
});

// DELETE /friends/:id — Remove friend or reject request
router.delete("/friends/:id", authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const friendshipId = parseInt(String(req.params.id));

    const friendships = await db.select().from(friendshipsTable)
      .where(eq(friendshipsTable.id, friendshipId));

    if (friendships.length === 0) {
      res.status(404).json({ error: "Friendship not found" });
      return;
    }

    const f = friendships[0];
    if (f.requesterId !== userId && f.addresseeId !== userId) {
      res.status(403).json({ error: "Not your friendship" });
      return;
    }

    await db.delete(friendshipsTable).where(eq(friendshipsTable.id, friendshipId));
    res.json({ message: "Friend removed" });
  } catch (error) {
    console.error("Remove friend error:", error);
    res.status(500).json({ error: "Failed to remove friend" });
  }
});

// POST /friends/:id/block — Block user
router.post("/friends/:id/block", authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const targetId = String(req.params.id);

    // Remove existing friendship if any
    await db.delete(friendshipsTable).where(
      or(
        and(eq(friendshipsTable.requesterId, userId), eq(friendshipsTable.addresseeId, targetId)),
        and(eq(friendshipsTable.requesterId, targetId), eq(friendshipsTable.addresseeId, userId))
      )
    );

    // Create block record
    const now = new Date().toISOString();
    await db.insert(friendshipsTable).values({
      requesterId: userId,
      addresseeId: targetId,
      status: "blocked",
      createdAt: now,
    });

    res.json({ message: "User blocked" });
  } catch (error) {
    console.error("Block user error:", error);
    res.status(500).json({ error: "Failed to block user" });
  }
});

// GET /friends — List accepted friends with profile info
router.get("/friends", authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

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

    if (friendIds.length === 0) {
      res.json({ friends: [] });
      return;
    }

    // Get friend profiles
    const allUsers = await db.select().from(usersTable);
    const friends = allUsers
      .filter(u => friendIds.includes(u.id))
      .map(u => ({
        id: u.id,
        displayName: u.displayName,
        username: u.username,
        classLevel: u.classLevel,
        avatarStage: u.avatarStage,
        samajhScoreTotal: u.samajhScoreTotal,
        teachingStyle: u.teachingStyle,
        streakCurrent: u.streakCurrent,
        profileTheme: u.profileTheme,
        friendshipId: friendships.find(
          f => (f.requesterId === u.id || f.addresseeId === u.id) && (f.requesterId === userId || f.addresseeId === userId)
        )?.id,
      }));

    res.json({ friends });
  } catch (error) {
    console.error("List friends error:", error);
    res.status(500).json({ error: "Failed to fetch friends" });
  }
});

// GET /friends/requests — Pending friend requests
router.get("/friends/requests", authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const incoming = await db.select().from(friendshipsTable)
      .where(and(
        eq(friendshipsTable.addresseeId, userId),
        eq(friendshipsTable.status, "pending")
      ));

    const outgoing = await db.select().from(friendshipsTable)
      .where(and(
        eq(friendshipsTable.requesterId, userId),
        eq(friendshipsTable.status, "pending")
      ));

    // Get user details for requesters
    const requesterIds = incoming.map(f => f.requesterId);
    const addresseeIds = outgoing.map(f => f.addresseeId);
    const allUsers = await db.select().from(usersTable);

    const incomingWithDetails = incoming.map(f => ({
      ...f,
      from: allUsers.find(u => u.id === f.requesterId),
    }));

    const outgoingWithDetails = outgoing.map(f => ({
      ...f,
      to: allUsers.find(u => u.id === f.addresseeId),
    }));

    res.json({ incoming: incomingWithDetails, outgoing: outgoingWithDetails });
  } catch (error) {
    console.error("Friend requests error:", error);
    res.status(500).json({ error: "Failed to fetch friend requests" });
  }
});

// POST /friends/:id/react — Send preset reaction to friend
router.post("/friends/:id/react", authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const receiverId = String(req.params.id);
    const { reactionType } = req.body;

    const validReactions = ["clap", "great_tree", "nice_avatar", "star", "fire"];
    if (!reactionType || !validReactions.includes(reactionType)) {
      res.status(400).json({ error: "Invalid reaction type" });
      return;
    }

    // Verify they are friends
    const friendships = await db.select().from(friendshipsTable)
      .where(and(
        eq(friendshipsTable.status, "accepted"),
        or(
          and(eq(friendshipsTable.requesterId, userId), eq(friendshipsTable.addresseeId, receiverId)),
          and(eq(friendshipsTable.requesterId, receiverId), eq(friendshipsTable.addresseeId, userId))
        )
      ));

    if (friendships.length === 0) {
      res.status(403).json({ error: "You can only react to friends' profiles" });
      return;
    }

    const now = new Date().toISOString();
    await db.insert(friendReactionsTable).values({
      senderId: userId,
      receiverId,
      reactionType,
      createdAt: now,
    });

    res.status(201).json({ message: "Reaction sent!" });
  } catch (error) {
    console.error("React error:", error);
    res.status(500).json({ error: "Failed to send reaction" });
  }
});

export default router;
