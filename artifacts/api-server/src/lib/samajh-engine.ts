/**
 * Samajh Score computation engine.
 * Used by the server to compute authoritative scores from AI evaluation results.
 */

export interface EvaluationResult {
  correctness: number;     // 0-1
  clarity: number;         // 0-1
  analogy_use: number;     // 0-1
  misconception_fixed: boolean;
  retention_ok: boolean;
  style_trait: string | null;
}

export interface ScoreContext {
  priorSessionsOnConcept: number;
  daysSinceLastSession: number | null; // null if first session
  reviewInterval: number | null;       // null if first session
  isRevive: boolean;
}

export interface ScoreResult {
  samajhDelta: number;
  coinsEarned: number;
  baseQuality: number;
  retentionMultiplier: number;
  diminishingReturns: number;
}

const SCALE_FACTOR = 100;
const DAILY_COIN_CAP = 50;

// Review intervals in days following simplified SM-2
const REVIEW_INTERVALS = [1, 3, 7, 14, 30, 60];

export function getReviewInterval(sessionCount: number): number {
  const idx = Math.min(sessionCount, REVIEW_INTERVALS.length - 1);
  return REVIEW_INTERVALS[idx];
}

export function computeBaseQuality(eval_: EvaluationResult): number {
  return (
    eval_.correctness * 0.35 +
    (eval_.misconception_fixed ? 0.25 : 0.0) +
    eval_.clarity * 0.25 +
    eval_.analogy_use * 0.15
  );
}

export function computeRetentionMultiplier(ctx: ScoreContext): number {
  if (ctx.daysSinceLastSession === null || ctx.reviewInterval === null) {
    return 1.0; // first session
  }
  if (ctx.daysSinceLastSession >= ctx.reviewInterval) {
    // Revisited after the required gap
    return ctx.isRevive ? 1.5 : 1.5; // retention_ok is checked upstream
  }
  // Too soon (cramming)
  return 0.7;
}

export function computeRetentionMultiplierWithResult(ctx: ScoreContext, retentionOk: boolean): number {
  if (ctx.daysSinceLastSession === null || ctx.reviewInterval === null) {
    return 1.0; // first session
  }
  if (ctx.daysSinceLastSession >= ctx.reviewInterval) {
    return retentionOk ? 1.5 : 1.2;
  }
  return 0.7;
}

export function computeDiminishingReturns(priorSessions: number): number {
  return Math.max(0.15, 1.0 / (1 + 0.3 * priorSessions));
}

export function computeSamajhScore(eval_: EvaluationResult, ctx: ScoreContext): ScoreResult {
  const baseQuality = computeBaseQuality(eval_);
  const retentionMultiplier = computeRetentionMultiplierWithResult(ctx, eval_.retention_ok);
  const diminishingReturns = computeDiminishingReturns(ctx.priorSessionsOnConcept);

  const samajhDelta = baseQuality * retentionMultiplier * diminishingReturns * SCALE_FACTOR;

  // Coins: floor(delta/10), min 2 if quality ≥ 0.3, +3 bonus if quality ≥ 0.8
  let coinsEarned = 0;
  if (baseQuality >= 0.3) {
    coinsEarned = Math.max(2, Math.floor(samajhDelta / 10));
    if (baseQuality >= 0.8) {
      coinsEarned += 3;
    }
  }

  // Revive bonus
  if (ctx.isRevive && eval_.retention_ok) {
    coinsEarned += 5;
  }

  return {
    samajhDelta: Math.round(samajhDelta * 100) / 100,
    coinsEarned,
    baseQuality: Math.round(baseQuality * 1000) / 1000,
    retentionMultiplier,
    diminishingReturns: Math.round(diminishingReturns * 1000) / 1000,
  };
}

export function computeMasteryLevel(sessions: { aiScore: number; attemptNumber: number }[]): number {
  const TARGET_SCORE = 2.5;
  const attemptWeights = [1.0, 0.7, 0.4];
  const weightedSum = sessions.reduce((sum, s) => {
    const w = attemptWeights[Math.min(s.attemptNumber - 1, 2)];
    return sum + s.aiScore * w;
  }, 0);
  return Math.min(1.0, weightedSum / TARGET_SCORE);
}

// Avatar stage thresholds
export const AVATAR_THRESHOLDS = [0, 100, 350, 800, 1500, 3000, 5500, 9000];
export const AVATAR_NAMES = [
  { en: "Beej", hi: "बीज" },
  { en: "Ankur", hi: "अंकुर" },
  { en: "Chhota Chhatra", hi: "छोटा छात्र" },
  { en: "Jigyasu", hi: "जिज्ञासु" },
  { en: "Vichari", hi: "विचारी" },
  { en: "Vidwan", hi: "विद्वान" },
  { en: "Acharya", hi: "आचार्य" },
  { en: "Guru", hi: "गुरु" },
];

export function computeAvatarStage(totalSamajhScore: number): number {
  let stage = 0;
  for (let i = AVATAR_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalSamajhScore >= AVATAR_THRESHOLDS[i]) {
      stage = i;
      break;
    }
  }
  return stage;
}

// Wilt factor for Gyaan Vriksh
export function computeWiltFactor(nextReviewAt: string | null, reviewInterval: number): number {
  if (!nextReviewAt) return 0;
  const now = new Date();
  const reviewDate = new Date(nextReviewAt);
  const daysOverdue = (now.getTime() - reviewDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysOverdue <= 0) return 0;
  return Math.min(0.7, daysOverdue / (reviewInterval * 3));
}

// Teaching style detection
export function detectTeachingStyle(
  sessions: { aiStyleTrait: string | null }[]
): string | null {
  if (sessions.length < 10) return null;
  const last10 = sessions.slice(-10);
  const counts: Record<string, number> = {};
  for (const s of last10) {
    if (s.aiStyleTrait) {
      counts[s.aiStyleTrait] = (counts[s.aiStyleTrait] || 0) + 1;
    }
  }
  let dominant: string | null = null;
  let maxCount = 0;
  for (const [trait, count] of Object.entries(counts)) {
    if (count >= 4 && count > maxCount) {
      dominant = trait;
      maxCount = count;
    }
  }
  return dominant;
}
