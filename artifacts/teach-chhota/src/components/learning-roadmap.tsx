import { useEffect, useState, type FormEvent } from 'react';
import { Check, Flame, Lock, Trophy } from 'lucide-react';
import { useAuth } from '../lib/auth-context';

interface Step {
  title: string; minutes: number; status: 'complete' | 'current' | 'locked';
  lesson?: string; action?: string; question?: string; options?: string[]; explanation?: string;
}
interface Roadmap {
  id: string; goal: string; source: 'ai' | 'demo'; completedCount: number; totalSteps: number;
  progress: number; xp: number; badge: string | null; nextStep: number | null; steps: Step[];
}
interface Result {
  roadmap: Roadmap | null; correct?: boolean; coinsEarned?: number; xpEarned?: number; feedback?: string;
}
const button = 'min-h-11 rounded-xl bg-primary px-5 py-2 font-semibold text-primary-foreground disabled:opacity-50';
const input = 'mt-2 min-h-11 w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground';

export default function LearningRoadmap() {
  const { token, user, isLoading, refreshUser } = useAuth();
  return <section aria-labelledby="roadmap-heading" className="mt-8 rounded-3xl border border-border bg-card p-5 sm:p-7">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-sm font-semibold text-primary">One goal. One next step.</p><h2 id="roadmap-heading" className="font-serif text-2xl">Your learning trail</h2></div>
      <span className="flex items-center gap-1 text-sm text-muted-foreground"><Flame size={16} /> {user?.streakCurrent ?? 0} day streak</span>
    </div>
    {isLoading ? <p role="status">Getting your learner account ready…</p> : token
      ? <RoadmapPanel key={token} token={token} refreshUser={refreshUser} />
      : <p role="status">Connect to the server and reload to save a learning trail.</p>}
  </section>;
}

