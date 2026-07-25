import { describe, it, expect } from 'vitest';
import { isOffTopicQuestion } from './offTopic';

describe('isOffTopicQuestion', () => {
  it('recognizes a simple math expression', () => {
    expect(isOffTopicQuestion('what is 1+1')).toBe(true);
    expect(isOffTopicQuestion('1 + 1')).toBe(true);
  });

  it('recognizes common factual question stems', () => {
    expect(isOffTopicQuestion("what's the capital of France")).toBe(true);
    expect(isOffTopicQuestion('who is the president')).toBe(true);
    expect(isOffTopicQuestion('define photosynthesis')).toBe(true);
  });

  it('does not flag emotional messages', () => {
    expect(isOffTopicQuestion('I feel really sad today')).toBe(false);
  });

  it('does not flag greetings', () => {
    expect(isOffTopicQuestion('hi')).toBe(false);
  });

  it('does not flag empty input', () => {
    expect(isOffTopicQuestion('   ')).toBe(false);
  });

  it('recognizes homework and calculation requests', () => {
    expect(isOffTopicQuestion('can you solve this equation for me')).toBe(true);
    expect(isOffTopicQuestion('help me with my homework')).toBe(true);
    expect(isOffTopicQuestion('write an essay about the french revolution')).toBe(true);
    expect(isOffTopicQuestion('what is the square root of 144')).toBe(true);
  });
});
