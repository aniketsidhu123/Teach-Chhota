import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { getShopItems, purchaseShopItem, equipCosmetic, getAvatarState } from "../lib/gamification-service";
import { useAuth } from "../lib/auth-context";
import { ChhotaAvatar } from "../components/avatar/chhota-avatar";
import { fireCelebration, fireCoinSparkle } from "../lib/confetti";
import { ArrowLeft, Sparkles, ShoppingBag, Check, Lock, Palette, Star, Shirt, TreePine } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

interface ShopItem {
  id: string;
  name: string;
  category: "tree_decoration" | "accessory" | "profile_theme" | "avatar_skin";
  rarity: "common" | "uncommon" | "rare" | "legendary";
  coinCost: number;
  requiresPlus: number;
  requiresStage: number;
  subjectAffinity: string | null;
  owned: boolean;
  canAfford: boolean;
  canPurchase: boolean;
  assetData: any;
}

export default function ShopPage() {
  const { user, refreshUser } = useAuth();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [equippedIds, setEquippedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [equippingId, setEquippingId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("accessory");

  useEffect(() => {
    loadShopAndAvatar();
  }, []);

  async function loadShopAndAvatar() {
    try {
      setLoading(true);
      const [shopData, avatarData] = await Promise.all([
        getShopItems(),
        getAvatarState().catch(() => ({ equipped: [] })),
      ]);

      if (shopData && shopData.items) {
        setItems(shopData.items);
      }

      if (avatarData && avatarData.equipped) {
        setEquippedIds(avatarData.equipped.map((e: any) => e.itemId));
      }
    } catch {
      // Offline fallback items
      setItems([
        { id: "tree-fairy-lights", name: "Fairy Lights", category: "tree_decoration", rarity: "common", coinCost: 50, requiresPlus: 0, requiresStage: 0, subjectAffinity: null, owned: true, canAfford: true, canPurchase: false, assetData: {} },
        { id: "tree-diya", name: "Diya Lights", category: "tree_decoration", rarity: "rare", coinCost: 150, requiresPlus: 0, requiresStage: 3, subjectAffinity: null, owned: false, canAfford: true, canPurchase: true, assetData: {} },
        { id: "acc-spectacles", name: "Round Spectacles", category: "accessory", rarity: "common", coinCost: 80, requiresPlus: 0, requiresStage: 0, subjectAffinity: null, owned: true, canAfford: true, canPurchase: false, assetData: {} },
        { id: "acc-scarf", name: "Colorful Scarf", category: "accessory", rarity: "common", coinCost: 90, requiresPlus: 0, requiresStage: 1, subjectAffinity: null, owned: false, canAfford: true, canPurchase: true, assetData: {} },
        { id: "acc-hat-topi", name: "Gandhi Topi", category: "accessory", rarity: "uncommon", coinCost: 120, requiresPlus: 0, requiresStage: 2, subjectAffinity: null, owned: false, canAfford: false, canPurchase: false, assetData: {} },
        { id: "acc-compass-maths", name: "Compass Set", category: "accessory", rarity: "rare", coinCost: 180, requiresPlus: 0, requiresStage: 3, subjectAffinity: "maths", owned: false, canAfford: false, canPurchase: false, assetData: {} },
        { id: "acc-beaker-science", name: "Lab Beaker", category: "accessory", rarity: "rare", coinCost: 180, requiresPlus: 0, requiresStage: 3, subjectAffinity: "science", owned: false, canAfford: false, canPurchase: false, assetData: {} },
        { id: "skin-golden", name: "Golden Aura", category: "avatar_skin", rarity: "legendary", coinCost: 300, requiresPlus: 1, requiresStage: 4, subjectAffinity: null, owned: false, canAfford: false, canPurchase: false, assetData: {} },
      ]);
      setEquippedIds(["acc-spectacles", "tree-fairy-lights"]);
    } finally {
      setLoading(false);
    }
  }

  async function handlePurchase(item: ShopItem) {
    try {
      setPurchasingId(item.id);
      await purchaseShopItem(item.id);
      fireCelebration();
      await refreshUser();
      await loadShopAndAvatar();
    } catch (e: any) {
      alert(e.message || "Failed to purchase item");
    } finally {
      setPurchasingId(null);
    }
  }

  async function handleToggleEquip(item: ShopItem) {
    try {
      setEquippingId(item.id);
      const isEquipped = equippedIds.includes(item.id);
      await equipCosmetic(item.id, isEquipped ? undefined : item.category);

      if (isEquipped) {
        setEquippedIds(equippedIds.filter((id) => id !== item.id));
      } else {
        setEquippedIds([...equippedIds, item.id]);
        fireCoinSparkle();
      }
    } catch (e: any) {
      alert(e.message || "Failed to equip item");
    } finally {
      setEquippingId(null);
    }
  }

  const filteredItems = items.filter((item) => {
    if (activeCategory === "all") return true;
    if (activeCategory === "plus") return item.requiresPlus === 1;
    return item.category === activeCategory;
  });

  return (
    <div className="min-h-screen bg-linear-to-b from-purple-50/30 via-background to-teal-50/20 pb-20">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <span>ज्ञान बाज़ार</span>
                <span className="text-sm font-normal text-muted-foreground hidden sm:inline">| Dressing Room & Shop</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 px-3.5 py-1.5 rounded-full text-xs font-bold">
            <Sparkles className="w-4 h-4" />
            <span>{user?.gyaanCoins || 0} Gyaan Coins</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Dressing Room Preview Card */}
        <Card className="p-6 bg-linear-to-r from-emerald-500/10 via-background to-teal-500/10 border-2 border-emerald-500/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="p-4 rounded-2xl bg-card shadow-sm border">
                <ChhotaAvatar
                  stage={user?.avatarStage || 0}
                  size={140}
                  accessories={equippedIds}
                  showStageBadge
                />
              </div>

              <div>
                <Badge variant="outline" className="mb-1 text-xs">
                  Chhota's Dressing Room
                </Badge>
                <h2 className="text-xl font-bold text-foreground">
                  Personalize Your Learning Companion
                </h2>
                <p className="text-xs text-muted-foreground mt-1 max-w-md">
                  Earn Gyaan Coins by teaching concepts and debunking misconceptions. Equip accessories, fairy lights, and festive themes!
                </p>

                <div className="flex gap-2 mt-3">
                  <span className="text-xs font-medium text-muted-foreground">
                    Equipped: <strong className="text-foreground">{equippedIds.length} items</strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="text-center md:text-right">
              <Link href="/plus">
                <Button variant="outline" className="gap-2 border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  Teach Chhota Plus Exclusive Items
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Category Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
          <TabsList className="grid w-full max-w-lg grid-cols-4 mb-6">
            <TabsTrigger value="accessory" className="gap-1.5 text-xs">
              <Shirt className="w-3.5 h-3.5" />
              <span>Accessories</span>
            </TabsTrigger>
            <TabsTrigger value="tree_decoration" className="gap-1.5 text-xs">
              <TreePine className="w-3.5 h-3.5" />
              <span>Tree Decor</span>
            </TabsTrigger>
            <TabsTrigger value="profile_theme" className="gap-1.5 text-xs">
              <Palette className="w-3.5 h-3.5" />
              <span>Themes</span>
            </TabsTrigger>
            <TabsTrigger value="plus" className="gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-bold">
              <Star className="w-3.5 h-3.5" />
              <span>Plus</span>
            </TabsTrigger>
          </TabsList>

          {/* Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map((item) => {
              const isEquipped = equippedIds.includes(item.id);
              const isPlusItem = item.requiresPlus === 1;

              return (
                <Card
                  key={item.id}
                  className={`border-2 flex flex-col justify-between transition-all ${
                    isEquipped
                      ? "border-emerald-500 bg-emerald-500/5 shadow-sm"
                      : isPlusItem
                      ? "border-amber-400/50 bg-amber-500/5"
                      : "border-border"
                  }`}
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {item.rarity}
                      </Badge>
                      {item.owned ? (
                        <Badge className="bg-emerald-600 text-white text-[10px] gap-1">
                          <Check className="w-3 h-3" /> Owned
                        </Badge>
                      ) : (
                        <div className="flex items-center gap-1 font-bold text-xs text-amber-600 dark:text-amber-400">
                          🪙 {item.coinCost}
                        </div>
                      )}
                    </div>

                    <CardTitle className="text-sm font-bold text-foreground mt-2">
                      {item.name}
                    </CardTitle>
                    <CardDescription className="text-xs capitalize">
                      {item.category.replace(/_/g, " ")}
                      {item.subjectAffinity && ` • ${item.subjectAffinity} Affinity`}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-4 pt-1">
                    {/* Item Requirements / Notes */}
                    {item.requiresStage > 0 && (
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1 mb-2">
                        {user && user.avatarStage >= item.requiresStage ? (
                          <span className="text-emerald-600">✓ Stage {item.requiresStage} Unlocked</span>
                        ) : (
                          <span className="text-amber-600 flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Requires Avatar Stage {item.requiresStage}
                          </span>
                        )}
                      </div>
                    )}

                    {isPlusItem && (
                      <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 mb-2">
                        <Star className="w-3 h-3 fill-current" /> Plus Exclusive Item
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="p-4 pt-0">
                    {item.owned ? (
                      <Button
                        size="sm"
                        variant={isEquipped ? "default" : "outline"}
                        onClick={() => handleToggleEquip(item)}
                        disabled={equippingId === item.id}
                        className={`w-full text-xs h-8 ${isEquipped ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}`}
                      >
                        {isEquipped ? "Equipped ✓" : "Equip on Chhota"}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handlePurchase(item)}
                        disabled={!item.canPurchase || purchasingId === item.id}
                        className="w-full text-xs h-8 gap-1.5"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        {item.canPurchase
                          ? `Buy for ${item.coinCost} Coins`
                          : (user?.gyaanCoins || 0) < item.coinCost
                          ? "Need More Coins"
                          : "Locked"}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </Tabs>
      </main>
    </div>
  );
}
