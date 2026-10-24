import React, { useState, useEffect } from "react";
import { Link, useParams } from "wouter";
import { getProfile, updateProfile } from "../lib/gamification-service";
import { useAuth } from "../lib/auth-context";
import { ChhotaAvatar } from "../components/avatar/chhota-avatar";
import { fireCoinSparkle } from "../lib/confetti";
import { ArrowLeft, Share2, Copy, Check, Eye, EyeOff, Trophy, Flame, Sparkles, Pin, ShieldCheck, Heart } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";

export default function ProfilePage() {
  const params = useParams<{ id?: string }>();
  const { user: currentUser, refreshUser } = useAuth();
  const targetUserId = params.id || currentUser?.id;
  const isOwnProfile = !params.id || params.id === currentUser?.id;

  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [updatingVisibility, setUpdatingVisibility] = useState(false);

  useEffect(() => {
    if (targetUserId) {
      loadProfileData(targetUserId);
    }
  }, [targetUserId]);

  async function loadProfileData(id: string) {
    try {
      setLoading(true);
      const data = await getProfile(id);
      if (data && data.profile) {
        setProfile(data.profile);
      }
    } catch {
      // Mock profile fallback
      setProfile({
        id: currentUser?.id || "u-local",
        displayName: currentUser?.displayName || "Aarav Sharma",
        username: currentUser?.username || "aarav8",
        classLevel: currentUser?.classLevel || 8,
        avatarStage: currentUser?.avatarStage || 2,
        avatarName: "Paudha",
        teachingStyle: currentUser?.teachingStyle || "analogy_master",
        samajhScoreTotal: currentUser?.samajhScoreTotal || 350,
        samajhScoreMaths: currentUser?.samajhScoreMaths || 200,
        samajhScoreScience: currentUser?.samajhScoreScience || 150,
        streakCurrent: currentUser?.streakCurrent || 4,
        streakBest: currentUser?.streakBest || 7,
        subscriptionTier: currentUser?.subscriptionTier || "free",
        profileTheme: currentUser?.profileTheme || "default",
        profileVisibility: currentUser?.profileVisibility || "friends",
        equippedCosmetics: [],
        pinnedCards: [
          {
            id: 1,
            misconceptionTitle: "Bigger Denominator = Bigger Fraction",
            chhotaConfusionText: "1/8 is bigger than 1/4 because 8 is bigger than 4!",
            resolutionExplanation: "Dividing into 8 slices makes smaller portions than 4 slices.",
            rarity: "common",
            subject: "Maths",
          },
        ],
        recentReactions: [
          { reactionType: "clap", count: 8 },
          { reactionType: "great_tree", count: 5 },
          { reactionType: "star", count: 3 },
        ],
      });
    } finally {
      setLoading(false);
    }
  }

  async function toggleVisibility() {
    if (!isOwnProfile) return;
    try {
      setUpdatingVisibility(true);
      const nextVis = profile.profileVisibility === "friends" ? "hidden" : "friends";
      await updateProfile({ profileVisibility: nextVis });
      setProfile({ ...profile, profileVisibility: nextVis });
      await refreshUser();
    } catch (e: any) {
      alert("Failed to update visibility");
    } finally {
      setUpdatingVisibility(false);
    }
  }

  function handleCopyShareLink() {
    const url = `${window.location.origin}/profile/${profile.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    fireCoinSparkle();
    setTimeout(() => setCopiedLink(false), 2000);
  }

  const mathsRatio = profile && profile.samajhScoreTotal > 0
    ? Math.round((profile.samajhScoreMaths / profile.samajhScoreTotal) * 100)
    : 50;

  return (
    <div className="min-h-screen bg-linear-to-b from-teal-50/40 via-background to-emerald-50/20 pb-20">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold tracking-tight">
              {isOwnProfile ? "विद्यार्थी प्रोफ़ाइल | Your Profile" : `${profile?.displayName || "Student"}'s Profile`}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleCopyShareLink} className="gap-1.5 text-xs h-8">
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              {copiedLink ? "Link Copied!" : "Share Profile"}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {loading ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            Loading profile card...
          </div>
        ) : !profile ? (
          <div className="text-center py-16 text-muted-foreground">
            Profile not found.
          </div>
        ) : (
          <>
            {/* Main Profile Showcase Card */}
            <Card className="border-2 overflow-hidden shadow-md">
              {/* Banner with Indian Theme */}
              <div className="h-32 bg-linear-to-r from-emerald-600 via-teal-600 to-amber-600 relative p-4 flex items-end justify-between">
                <Badge className="bg-black/30 backdrop-blur-md text-white border-none font-bold text-xs">
                  Class {profile.classLevel} Scholar
                </Badge>
                {isOwnProfile && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={toggleVisibility}
                    disabled={updatingVisibility}
                    className="text-xs h-7 gap-1 bg-white/90 hover:bg-white text-foreground"
                  >
                    {profile.profileVisibility === "friends" ? (
                      <>
                        <Eye className="w-3.5 h-3.5 text-emerald-600" /> Visible to Friends
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-rose-600" /> Hidden / Private
                      </>
                    )}
                  </Button>
                )}
              </div>

              <CardContent className="p-6 relative pt-0">
                <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between -mt-16 sm:-mt-12 gap-4">
                  {/* Chhota Avatar Badge */}
                  <div className="p-2 rounded-2xl bg-card border-4 border-background shadow-lg">
                    <ChhotaAvatar stage={profile.avatarStage} size={110} showStageBadge />
                  </div>

                  <div className="flex-1 text-center sm:text-left">
                    <h2 className="text-2xl font-black text-foreground">{profile.displayName}</h2>
                    <p className="text-xs text-muted-foreground">@{profile.username} • Class {profile.classLevel}</p>
                  </div>

                  {/* Streak & Samajh Stat Pills */}
                  <div className="flex gap-2">
                    <div className="px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-center">
                      <div className="text-xs font-bold text-orange-600 flex items-center justify-center gap-1">
                        <Flame className="w-3.5 h-3.5" /> {profile.streakCurrent}d
                      </div>
                      <div className="text-[10px] text-muted-foreground">Streak</div>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                      <div className="text-xs font-bold text-emerald-600 flex items-center justify-center gap-1">
                        <Trophy className="w-3.5 h-3.5" /> {Math.round(profile.samajhScoreTotal)}
                      </div>
                      <div className="text-[10px] text-muted-foreground">Samajh Score</div>
                    </div>
                  </div>
                </div>

                {/* Subject Mastery Ratio */}
                <div className="mt-8 pt-6 border-t space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-emerald-700 dark:text-emerald-400">📐 Maths: {mathsRatio}%</span>
                    <span className="text-teal-700 dark:text-teal-400">🔬 Science: {100 - mathsRatio}%</span>
                  </div>
                  <Progress value={mathsRatio} className="h-2 bg-teal-500/30" />
                </div>

                {/* Encouragement Reactions received */}
                {profile.recentReactions && profile.recentReactions.length > 0 && (
                  <div className="mt-6 p-4 rounded-xl bg-muted/50 border flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                      Classmate Encouragements:
                    </span>
                    <div className="flex gap-3 text-xs font-bold">
                      <span>👏 {profile.recentReactions.find((r: any) => r.reactionType === "clap")?.count || 8}</span>
                      <span>🌳 {profile.recentReactions.find((r: any) => r.reactionType === "great_tree")?.count || 5}</span>
                      <span>⭐ {profile.recentReactions.find((r: any) => r.reactionType === "star")?.count || 3}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pinned Galti Dex Trophy Cards */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Pin className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>Pinned Misconception Trophies</span>
              </h3>

              {profile.pinnedCards && profile.pinnedCards.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile.pinnedCards.map((card: any) => (
                    <Card key={card.id} className="p-4 border-2 border-amber-500/30 bg-amber-500/5 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-[10px] uppercase font-bold">
                          {card.rarity} {card.subject}
                        </Badge>
                        <span className="text-[10px] text-amber-600 font-bold">📌 Pinned Trophy</span>
                      </div>
                      <h4 className="font-bold text-sm text-foreground">{card.misconceptionTitle}</h4>
                      <p className="text-xs text-muted-foreground italic">"{card.chhotaConfusionText}"</p>
                      <div className="text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 p-2 rounded-md">
                        {card.resolutionExplanation}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-6 text-center text-xs text-muted-foreground border-dashed">
                  No trophy cards pinned yet. Visit your Galti Dex to pin your proudest moments!
                </Card>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
