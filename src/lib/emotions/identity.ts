import { escapeRegExp } from './regexUtil';

const IDENTITY_PHRASES = [
  'what are you',
  'who are you',
  'are you a bot',
  'are you a robot',
  'are you human',
  'are you a human',
  'are you real',
  'are you ai',
  'are you an ai',
  'are you a person',
];

const IDENTITY_PATTERNS = IDENTITY_PHRASES.map(
  (phrase) => new RegExp(`\\b${escapeRegExp(phrase)}\\b`, 'i')
);

export function isIdentityQuestion(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return false;
  return IDENTITY_PATTERNS.some((pattern) => pattern.test(normalized));
}
