import { escapeRegExp } from './regexUtil';

const GREETING_PHRASES = [
  'hi',
  'hello',
  'hey',
  'hiya',
  'yo',
  'sup',
  "what's up",
  'whats up',
  'howdy',
  'good morning',
  'good afternoon',
  'good evening',
  'hey there',
  'hi there',
  'how are you',
  "how's it going",
  'hows it going',
  'how are you doing',
];

const GREETING_PATTERNS = GREETING_PHRASES.map(
  (phrase) => new RegExp(`\\b${escapeRegExp(phrase)}\\b`, 'i')
);

export function isGreeting(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return false;
  return GREETING_PATTERNS.some((pattern) => pattern.test(normalized));
}
