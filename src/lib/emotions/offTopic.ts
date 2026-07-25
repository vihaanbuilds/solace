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

export function isOffTopicQuestion(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (MATH_EXPRESSION.test(trimmed)) return true;
  return FACTUAL_QUESTION_STEMS.some((pattern) => pattern.test(trimmed));
}
