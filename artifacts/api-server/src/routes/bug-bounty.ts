import { Router, type Request, type Response } from "express";
import { db, bugBountyChallengesTable, usersTable, chaptersTable, chapterChunksTable, galtiDexCardsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { authMiddleware } from "../middlewares/auth";

const router = Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// GET /bug-bounty/daily — Get today's challenge
router.get("/bug-bounty/daily", authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const today = new Date().toISOString().split("T")[0];

    // Check if already have today's challenge
    const existing = await db.select().from(bugBountyChallengesTable)
      .where(and(
        eq(bugBountyChallengesTable.userId, userId),
        eq(bugBountyChallengesTable.date, today)
      ));

    if (existing.length > 0) {
      res.json({
        challenge: existing[0],
        isCompleted: existing[0].isCompleted === 1,
      });
      return;
    }

    // Generate a new challenge
    const user = (await db.select().from(usersTable).where(eq(usersTable.id, userId)))[0];
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    // Pick a random chapter from user's class level
    const chapters = await db.select().from(chaptersTable);
    const levelChapters = chapters.filter(c => c.classLevel === user.classLevel);
    if (levelChapters.length === 0) {
      res.status(404).json({ error: "No chapters found for your class level" });
      return;
    }

    const randomChapter = levelChapters[Math.floor(Math.random() * levelChapters.length)];

    // Get a chunk for context
    const chunks = await db.select().from(chapterChunksTable)
      .where(eq(chapterChunksTable.chapterId, randomChapter.id))
      .limit(2);

    const contextText = chunks.map(c => c.chunkText).join("\n") || randomChapter.content;

    let misconceptionText = "";
    let correctAnswer = "";

    try {
      const prompt = `Generate one common misconception a Class ${user.classLevel} student might have about "${randomChapter.title}" (${randomChapter.subject}).

The misconception should be:
- Plausible and based on real student errors
- Grounded in this NCERT content: ${contextText.slice(0, 500)}
- Something a student would believably say

Respond with ONLY a JSON object (no markdown, no code fences):
{
  "misconception": "The wrong belief stated as Chhota would say it, e.g. 'I think plants get food from soil because roots are in soil'",
  "correct_answer": "A brief correct explanation"
}`;

      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const response = await model.generateContent(prompt);
      let text = response.response.text();
      text = text.replace(/```json/gi, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(text);
      misconceptionText = parsed.misconception;
      correctAnswer = parsed.correct_answer;
    } catch {
      // Fallback misconception
      misconceptionText = `I think ${randomChapter.title.toLowerCase()} is just memorizing facts without understanding why.`;
      correctAnswer = `Understanding ${randomChapter.title.toLowerCase()} requires connecting concepts, not just memorizing.`;
    }

    const now = new Date().toISOString();
    await db.insert(bugBountyChallengesTable).values({
      userId,
      date: today,
      misconceptionText,
      correctAnswer,
      chapterId: randomChapter.id,
      createdAt: now,
    });

    const challenge = (await db.select().from(bugBountyChallengesTable)
      .where(and(
        eq(bugBountyChallengesTable.userId, userId),
        eq(bugBountyChallengesTable.date, today)
      )))[0];

    res.json({
      challenge: {
        ...challenge,
        correctAnswer: undefined, // Don't reveal the answer yet
      },
      chapter: { title: randomChapter.title, subject: randomChapter.subject, classLevel: randomChapter.classLevel },
      isCompleted: false,
    });
  } catch (error) {
    console.error("Bug bounty daily error:", error);
    res.status(500).json({ error: "Failed to get daily challenge" });
  }
});

// POST /bug-bounty/submit — Submit answer to daily challenge
router.post("/bug-bounty/submit", authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { challengeId, explanation } = req.body;

    if (!challengeId || !explanation) {
      res.status(400).json({ error: "challengeId and explanation are required" });
      return;
    }

    const challenges = await db.select().from(bugBountyChallengesTable)
      .where(and(
        eq(bugBountyChallengesTable.id, challengeId),
        eq(bugBountyChallengesTable.userId, userId)
      ));

    if (challenges.length === 0) {
      res.status(404).json({ error: "Challenge not found" });
      return;
    }

    const challenge = challenges[0];
    if (challenge.isCompleted) {
      res.status(400).json({ error: "Challenge already completed" });
      return;
    }

    // Evaluate with Gemini
    let score = 0;
    let feedback = "";

    try {
      const prompt = `A student is trying to identify and correct this misconception:
Misconception: "${challenge.misconceptionText}"
Correct answer: "${challenge.correctAnswer}"
Student's explanation: "${explanation}"

Rate how well the student identified and corrected the misconception.
Respond with ONLY a JSON object (no markdown):
{
  "score": (0.0-1.0),
  "feedback": "Encouraging feedback for the student"
}`;

      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const response = await model.generateContent(prompt);
      let text = response.response.text();
      text = text.replace(/```json/gi, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(text);
      score = Math.max(0, Math.min(1, Number(parsed.score) || 0));
      feedback = parsed.feedback || "";
    } catch {
      // Fallback scoring
      score = explanation.length > 30 ? 0.6 : 0.3;
      feedback = "Good attempt! Keep practicing.";
    }

    const success = score >= 0.5;
    let coinsEarned = 0;

    if (success) {
      coinsEarned = 8;
      await db.update(bugBountyChallengesTable)
        .set({ isCompleted: 1 })
        .where(eq(bugBountyChallengesTable.id, challengeId));

      // Award coins
      const user = (await db.select().from(usersTable).where(eq(usersTable.id, userId)))[0];
      if (user) {
        await db.update(usersTable)
          .set({
            gyaanCoins: user.gyaanCoins + coinsEarned,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(usersTable.id, userId));

        // Add Galti Dex card
        const existingCard = await db.select().from(galtiDexCardsTable)
          .where(and(
            eq(galtiDexCardsTable.userId, userId),
            eq(galtiDexCardsTable.wrongBelief, challenge.misconceptionText)
          ));

        if (existingCard.length === 0) {
          await db.insert(galtiDexCardsTable).values({
            userId,
            misconceptionId: `bounty-${challengeId}`,
            conceptKey: `bounty-${challenge.chapterId}`,
            wrongBelief: challenge.misconceptionText,
            studentCorrection: explanation.slice(0, 500),
            rarity: "uncommon",
            earnedAt: new Date().toISOString(),
          });
        }
      }
    } else {
      coinsEarned = score >= 0.3 ? 3 : 0;
      if (coinsEarned > 0) {
        const user = (await db.select().from(usersTable).where(eq(usersTable.id, userId)))[0];
        if (user) {
          await db.update(usersTable)
            .set({
              gyaanCoins: user.gyaanCoins + coinsEarned,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(usersTable.id, userId));
        }
      }
    }

    res.json({
      success,
      score,
      feedback,
      coinsEarned,
      correctAnswer: challenge.correctAnswer,
    });
  } catch (error) {
    console.error("Bug bounty submit error:", error);
    res.status(500).json({ error: "Failed to submit answer" });
  }
});

// GET /galti-dex — All collected misconception cards
router.get("/galti-dex", authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const cards = await db.select().from(galtiDexCardsTable)
      .where(eq(galtiDexCardsTable.userId, userId));

    res.json({ cards });
  } catch (error) {
    console.error("Galti dex error:", error);
    res.status(500).json({ error: "Failed to fetch Galti Dex" });
  }
});

