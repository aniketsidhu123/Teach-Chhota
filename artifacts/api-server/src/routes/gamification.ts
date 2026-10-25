import { Router, type Request, type Response } from "express";
import { db, usersTable, teachingSessionsTable, conceptMasteryTable, galtiDexCardsTable, chaptersTable, chapterChunksTable } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { authMiddleware } from "../middlewares/auth";
import {
  computeSamajhScore,
  computeAvatarStage,
  computeMasteryLevel,
  getReviewInterval,
  computeWiltFactor,
  detectTeachingStyle,
  AVATAR_THRESHOLDS,
  AVATAR_NAMES,
  type EvaluationResult,
  type ScoreContext,
} from "../lib/samajh-engine";

const router = Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// POST /gamification/teaching-session — Submit and score a teaching session
router.post("/gamification/teaching-session", authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { explanation, misconception, conceptKey, chapterId, sessionType, attemptNumber } = req.body;

    if (!explanation || !conceptKey) {
      res.status(400).json({ error: "explanation and conceptKey are required" });
      return;
    }

    const type = sessionType || "misconception";
    const attempt = attemptNumber || 1;

    // 1. Evaluate with Gemini (structured JSON output)
    let evalResult: EvaluationResult = {
      correctness: 0,
      clarity: 0,
      analogy_use: 0,
      misconception_fixed: false,
      retention_ok: false,
      style_trait: null,
    };

    try {
      const prompt = `You are evaluating a student's teaching explanation. The student is trying to teach a concept by correcting a misconception.

${misconception ? `Misconception to correct: "${misconception.belief || misconception}"` : `Concept being taught: "${conceptKey}"`}
Student's explanation: "${explanation}"

Evaluate the quality of the explanation and respond with ONLY a JSON object (no markdown, no code fences):
{
  "correctness": (0.0-1.0, how factually correct is the explanation),
  "clarity": (0.0-1.0, how clear and logical is the explanation),
  "analogy_use": (0.0-1.0, did they use examples, analogies, or real-life connections like cricket, chai, trains, rangoli),
  "misconception_fixed": (true/false, did they correctly identify and fix the misconception),
  "retention_ok": (true/false, does the student demonstrate solid understanding),
  "style_trait": ("analogy_master" | "step_by_step" | "real_life" | "visual_thinker" | "storyteller" | null)
}`;

      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const response = await model.generateContent(prompt);
      let text = response.response.text();
      text = text.replace(/```json/gi, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(text);

      evalResult = {
        correctness: Math.max(0, Math.min(1, Number(parsed.correctness) || 0)),
        clarity: Math.max(0, Math.min(1, Number(parsed.clarity) || 0)),
        analogy_use: Math.max(0, Math.min(1, Number(parsed.analogy_use) || 0)),
        misconception_fixed: Boolean(parsed.misconception_fixed),
        retention_ok: Boolean(parsed.retention_ok),
        style_trait: parsed.style_trait || null,
      };
    } catch (aiError) {
      console.warn("AI evaluation failed, using fallback scoring:", aiError);
      // Fallback: basic keyword matching
      const lower = explanation.toLowerCase();
      const hasKeywords = lower.length > 30;
      evalResult.correctness = hasKeywords ? 0.5 : 0.2;
      evalResult.clarity = hasKeywords ? 0.4 : 0.2;
      evalResult.analogy_use = lower.includes("example") || lower.includes("like") ? 0.5 : 0.1;
      evalResult.misconception_fixed = hasKeywords;
      evalResult.retention_ok = hasKeywords;
    }

    // 2. Get prior sessions on this concept for score computation
    const priorSessions = await db.select().from(teachingSessionsTable)
      .where(and(
        eq(teachingSessionsTable.userId, userId),
        eq(teachingSessionsTable.conceptKey, conceptKey)
      ))
      .orderBy(desc(teachingSessionsTable.createdAt));

    // 3. Get existing concept mastery for retention context
    const existingMastery = await db.select().from(conceptMasteryTable)
      .where(and(
        eq(conceptMasteryTable.userId, userId),
        eq(conceptMasteryTable.conceptKey, conceptKey)
      ));

    const mastery = existingMastery[0] || null;
    let daysSinceLastSession: number | null = null;
    let reviewInterval: number | null = null;

    if (mastery?.lastSessionAt) {
      const lastDate = new Date(mastery.lastSessionAt);
      daysSinceLastSession = (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
      reviewInterval = getReviewInterval(mastery.sessionCount);
    }

    const scoreCtx: ScoreContext = {
      priorSessionsOnConcept: priorSessions.length,
      daysSinceLastSession,
      reviewInterval,
      isRevive: type === "revive",
    };

    // 4. Compute Samajh Score
    const scoreResult = computeSamajhScore(evalResult, scoreCtx);
    const now = new Date().toISOString();

    // 5. Determine subject from chapter or fallback
    let subject = "Maths";
    if (chapterId) {
      const chapters = await db.select().from(chaptersTable).where(eq(chaptersTable.id, chapterId));
      if (chapters[0]) subject = chapters[0].subject;
    }

    // 6. Save teaching session
    await db.insert(teachingSessionsTable).values({
      userId,
      chapterId: chapterId || null,
      conceptKey,
      misconceptionId: misconception?.id || null,
      explanationText: explanation,
      aiScore: (evalResult.correctness + evalResult.clarity) / 2,
      aiCorrectness: evalResult.correctness,
      aiClarity: evalResult.clarity,
      aiAnalogyUse: evalResult.analogy_use,
      aiMisconceptionFixed: evalResult.misconception_fixed ? 1 : 0,
      aiStyleTrait: evalResult.style_trait,
      samajhDelta: scoreResult.samajhDelta,
      coinsEarned: scoreResult.coinsEarned,
      attemptNumber: attempt,
      sessionType: type,
      createdAt: now,
    });

    // 7. Update or create concept mastery
    const nextReviewInterval = getReviewInterval((mastery?.sessionCount || 0) + 1);
    const nextReviewDate = new Date(Date.now() + nextReviewInterval * 24 * 60 * 60 * 1000).toISOString();
    const allSessionsForMastery = [
      ...priorSessions.map(s => ({ aiScore: s.aiScore, attemptNumber: s.attemptNumber })),
      { aiScore: (evalResult.correctness + evalResult.clarity) / 2, attemptNumber: attempt },
    ];
    const newMasteryLevel = computeMasteryLevel(allSessionsForMastery);

    if (mastery) {
      await db.update(conceptMasteryTable)
        .set({
          masteryLevel: Math.max(mastery.masteryLevel, newMasteryLevel),
          samajhScore: mastery.samajhScore + scoreResult.samajhDelta,
          sessionCount: mastery.sessionCount + 1,
          lastSessionAt: now,
          nextReviewAt: nextReviewDate,
          decayApplied: 0, // reset decay on new session
        })
        .where(eq(conceptMasteryTable.id, mastery.id));
    } else {
      await db.insert(conceptMasteryTable).values({
        userId,
        conceptKey,
        subject,
        chapterId: chapterId || null,
        masteryLevel: newMasteryLevel,
        samajhScore: scoreResult.samajhDelta,
        sessionCount: 1,
        lastSessionAt: now,
        nextReviewAt: nextReviewDate,
      });
    }

    // 8. Update user aggregate scores
    const user = (await db.select().from(usersTable).where(eq(usersTable.id, userId)))[0];
    if (user) {
      const newTotal = user.samajhScoreTotal + scoreResult.samajhDelta;
      const newMaths = subject === "Maths" ? user.samajhScoreMaths + scoreResult.samajhDelta : user.samajhScoreMaths;
      const newScience = subject === "Science" ? user.samajhScoreScience + scoreResult.samajhDelta : user.samajhScoreScience;
      const newCoins = Math.min(user.gyaanCoins + scoreResult.coinsEarned, user.gyaanCoins + 50); // daily cap handled here simply
      const newStage = computeAvatarStage(newTotal);
      const leveledUp = newStage > user.avatarStage;

      // Update weekly ring days
      const today = new Date().toISOString().split("T")[0];
      let ringDays: string[] = [];
      try { ringDays = JSON.parse(user.weeklyRingDays); } catch { ringDays = []; }
      if (!ringDays.includes(today)) ringDays.push(today);

      // Detect teaching style
      const recentSessions = await db.select().from(teachingSessionsTable)
        .where(eq(teachingSessionsTable.userId, userId))
        .orderBy(desc(teachingSessionsTable.createdAt))
        .limit(10);
      const teachingStyle = detectTeachingStyle(recentSessions) || user.teachingStyle;

      await db.update(usersTable)
        .set({
          samajhScoreTotal: newTotal,
          samajhScoreMaths: newMaths,
          samajhScoreScience: newScience,
          gyaanCoins: newCoins,
          avatarStage: newStage,
          teachingStyle,
          weeklyRingDays: JSON.stringify(ringDays),
          updatedAt: now,
        })
        .where(eq(usersTable.id, userId));

      // 9. Create Galti Dex card if misconception was fixed
      if (evalResult.misconception_fixed && misconception) {
        const existingCard = await db.select().from(galtiDexCardsTable)
          .where(and(
            eq(galtiDexCardsTable.userId, userId),
            eq(galtiDexCardsTable.misconceptionId, misconception.id || conceptKey)
          ));

        if (existingCard.length === 0) {
          await db.insert(galtiDexCardsTable).values({
            userId,
            misconceptionId: misconception.id || conceptKey,
            conceptKey,
            wrongBelief: misconception.belief || misconception.prompt || "Unknown misconception",
            studentCorrection: explanation.slice(0, 500),
            rarity: "uncommon", // default until aggregated stats are available
            earnedAt: now,
          });
        }
      }

      res.json({
        evaluation: evalResult,
        score: scoreResult,
        masteryLevel: newMasteryLevel,
        avatarStage: newStage,
        leveledUp,
        levelName: leveledUp ? AVATAR_NAMES[newStage] : null,
        coinsTotal: newCoins,
        feedback: evalResult.misconception_fixed
          ? "Chhota gets it now! Great teaching!"
          : "Good start — try adding one more detail.",
      });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Teaching session error:", error);
    res.status(500).json({ error: "Failed to process teaching session" });
  }
});

// GET /gamification/state — Full gamification state for current user
router.get("/gamification/state", authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const user = (await db.select().from(usersTable).where(eq(usersTable.id, userId)))[0];
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    const mastery = await db.select().from(conceptMasteryTable)
      .where(eq(conceptMasteryTable.userId, userId));

    const galtiDex = await db.select().from(galtiDexCardsTable)
      .where(eq(galtiDexCardsTable.userId, userId));

    const sessionCount = await db.select({ count: sql<number>`count(*)` })
      .from(teachingSessionsTable)
      .where(eq(teachingSessionsTable.userId, userId));

    // Compute tree state with wilt factors
    const treeState = mastery.map(m => {
      const reviewInterval = getReviewInterval(m.sessionCount);
      const wiltFactor = computeWiltFactor(m.nextReviewAt, reviewInterval);
      return {
        ...m,
        wiltFactor,
        reviewInterval,
        status: m.masteryLevel >= 0.8 ? "mastered" :
                m.masteryLevel >= 0.5 ? "resolved" :
                m.masteryLevel >= 0.2 ? "partly" : "unresolved",
      };
    });

    res.json({
      user: {
        id: user.id,
        displayName: user.displayName,
        username: user.username,
        classLevel: user.classLevel,
        friendCode: user.friendCode,
        avatarStage: user.avatarStage,
        avatarName: AVATAR_NAMES[user.avatarStage],
        samajhScoreTotal: user.samajhScoreTotal,
        samajhScoreMaths: user.samajhScoreMaths,
        samajhScoreScience: user.samajhScoreScience,
        gyaanCoins: user.gyaanCoins,
        teachingStyle: user.teachingStyle,
        streakCurrent: user.streakCurrent,
        streakBest: user.streakBest,
        weeklyRingDays: JSON.parse(user.weeklyRingDays || "[]"),
        profileTheme: user.profileTheme,
        subscriptionTier: user.subscriptionTier,
      },
      nextStageThreshold: AVATAR_THRESHOLDS[Math.min(user.avatarStage + 1, 7)],
      tree: treeState,
      galtiDex,
      totalSessions: sessionCount[0]?.count || 0,
    });
  } catch (error) {
    console.error("Gamification state error:", error);
    res.status(500).json({ error: "Failed to fetch gamification state" });
  }
});

// GET /gamification/concept-mastery — All concept mastery entries
router.get("/gamification/concept-mastery", authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const mastery = await db.select().from(conceptMasteryTable)
      .where(eq(conceptMasteryTable.userId, userId));

    const withWilt = mastery.map(m => ({
      ...m,
      wiltFactor: computeWiltFactor(m.nextReviewAt, getReviewInterval(m.sessionCount)),
    }));

    res.json({ mastery: withWilt });
  } catch (error) {
    console.error("Concept mastery error:", error);
    res.status(500).json({ error: "Failed to fetch concept mastery" });
  }
});

// POST /gamification/revive-concept — Start a revive session for a wilted concept
router.post("/gamification/revive-concept", authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { conceptKey } = req.body;

    if (!conceptKey) {
      res.status(400).json({ error: "conceptKey is required" });
      return;
    }

    const mastery = await db.select().from(conceptMasteryTable)
      .where(and(
        eq(conceptMasteryTable.userId, userId),
        eq(conceptMasteryTable.conceptKey, conceptKey)
      ));

    if (mastery.length === 0) {
      res.status(404).json({ error: "Concept not found in your mastery" });
      return;
    }

    const m = mastery[0];
    const wiltFactor = computeWiltFactor(m.nextReviewAt, getReviewInterval(m.sessionCount));

    if (wiltFactor <= 0) {
      res.status(400).json({ error: "This concept is not wilting" });
      return;
    }

    // Return the concept info so the frontend can start a revive teaching session
    res.json({
      concept: m,
      wiltFactor,
      message: "Start a teaching session with sessionType='revive' to revive this concept.",
    });
  } catch (error) {
    console.error("Revive concept error:", error);
    res.status(500).json({ error: "Failed to initiate revive" });
  }
});

export default router;
