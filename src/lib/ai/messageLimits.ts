import type { ChatTier } from '../storage';

// Soft, client-side daily caps on cloud replies — sized around each tier's
// actual API cost. Sprout is cheap and brief so it's the most lenient; Bud
// is the standard case; Bloom and Canopy run the longest, deepest requests
// (and Canopy's images add further cost), so they're capped tightest.
//
// This is enforced entirely in the browser, since there's no backend
// database yet to track usage server-side — it's the only real option
// available right now. It meaningfully bounds normal/organic usage (which
// is the vast majority of real traffic), but it is an honor-system limit:
// clearing localStorage resets it, and nothing stops a request made
// directly against /api/cloud-chat from bypassing it entirely. Real abuse
// protection at scale would need a server-side store (e.g. Vercel KV)
// rate-limiting the edge function itself.
const DAILY_LIMITS: Record<ChatTier, number> = {
  sprout: 60,
  bud: 35,
  bloom: 20,
  canopy: 15,
};

interface UsageRecord {
  date: string;
  counts: Partial<Record<ChatTier, number>>;
  notified: Partial<Record<ChatTier, boolean>>;
}

const USAGE_KEY = 'solace.dailyAiUsage';

function todayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function loadUsage(): UsageRecord {
  const today = todayKey();
  const raw = localStorage.getItem(USAGE_KEY);
  if (!raw) return { date: today, counts: {}, notified: {} };

  try {
    const parsed = JSON.parse(raw) as UsageRecord;
    // A stored day that isn't today means the counters are stale — start
    // today fresh rather than trying to carry anything over.
    if (parsed.date !== today) return { date: today, counts: {}, notified: {} };
    return parsed;
  } catch {
    return { date: today, counts: {}, notified: {} };
  }
}

function saveUsage(record: UsageRecord): void {
  localStorage.setItem(USAGE_KEY, JSON.stringify(record));
}

export function getDailyLimit(tier: ChatTier): number {
  return DAILY_LIMITS[tier];
}

export function getMessagesUsedToday(tier: ChatTier): number {
  return loadUsage().counts[tier] ?? 0;
}

export function getMessagesRemainingToday(tier: ChatTier): number {
  return Math.max(0, DAILY_LIMITS[tier] - getMessagesUsedToday(tier));
}

export function hasReachedDailyLimit(tier: ChatTier): boolean {
  return getMessagesUsedToday(tier) >= DAILY_LIMITS[tier];
}

// Only call this once a cloud reply has actually succeeded — a failed
// attempt (network error, provider outage) shouldn't cost the user part of
// their daily budget.
export function recordCloudMessage(tier: ChatTier): void {
  const usage = loadUsage();
  usage.counts[tier] = (usage.counts[tier] ?? 0) + 1;
  saveUsage(usage);
}

// The "you've hit today's limit" explanation should show once when the cap
// is first reached, not on every message after — these two track that
// without needing to distinguish "just hit it" from "still over it" by
// counter value alone (which can't tell those apart once blocked attempts
// stop incrementing the counter).
export function shouldShowLimitNotice(tier: ChatTier): boolean {
  return !loadUsage().notified[tier];
}

export function markLimitNoticeShown(tier: ChatTier): void {
  const usage = loadUsage();
  usage.notified[tier] = true;
  saveUsage(usage);
}
