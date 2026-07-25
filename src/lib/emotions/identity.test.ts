import { describe, it, expect } from 'vitest';
import { isIdentityQuestion } from './identity';

describe('isIdentityQuestion', () => {
  it('recognizes "what are you"', () => {
    expect(isIdentityQuestion('what are you')).toBe(true);
  });

  it('recognizes "who are you"', () => {
    expect(isIdentityQuestion('who are you')).toBe(true);
  });

  it('recognizes bot/ai/human identity questions', () => {
    expect(isIdentityQuestion('are you a bot')).toBe(true);
    expect(isIdentityQuestion('are you an ai')).toBe(true);
    expect(isIdentityQuestion('are you real')).toBe(true);
  });

  it('does not flag emotional or greeting messages', () => {
    expect(isIdentityQuestion('I feel really sad today')).toBe(false);
    expect(isIdentityQuestion('hi')).toBe(false);
  });

  it('does not flag empty input', () => {
    expect(isIdentityQuestion('   ')).toBe(false);
  });
});