// PATCH /galti-dex/:id/pin — Pin or unpin a card
router.patch("/galti-dex/:id/pin", authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const cardId = parseInt(String(req.params.id));
    const { pinned } = req.body;

    const cards = await db.select().from(galtiDexCardsTable)
      .where(and(
        eq(galtiDexCardsTable.id, cardId),
        eq(galtiDexCardsTable.userId, userId)
      ));

    if (cards.length === 0) {
      res.status(404).json({ error: "Card not found" });
      return;
    }

    // Max 3 pinned cards
    if (pinned) {
      const pinnedCount = await db.select().from(galtiDexCardsTable)
        .where(and(
          eq(galtiDexCardsTable.userId, userId),
          eq(galtiDexCardsTable.isPinned, 1)
        ));

      if (pinnedCount.length >= 3) {
        res.status(400).json({ error: "Maximum 3 pinned cards allowed" });
        return;
      }
    }

    await db.update(galtiDexCardsTable)
      .set({ isPinned: pinned ? 1 : 0 })
      .where(eq(galtiDexCardsTable.id, cardId));

    res.json({ message: pinned ? "Card pinned" : "Card unpinned" });
  } catch (error) {
    console.error("Pin card error:", error);
    res.status(500).json({ error: "Failed to pin/unpin card" });
  }
});

export default router;
