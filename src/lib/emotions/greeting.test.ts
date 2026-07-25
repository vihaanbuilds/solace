import { describe, it, expect } from 'vitest';
import { isGreeting } from './greeting';

describe('isGreeting', () => {
  it('recognizes a bare "hi"', () => {
    expect(isGreeting('hi')).toBe(true);
  });

  it('recognizes "hello" and "hey"', () => {
    expect(isGreeting('hello')).toBe(true);
    expect(isGreeting('hey')).toBe(true);
  });

  it('recognizes "what\'s up"', () => {
    expect(isGreeting("what's up")).toBe(true);
  });

  it('does not flag unrelated text', () => {
    expect(isGreeting('I feel really sad today')).toBe(false);
  });

  it('does not flag empty input', () => {
    expect(isGreeting('   ')).toBe(false);
  });
});
