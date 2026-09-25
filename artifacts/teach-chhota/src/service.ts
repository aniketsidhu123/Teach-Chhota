export type Passage = { id: string; chapter: string; page: number; title: string; text: string; keywords: string[] };

export const passages: Passage[] = [
  { id: 'fractions', chapter: 'Fractions and Decimals', page: 42, title: 'What is a fraction?', text: 'A fraction shows equal parts of a whole. The top number tells how many parts we have. The bottom number tells how many equal parts make the whole.', keywords: ['fraction', 'numerator', 'denominator', 'parts', 'whole'] },
  { id: 'angles', chapter: 'Lines and Angles', page: 68, title: 'Angles around us', text: 'An angle is made when two lines meet at one point. We can measure an angle in degrees. A right angle is 90 degrees.', keywords: ['angle', 'line', 'degree', 'right angle', '90'] },
  { id: 'plants', chapter: 'Plants and Their Food', page: 31, title: 'How plants make food', text: 'Green leaves use sunlight, air and water to make food for the plant. This process is called photosynthesis.', keywords: ['plant', 'leaf', 'sunlight', 'food', 'photosynthesis'] },
  { id: 'water', chapter: 'Water and Its Forms', page: 19, title: 'Three forms of water', text: 'Water can be a solid called ice, a liquid we drink, or a gas called water vapour. Heat can change ice to water and water to vapour.', keywords: ['water', 'ice', 'gas', 'liquid', 'vapour', 'solid'] },
];

export const misconceptions = [
  { id: 'frac', chapter: 'Fractions and Decimals', belief: 'A bigger denominator means a bigger fraction.', prompt: 'I think 1/8 is bigger than 1/4 because 8 is bigger than 4.', keywords: ['small', 'part', 'denominator', 'whole', 'four', 'eight'] },
  { id: 'plant', chapter: 'Plants and Their Food', belief: 'Plants get all their food from the soil.', prompt: 'Plants eat food from the soil through their roots.', keywords: ['sunlight', 'leaves', 'make', 'food', 'soil', 'water'] },
  { id: 'angle', chapter: 'Lines and Angles', belief: 'A longer line makes a bigger angle.', prompt: 'This angle is bigger because one line is longer.', keywords: ['turn', 'meeting', 'degree', 'length', 'same'] },
];

export async function retrieveAnswer(question: string) {
  try {
    const res = await fetch('/api/rag/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: question })
    });
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    return {
      id: 'rag',
      chapter: data.chapter?.title || 'Knowledge Base',
      page: data.chapter?.classLevel || 0,
      title: "Chhota's Answer",
      text: data.answer,
      keywords: []
    };
  } catch (err) {
    console.error(err);
    // Fallback to local logic if offline or error
    const words = question.toLowerCase().split(/\W+/).filter(Boolean);
    const scored = passages.map((passage) => ({ passage, score: passage.keywords.reduce((n, word) => n + (words.includes(word) ? 1 : 0), 0) })).sort((a, b) => b.score - a.score);
    return scored[0]?.score ? scored[0].passage : null;
  }
}

export async function evaluateExplanation(text: string, item = misconceptions[0], attempt = 0) {
  try {
    const res = await fetch('/api/rag/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ explanation: text, misconception: item })
    });
    if (res.ok) {
      const aiData = await res.json();
      const score = aiData.score || 0;
      const outcome = score >= .65 ? (attempt > 1 ? 'Resolved with hint' : 'Resolved') : score >= .3 ? 'Partly understood' : 'Unresolved';
      return { 
        covered: aiData.covered || [], 
        missed: aiData.missed || [], 
        score, 
        outcome, 
        needsHint: score < .65 && attempt >= 2,
        feedback: aiData.feedback
      };
    }
  } catch (err) {
    console.error("AI Evaluation failed, using local fallback", err);
  }

  const lower = text.toLowerCase();
  const covered = item.keywords.filter((word) => lower.includes(word));
  const missed = item.keywords.filter((word) => !lower.includes(word));
  const score = covered.length / item.keywords.length;
  const outcome = score >= .65 ? (attempt > 1 ? 'Resolved with hint' : 'Resolved') : score >= .3 ? 'Partly understood' : 'Unresolved';
  return { covered, missed, score, outcome, needsHint: score < .65 && attempt >= 2, feedback: null };
}

export function speak(text: string, language = 'en-IN') {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    window.speechSynthesis.speak(utterance);
    return true;
  }
  return false;
}

export function transcribe(onText: (text: string) => void, onError: (message: string) => void, onEnd?: () => void) {
  const SpeechRecognition = (window as unknown as { SpeechRecognition?: new () => any; webkitSpeechRecognition?: new () => any }).SpeechRecognition
    || (window as unknown as { webkitSpeechRecognition?: new () => any }).webkitSpeechRecognition;
  if (!SpeechRecognition) { onError('Your phone could not hear that. You can type instead.'); return null; }
  const recognition = new SpeechRecognition();
  recognition.lang = 'en-IN';
  recognition.interimResults = true;
  recognition.onresult = (event: any) => onText(Array.from(event.results).map((result: any) => result[0].transcript).join(' '));
  recognition.onerror = () => onError("Chhota couldn't hear that. Try again.");
  recognition.onend = onEnd;
  try { recognition.start(); } catch { onError("Chhota couldn't hear that. Try again."); }
  return recognition;
}