import { Router, type Request, type Response } from "express";
import { db, cosmeticItemsTable, userCosmeticsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

// GET /shop/items — List available cosmetic items
router.get("/shop/items", authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const user = (await db.select().from(usersTable).where(eq(usersTable.id, userId)))[0];
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    const allItems = await db.select().from(cosmeticItemsTable);

    // Get user's owned items
    const ownedCosmetics = await db.select().from(userCosmeticsTable)
      .where(eq(userCosmeticsTable.userId, userId));
    const ownedIds = new Set(ownedCosmetics.map(uc => uc.itemId));

    const items = allItems.map(item => ({
      ...item,
      owned: ownedIds.has(item.id),
      canAfford: user.gyaanCoins >= item.coinCost,
      canPurchase: !ownedIds.has(item.id)
        && user.gyaanCoins >= item.coinCost
        && user.avatarStage >= item.requiresStage
        && (!item.requiresPlus || user.subscriptionTier === "plus"),
      assetData: typeof item.assetData === "string" ? JSON.parse(item.assetData) : item.assetData,
    }));

    res.json({
      items,
      coins: user.gyaanCoins,
    });
  } catch (error) {
    console.error("Shop items error:", error);
    res.status(500).json({ error: "Failed to fetch shop items" });
  }
});

// POST /shop/purchase — Buy item with Gyaan Coins
router.post("/shop/purchase", authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { itemId } = req.body;

    if (!itemId) {
      res.status(400).json({ error: "itemId is required" });
      return;
    }

    const user = (await db.select().from(usersTable).where(eq(usersTable.id, userId)))[0];
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    const items = await db.select().from(cosmeticItemsTable).where(eq(cosmeticItemsTable.id, itemId));
    if (items.length === 0) {
      res.status(404).json({ error: "Item not found" });
      return;
    }

    const item = items[0];

    // Check if already owned
    const existing = await db.select().from(userCosmeticsTable)
      .where(and(eq(userCosmeticsTable.userId, userId), eq(userCosmeticsTable.itemId, itemId)));
    if (existing.length > 0) {
      res.status(400).json({ error: "Already owned" });
      return;
    }

    // Check requirements
    if (user.gyaanCoins < item.coinCost) {
      res.status(400).json({ error: "Not enough Gyaan Coins" });
      return;
    }
    if (user.avatarStage < item.requiresStage) {
      res.status(400).json({ error: `Requires avatar stage ${item.requiresStage}` });
      return;
    }
    if (item.requiresPlus && user.subscriptionTier !== "plus") {
      res.status(400).json({ error: "Requires Chhota Plus subscription" });
      return;
    }

    // Purchase
    const now = new Date().toISOString();
    await db.insert(userCosmeticsTable).values({
      userId,
      itemId,
      acquiredAt: now,
    });

    await db.update(usersTable)
      .set({
        gyaanCoins: user.gyaanCoins - item.coinCost,
        updatedAt: now,
      })
      .where(eq(usersTable.id, userId));

    res.json({
      message: `Purchased ${item.name}!`,
      coinsRemaining: user.gyaanCoins - item.coinCost,
      item,
    });
  } catch (error) {
    console.error("Purchase error:", error);
    res.status(500).json({ error: "Failed to purchase item" });
  }
});

// POST /avatar/equip — Equip or unequip a cosmetic
router.post("/avatar/equip", authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { itemId, equip } = req.body;

    if (!itemId) {
      res.status(400).json({ error: "itemId is required" });
      return;
    }

    const ownedItems = await db.select().from(userCosmeticsTable)
      .where(and(eq(userCosmeticsTable.userId, userId), eq(userCosmeticsTable.itemId, itemId)));

    if (ownedItems.length === 0) {
      res.status(404).json({ error: "You don't own this item" });
      return;
    }

    await db.update(userCosmeticsTable)
      .set({ isEquipped: equip === false ? 0 : 1 })
      .where(eq(userCosmeticsTable.id, ownedItems[0].id));

    res.json({ message: equip === false ? "Item unequipped" : "Item equipped" });
  } catch (error) {
    console.error("Equip error:", error);
    res.status(500).json({ error: "Failed to equip item" });
  }
});

// GET /avatar/state — Current avatar state with equipped items
router.get("/avatar/state", authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const user = (await db.select().from(usersTable).where(eq(usersTable.id, userId)))[0];
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    const equipped = await db.select({
      cosmetic: userCosmeticsTable,
      item: cosmeticItemsTable,
    }).from(userCosmeticsTable)
      .innerJoin(cosmeticItemsTable, eq(userCosmeticsTable.itemId, cosmeticItemsTable.id))
      .where(and(
        eq(userCosmeticsTable.userId, userId),
        eq(userCosmeticsTable.isEquipped, 1)
      ));

    // Subject accessories
    const total = user.samajhScoreMaths + user.samajhScoreScience;
    const mathsRatio = total > 0 ? user.samajhScoreMaths / total : 0;
    const scienceRatio = total > 0 ? user.samajhScoreScience / total : 0;

    const subjectAccessories: string[] = [];
    if (mathsRatio >= 0.8) subjectAccessories.push("pi_aura");
    else if (mathsRatio >= 0.6) subjectAccessories.push("geometry_set");
    else if (mathsRatio >= 0.4) subjectAccessories.push("compass");
    else if (mathsRatio >= 0.2) subjectAccessories.push("pencil");

    if (scienceRatio >= 0.8) subjectAccessories.push("atom_rings");
    else if (scienceRatio >= 0.6) subjectAccessories.push("beaker");
    else if (scienceRatio >= 0.4) subjectAccessories.push("lab_coat");
    else if (scienceRatio >= 0.2) subjectAccessories.push("goggles");

    res.json({
      stage: user.avatarStage,
      equippedItems: equipped.map(e => ({
        ...e.item,
        assetData: typeof e.item.assetData === "string" ? JSON.parse(e.item.assetData) : e.item.assetData,
      })),
      subjectAccessories,
      mathsRatio,
      scienceRatio,
      teachingStyle: user.teachingStyle,
    });
  } catch (error) {
    console.error("Avatar state error:", error);
    res.status(500).json({ error: "Failed to fetch avatar state" });
  }
});

export default router;
