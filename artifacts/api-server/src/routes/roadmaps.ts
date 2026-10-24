import { Router } from 'express';
import { client } from '@workspace/db';
import { authMiddleware } from '../middlewares/auth';
import { generateRoadmap, parseInput, RoadmapError } from '../lib/roadmap-engine';
import { createRoadmapStore, migrateRoadmaps } from '../lib/roadmap-store';

const router = Router();
const store = createRoadmapStore(client);
const generating = new Set<string>();
let ready: Promise<void> | undefined;
router.use('/roadmaps', authMiddleware, async (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    ready ??= migrateRoadmaps(client).catch(error => { ready = undefined; throw error; });
    await ready;
    const user = await client.execute({ sql: 'SELECT class_level FROM users WHERE id=?', args: [req.user!.userId] });
    if (!user.rows.length) { res.status(404).json({ error: 'Learner not found.' }); return; }
    res.locals.classLevel = Number(user.rows[0].class_level);
    next();
  } catch { res.status(503).json({ error: 'Learning storage is unavailable. Please try again.' }); }
});
router.get('/roadmaps/current', async (req, res) => {
  try { res.json({ roadmap: await store.latest(req.user!.userId) }); }
  catch { res.status(503).json({ error: 'Could not load your path. Please retry.' }); }
});
router.post('/roadmaps', async (req, res) => {
  const userId = req.user!.userId;
  if (generating.has(userId)) { res.status(409).json({ error: 'Your roadmap is already being created.' }); return; }
  generating.add(userId);
  try {
    const input = parseInput(req.body);
    if (!input.demo && !process.env.GEMINI_API_KEY) throw new RoadmapError(503, 'AI roadmaps are not configured yet. Try the fractions demo.');
    await store.reserveGeneration(userId);
    const steps = await generateRoadmap(input, res.locals.classLevel);
    res.status(201).json({ roadmap: await store.save(userId, input, steps) });
  } catch (error) {
    res.status(error instanceof RoadmapError ? error.status : 500).json({ error: error instanceof RoadmapError ? error.message : 'Could not save your roadmap. Please retry.' });
  } finally { generating.delete(userId); }
});
router.post('/roadmaps/:id/steps/:step/complete', async (req, res) => {
  try {
    const step = Number(req.params.step);
    const choice = req.body?.choice;
    if (!Number.isInteger(step) || step < 0 || !Number.isInteger(choice) || choice < 0 || choice > 2) throw new RoadmapError(400, 'Select one of the three answers.');
    res.json(await store.complete(req.user!.userId, String(req.params.id), step, choice));
  } catch (error) {
    res.status(error instanceof RoadmapError ? error.status : 500).json({ error: error instanceof RoadmapError ? error.message : 'Could not save this step. Please retry; rewards will not be duplicated.' });
  }
});
export default router;
