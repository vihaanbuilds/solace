import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getDailyLimit,
  getMessagesUsedToday,
  getMessagesRemainingToday,
  hasReachedDailyLimit,
  recordCloudMessage,
  shouldShowLimitNotice,
  markLimitNoticeShown,
} from './messageLimits';

describe('messageLimits', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.setSystemTime(new Date('2026-08-09T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with the full daily limit available', () => {
    expect(getMessagesUsedToday('sprout')).toBe(0);
    expect(getMessagesRemainingToday('sprout')).toBe(getDailyLimit('sprout'));
    expect(hasReachedDailyLimit('sprout')).toBe(false);
  });

  it('orders limits heaviest on canopy/bloom, medium on bud, lenient on sprout', () => {
    expect(getDailyLimit('sprout')).toBeGreaterThan(getDailyLimit('bud'));
    expect(getDailyLimit('bud')).toBeGreaterThan(getDailyLimit('bloom'));
    expect(getDailyLimit('bloom')).toBeGreaterThanOrEqual(getDailyLimit('canopy'));
  });

  it('increments usage independently per tier', () => {
    recordCloudMessage('sprout');
    recordCloudMessage('sprout');
    recordCloudMessage('bud');

    expect(getMessagesUsedToday('sprout')).toBe(2);
    expect(getMessagesUsedToday('bud')).toBe(1);
    expect(getMessagesUsedToday('bloom')).toBe(0);
  });

  it('reaches the limit once usage meets the daily cap', () => {
    const limit = getDailyLimit('canopy');
    for (let i = 0; i < limit; i += 1) recordCloudMessage('canopy');

    expect(hasReachedDailyLimit('canopy')).toBe(true);
    expect(getMessagesRemainingToday('canopy')).toBe(0);
  });

  it('never returns a negative remaining count', () => {
    const limit = getDailyLimit('canopy');
    for (let i = 0; i < limit + 5; i += 1) recordCloudMessage('canopy');

    expect(getMessagesRemainingToday('canopy')).toBe(0);
  });

  it('shows the limit notice exactly once until reset', () => {
    expect(shouldShowLimitNotice('bloom')).toBe(true);
    markLimitNoticeShown('bloom');
    expect(shouldShowLimitNotice('bloom')).toBe(false);
  });

  it('resets usage and the notice flag on a new calendar day', () => {
    const limit = getDailyLimit('bud');
    for (let i = 0; i < limit; i += 1) recordCloudMessage('bud');
    markLimitNoticeShown('bud');
    expect(hasReachedDailyLimit('bud')).toBe(true);
    expect(shouldShowLimitNotice('bud')).toBe(false);

    vi.setSystemTime(new Date('2026-08-10T00:05:00'));

    expect(getMessagesUsedToday('bud')).toBe(0);
    expect(hasReachedDailyLimit('bud')).toBe(false);
    expect(shouldShowLimitNotice('bud')).toBe(true);
  });
});
