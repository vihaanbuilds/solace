const CRISIS_PHRASES = [
  'want to die',
  'kill myself',
  'end my life',
  'end it all',
  "don't want to be here anymore",
  'no reason to live',
  'better off dead',
  'suicide',
  'hurting myself',
  'harm myself',
  'self harm',
  'self-harm',
];

export function isCrisis(text: string): boolean {
  const normalized = text.toLowerCase();
  return CRISIS_PHRASES.some((phrase) => normalized.includes(phrase));
}
