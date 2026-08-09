// Server-side rate limiting for /api/cloud-chat — the real backstop behind
// the client's own friendly per-browser daily nudge (src/lib/ai/messageLimits.ts),
// which is easily bypassed by clearing storage or calling this endpoint
// directly. This is IP-based since the app has no user accounts, backed by
// Upstash Redis's REST API (works over plain fetch, no persistent TCP
// connection needed, so it's safe to call from the Edge runtime).
//
// Two layers, because either alone has a real gap:
// - Burst: caps requests per IP per short window. Stops a tight script loop
//   almost immediately, before it can run up meaningful cost.
// - Daily: caps requests per IP per tier per day. Stops a slow-drip script
//   that stays under the burst threshold but still hammers the API all day.
//
// Deliberately generous relative to the client-side per-browser limits,
// since many real people can legitimately share one IP (a school's wifi,
// a family). This bounds cost from a single abusive source hard, without
// punishing a whole shared network for one heavy day of normal use.
//
// If Upstash isn't configured (env vars unset) or is unreachable, this
// fails OPEN — a rate limiter outage shouldn't take the whole chat feature
// down, since this is a cost-protection measure, not a security boundary.

const BURST_WINDOW_SECONDS = 60;
const BURST_LIMIT = 15;

// Per IP per day — roughly 10x the per-browser daily caps in
// messageLimits.ts, so a busy shared network isn't mistaken for abuse.
// Same relative ordering: heaviest on the longest/deepest/image-carrying
// tiers, lightest on the cheap fast one.
const DAILY_IP_LIMITS: Record<string, number> = {
  sprout: 600,
  bud: 350,
  bloom: 150,
  canopy: 100,
};
const DEFAULT_DAILY_LIMIT = DAILY_IP_LIMITS.bud;
const DAILY_KEY_TTL_SECONDS = 26 * 60 * 60; // buffer past the UTC day boundary

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reason?: 'burst' | 'daily';
}

export function isRateLimitConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const first = forwarded?.split(',')[0]?.trim();
  if (first) return first;
  return req.headers.get('x-real-ip') ?? 'unknown';
}

// INCR + EXPIRE in one round trip via Upstash's pipeline endpoint.
async function incrWithExpiry(key: string, ttlSeconds: number): Promise<number> {
  const res = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/pipeline`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify([
      ['INCR', key],
      ['EXPIRE', key, String(ttlSeconds)],
    ]),
  });

  if (!res.ok) {
    throw new Error(`Upstash request failed: ${res.status}`);
  }

  const data = (await res.json()) as Array<{ result?: number }>;
  const count = data[0]?.result;
  if (typeof count !== 'number') {
    throw new Error('Unexpected Upstash response shape');
  }
  return count;
}

function todayUtcKey(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}`;
}

// Checks both layers for one request. Only increments the daily counter if
// the burst check passes, so a rejected burst attempt doesn't also eat
// into the day's budget.
export async function checkRateLimit(ip: string, tier: string): Promise<RateLimitResult> {
  if (!isRateLimitConfigured()) {
    return { allowed: true, remaining: Infinity };
  }

  try {
    const burstCount = await incrWithExpiry(`ratelimit:burst:${ip}`, BURST_WINDOW_SECONDS);
    if (burstCount > BURST_LIMIT) {
      return { allowed: false, remaining: 0, reason: 'burst' };
    }

    const dailyLimit = DAILY_IP_LIMITS[tier] ?? DEFAULT_DAILY_LIMIT;
    const dailyKey = `ratelimit:daily:${ip}:${tier}:${todayUtcKey()}`;
    const dailyCount = await incrWithExpiry(dailyKey, DAILY_KEY_TTL_SECONDS);
    if (dailyCount > dailyLimit) {
      return { allowed: false, remaining: 0, reason: 'daily' };
    }

    return { allowed: true, remaining: dailyLimit - dailyCount };
  } catch {
    // Upstash unreachable or misbehaving — fail open rather than break chat.
    return { allowed: true, remaining: Infinity };
  }
}
