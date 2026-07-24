import { describe, it, expect } from 'vitest';
import { detectEmotion } from './detectEmotion';

describe('detectEmotion', () => {
  it('detects sadness from sad, empty language', () => {
    const result = detectEmotion('I feel so sad and empty lately');
    expect(result.topEmotion).toBe('sadness');
  });

  it('detects grief from loss-specific language over plain sadness', () => {
    const result = detectEmotion('My grandma passed away and I miss them so much');
    expect(result.topEmotion).toBe('grief');
  });

  it('suppresses a negated emotion word', () => {
    const result = detectEmotion("I'm not sad, everything is fine");
    expect(result.topEmotion).not.toBe('sadness');
  });

  it('boosts score with an intensifier compared to the bare phrase', () => {
    const plain = detectEmotion('I am anxious about this');
    const intensified = detectEmotion('I am extremely anxious about this');
    expect(intensified.scores[0].score).toBeGreaterThan(plain.scores[0].score);
  });

  it('returns null topEmotion and ambiguous flag when two emotions tie closely', () => {
    const result = detectEmotion('I am mad and I am sad');
    expect(result.ambiguous).toBe(true);
    expect(result.topEmotion).toBeNull();
  });

  it('returns null topEmotion for text with no matched emotion words', () => {
    const result = detectEmotion('The weather today is cloudy');
    expect(result.topEmotion).toBeNull();
    expect(result.scores).toHaveLength(0);
  });
});
