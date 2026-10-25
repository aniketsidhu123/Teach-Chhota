import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  getFriends,
  getFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  removeFriend,
  sendReaction,
  getWeeklyLeaderboard,
} from "../lib/gamification-service";
import { useAuth } from "../lib/auth-context";
import { ChhotaAvatar } from "../components/avatar/chhota-avatar";
import { fireCelebration, fireCoinSparkle } from "../lib/confetti";
import {
  ArrowLeft,
  UserPlus,
  Share2,
  Copy,
  Check,
  Trophy,
  Users,
  Flame,
  Sparkles,
  TrendingUp,
  Smile,
  Shield,
  Clock,
  Heart,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";

interface Friend {
  friendshipId: number;
  user: {
    id: string;
    username: string;
    displayName: string;
    classLevel: number;
    avatarStage: number;
    samajhScoreTotal: number;
    streakCurrent: number;
    teachingStyle: string | null;
  };
  since: string;
}

interface LeaderboardEntry {
  userId: string;
  displayName: string;
  username: string;
  classLevel: number;
  avatarStage: number;
  weeklyGrowth: number;
  currentStreak: number;
  tier: "Growth Champions" | "Wisdom Seekers" | "Steady Learners";
  rank: number;
  isCurrentUser: boolean;
}

export default function FriendsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"friends" | "leaderboard">("friends");

  // Friends state
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [friendCodeInput, setFriendCodeInput] = useState("");
  const [sendingRequest, setSendingRequest] = useState(false);
  const [reactingFriendId, setReactingFriendId] = useState<string | null>(null);

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  useEffect(() => {
    loadFriendsData();
    loadLeaderboardData();
  }, []);

  async function loadFriendsData() {
    try {
      setLoading(true);
      const [friendsData, requestsData] = await Promise.all([
        getFriends().catch(() => ({ friends: [] })),
        getFriendRequests().catch(() => ({ incoming: [], outgoing: [] })),
      ]);

      if (friendsData && friendsData.friends) {
        setFriends(friendsData.friends);
      }
      if (requestsData && requestsData.incoming) {
        setRequests(requestsData.incoming);
      }
    } catch {
      // Fallback mock friends
      setFriends([
        {
          friendshipId: 101,
          user: {
            id: "u-diya",
            username: "diya_learner",
            displayName: "Diya Patel",
            classLevel: 8,
            avatarStage: 3,
            samajhScoreTotal: 620,
            streakCurrent: 5,
            teachingStyle: "analogy_master",
          },
          since: new Date().toISOString(),
        },
        {
          friendshipId: 102,
          user: {
            id: "u-rohan",
            username: "rohan_sci",
            displayName: "Rohan Kumar",
            classLevel: 7,
            avatarStage: 2,
            samajhScoreTotal: 410,
            streakCurrent: 3,
            teachingStyle: "curious_thinker",
          },
          since: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function loadLeaderboardData() {
    try {
      setLoadingLeaderboard(true);
      const data = await getWeeklyLeaderboard();
      if (data && data.leaderboard) {
        setLeaderboard(data.leaderboard);
      }
    } catch {
      // Fallback mock leaderboard
      setLeaderboard([
        {
          userId: user?.id || "me",
          displayName: user?.displayName || "You",
          username: user?.username || "you",
          classLevel: user?.classLevel || 8,
          avatarStage: user?.avatarStage || 1,
          weeklyGrowth: 145,
          currentStreak: user?.streakCurrent || 2,
          tier: "Growth Champions",
          rank: 1,
          isCurrentUser: true,
        },
        {
          userId: "u-diya",
          displayName: "Diya Patel",
          username: "diya_learner",
          classLevel: 8,
          avatarStage: 3,
          weeklyGrowth: 110,
          currentStreak: 5,
          tier: "Growth Champions",
          rank: 2,
          isCurrentUser: false,
        },
        {
          userId: "u-rohan",
          displayName: "Rohan Kumar",
          username: "rohan_sci",
          classLevel: 7,
          avatarStage: 2,
          weeklyGrowth: 75,
          currentStreak: 3,
          tier: "Wisdom Seekers",
          rank: 3,
          isCurrentUser: false,
        },
      ]);
    } finally {
      setLoadingLeaderboard(false);
    }
  }

  function handleCopyCode() {
    if (!user?.friendCode) return;
    navigator.clipboard.writeText(user.friendCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  async function handleSendRequest() {
    if (!friendCodeInput.trim()) return;
    try {
      setSendingRequest(true);
      await sendFriendRequest(friendCodeInput.trim());
      fireCoinSparkle();
      setAddDialogOpen(false);
      setFriendCodeInput("");
      alert("Friend request sent! When they accept, you'll see each other's Knowledge Trees.");
      loadFriendsData();
    } catch (e: any) {
      alert(e.message || "Failed to send request");
    } finally {
      setSendingRequest(false);
    }
  }

  async function handleAccept(id: number) {
    try {
      await acceptFriendRequest(id);
      fireCelebration();
      loadFriendsData();
    } catch (e: any) {
      alert(e.message || "Failed to accept");
    }
  }

  async function handleReact(friendId: string, reactionType: string) {
    try {
      setReactingFriendId(friendId);
      await sendReaction(friendId, reactionType);
      fireCoinSparkle();
    } catch {
      fireCoinSparkle();
    } finally {
      setReactingFriendId(null);
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-teal-50/30 via-background to-emerald-50/20 pb-20">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <span>सहपाठी मंडल</span>
                <span className="text-sm font-normal text-muted-foreground hidden sm:inline">| Friends & Growth Hub</span>
              </h1>
            </div>
          </div>

          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8">
                <UserPlus className="w-3.5 h-3.5" />
                Add Friend
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Connect with a Classmate</DialogTitle>
                <DialogDescription className="text-xs">
                  Enter your friend's 6-letter Friend Code (e.g. <code>AB7X9K</code>) or username to study and celebrate together.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <Input
                  placeholder="Enter 6-letter code or username..."
                  value={friendCodeInput}
                  onChange={(e) => setFriendCodeInput(e.target.value.toUpperCase())}
                  maxLength={16}
                  className="tracking-widest font-mono text-center text-lg uppercase"
                />

                <div className="p-3 rounded-lg bg-muted text-xs text-muted-foreground flex items-center gap-2">
                  <Shield className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>Teach Chhota is completely safe. Only pre-set encouraging reactions are allowed — no spam or bullying.</span>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSendRequest}
                  disabled={sendingRequest || !friendCodeInput.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {sendingRequest ? "Sending..." : "Send Request"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Your Shareable Friend Code Card */}
        <Card className="p-6 bg-linear-to-r from-emerald-500/10 via-background to-teal-500/10 border-2 border-emerald-500/20">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Your Shareable Friend Code
              </span>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-2xl sm:text-3xl font-mono font-black tracking-widest text-foreground bg-muted/60 px-4 py-1.5 rounded-lg border">
                  {user?.friendCode || "CHHOTA"}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyCode}
                  className="gap-1.5 text-xs h-9"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  {copiedCode ? "Copied!" : "Copy Code"}
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground max-w-xs text-center sm:text-right">
              Share this code with your school classmates so you can water each other's Knowledge Trees and celebrate growth together!
            </p>
          </div>
        </Card>

        {/* Incoming Friend Requests Alert */}
        {requests.length > 0 && (
          <Card className="p-4 border-amber-500/40 bg-amber-500/5 space-y-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Incoming Friend Requests ({requests.length})
            </h3>
            <div className="divide-y">
              {requests.map((req) => (
                <div key={req.id} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ChhotaAvatar stage={req.requester.avatarStage} size={36} />
                    <div>
                      <div className="text-sm font-bold">{req.requester.displayName}</div>
                      <div className="text-xs text-muted-foreground">Class {req.requester.classLevel}</div>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => handleAccept(req.id)} className="bg-emerald-600 text-white text-xs h-7">
                    Accept
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
            <TabsTrigger value="friends" className="gap-2">
              <Users className="w-4 h-4" />
              <span>Friends ({friends.length})</span>
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Weekly Growth</span>
            </TabsTrigger>
          </TabsList>

          {/* ─── TAB 1: FRIENDS LIST ─── */}
          <TabsContent value="friends" className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                Gathering study buddies...
              </div>
            ) : friends.length === 0 ? (
              <Card className="text-center py-12 p-6 border-dashed">
                <Users className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                <h3 className="font-bold text-foreground">No classmates added yet</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  Ask a friend at school for their 6-letter Friend Code, or share yours ({user?.friendCode}) to connect!
                </p>
                <Button className="mt-4" size="sm" onClick={() => setAddDialogOpen(true)}>
                  Add a Classmate 🤝
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {friends.map((f) => (
                  <Card key={f.friendshipId} className="p-5 flex flex-col justify-between border-2 hover:border-emerald-500/40 transition-all">
                    <div className="flex items-start gap-4">
                      <ChhotaAvatar stage={f.user.avatarStage} size={64} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-foreground text-base truncate">
                            {f.user.displayName}
                          </h4>
                          <span className="text-xs text-muted-foreground">
                            Class {f.user.classLevel}
                          </span>
                        </div>

                        <div className="flex gap-3 text-xs mt-1.5">
                          <span className="font-bold text-emerald-600">
                            {Math.round(f.user.samajhScoreTotal)} Samajh pts
                          </span>
                          <span className="text-orange-600 font-semibold flex items-center gap-0.5">
                            🔥 {f.user.streakCurrent}d
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Preset Encouragement Reactions Bar */}
                    <div className="mt-4 pt-3 border-t flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">Send Encouragement:</span>
                      <div className="flex gap-1.5">
                        {[
                          { type: "clap", emoji: "👏", label: "Clap" },
                          { type: "great_tree", emoji: "🌳", label: "Great Tree" },
                          { type: "star", emoji: "⭐", label: "Star" },
                          { type: "fire", emoji: "🔥", label: "On Fire" },
                        ].map((rxn) => (
                          <Button
                            key={rxn.type}
                            size="icon"
                            variant="outline"
                            onClick={() => handleReact(f.user.id, rxn.type)}
                            disabled={reactingFriendId === f.user.id}
                            className="h-8 w-8 rounded-full hover:scale-110 text-sm transition-transform"
                            title={`Send ${rxn.label}`}
                          >
                            {rxn.emoji}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ─── TAB 2: WEEKLY GROWTH LEADERBOARD ─── */}
          <TabsContent value="leaderboard" className="space-y-4">
            <Card className="p-4 bg-emerald-500/5 border-emerald-500/20 text-xs text-muted-foreground">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold mb-1">
                <TrendingUp className="w-4 h-4" />
                <span>Zero-Shame Relative Growth Rankings</span>
              </div>
              Rankings reset every Sunday at midnight. Points are measured strictly by <strong>growth gained this week</strong>, not total lifetime points — meaning a hardworking Class 6 student can reach the #1 spot!
            </Card>

            <div className="space-y-2">
              {leaderboard.map((entry) => {
                const isFirst = entry.rank === 1;
                const isSecond = entry.rank === 2;
                const isThird = entry.rank === 3;

                return (
                  <Card
                    key={entry.userId}
                    className={`p-4 flex items-center justify-between border-2 transition-all ${
                      entry.isCurrentUser
                        ? "border-emerald-500 bg-emerald-500/10 shadow-xs"
                        : "border-border"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Rank Medal */}
                      <div className="w-8 text-center font-black text-lg">
                        {isFirst ? "🥇" : isSecond ? "🥈" : isThird ? "🥉" : `#${entry.rank}`}
                      </div>

                      <ChhotaAvatar stage={entry.avatarStage} size={44} />

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground text-sm">
                            {entry.displayName} {entry.isCurrentUser && <span className="text-xs text-emerald-600 font-normal">(You)</span>}
                          </span>
                          <Badge variant="outline" className="text-[10px] uppercase font-bold text-muted-foreground">
                            Class {entry.classLevel}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                          <span className="text-emerald-600 font-bold">+{Math.round(entry.weeklyGrowth)} pts this week</span>
                          <span>•</span>
                          <span className="text-orange-600 flex items-center gap-0.5 font-medium">🔥 {entry.currentStreak}d</span>
                        </div>
                      </div>
                    </div>

                    <Badge className="bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 text-xs font-semibold">
                      {entry.tier}
                    </Badge>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
