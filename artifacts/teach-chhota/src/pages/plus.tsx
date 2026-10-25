import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "../lib/auth-context";
import { getSubscriptionStatus, createSubscriptionOrder, verifySubscriptionOrder } from "../lib/gamification-service";
import { fireCelebration } from "../lib/confetti";
import { ArrowLeft, Check, Sparkles, Star, Zap, DownloadCloud, ShieldCheck, HelpCircle, HeartHandshake } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";

export default function PlusPage() {
  const { user, refreshUser } = useAuth();
  const [subStatus, setSubStatus] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  useEffect(() => {
    loadSubStatus();
  }, []);

  async function loadSubStatus() {
    try {
      setLoading(true);
      const data = await getSubscriptionStatus();
      setSubStatus(data);
    } catch {
      setSubStatus({
        tier: user?.subscriptionTier || "free",
        isPlus: user?.subscriptionTier === "plus",
        features: {
          offlinePackDownload: false,
          unlimitedHints: false,
          exclusiveCosmetics: false,
          parentWeeklyDigest: false,
        },
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubscribe(plan: "monthly" | "yearly") {
    try {
      setProcessingPlan(plan);
      // 1. Create order
      const orderData = await createSubscriptionOrder(plan);
      // 2. Demo verification
      const verifyRes = await verifySubscriptionOrder(orderData.orderId, `pay_${Date.now()}`);
      if (verifyRes.success) {
        fireCelebration();
        await refreshUser();
        await loadSubStatus();
        alert("🎉 Dhanyawaad! Teach Chhota Plus is now active on your account!");
      }
    } catch (e: any) {
      alert(e.message || "Failed to process subscription");
    } finally {
      setProcessingPlan(null);
    }
  }

  const isPlus = user?.subscriptionTier === "plus" || subStatus?.isPlus;

  return (
    <div className="min-h-screen bg-linear-to-b from-amber-50/40 via-background to-orange-50/20 pb-20">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <span>टीच छोटा प्लस</span>
                <span className="text-sm font-normal text-muted-foreground hidden sm:inline">| Teach Chhota Plus</span>
              </h1>
            </div>
          </div>

          {isPlus ? (
            <Badge className="bg-amber-500 text-amber-950 font-black text-xs gap-1.5 px-3 py-1">
              <Star className="w-3.5 h-3.5 fill-current" /> Active Plus Member
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">Free Tier</span>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Hero Banner */}
        <div className="text-center space-y-3">
          <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 text-xs px-3 py-1">
            ⭐ Empowering Bharat's Inquisitive Minds
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
            Supercharge Your Learning by Teaching
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Offline NCERT chapters for train & village commutes, unlimited AI mentor hints, and legendary cosmic avatar skins for Chhota.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Monthly Plan */}
          <Card className="border-2 border-border p-6 flex flex-col justify-between hover:border-amber-400 transition-all">
            <div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Monthly Pass</div>
              <div className="text-3xl font-black text-foreground mt-2">
                ₹199 <span className="text-sm font-normal text-muted-foreground">/ month</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Ideal for term exams and focused concept mastery.
              </p>

              <ul className="mt-6 space-y-2.5 text-xs text-foreground">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Full Offline NCERT pack for your class</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Unlimited AI Hint Tutor during teach sessions</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Access to Plus cosmetic shop items</span>
                </li>
              </ul>
            </div>

            <Button
              className="mt-6 w-full font-bold text-xs"
              variant={isPlus ? "outline" : "default"}
              disabled={isPlus || processingPlan === "monthly"}
              onClick={() => handleSubscribe("monthly")}
            >
              {isPlus ? "Currently Active" : processingPlan === "monthly" ? "Processing..." : "Select Monthly (₹199)"}
            </Button>
          </Card>

          {/* Yearly Plan (Best Value) */}
          <Card className="border-2 border-amber-500 bg-amber-500/5 p-6 flex flex-col justify-between relative shadow-md">
            <div className="absolute -top-3 right-6 bg-linear-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-xs">
              Save 37% • Best for School Year
            </div>

            <div>
              <div className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                Annual School Pass
              </div>
              <div className="text-3xl font-black text-foreground mt-2">
                ₹1,499 <span className="text-sm font-normal text-muted-foreground">/ year</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Just ₹125/month. Complete peace of mind for the whole academic session.
              </p>

              <ul className="mt-6 space-y-2.5 text-xs text-foreground">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Everything in Monthly Pass</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Legendary Golden Aura skin for Chhota</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Weekly Parent WhatsApp Samajh Report</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Exclusive Banyan Tree theme</span>
                </li>
              </ul>
            </div>

            <Button
              className="mt-6 w-full font-bold text-xs bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm"
              disabled={isPlus || processingPlan === "yearly"}
              onClick={() => handleSubscribe("yearly")}
            >
              {isPlus ? "Currently Active" : processingPlan === "yearly" ? "Processing..." : "Select Annual (₹1,499)"}
            </Button>
          </Card>
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t text-center">
          <div className="p-4 rounded-xl bg-card border space-y-1">
            <DownloadCloud className="w-6 h-6 text-emerald-600 mx-auto" />
            <h4 className="font-bold text-xs text-foreground">Zero Internet Worry</h4>
            <p className="text-[11px] text-muted-foreground">Chapters and sessions sync automatically when connected.</p>
          </div>

          <div className="p-4 rounded-xl bg-card border space-y-1">
            <ShieldCheck className="w-6 h-6 text-sky-600 mx-auto" />
            <h4 className="font-bold text-xs text-foreground">Kid Safe & Ad-Free</h4>
            <p className="text-[11px] text-muted-foreground">No third party ads, no dark patterns, no open chat with strangers.</p>
          </div>

          <div className="p-4 rounded-xl bg-card border space-y-1">
            <HeartHandshake className="w-6 h-6 text-amber-600 mx-auto" />
            <h4 className="font-bold text-xs text-foreground">NCERT Aligned</h4>
            <p className="text-[11px] text-muted-foreground">Strictly mapped to CBSE & State Board Maths & Science curricula.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
