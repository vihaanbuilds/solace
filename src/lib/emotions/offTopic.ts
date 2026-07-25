const MATH_EXPRESSION = /\d+\s*[+\-*/]\s*\d+/;

const FACTUAL_QUESTION_STEMS = [
  /^what('|)s? is\b/i,
  /^what('|)s\b/i,
  /^who('|)s? is\b/i,
  /^who('|)s\b/i,
  /^when is\b/i,
  /^where is\b/i,
  /^how many\b/i,
  /^how much is\b/i,
  /^what year\b/i,
  /^what time\b/i,
  /^define\b/i,
  /^calculate\b/i,
  /^what('|)s the capital\b/i,
];

const HOMEWORK_PATTERNS = [
  /\bsolve\b/i,
  /\bhomework\b/i,
  /\bequation\b/i,
  /\balgebra\b/i,
  /\bmath problem\b/i,
  /\bmy essay\b/i,
  /\bwrite (an|a|my) (essay|paragraph|story|poem|paper)\b/i,
  /\bhow do (i|you) (solve|calculate)\b/i,
  /\bwhat('|)s the (sum|product|answer|square root)\b/i,
  /\bcan you (solve|calculate|do my)\b/i,
];

export function isOffTopicQuestion(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (MATH_EXPRESSION.test(trimmed)) return true;
  if (HOMEWORK_PATTERNS.some((pattern) => pattern.test(trimmed))) return true;
  return FACTUAL_QUESTION_STEMS.some((pattern) => pattern.test(trimmed));
}
