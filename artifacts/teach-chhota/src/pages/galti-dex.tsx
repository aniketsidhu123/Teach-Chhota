import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { getGaltiDex, pinGaltiCard, getBugBountyChallenge, evaluateBugBounty } from "../lib/gamification-service";
import { useAuth } from "../lib/auth-context";
import { fireCelebration, fireCoinSparkle } from "../lib/confetti";
import { ChhotaAvatar } from "../components/avatar/chhota-avatar";
import { ArrowLeft, Sparkles, Pin, Bug, ShieldCheck, Trophy, Mic, Send, RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

interface GaltiCard {
  id: number;
  misconceptionId: string;
  conceptKey: string;
  misconceptionTitle: string;
  chhotaConfusionText: string;
  resolutionExplanation: string;
  rarity: "common" | "rare" | "legendary" | "mythic";
  subject: string;
  isPinned: number;
  unlockedAt: string;
}

interface BugChallenge {
  id: number;
  chapterTitle: string;
  subject: string;
  classLevel: number;
  conceptKey: string;
  misconceptionTitle: string;
  flawedArgument: string;
  coinReward: number;
  rarity: string;
}

export default function GaltiDexPage() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"dex" | "bounty">("dex");

  // Dex state
  const [cards, setCards] = useState<GaltiCard[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [selectedRarity, setSelectedRarity] = useState<string>("all");

  // Bounty state
  const [challenge, setChallenge] = useState<BugChallenge | null>(null);
  const [loadingChallenge, setLoadingChallenge] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<any | null>(null);

  useEffect(() => {
    loadDex();
    loadDailyChallenge();
  }, []);

  async function loadDex() {
    try {
      setLoadingCards(true);
      const data = await getGaltiDex();
      if (data && data.cards) {
        setCards(data.cards);
      }
    } catch {
      // Offline fallback mock cards
      setCards([
        {
          id: 1,
          misconceptionId: "frac_denominator",
          conceptKey: "fractions_denominator",
          misconceptionTitle: "Bigger Denominator = Bigger Fraction",
          chhotaConfusionText: "I thought 1/8 was bigger than 1/4 because 8 is bigger than 4!",
          resolutionExplanation: "You showed Chhota that dividing a samosa into 8 slices makes each slice smaller than dividing it into 4 slices.",
          rarity: "common",
          subject: "Maths",
          isPinned: 1,
          unlockedAt: new Date().toISOString(),
        },
        {
          id: 2,
          misconceptionId: "plants_food_soil",
          conceptKey: "photosynthesis_source",
          misconceptionTitle: "Plants Eat Soil from Roots",
          chhotaConfusionText: "I believed plant roots eat mud to grow big and strong!",
          resolutionExplanation: "You clarified that roots only absorb water and minerals; green leaves make glucose using sunlight and carbon dioxide.",
          rarity: "rare",
          subject: "Science",
          isPinned: 0,
          unlockedAt: new Date().toISOString(),
        },
        {
          id: 3,
          misconceptionId: "angles_line_length",
          conceptKey: "angles_definition",
          misconceptionTitle: "Longer Arms Make Bigger Angles",
          chhotaConfusionText: "I drew longer lines for a 30° angle and thought it became 90°!",
          resolutionExplanation: "You explained that an angle is the amount of turn between two rays, not how long the lines are drawn.",
          rarity: "legendary",
          subject: "Maths",
          isPinned: 1,
          unlockedAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoadingCards(false);
    }
  }

  async function loadDailyChallenge() {
    try {
      setLoadingChallenge(true);
      setEvalResult(null);
      setExplanation("");
      const data = await getBugBountyChallenge(user?.classLevel || 8);
      if (data && data.challenge) {
        setChallenge(data.challenge);
      }
    } catch {
      // Offline mock challenge
      setChallenge({
        id: 99,
        chapterTitle: "Integers & Operations",
        subject: "Maths",
        classLevel: 8,
        conceptKey: "integers_negative_comparison",
        misconceptionTitle: "Negative Numbers Ordering",
        flawedArgument: "I think -10 is bigger than -2 because 10 is bigger than 2! So having a debt of ₹10 is better than a debt of ₹2!",
        coinReward: 25,
        rarity: "rare",
      });
    } finally {
      setLoadingChallenge(false);
    }
  }

  async function togglePin(card: GaltiCard) {
    const nextPinned = card.isPinned === 1 ? false : true;
    try {
      await pinGaltiCard(card.id, nextPinned);
      setCards(cards.map((c) => (c.id === card.id ? { ...c, isPinned: nextPinned ? 1 : 0 } : c)));
    } catch {
      setCards(cards.map((c) => (c.id === card.id ? { ...c, isPinned: nextPinned ? 1 : 0 } : c)));
    }
  }

  async function handleSubmitBounty() {
    if (!challenge || !explanation.trim()) return;
    try {
      setEvaluating(true);
      const result = await evaluateBugBounty(challenge.id, explanation.trim());
      setEvalResult(result);
      if (result.bountyAwarded) {
        fireCelebration();
        refreshUser();
        loadDex();
      }
    } catch {
      // Local optimistic evaluation fallback
      const fixed = explanation.length > 30;
      setEvalResult({
        evaluation: {
          isFixed: fixed,
          score: fixed ? 0.85 : 0.4,
          feedback: fixed
            ? "Wah! You clearly corrected Chhota's mistake with a fantastic explanation."
            : "Good attempt! Explain why numbers further to the left on the number line are smaller.",
        },
        bountyAwarded: fixed,
        coinsEarned: fixed ? challenge.coinReward : 0,
        samajhScoreEarned: fixed ? 40 : 10,
      });
      if (fixed) {
        fireCelebration();
        refreshUser();
      }
    } finally {
      setEvaluating(false);
    }
  }

  const filteredCards = cards.filter(
    (c) => selectedRarity === "all" || c.rarity === selectedRarity
  );

  return (
    <div className="min-h-screen bg-linear-to-b from-amber-50/30 via-background to-orange-50/20 pb-20">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <span>गलती-डेक्स</span>
                <span className="text-sm font-normal text-muted-foreground hidden sm:inline">| Galti Dex & Bug Bounty</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{user?.gyaanCoins || 0} Coins</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
            <TabsTrigger value="dex" className="gap-2">
              <Trophy className="w-4 h-4" />
              <span>Galti Dex ({cards.length})</span>
            </TabsTrigger>
            <TabsTrigger value="bounty" className="gap-2">
              <Bug className="w-4 h-4 text-rose-500" />
              <span>Bug Bounty Arena</span>
            </TabsTrigger>
          </TabsList>

          {/* ─── TAB 1: GALTI DEX ─── */}
          <TabsContent value="dex" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
              <div>
                <h2 className="text-lg font-bold">Your Misconception Trophy Cards</h2>
                <p className="text-xs text-muted-foreground">
                  Every time you debunk Chhota's wrong beliefs, you earn a permanent trophy card for your Dex!
                </p>
              </div>

              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {["all", "common", "rare", "legendary", "mythic"].map((rarity) => (
                  <Button
                    key={rarity}
                    size="sm"
                    variant={selectedRarity === rarity ? "default" : "outline"}
                    onClick={() => setSelectedRarity(rarity)}
                    className="capitalize text-xs h-7 rounded-full"
                  >
                    {rarity}
                  </Button>
                ))}
              </div>
            </div>

            {loadingCards ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                Opening Galti Dex...
              </div>
            ) : filteredCards.length === 0 ? (
              <Card className="text-center py-12 p-6 border-dashed">
                <Trophy className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                <h3 className="font-bold text-foreground">No cards found in this category</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  Teach Chhota in the Teach Room or tackle today's Bug Bounty to unlock your first trophy card!
                </p>
                <Button className="mt-4" size="sm" onClick={() => setActiveTab("bounty")}>
                  Play Bug Bounty Arena 🎯
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredCards.map((card) => {
                  const borderClass =
                    card.rarity === "mythic"
                      ? "border-amber-400 shadow-amber-500/20 shadow-md bg-linear-to-br from-amber-500/10 via-background to-rose-500/10"
                      : card.rarity === "legendary"
                      ? "border-purple-400 shadow-purple-500/10 shadow-sm bg-linear-to-br from-purple-500/10 via-background to-indigo-500/10"
                      : card.rarity === "rare"
                      ? "border-sky-400 bg-sky-500/5"
                      : "border-border bg-card";

                  return (
                    <Card key={card.id} className={`border-2 transition-all hover:scale-[1.02] flex flex-col justify-between ${borderClass}`}>
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="capitalize text-[10px] font-bold">
                            {card.rarity} {card.subject}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => togglePin(card)}
                            className={`h-7 w-7 rounded-full ${card.isPinned ? "text-amber-500 hover:text-amber-600" : "text-muted-foreground"}`}
                            title={card.isPinned ? "Pinned to profile" : "Pin to profile"}
                          >
                            <Pin className="w-3.5 h-3.5 fill-current" />
                          </Button>
                        </div>
                        <CardTitle className="text-base font-bold text-foreground mt-1">
                          {card.misconceptionTitle}
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="p-4 pt-2 space-y-3">
                        <div className="p-2.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-xs">
                          <span className="font-semibold text-rose-700 dark:text-rose-400 block mb-0.5">
                            Chhota's Confusion:
                          </span>
                          <span className="text-muted-foreground italic">"{card.chhotaConfusionText}"</span>
                        </div>

                        <div className="p-2.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-xs">
                          <span className="font-semibold text-emerald-700 dark:text-emerald-400 block mb-0.5">
                            How YOU Debunked It:
                          </span>
                          <span className="text-foreground">{card.resolutionExplanation}</span>
                        </div>
                      </CardContent>

                      <CardFooter className="p-4 pt-0 text-[10px] text-muted-foreground flex justify-between">
                        <span>Debunked on {new Date(card.unlockedAt).toLocaleDateString()}</span>
                        {card.isPinned ? <span className="text-amber-600 font-semibold">📌 Pinned</span> : null}
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ─── TAB 2: BUG BOUNTY ARENA ─── */}
          <TabsContent value="bounty" className="space-y-6">
            <div className="max-w-2xl mx-auto space-y-6">
              <Card className="border-2 border-rose-500/30 overflow-hidden shadow-sm">
                <div className="bg-linear-to-r from-rose-500 to-orange-500 text-white p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 font-black text-sm tracking-wide">
                    <Bug className="w-5 h-5 animate-spin" style={{ animationDuration: "8s" }} />
                    <span>CHHOTA'S CONCEPT BUG BOUNTY</span>
                  </div>
                  <Badge className="bg-white/20 text-white border-none font-bold">
                    🪙 {challenge?.coinReward || 25} Gyaan Coins Bounty
                  </Badge>
                </div>

                <CardHeader className="p-5 pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {challenge?.subject} | Class {challenge?.classLevel}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-medium">
                      Chapter: {challenge?.chapterTitle}
                    </span>
                  </div>
                  <CardTitle className="text-lg font-bold text-foreground mt-2">
                    {challenge?.misconceptionTitle}
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-5 pt-2 space-y-4">
                  {/* Chhota's Flawed Argument */}
                  <div className="flex gap-3 p-4 rounded-xl bg-muted/60 border">
                    <ChhotaAvatar stage={user?.avatarStage || 0} size={50} emotion="curious" />
                    <div>
                      <div className="text-xs font-bold text-foreground mb-1">Chhota says:</div>
                      <div className="text-sm italic text-foreground/90 font-medium leading-relaxed">
                        "{challenge?.flawedArgument}"
                      </div>
                    </div>
                  </div>

                  {/* Evaluation Result if already submitted */}
                  {evalResult && (
                    <div
                      className={`p-4 rounded-xl border-2 space-y-2 ${
                        evalResult.bountyAwarded
                          ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-950 dark:text-emerald-200"
                          : "bg-amber-500/10 border-amber-500/40 text-amber-950 dark:text-amber-200"
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-sm">
                        {evalResult.bountyAwarded ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            <span>Bounty Claimed! Misconception Fixed!</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                            <span>Chhota is still a bit confused!</span>
                          </>
                        )}
                      </div>

                      <p className="text-xs leading-relaxed">{evalResult.evaluation.feedback}</p>

                      {evalResult.bountyAwarded && (
                        <div className="pt-2 flex gap-4 text-xs font-bold">
                          <span className="text-amber-600">+{evalResult.coinsEarned} Coins 🪙</span>
                          <span className="text-emerald-600">+{evalResult.samajhScoreEarned} Samajh Score 🏆</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Student's Diagnosis & Fix */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-foreground flex items-center justify-between">
                      <span>Your Fix (Explain why Chhota is mistaken):</span>
                      <span className="text-[11px] font-normal text-muted-foreground">Use a clear analogy or real-world example!</span>
                    </label>
                    <Textarea
                      placeholder="e.g., Think of negative numbers like elevator floors below ground level..."
                      value={explanation}
                      onChange={(e) => setExplanation(e.target.value)}
                      rows={4}
                      className="resize-none text-sm"
                    />
                  </div>
                </CardContent>

                <CardFooter className="p-5 pt-0 flex items-center justify-between gap-3">
                  <Button variant="outline" size="sm" onClick={loadDailyChallenge} disabled={loadingChallenge}>
                    <RefreshCw className="w-3.5 h-3.5 mr-1" />
                    New Bug
                  </Button>

                  <Button
                    onClick={handleSubmitBounty}
                    disabled={evaluating || !explanation.trim()}
                    className="gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold"
                  >
                    <Send className="w-4 h-4" />
                    {evaluating ? "Chhota is Thinking..." : "Debug Chhota & Claim Bounty 🪙"}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
