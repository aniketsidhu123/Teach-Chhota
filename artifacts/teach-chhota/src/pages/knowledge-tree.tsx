import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { getConceptMastery, reviveConcept } from "../lib/gamification-service";
import { useAuth } from "../lib/auth-context";
import { ChhotaAvatar } from "../components/avatar/chhota-avatar";
import { fireCelebration, fireCoinSparkle } from "../lib/confetti";
import { Droplet, Sparkles, BookOpen, AlertCircle, RefreshCw, Trophy, ArrowRight, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";

interface ConceptNode {
  conceptKey: string;
  chapterTitle?: string;
  subject: string;
  classLevel: number;
  masteryLevel: string; // 'none' | 'novice' | 'practitioner' | 'expert' | 'guru'
  samajhScore: number;
  sessionCount: number;
  wiltFactor: number; // 0 (fresh) to 1 (wilted)
  isWilted: boolean;
  nextReviewAt: string;
}

export default function KnowledgeTreePage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [concepts, setConcepts] = useState<ConceptNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<"all" | "Maths" | "Science">("all");
  const [revivingKey, setRevivingKey] = useState<string | null>(null);

  useEffect(() => {
    loadTreeData();
  }, []);

  async function loadTreeData() {
    try {
      setLoading(true);
      const data = await getConceptMastery();
      if (data && data.concepts) {
        setConcepts(data.concepts);
      }
    } catch (err) {
      console.warn("Could not load online concept mastery, using mock/cached concepts", err);
      // Fallback sample concepts for demonstration
      setConcepts([
        { conceptKey: "fractions_meaning", chapterTitle: "Fractions & Decimals", subject: "Maths", classLevel: user?.classLevel || 8, masteryLevel: "guru", samajhScore: 420, sessionCount: 5, wiltFactor: 0.1, isWilted: false, nextReviewAt: new Date(Date.now() + 86400000 * 5).toISOString() },
        { conceptKey: "integers_addition", chapterTitle: "Integers", subject: "Maths", classLevel: user?.classLevel || 8, masteryLevel: "expert", samajhScore: 280, sessionCount: 3, wiltFactor: 0.55, isWilted: true, nextReviewAt: new Date(Date.now() - 86400000 * 2).toISOString() },
        { conceptKey: "photosynthesis_sunlight", chapterTitle: "Nutrition in Plants", subject: "Science", classLevel: user?.classLevel || 8, masteryLevel: "guru", samajhScore: 390, sessionCount: 4, wiltFactor: 0.2, isWilted: false, nextReviewAt: new Date(Date.now() + 86400000 * 3).toISOString() },
        { conceptKey: "heat_transfer", chapterTitle: "Heat", subject: "Science", classLevel: user?.classLevel || 8, masteryLevel: "practitioner", samajhScore: 160, sessionCount: 2, wiltFactor: 0.72, isWilted: true, nextReviewAt: new Date(Date.now() - 86400000 * 4).toISOString() },
        { conceptKey: "force_pressure", chapterTitle: "Force and Pressure", subject: "Science", classLevel: user?.classLevel || 8, masteryLevel: "novice", samajhScore: 90, sessionCount: 1, wiltFactor: 0.35, isWilted: false, nextReviewAt: new Date(Date.now() + 86400000).toISOString() },
        { conceptKey: "linear_equations", chapterTitle: "Linear Equations", subject: "Maths", classLevel: user?.classLevel || 8, masteryLevel: "none", samajhScore: 0, sessionCount: 0, wiltFactor: 0.0, isWilted: false, nextReviewAt: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleWaterLeaf(concept: ConceptNode) {
    setRevivingKey(concept.conceptKey);
    try {
      await reviveConcept(concept.conceptKey);
      fireCoinSparkle();
      // Navigate to teach session with bonus
      setLocation(`/teach?concept=${encodeURIComponent(concept.conceptKey)}&bonus=1.5`);
    } catch {
      setLocation(`/teach?concept=${encodeURIComponent(concept.conceptKey)}&bonus=1.5`);
    } finally {
      setRevivingKey(null);
    }
  }

  const filteredConcepts = concepts.filter(
    (c) => selectedSubject === "all" || c.subject === selectedSubject
  );

  const totalMastered = concepts.filter((c) => c.samajhScore >= 150).length;
  const wiltedCount = concepts.filter((c) => c.isWilted).length;
  const overallHealth = concepts.length > 0
    ? Math.round((1 - concepts.reduce((acc, c) => acc + c.wiltFactor, 0) / concepts.length) * 100)
    : 100;

  return (
    <div className="min-h-screen bg-linear-to-b from-emerald-50/40 via-background to-teal-50/20 pb-20">
      {/* Top Header */}
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <span>ज्ञान वृक्ष</span>
                <span className="text-sm font-normal text-muted-foreground hidden sm:inline">| Knowledge Tree</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{user?.gyaanCoins || 0} Coins</span>
            </div>
            <Link href="/shop">
              <Button size="sm" variant="outline" className="text-xs h-8">
                Shop 🛍️
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Tree Overview & Health Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Chhota Status */}
          <Card className="flex flex-col items-center justify-center p-6 text-center relative overflow-hidden bg-linear-to-br from-emerald-500/5 to-teal-500/10 border-emerald-500/20">
            <ChhotaAvatar stage={user?.avatarStage || 0} size={110} showStageBadge />
            <h3 className="mt-3 font-bold text-foreground text-base">
              Chhota's Growth: {STAGE_NAMES[user?.avatarStage || 0]}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              Every concept you teach nourishes Chhota. Master more chapters to evolve to the next stage!
            </p>
          </Card>

          {/* Tree Health & Wilt Summary */}
          <Card className="p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-muted-foreground">Tree Vitality</span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{overallHealth}%</span>
              </div>
              <Progress value={overallHealth} className="h-2.5 bg-muted" />
              <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <div className="font-bold text-emerald-700 dark:text-emerald-400 text-lg">{totalMastered}</div>
                  <div className="text-muted-foreground">Mastered</div>
                </div>
                <div className={`p-2.5 rounded-lg border ${wiltedCount > 0 ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400" : "bg-muted/50 border-border"}`}>
                  <div className="font-bold text-lg">{wiltedCount}</div>
                  <div className="text-muted-foreground">Thirsty Leaves 💧</div>
                </div>
              </div>
            </div>

            {wiltedCount > 0 && (
              <div className="mt-4 p-2.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-xs flex items-center gap-2 text-amber-800 dark:text-amber-300">
                <Droplet className="w-4 h-4 shrink-0 text-amber-500 animate-bounce" />
                <span>Water thirsty concepts with a quick teaching session for <strong>1.5× Samajh Bonus</strong>!</span>
              </div>
            )}
          </Card>

          {/* Samajh Score Summary */}
          <Card className="p-6 flex flex-col justify-between bg-linear-to-br from-amber-500/5 to-orange-500/5 border-amber-500/20">
            <div>
              <div className="text-sm font-semibold text-muted-foreground">Total Samajh Score</div>
              <div className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {Math.round(user?.samajhScoreTotal || 0)} <span className="text-sm font-normal text-muted-foreground">pts</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Earned strictly through quality teaching, analogies, and debunking misconceptions.
              </p>
            </div>

            <div className="mt-4 pt-4 border-t flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Current Streak</span>
              <span className="text-sm font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1">
                🔥 {user?.streakCurrent || 0} days
              </span>
            </div>
          </Card>
        </div>

        {/* Subject Filter Tabs */}
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={selectedSubject === "all" ? "default" : "outline"}
              onClick={() => setSelectedSubject("all")}
              className="rounded-full text-xs"
            >
              All Concepts ({concepts.length})
            </Button>
            <Button
              size="sm"
              variant={selectedSubject === "Maths" ? "default" : "outline"}
              onClick={() => setSelectedSubject("Maths")}
              className="rounded-full text-xs"
            >
              📐 Maths ({concepts.filter((c) => c.subject === "Maths").length})
            </Button>
            <Button
              size="sm"
              variant={selectedSubject === "Science" ? "default" : "outline"}
              onClick={() => setSelectedSubject("Science")}
              className="rounded-full text-xs"
            >
              🔬 Science ({concepts.filter((c) => c.subject === "Science").length})
            </Button>
          </div>

          <Button size="sm" variant="ghost" onClick={loadTreeData} className="text-xs text-muted-foreground">
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>
        </div>

        {/* Concept Leaves Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredConcepts.map((concept) => {
            const isWilted = concept.isWilted;
            const masteryColor =
              concept.samajhScore >= 350
                ? "border-amber-400 bg-amber-500/5 text-amber-700 dark:text-amber-300"
                : concept.samajhScore >= 150
                ? "border-emerald-400 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
                : concept.samajhScore > 0
                ? "border-sky-400 bg-sky-500/5 text-sky-700 dark:text-sky-300"
                : "border-border bg-card text-muted-foreground";

            return (
              <Card
                key={concept.conceptKey}
                className={`transition-all duration-200 border-2 relative overflow-hidden ${
                  isWilted ? "border-amber-500/60 bg-amber-50/30 dark:bg-amber-950/20" : ""
                }`}
              >
                {/* Wilt Banner */}
                {isWilted && (
                  <div className="bg-amber-500 text-amber-950 text-[10px] font-black px-2 py-0.5 text-center flex items-center justify-center gap-1 uppercase tracking-wider">
                    <Droplet className="w-3 h-3 fill-amber-950" />
                    Thirsty Leaf — Water with Spaced Repetition (1.5× Bonus)
                  </div>
                )}

                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">{concept.subject === "Maths" ? "📐" : "🔬"}</span>
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {concept.subject}
                      </span>
                    </div>

                    <Badge variant="outline" className={`text-[10px] uppercase font-bold ${masteryColor}`}>
                      {concept.masteryLevel}
                    </Badge>
                  </div>

                  <CardTitle className="text-sm font-bold text-foreground mt-1 line-clamp-1">
                    {concept.chapterTitle || concept.conceptKey.replace(/_/g, " ")}
                  </CardTitle>
                  <CardDescription className="text-xs line-clamp-1">
                    Class {concept.classLevel} NCERT Concept
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-4 pt-2 space-y-3">
                  {/* Samajh Score Bar */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Samajh Level</span>
                      <span className="font-bold text-foreground">{Math.round(concept.samajhScore)} pts</span>
                    </div>
                    <Progress
                      value={Math.min(100, (concept.samajhScore / 400) * 100)}
                      className={`h-2 ${isWilted ? "bg-amber-200 dark:bg-amber-950" : ""}`}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-muted-foreground">
                      {concept.sessionCount} {concept.sessionCount === 1 ? "teaching" : "teachings"}
                    </span>

                    {isWilted ? (
                      <Button
                        size="sm"
                        onClick={() => handleWaterLeaf(concept)}
                        disabled={revivingKey === concept.conceptKey}
                        className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-7 gap-1 px-3"
                      >
                        <Droplet className="w-3 h-3" />
                        Water Leaf (1.5×)
                      </Button>
                    ) : (
                      <Link href={`/teach?concept=${encodeURIComponent(concept.conceptKey)}`}>
                        <Button size="sm" variant="outline" className="text-xs h-7 gap-1 px-3">
                          Teach Chhota
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}

const STAGE_NAMES = [
  "Beej (Seedling)",
  "Ankuran (Sprout)",
  "Paudha (Sapling)",
  "Kishor (Young Tree)",
  "Taru (Flourishing Tree)",
  "Vriksh (Mighty Tree)",
  "Kalpavriksh (Wish Tree)",
  "Guru (Ancient Banyan Sage)",
];
