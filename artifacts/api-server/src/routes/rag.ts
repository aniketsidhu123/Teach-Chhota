import { Router, type Request, type Response } from "express";
import { db, chaptersTable, chapterChunksTable } from "@workspace/db";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { eq, and } from "drizzle-orm";

const router = Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Helper function to calculate cosine similarity
function cosineSimilarity(a: number[], b: number[]) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

router.post("/rag/query", async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, classLevel, subject } = req.body;

    if (!query) {
      res.status(400).json({ error: "Query is required" });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
      return;
    }

    // 1. Get embedding for the query
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const result = await model.embedContent(query);
    const queryEmbedding = result.embedding.values;

    // 2. Fetch chunks from DB (filtering by classLevel and subject if provided)
    // For a real production app, we would use pgvector. For testing/demo, we do it in memory.
    const chapters = await db.select().from(chaptersTable);
    const chunks = await db.select().from(chapterChunksTable);

    // Map chapters for easy lookup
    const chapterMap = new Map(chapters.map((c: any) => [c.id, c]));

    // Filter chunks and calculate similarity
    const scoredChunks = chunks
      .map((chunk: any) => {
        const chapter = chapterMap.get(chunk.chapterId);
        // Apply filters
        if (classLevel && chapter?.classLevel !== classLevel) return null;
        if (subject && chapter?.subject.toLowerCase() !== subject.toLowerCase()) return null;

        const embedding = typeof chunk.embedding === "string" ? JSON.parse(chunk.embedding) : chunk.embedding;
        const similarity = cosineSimilarity(queryEmbedding, embedding as number[]);
        
        return {
          chunk,
          chapter,
          similarity
        };
      })
      .filter((item: any) => item !== null)
      .sort((a: any, b: any) => b.similarity - a.similarity)
      .slice(0, 5); // Get top 5 matches

    if (scoredChunks.length === 0) {
      res.json({ answer: "I couldn't find any relevant information in the foundation chapters for this query.", sources: [] });
      return;
    }

    // 3. Construct prompt
    const contextText = scoredChunks.map((c: any) => `Chapter: ${c.chapter?.title} (Class ${c.chapter?.classLevel} ${c.chapter?.subject})\nContent: ${c.chunk.chunkText}`).join("\n\n");
    
    const prompt = `You are a helpful teaching assistant for school students.
Use the following pieces of retrieved context to answer the student's question. 
If the answer is not in the context, just say that you don't know based on the provided material, but you can provide a general answer if helpful.

Context:
${contextText}

Question:
${query}

Answer:`;

    // 4. Generate answer with model fallback
    const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
    let answerText = "";
    let generated = false;

    for (const modelName of modelsToTry) {
      try {
        const chatModel = genAI.getGenerativeModel({ model: modelName });
        const response = await chatModel.generateContent(prompt);
        answerText = response.response.text();
        generated = true;
        console.log(`RAG: Successfully used model ${modelName}`);
        break;
      } catch (modelError: any) {
        console.warn(`RAG: Model ${modelName} failed (${modelError?.status || "unknown"}), trying next...`);
      }
    }

    // If all models failed, return the raw context as the answer
    if (!generated) {
      answerText = `Based on your NCERT textbook:\n\n${contextText}`;
    }
    
    res.json({
      answer: answerText,
      sources: scoredChunks.map((c: any) => ({
        chapter: c.chapter?.title,
        classLevel: c.chapter?.classLevel,
        subject: c.chapter?.subject,
        similarity: c.similarity
      }))
    });
  } catch (error) {
    console.error("RAG Error:", error);
    res.status(500).json({ error: "An error occurred during RAG generation." });
  }
});

// GET /rag/chapters – list all chapters, optionally filtered by classLevel / subject
router.get("/rag/chapters", async (req: Request, res: Response): Promise<void> => {
  try {
    const classLevel = req.query.classLevel ? Number(req.query.classLevel) : undefined;
    const subject = req.query.subject ? String(req.query.subject) : undefined;

    let rows = await db.select().from(chaptersTable);

    if (classLevel) rows = rows.filter((r: any) => r.classLevel === classLevel);
    if (subject)    rows = rows.filter((r: any) => r.subject.toLowerCase() === subject.toLowerCase());

    // Sort by classLevel then title
    rows.sort((a: any, b: any) => a.classLevel - b.classLevel || a.title.localeCompare(b.title));

    res.json({ chapters: rows });
  } catch (error) {
    console.error("Chapters list error:", error);
    res.status(500).json({ error: "Failed to fetch chapters." });
  }
});

// POST /rag/evaluate - Evaluate a student's teaching attempt
router.post("/rag/evaluate", async (req: Request, res: Response): Promise<void> => {
  try {
    const { explanation, misconception } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
      return;
    }

    const prompt = `You are a friendly, encouraging AI student named Chhota. A human student is trying to teach you and correct your misconception.
My misconception: "${misconception.belief}"
Student's explanation: "${explanation}"

Evaluate if the student successfully explained the concept and corrected my misconception.
Respond with JSON exactly in this format:
{
  "score": (a number between 0 and 1, where 1.0 is perfectly explained and 0.0 means completely missed the point),
  "feedback": (Your encouraging response to the student, pretending to be Chhota. E.g., "Oh, I get it now! You mean that..."),
  "covered": ["list", "of", "key", "concepts", "they", "mentioned"],
  "missed": ["list", "of", "concepts", "they", "missed"]
}`;

    const chatModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const response = await chatModel.generateContent(prompt);
    let text = response.response.text();
    text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    res.json(JSON.parse(text));
  } catch (error) {
    console.error("Evaluation Error:", error);
    res.status(500).json({ error: "Evaluation failed." });
  }
});

export default router;
