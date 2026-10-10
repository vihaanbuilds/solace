// Vercel Edge Function — the only place the cloud AI provider's API key
// touches the network. It never reaches the browser: the client calls this
// endpoint, this endpoint calls the provider, and the response streams back
// through. Keep it that way — moving this call into client code would leak
// the key to anyone who opens the Network tab on the live site.
import { checkRateLimit, getClientIp } from './_lib/rateLimit';

export const config = { runtime: 'edge' };

const KNOWN_TIERS = new Set(['sprout', 'bud', 'bloom', 'canopy']);
const DEFAULT_TIER = 'bud';

// Canopy's cloud model, via Google's Gemini OpenAI-compatible endpoint.
// Flash, not Pro — the free-tier key this runs on has zero quota for Pro
// models, only Flash. Every other tier is unaffected by this and always
// uses the provider below.
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai';
const GEMINI_MODEL = 'gemini-flash-latest';

interface CloudChatRequestBody {
  messages?: unknown;
  max_tokens?: unknown;
  tier?: string;
}

// Images are sent as base64 data URLs inside message content, which can get
// large fast — this is an explicit, controlled failure instead of leaving
// it to whatever the platform's own default limit happens to be.
const MAX_BODY_BYTES = 8 * 1024 * 1024;
// Some models (gemini-3, the direct Gemini path used by canopy) spend a
// large, variable share of this budget on an invisible reasoning pass before
// writing any visible reply — observed up to ~1000 reasoning tokens alone on
// a real prompt. A ceiling too close to a tier's requested max_tokens risks
// the reasoning pass consuming the whole budget and returning an empty
// reply. Kept well above the highest per-tier request (see MAX_TOKENS in
// cloudEngine.ts) so that can't happen.
const MAX_TOKENS_CEILING = 4000;

interface Provider {
  apiKey: string;
  baseUrl: string;
  model: string;
}

// sprout/bud/bloom all route through the same OPENAI_API_KEY/OPENAI_BASE_URL
// endpoint — only the "model" field picked per tier changes which underlying
// model answers. sonar/gpt-5.5/opus-5/etc are gated behind a premium
// invitation this key doesn't have yet, so tiers currently use standard-tier
// models. Picked by testing each against the real system prompt + a real
// message, not just latency on a trivial prompt — every "thinking"-style
// model tried for bloom (nemotron, kimi-k2.6, gemini-3) eventually failed
// under real conditions: nemotron and kimi-k2.6 went into runaway reasoning
// chains that never finished, and gemini-3 — despite good replies most of
// the time — hung past 5 minutes on one repeat of the exact same request
// that had just answered in 8s. deepseek-v3.2 has no such invisible
// reasoning pass, answered consistently in the same few seconds across
// every trial, and reads just as warm and specific — reliability matters
// more than raw depth for a tier real people rely on mid-crisis.
// Models verified working on this key (standard tier). The provider has
// retired or locked models before: deepseek-v3.2 was removed and sonar now
// requires an invitation, which silently broke every tier at once. So each
// tier has an ordered chain of working models and tries the next one on any
// failure, instead of depending on a single model staying available.
const TIER_CHAINS: Record<string, string[]> = {
  sprout: ['llama-3.1', 'gpt-oss', 'gemma-4', 'deepseek-v4.1-flash'],
  bud: ['glm-5.2', 'gpt-oss', 'gemma-4', 'llama-3.1'],
  bloom: ['deepseek-v4.1-flash', 'glm-5.2', 'gpt-oss', 'gemma-4'],
  // Canopy tries Gemini directly first (if configured), then the same
  // vision-capable model through the shared provider.
  canopy: ['gemini-3.1-lite', 'deepseek-v4.1-flash', 'gpt-oss'],
};

function aquaProvider(model: string): Provider | null {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL;
  return apiKey && baseUrl ? { apiKey, baseUrl, model } : null;
}

function geminiProvider(): Provider | null {
  const apiKey = process.env.GEMINI_API_KEY;
  return apiKey ? { apiKey, baseUrl: GEMINI_BASE_URL, model: GEMINI_MODEL } : null;
}

function providersFor(tier: string): Provider[] {
  const chain = (TIER_CHAINS[tier] ?? TIER_CHAINS[DEFAULT_TIER]).map((model) => aquaProvider(model));
  const first = tier === 'canopy' ? geminiProvider() : null;
  return [first, ...chain].filter((p): p is Provider => p !== null);
}

interface CallResult {
  response: Response | null;
  failure: string;
}

async function callProvider(
  provider: Provider,
  messages: unknown,
  maxTokens: number | undefined
): Promise<CallResult> {
  try {
    const upstream = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        model: provider.model,
        messages,
        stream: true,
        ...(maxTokens ? { max_tokens: maxTokens } : {}),
      }),
    });
    if (upstream.ok && upstream.body) return { response: upstream, failure: '' };
    return { response: null, failure: `${provider.model}:${upstream.status}` };
  } catch {
    return { response: null, failure: `${provider.model}:network` };
  }
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'content-type': 'application/json' },
    });
  }

  const rawBody = await req.text();
  if (rawBody.length > MAX_BODY_BYTES) {
    return new Response(JSON.stringify({ error: 'Request is too large.' }), {
      status: 413,
      headers: { 'content-type': 'application/json' },
    });
  }

  let body: CloudChatRequestBody;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body.' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return new Response(JSON.stringify({ error: 'messages must be a non-empty array.' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const maxTokens =
    typeof body.max_tokens === 'number' && body.max_tokens > 0 && body.max_tokens <= MAX_TOKENS_CEILING
      ? body.max_tokens
      : undefined;
  const tier = typeof body.tier === 'string' && KNOWN_TIERS.has(body.tier) ? body.tier : DEFAULT_TIER;

  const providers = providersFor(tier);
  if (providers.length === 0) {
    return new Response(JSON.stringify({ error: 'Cloud AI is not configured.' }), {
      status: 503,
      headers: { 'content-type': 'application/json' },
    });
  }

  // The real, server-side backstop against deliberate abuse — the client's
  // own daily nudge (messageLimits.ts) is easily bypassed by clearing
  // storage or hitting this endpoint directly, so this is what actually
  // bounds cost from a bad actor rather than a well-behaved browser.
  const ip = getClientIp(req);
  const rateLimit = await checkRateLimit(ip, tier);
  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({
        error:
          rateLimit.reason === 'burst'
            ? 'Too many requests — please slow down and try again in a minute.'
            : 'Daily request limit reached for this network. It resets tomorrow.',
      }),
      {
        status: 429,
        headers: { 'content-type': 'application/json', 'retry-after': '60' },
      }
    );
  }

  let upstream: Response | null = null;
  const failures: string[] = [];
  for (const provider of providers) {
    const result = await callProvider(provider, body.messages, maxTokens);
    if (result.response) {
      upstream = result.response;
      break;
    }
    failures.push(result.failure);
  }

  if (!upstream) {
    // Model names and HTTP statuses only, never keys or URLs. Makes the next
    // outage diagnosable from the browser's network tab.
    return new Response(JSON.stringify({ error: 'Cloud AI request failed.', detail: failures }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache',
    },
  });
}