function RoadmapPanel({ token, refreshUser }: { token: string; refreshUser: () => Promise<void> }) {
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [goal, setGoal] = useState('');
  const [level, setLevel] = useState('beginner');
  const [minutes, setMinutes] = useState(10);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [choice, setChoice] = useState<number | null>(null);
  const [changeGoal, setChangeGoal] = useState(false);
  const [retry, setRetry] = useState(0);

  async function request(path: string, body?: unknown, signal?: AbortSignal): Promise<Result> {
    const res = await fetch(`/api/roadmaps${path}`, {
      method: body === undefined ? 'GET' : 'POST', cache: 'no-store', signal,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Please try again.');
    return data;
  }
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setLoadFailed(false);
    request('/current', undefined, controller.signal)
      .then(data => { if (!controller.signal.aborted) setRoadmap(data.roadmap); })
      .catch(() => { if (!controller.signal.aborted) { setError('Could not load your saved trail. Check your connection and retry.'); setLoadFailed(true); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [token, retry]);

  async function create(demo = false) {
    setBusy(true); setError(''); setFeedback('');
    try {
      const data = await request('', { goal, level, dailyMinutes: minutes, demo });
      setRoadmap(data.roadmap); setChoice(null); setChangeGoal(false);
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not create a trail.'); }
    finally { setBusy(false); }
  }
  async function complete(event: FormEvent) {
    event.preventDefault();
    if (!roadmap || roadmap.nextStep === null || choice === null || busy) return;
    setBusy(true); setError('');
    try {
      const data = await request(`/${roadmap.id}/steps/${roadmap.nextStep}/complete`, { choice });
      setRoadmap(data.roadmap);
      setFeedback(`${data.feedback}${data.coinsEarned ? ` +${data.xpEarned} trail XP · +${data.coinsEarned} Gyaan coins!` : ''}`);
      if (data.correct) { setChoice(null); await refreshUser(); }
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not save. Please retry.'); }
    finally { setBusy(false); }
  }
  if (loading) return <p role="status" className="text-sm text-muted-foreground">Loading your next step…</p>;
  if (loadFailed) return <div><p role="alert">{error}</p><button className={`${button} mt-3`} onClick={() => setRetry(n => n + 1)}>Retry loading</button></div>;
  const current = roadmap && roadmap.nextStep !== null ? roadmap.steps[roadmap.nextStep] : undefined;
  return <div aria-busy={busy}>
    {error && <p role="alert" className="mb-4 rounded-xl border border-destructive/40 p-3 text-sm">{error}</p>}
    <div role="status" aria-live="polite">{feedback && <p className="mb-4 rounded-xl bg-primary/10 p-4 text-sm">{feedback}</p>}</div>
    {!roadmap || changeGoal ? <form onSubmit={event => { event.preventDefault(); void create(); }} className="space-y-4">
      <label className="block text-sm font-semibold">What would you like to learn?<input className={input} value={goal} onChange={event => setGoal(event.target.value)} minLength={3} maxLength={160} required placeholder="e.g. Learn Python basics" disabled={busy} /></label>
      <div className="flex flex-wrap gap-2">{['Understand fractions', 'Learn Python basics', 'Speak confidently'].map(example => <button type="button" key={example} disabled={busy} onClick={() => setGoal(example)} className="rounded-full border border-border px-3 py-2 text-xs hover:bg-muted">{example}</button>)}</div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold">Your starting point<select className={input} value={level} onChange={event => setLevel(event.target.value)} disabled={busy}><option value="beginner">I’m starting fresh</option><option value="some-experience">I know a little</option><option value="confident">I want to go further</option></select></label>
        <label className="text-sm font-semibold">Time each day<select className={input} value={minutes} onChange={event => setMinutes(Number(event.target.value))} disabled={busy}>{[5, 10, 15, 20].map(n => <option key={n} value={n}>{n} minutes</option>)}</select></label>
      </div>
      {changeGoal && <p className="text-sm text-muted-foreground">Your new trail will become the current path. Coins already earned stay yours.</p>}
      <div className="flex flex-wrap items-center gap-3"><button className={button} disabled={busy}>{busy ? 'Building your trail…' : 'Make my AI roadmap'}</button><button type="button" disabled={busy} onClick={() => void create(true)} className="min-h-11 rounded-xl border border-border px-4 text-sm font-semibold">Try the 60-second fractions demo</button>{roadmap && <button type="button" disabled={busy} onClick={() => setChangeGoal(false)} className="min-h-11 px-3 text-sm underline">Keep my current path</button>}</div>
      <p className="text-xs text-muted-foreground">Demo uses a prepared lesson. Custom goals use AI and need an internet connection.</p>
    </form> : <>
      <div className="flex flex-wrap justify-between gap-3"><div><h3 className="text-lg font-bold">{roadmap.goal}</h3><p className="mt-1 text-sm text-muted-foreground">{roadmap.source === 'demo' ? 'Prepared demo' : 'AI-generated path'} · {roadmap.completedCount}/{roadmap.totalSteps} steps · {roadmap.xp} trail XP</p></div><button disabled={busy} className="text-sm font-semibold underline" onClick={() => { setChangeGoal(true); setFeedback(''); }}>Change goal</button></div>
      <progress className="my-4 h-3 w-full accent-primary" value={roadmap.progress} max={100} aria-label="Trail completion" />
      <ol className="mb-5 grid gap-2 sm:grid-cols-5">{roadmap.steps.map((step, index) => <li key={index} aria-current={step.status === 'current' ? 'step' : undefined} className={`rounded-xl border p-3 text-sm ${step.status === 'current' ? 'border-primary bg-primary/10' : 'border-border'}`}><span className="mb-1 flex items-center gap-2 font-semibold">{step.status === 'complete' ? <Check size={14} /> : step.status === 'locked' ? <Lock size={14} /> : <span aria-hidden="true">→</span>}Step {index + 1}</span>{step.title}<span className="mt-1 block text-xs text-muted-foreground">{step.status === 'current' ? 'Up next · ' : step.status === 'complete' ? 'Done · ' : 'Later · '}{step.minutes} min</span></li>)}</ol>
      {current ? <form key={`${roadmap.id}-${roadmap.nextStep}`} onSubmit={complete} className="rounded-2xl bg-muted/40 p-4 sm:p-5">
        <h4 className="text-lg font-bold">Start here: {current.title}</h4><p className="mt-3 whitespace-pre-line text-sm leading-7">{current.lesson}</p>
        <p className="my-4 rounded-xl bg-card p-3 text-sm"><strong>Your action: </strong>{current.action}</p>
        <fieldset disabled={busy}><legend className="mb-2 font-semibold">{current.question}</legend><div className="space-y-2">{current.options?.map((option, index) => <label key={index} className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm ${choice === index ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}><input type="radio" name="roadmap-answer" checked={choice === index} onChange={() => setChoice(index)} value={index} />{option}</label>)}</div></fieldset>
        <button disabled={busy || choice === null} className={`${button} mt-4`}>{busy ? 'Saving your progress…' : 'Check answer & unlock next step'}</button><p className="mt-2 text-xs text-muted-foreground">Earn 25 trail XP + 10 Gyaan coins once per step. Mistakes cost nothing.</p>
      </form> : <div className="rounded-2xl bg-primary/10 p-5"><Trophy className="mb-2 text-primary" /><h4 className="text-lg font-bold">Trail complete!</h4><p className="mt-2 text-sm">Five small wins. Explain what you learned to someone, then pick your next goal.</p><button className={`${button} mt-4`} onClick={() => setChangeGoal(true)}>Choose my next goal</button></div>}
      {roadmap.badge && <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-primary"><Trophy size={16} />{roadmap.badge}</p>}
      {roadmap.completedCount > 0 && <details className="mt-4 text-sm"><summary className="cursor-pointer font-semibold">Revisit completed lessons</summary>{roadmap.steps.filter(s => s.status === 'complete').map((step, index) => <article key={index} className="mt-3 border-t border-border pt-3"><h4 className="font-bold">{step.title}</h4><p className="mt-2 leading-6">{step.lesson}</p><p className="mt-2 text-muted-foreground">{step.explanation}</p></article>)}</details>}
    </>}
  </div>;
}
