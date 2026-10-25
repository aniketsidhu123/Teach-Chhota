import { randomUUID } from 'node:crypto';
import type { Client, Row } from '@libsql/client';
import { RoadmapError, type RoadmapInput, type RoadmapStep } from './roadmap-engine';

// Additive, idempotent migration: never resets existing learning data.
export async function migrateRoadmaps(client: Client) {
  await client.batch([
    `CREATE TABLE IF NOT EXISTS learning_roadmaps (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), goal TEXT NOT NULL,
      level TEXT NOT NULL, daily_minutes INTEGER NOT NULL, source TEXT NOT NULL,
      steps_json TEXT NOT NULL, completed_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
    'CREATE INDEX IF NOT EXISTS learning_roadmaps_user_idx ON learning_roadmaps(user_id, created_at)',
    `CREATE TABLE IF NOT EXISTS roadmap_generation_usage (
      user_id TEXT NOT NULL REFERENCES users(id), day TEXT NOT NULL, count INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY(user_id, day))`,
  ], 'write');
}
export function publicRoadmap(row: Row) {
  const steps = JSON.parse(String(row.steps_json)) as RoadmapStep[];
  const completed = Number(row.completed_count);
  return {
    id: String(row.id), goal: String(row.goal), level: String(row.level), dailyMinutes: Number(row.daily_minutes),
    source: String(row.source), completedCount: completed, totalSteps: steps.length,
    progress: Math.round(completed / steps.length * 100), xp: completed * 25,
    badge: completed === steps.length ? 'Trail complete' : completed > 0 ? 'First step taken' : null,
    nextStep: completed < steps.length ? completed : null,
    steps: steps.map((step, index) => ({
      title: step.title, minutes: step.minutes,
      status: index < completed ? 'complete' : index === completed ? 'current' : 'locked',
      ...(index <= completed ? { lesson: step.lesson, action: step.action, question: step.question, options: step.options } : {}),
      ...(index < completed ? { explanation: step.explanation } : {}),
    })),
  };
}
export function createRoadmapStore(client: Client) {
  return {
    async latest(userId: string) {
      const result = await client.execute({ sql: 'SELECT * FROM learning_roadmaps WHERE user_id=? ORDER BY created_at DESC, rowid DESC LIMIT 1', args: [userId] });
      return result.rows[0] ? publicRoadmap(result.rows[0]) : null;
    },
    async reserveGeneration(userId: string) {
      const day = new Date().toISOString().slice(0, 10);
      const result = await client.execute({ sql: `INSERT INTO roadmap_generation_usage(user_id,day,count) VALUES(?,?,1)
        ON CONFLICT(user_id,day) DO UPDATE SET count=count+1 WHERE count<5 RETURNING count`, args: [userId, day] });
      if (!result.rows.length) throw new RoadmapError(429, 'You have used today’s five roadmap requests. Continue your saved path and try a new goal tomorrow.');
    },
    async save(userId: string, input: RoadmapInput, steps: RoadmapStep[]) {
      const id = randomUUID();
      const now = new Date().toISOString();
      const result = await client.execute({ sql: `INSERT INTO learning_roadmaps
        (id,user_id,goal,level,daily_minutes,source,steps_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?) RETURNING *`,
        args: [id, userId, input.goal, input.level, input.dailyMinutes, input.demo ? 'demo' : 'ai', JSON.stringify(steps), now, now] });
      return publicRoadmap(result.rows[0]);
    },
    async complete(userId: string, id: string, index: number, choice: number) {
      // Serialize reads and writes: retries/concurrent clicks cannot mint extra coins.
      const tx = await client.transaction('write');
      try {
        const result = await tx.execute({ sql: 'SELECT * FROM learning_roadmaps WHERE id=? AND user_id=?', args: [id, userId] });
        const row = result.rows[0];
        if (!row) throw new RoadmapError(404, 'Roadmap not found.');
        const steps = JSON.parse(String(row.steps_json)) as RoadmapStep[];
        const completed = Number(row.completed_count);
        if (index < 0 || index >= steps.length) throw new RoadmapError(400, 'Invalid step.');
        if (index > completed) throw new RoadmapError(409, 'Complete your current step first.');
        if (index < completed) {
          await tx.commit();
          return { roadmap: publicRoadmap(row), correct: true, coinsEarned: 0, xpEarned: 0, feedback: 'This step is already saved. Your next step is ready.' };
        }
        if (choice !== steps[index].answerIndex) {
          await tx.commit();
          return { roadmap: publicRoadmap(row), correct: false, coinsEarned: 0, xpEarned: 0, feedback: 'Not quite yet. Reread the short lesson, try the action, then choose again. No points lost.' };
        }
        const userResult = await tx.execute({ sql: 'SELECT * FROM users WHERE id=?', args: [userId] });
        const user = userResult.rows[0];
        if (!user) throw new RoadmapError(404, 'Learner not found.');
        const now = new Date();
        // Use the same UTC date convention as existing gamification records.
        const day = now.toISOString().slice(0, 10);
        const yesterday = new Date(now.getTime() - 86400000).toISOString().slice(0, 10);
        const parsed: unknown = JSON.parse(String(user.weekly_ring_days || '[]'));
        const days = Array.isArray(parsed) ? parsed.filter((d): d is string => typeof d === 'string') : [];
        const streak = days.includes(day) ? Math.max(1, Number(user.streak_current)) : days.includes(yesterday) ? Number(user.streak_current) + 1 : 1;
        const ring = [...new Set([...days, day])].filter(d => d >= new Date(now.getTime() - 6 * 86400000).toISOString().slice(0, 10)).sort();
        await tx.execute({ sql: `UPDATE users SET gyaan_coins=gyaan_coins+10, streak_current=?, streak_best=MAX(streak_best,?), weekly_ring_days=?, updated_at=? WHERE id=?`, args: [streak, streak, JSON.stringify(ring), now.toISOString(), userId] });
        await tx.execute({ sql: 'UPDATE learning_roadmaps SET completed_count=completed_count+1, updated_at=? WHERE id=?', args: [now.toISOString(), id] });
        await tx.commit();
        return { roadmap: publicRoadmap({ ...row, completed_count: completed + 1 }), correct: true, coinsEarned: 10, xpEarned: 25, streakCurrent: streak, feedback: steps[index].explanation };
      } catch (error) {
        await tx.rollback();
        throw error;
      } finally { tx.close(); }
    },
  };
}
