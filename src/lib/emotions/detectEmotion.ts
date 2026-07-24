import { EMOTION_LEXICON, Emotion, NEGATION_WORDS, INTENSIFIERS, DAMPENERS } from './lexicon';

export interface EmotionScore {
  emotion: Emotion;
  score: number;
}

export interface DetectionResult {
  topEmotion: Emotion | null;
  scores: EmotionScore[];
  ambiguous: boolean;
}

const AMBIGUITY_THRESHOLD = 0.75;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stripPunctuation(word: string): string {
  return word.replace(/^[^\w']+|[^\w']+$/g, '');
}

function wordsBefore(normalized: string, index: number): string[] {
  const before = normalized.slice(0, index).trim();
  if (!before) return [];
  return before.split(/\s+/).map(stripPunctuation).filter(Boolean);
}

export function detectEmotion(text: string): DetectionResult {
  const normalized = text.toLowerCase();
  const emotions = Object.keys(EMOTION_LEXICON) as Emotion[];
  const scores: Record<Emotion, number> = Object.fromEntries(
    emotions.map((e) => [e, 0])
  ) as Record<Emotion, number>;

  for (const emotion of emotions) {
    for (const entry of EMOTION_LEXICON[emotion]) {
      const pattern = new RegExp(`\\b${escapeRegExp(entry.phrase)}\\b`, 'g');
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(normalized)) !== null) {
        let weight = entry.weight;
        const before = wordsBefore(normalized, match.index);
        const lastWord = before[before.length - 1];
        const lastTwo = before.slice(-2).join(' ');
        const lastThree = before.slice(-3);

        const negated = lastThree.some((w) => NEGATION_WORDS.includes(w));
        if (negated) weight *= -1;

        const intensifier = INTENSIFIERS[lastWord] ?? INTENSIFIERS[lastTwo];
        const dampener = DAMPENERS[lastWord] ?? DAMPENERS[lastTwo];
        if (intensifier) weight *= intensifier;
        else if (dampener) weight *= dampener;

        scores[emotion] += weight;

        if (match.index === pattern.lastIndex) pattern.lastIndex += 1;
      }
    }
  }

  const ranked: EmotionScore[] = emotions
    .map((emotion) => ({ emotion, score: scores[emotion] }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  if (ranked.length === 0) {
    return { topEmotion: null, scores: ranked, ambiguous: false };
  }

  const [top, second] = ranked;
  const ambiguous = !!second && top.score - second.score < AMBIGUITY_THRESHOLD;

  return {
    topEmotion: ambiguous ? null : top.emotion,
    scores: ranked,
    ambiguous,
  };
}
