import { Router, type Request, type Response } from "express";
import { db, usersTable, subscriptionEventsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

// Feature entitlement checker
function canAccess(feature: string, user: { subscriptionTier: string; subscriptionExpiresAt: string | null }): boolean {
  const FREE_LIMITS: Record<string, number> = {
    doubt_daily: 5,
    evaluate_daily: 8,
    streak_freeze_monthly: 1,
    offline_chapters: 3,
  };

  const PLUS_LIMITS: Record<string, number> = {
    doubt_daily: 20,
    evaluate_daily: 30,
    streak_freeze_monthly: 3,
    offline_chapters: 999,
  };

  const PLUS_ONLY = ["bug_bounty_exam", "cosmetics_premium", "tree_premium", "parent_detailed"];

  if (PLUS_ONLY.includes(feature)) {
    return user.subscriptionTier === "plus" && 
           !!user.subscriptionExpiresAt && 
           new Date(user.subscriptionExpiresAt) > new Date();
  }

  return true; // Free features are always accessible
}

function getLimit(feature: string, user: { subscriptionTier: string; subscriptionExpiresAt: string | null }): number {
  const isPlus = user.subscriptionTier === "plus" && 
                 !!user.subscriptionExpiresAt && 
                 new Date(user.subscriptionExpiresAt) > new Date();

  const limits: Record<string, [number, number]> = {
    doubt_daily: [5, 20],
    evaluate_daily: [8, 30],
    streak_freeze_monthly: [1, 3],
    offline_chapters: [3, 999],
  };

  const entry = limits[feature];
  if (!entry) return 999;
  return isPlus ? entry[1] : entry[0];
}

// GET /subscription/status — Current entitlement
router.get("/subscription/status", authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const user = (await db.select().from(usersTable).where(eq(usersTable.id, userId)))[0];
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    const isPlus = user.subscriptionTier === "plus" && 
                   !!user.subscriptionExpiresAt && 
                   new Date(user.subscriptionExpiresAt) > new Date();

    const events = await db.select().from(subscriptionEventsTable)
      .where(eq(subscriptionEventsTable.userId, userId))
      .orderBy(desc(subscriptionEventsTable.createdAt))
      .limit(5);

    res.json({
      tier: isPlus ? "plus" : "free",
      expiresAt: user.subscriptionExpiresAt,
      isActive: isPlus,
      limits: {
        doubt_daily: getLimit("doubt_daily", user),
        evaluate_daily: getLimit("evaluate_daily", user),
        streak_freeze_monthly: getLimit("streak_freeze_monthly", user),
        offline_chapters: getLimit("offline_chapters", user),
      },
      features: {
        bug_bounty_exam: canAccess("bug_bounty_exam", user),
        cosmetics_premium: canAccess("cosmetics_premium", user),
        tree_premium: canAccess("tree_premium", user),
        parent_detailed: canAccess("parent_detailed", user),
      },
      recentEvents: events,
    });
  } catch (error) {
    console.error("Subscription status error:", error);
    res.status(500).json({ error: "Failed to fetch subscription status" });
  }
});

// POST /subscription/create — Create a subscription (mock Razorpay)
router.post("/subscription/create", authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { plan } = req.body; // 'monthly' | 'yearly'

    if (!plan || !["monthly", "yearly"].includes(plan)) {
      res.status(400).json({ error: "plan must be 'monthly' or 'yearly'" });
      return;
    }

    const user = (await db.select().from(usersTable).where(eq(usersTable.id, userId)))[0];
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    // Mock Razorpay integration — in production, this would create a Razorpay order
    const amountPaise = plan === "monthly" ? 9900 : 79900; // ₹99 or ₹799
    const durationDays = plan === "monthly" ? 30 : 365;
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
    const mockRef = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    // In a real implementation, this would return a Razorpay order ID
    // and the client would handle the payment flow
    // For now, we auto-activate (mock payment success)

    await db.update(usersTable)
      .set({
        subscriptionTier: "plus",
        subscriptionExpiresAt: expiresAt,
        streakFreezeAvailable: 3,
        updatedAt: now,
      })
      .where(eq(usersTable.id, userId));

    await db.insert(subscriptionEventsTable).values({
      userId,
      eventType: "created",
      plan,
      provider: "mock",
      providerRef: mockRef,
      amountPaise,
      createdAt: now,
    });

    res.json({
      message: "Subscription activated! Welcome to Chhota Plus!",
      tier: "plus",
      plan,
      expiresAt,
      amount: `₹${amountPaise / 100}`,
      providerRef: mockRef,
    });
  } catch (error) {
    console.error("Subscription create error:", error);
    res.status(500).json({ error: "Failed to create subscription" });
  }
});

// POST /subscription/cancel — Cancel subscription
router.post("/subscription/cancel", authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const user = (await db.select().from(usersTable).where(eq(usersTable.id, userId)))[0];
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    if (user.subscriptionTier !== "plus") {
      res.status(400).json({ error: "No active subscription" });
      return;
    }

    const now = new Date().toISOString();

    // Don't immediately downgrade — let it expire naturally
    await db.insert(subscriptionEventsTable).values({
      userId,
      eventType: "cancelled",
      plan: "unknown",
      provider: "mock",
      amountPaise: 0,
      createdAt: now,
    });

    res.json({
      message: "Subscription cancelled. You'll keep Plus features until " + (user.subscriptionExpiresAt || "expiry"),
      expiresAt: user.subscriptionExpiresAt,
    });
  } catch (error) {
    console.error("Subscription cancel error:", error);
    res.status(500).json({ error: "Failed to cancel subscription" });
  }
});

// POST /subscription/webhook — Payment callback (mock)
router.post("/subscription/webhook", async (req: Request, res: Response): Promise<void> => {
  try {
    // In production, this would validate a Razorpay webhook signature
    const { event, userId, plan, providerRef } = req.body;

    if (event === "payment.success" && userId && plan) {
      const durationDays = plan === "monthly" ? 30 : 365;
      const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
      const now = new Date().toISOString();

      await db.update(usersTable)
        .set({
          subscriptionTier: "plus",
          subscriptionExpiresAt: expiresAt,
          streakFreezeAvailable: 3,
          updatedAt: now,
        })
        .where(eq(usersTable.id, userId));

      await db.insert(subscriptionEventsTable).values({
        userId,
        eventType: "renewed",
        plan,
        provider: "razorpay",
        providerRef: providerRef || null,
        amountPaise: plan === "monthly" ? 9900 : 79900,
        createdAt: now,
      });
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

export default router;
