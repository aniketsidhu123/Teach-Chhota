/**
 * Seed script for gamification cosmetic items.
 * Run with: pnpm --filter @workspace/api-server run seed-cosmetics
 */
import { db, cosmeticItemsTable } from "@workspace/db";

const cosmeticItems = [
  // Tree decorations (50-150 coins)
  { id: "tree-fairy-lights", name: "Fairy Lights", category: "tree_decoration", rarity: "common", coinCost: 50, requiresPlus: 0, requiresStage: 0, subjectAffinity: null, assetData: JSON.stringify({ type: "lights", color: "#f7d66c", pattern: "twinkle" }) },
  { id: "tree-butterflies", name: "Butterflies", category: "tree_decoration", rarity: "common", coinCost: 75, requiresPlus: 0, requiresStage: 1, subjectAffinity: null, assetData: JSON.stringify({ type: "butterflies", colors: ["#f3bd62", "#5caaa0", "#ef9b55"] }) },
  { id: "tree-flowers", name: "Marigold Flowers", category: "tree_decoration", rarity: "uncommon", coinCost: 100, requiresPlus: 0, requiresStage: 2, subjectAffinity: null, assetData: JSON.stringify({ type: "flowers", color: "#ef9b55", variant: "marigold" }) },
  { id: "tree-rangoli", name: "Rangoli Base", category: "tree_decoration", rarity: "uncommon", coinCost: 120, requiresPlus: 0, requiresStage: 2, subjectAffinity: null, assetData: JSON.stringify({ type: "rangoli", pattern: "traditional", colors: ["#e47451", "#f3bd62", "#5caaa0"] }) },
  { id: "tree-diya", name: "Diya Lights", category: "tree_decoration", rarity: "rare", coinCost: 150, requiresPlus: 0, requiresStage: 3, subjectAffinity: null, assetData: JSON.stringify({ type: "diya", glow: true, color: "#f7d66c" }) },

  // Avatar accessories (80-200 coins)
  { id: "acc-spectacles", name: "Round Spectacles", category: "accessory", rarity: "common", coinCost: 80, requiresPlus: 0, requiresStage: 0, subjectAffinity: null, assetData: JSON.stringify({ type: "spectacles", style: "round", color: "#285d5c" }) },
  { id: "acc-scarf", name: "Colorful Scarf", category: "accessory", rarity: "common", coinCost: 90, requiresPlus: 0, requiresStage: 1, subjectAffinity: null, assetData: JSON.stringify({ type: "scarf", colors: ["#e47451", "#f3bd62"] }) },
  { id: "acc-hat-topi", name: "Gandhi Topi", category: "accessory", rarity: "uncommon", coinCost: 120, requiresPlus: 0, requiresStage: 2, subjectAffinity: null, assetData: JSON.stringify({ type: "hat", variant: "gandhi_topi", color: "#f9f2d9" }) },
  { id: "acc-bangles", name: "Bangles", category: "accessory", rarity: "uncommon", coinCost: 100, requiresPlus: 0, requiresStage: 1, subjectAffinity: null, assetData: JSON.stringify({ type: "bangles", colors: ["#5caaa0", "#f3bd62", "#e47451"] }) },
  { id: "acc-cricket-bat", name: "Cricket Bat Pin", category: "accessory", rarity: "rare", coinCost: 150, requiresPlus: 0, requiresStage: 3, subjectAffinity: null, assetData: JSON.stringify({ type: "pin", variant: "cricket_bat", color: "#8b6134" }) },
  { id: "acc-notebook", name: "Mini Notebook", category: "accessory", rarity: "uncommon", coinCost: 110, requiresPlus: 0, requiresStage: 2, subjectAffinity: null, assetData: JSON.stringify({ type: "notebook", color: "#285d5c" }) },
  { id: "acc-paintbrush", name: "Paintbrush", category: "accessory", rarity: "uncommon", coinCost: 110, requiresPlus: 0, requiresStage: 2, subjectAffinity: null, assetData: JSON.stringify({ type: "paintbrush", colors: ["#e47451", "#5caaa0"] }) },
  { id: "acc-market-bag", name: "Market Bag Charm", category: "accessory", rarity: "uncommon", coinCost: 100, requiresPlus: 0, requiresStage: 2, subjectAffinity: null, assetData: JSON.stringify({ type: "charm", variant: "market_bag", color: "#ef9b55" }) },
  { id: "acc-storybook", name: "Storybook", category: "accessory", rarity: "uncommon", coinCost: 110, requiresPlus: 0, requiresStage: 2, subjectAffinity: null, assetData: JSON.stringify({ type: "book", variant: "storybook", color: "#5caaa0" }) },

  // Profile themes (150-300 coins)
  { id: "theme-night-sky", name: "Night Sky", category: "profile_theme", rarity: "uncommon", coinCost: 150, requiresPlus: 0, requiresStage: 2, subjectAffinity: null, assetData: JSON.stringify({ background: "linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)", stars: true }) },
  { id: "theme-monsoon", name: "Monsoon", category: "profile_theme", rarity: "uncommon", coinCost: 180, requiresPlus: 0, requiresStage: 3, subjectAffinity: null, assetData: JSON.stringify({ background: "linear-gradient(135deg, #355c7d, #6c5b7b, #c06c84)", rain: true }) },
  { id: "theme-cricket", name: "Cricket Ground", category: "profile_theme", rarity: "rare", coinCost: 200, requiresPlus: 0, requiresStage: 3, subjectAffinity: null, assetData: JSON.stringify({ background: "linear-gradient(135deg, #56ab2f, #a8e063)", pattern: "pitch" }) },
  { id: "theme-diwali", name: "Diwali Festival", category: "profile_theme", rarity: "rare", coinCost: 250, requiresPlus: 0, requiresStage: 4, subjectAffinity: null, assetData: JSON.stringify({ background: "linear-gradient(135deg, #f12711, #f5af19)", sparkle: true }) },

  // Plus-exclusive items
  { id: "skin-golden", name: "Golden Aura", category: "avatar_skin", rarity: "legendary", coinCost: 300, requiresPlus: 1, requiresStage: 4, subjectAffinity: null, assetData: JSON.stringify({ type: "aura", color: "#f7d66c", glow: true, intensity: 0.8 }) },
  { id: "skin-rainbow", name: "Rainbow Trail", category: "avatar_skin", rarity: "legendary", coinCost: 400, requiresPlus: 1, requiresStage: 5, subjectAffinity: null, assetData: JSON.stringify({ type: "trail", colors: ["#e47451", "#f3bd62", "#5caaa0", "#6c5b7b"], animated: true }) },
  { id: "tree-banyan", name: "Banyan Tree", category: "tree_decoration", rarity: "legendary", coinCost: 350, requiresPlus: 1, requiresStage: 5, subjectAffinity: null, assetData: JSON.stringify({ type: "tree_theme", variant: "banyan", aerial_roots: true }) },
  { id: "tree-cherry", name: "Cherry Blossom", category: "tree_decoration", rarity: "legendary", coinCost: 400, requiresPlus: 1, requiresStage: 5, subjectAffinity: null, assetData: JSON.stringify({ type: "tree_theme", variant: "cherry", petals: true, color: "#ffb7c5" }) },
  { id: "theme-holi", name: "Holi Festival", category: "profile_theme", rarity: "legendary", coinCost: 300, requiresPlus: 1, requiresStage: 4, subjectAffinity: null, assetData: JSON.stringify({ background: "linear-gradient(135deg, #a855f7, #ec4899, #f59e0b, #22c55e)", splash: true }) },

  // Subject-specific items (earned via style, but also purchasable)
  { id: "acc-compass-maths", name: "Compass Set", category: "accessory", rarity: "rare", coinCost: 180, requiresPlus: 0, requiresStage: 3, subjectAffinity: "maths", assetData: JSON.stringify({ type: "compass", style: "geometry", color: "#285d5c" }) },
  { id: "acc-beaker-science", name: "Lab Beaker", category: "accessory", rarity: "rare", coinCost: 180, requiresPlus: 0, requiresStage: 3, subjectAffinity: "science", assetData: JSON.stringify({ type: "beaker", bubbles: true, color: "#5caaa0" }) },
];

async function seedCosmetics() {
  console.log("Seeding cosmetic items...");

  for (const item of cosmeticItems) {
    try {
      await db.insert(cosmeticItemsTable).values(item);
      console.log(`  ✓ ${item.name}`);
    } catch (e: any) {
      if (e.message?.includes("UNIQUE")) {
        console.log(`  - ${item.name} (already exists)`);
      } else {
        console.error(`  ✗ ${item.name}: ${e.message}`);
      }
    }
  }

  console.log("Done seeding cosmetics!");
}

seedCosmetics().catch(console.error);
