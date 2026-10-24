import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { demoSteps, parseInput, validateSteps, generateRoadmap } from '../src/lib/roadmap-engine';

// An isolated memory database: never load .env or touch the learner database.
const liveKey = process.env.ROADMAP_TEST_AI === '1' ? process.env.GEMINI_API_KEY : undefined;
process.env.LOG_LEVEL = 'silent';
process.env.DATABASE_URL = 'file::memory:';
process.env.JWT_SECRET = 'roadmap-tests-only';
delete process.env.GEMINI_API_KEY;
const { client } = await import('@workspace/db');
await client.execute(`CREATE TABLE users (
  id TEXT PRIMARY KEY, class_level INTEGER DEFAULT 8, gyaan_coins INTEGER DEFAULT 0,
  streak_current INTEGER DEFAULT 0, streak_best INTEGER DEFAULT 0,
  weekly_ring_days TEXT DEFAULT '[]', updated_at TEXT)`);
await client.execute("INSERT INTO users(id) VALUES ('learner-a'), ('learner-b')");
const { signToken } = await import('../src/lib/auth');
const { default: app } = await import('../src/app');
const server = app.listen(0, '127.0.0.1');
await new Promise<void>(resolve => server.once('listening', resolve));
const address = server.address();
if (!address || typeof address === 'string') throw new Error('No test address');
const base = `http://127.0.0.1:${address.port}/api/roadmaps`;
const token = signToken({ userId: 'learner-a', username: 'test' });
const otherToken = signToken({ userId: 'learner-b', username: 'other' });
async function request(path: string, body?: unknown, auth: string | null = token) {
  const response = await fetch(base + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: `Bearer ${auth}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: response.status, cache: response.headers.get('cache-control'), data: await response.json() };
}
after(async () => {
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  client.close();
});

test('validates learner input, time budget, AI shape and answers', () => {
  assert.throws(() => parseInput({ goal: 'a', dailyMinutes: 10 }));
  assert.throws(() => parseInput({ goal: 'Python', dailyMinutes: 500 }));
  assert.throws(() => parseInput({ goal: 'Python', level: 'anything' }));
  assert.throws(() => parseInput({ demo: 'true' }));
  assert.equal(validateSteps({ steps: demoSteps }, 5).length, 5);
  assert.throws(() => validateSteps({ steps: demoSteps.slice(1) }, 5));
  assert.throws(() => validateSteps({ steps: demoSteps.map(s => ({ ...s, answerIndex: 7 })) }, 5));
  assert.throws(() => validateSteps({ steps: demoSteps.map(s => ({ ...s, options: ['a', 'a', 'b'] })) }, 5));
});
test('AI absence is explicit; prepared demo remains available', async () => {
  await assert.rejects(generateRoadmap(parseInput({ goal: 'Learn Python' }), 8), /not configured/);
  assert.equal((await generateRoadmap(parseInput({ demo: true }), 8)).length, 5);
});
test('HTTP workflow: ownership, unlocks, wrong answers, persistence, rewards and quota', async () => {
  assert.equal((await request('/current', undefined, null)).status, 401);
  assert.equal((await request('/current')).data.roadmap, null);
  assert.equal((await request('', { goal: 'x' })).status, 400);
  assert.equal((await request('', { goal: 'Learn Python' })).status, 503);
  const created = await request('', { demo: true });
  assert.equal(created.status, 201);
  assert.equal(created.cache, 'no-store');
  const id = created.data.roadmap.id;
  assert.equal(created.data.roadmap.source, 'demo');
  assert.equal(created.data.roadmap.steps[0].answerIndex, undefined);
  assert.equal(created.data.roadmap.steps[1].lesson, undefined);
  assert.equal((await request(`/${id}/steps/0/complete`, { choice: 0 }, otherToken)).status, 404);
  assert.equal((await request('/current', undefined, otherToken)).data.roadmap, null);
  assert.equal((await request(`/${id}/steps/2/complete`, { choice: 2 })).status, 409);
  assert.equal((await request(`/${id}/steps/0/complete`, { choice: '0' })).status, 400);
  const wrong = await request(`/${id}/steps/0/complete`, { choice: 1 });
  assert.equal(wrong.data.correct, false);
  assert.equal(wrong.data.roadmap.progress, 0);
  const won = await request(`/${id}/steps/0/complete`, { choice: 0 });
  assert.equal(won.data.coinsEarned, 10);
  assert.equal(won.data.roadmap.nextStep, 1);
  assert.equal(won.data.roadmap.progress, 20);
  assert.equal((await request(`/${id}/steps/0/complete`, { choice: 0 })).data.coinsEarned, 0);
  assert.equal((await request('/current')).data.roadmap.completedCount, 1);
  // A write failure must roll back both progression and currency.
  await client.execute("CREATE TRIGGER fail_reward BEFORE UPDATE ON users BEGIN SELECT RAISE(ABORT, 'test rollback'); END");
  assert.equal((await request(`/${id}/steps/1/complete`, { choice: 1 })).status, 500);
  assert.equal((await request('/current')).data.roadmap.completedCount, 1);
  await client.execute('DROP TRIGGER fail_reward');
  // Competing requests must never award twice (busy transactions can be retried).
  const concurrent = await Promise.all([request(`/${id}/steps/1/complete`, { choice: 1 }), request(`/${id}/steps/1/complete`, { choice: 1 })]);
  assert.equal(concurrent.reduce((n, r) => n + (r.data.coinsEarned || 0), 0), 10);
  assert.equal((await request(`/${id}/steps/1/complete`, { choice: 1 })).data.coinsEarned, 0);
  for (let step = 2; step < 5; step++) {
    assert.equal((await request(`/${id}/steps/${step}/complete`, { choice: demoSteps[step].answerIndex })).status, 200);
  }
  const complete = (await request('/current')).data.roadmap;
  assert.equal(complete.progress, 100);
  assert.equal(complete.xp, 125);
  assert.equal(complete.nextStep, null);
  assert.equal(complete.badge, 'Trail complete');
  const user = (await client.execute("SELECT * FROM users WHERE id='learner-a'")).rows[0];
  assert.equal(user.gyaan_coins, 50);
  assert.equal(user.streak_current, 1);
  for (let n = 0; n < 4; n++) assert.equal((await request('', { demo: true })).status, 201);
  assert.equal((await request('', { demo: true })).status, 429);
});

test('configured Gemini generates a valid personalized roadmap', { skip: !liveKey }, async () => {
  process.env.GEMINI_API_KEY = liveKey;
  try {
    const steps = await generateRoadmap(parseInput({ goal: 'Learn Python variables', level: 'beginner', dailyMinutes: 5 }), 8);
    assert.equal(steps.length, 5);
    assert.ok(steps.every(step => step.minutes <= 5));
  } finally { delete process.env.GEMINI_API_KEY; }
});
