import { describe, it, expect } from 'vitest';
import { stripDashes } from './noDashes';

describe('stripDashes', () => {
  it('replaces spaced and unspaced em dashes with commas', () => {
    expect(stripDashes('That sounds heavy — what happened?')).toBe('That sounds heavy, what happened?');
    expect(stripDashes('That sounds heavy—what happened?')).toBe('That sounds heavy, what happened?');
  });
  it('removes a dash that lands before punctuation or at the start', () => {
    expect(stripDashes('Wait —. Okay')).toBe('Wait. Okay');
    expect(stripDashes('— hello')).toBe('hello');
  });
  it('turns number ranges into hyphens', () => {
    expect(stripDashes('about 2–3 days')).toBe('about 2-3 days');
  });
  it('leaves text without dashes alone', () => {
    expect(stripDashes('Hello there.')).toBe('Hello there.');
  });
});
