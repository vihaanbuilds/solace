// Vercel Edge Function — the only place the cloud AI provider's API key
// touches the network. It never reaches the browser: the client calls this
// endpoint, this endpoint calls the provider, and the response streams back
// through. Keep it that way — moving this call into client code would leak
// the key to anyone who opens the Network tab on the live site.
import { checkRateLimit, getClientIp } from './_lib/rateLimit';

export const config = { runtime: 'edge' };

// Only ever forward requests for models we've actually verified work on
// this account — the provider's catalog lists many more than actually
// function, and letting the client pick an arbitrary one risks silent
// failures or unexpected cost.
const ALLOWED_MODELS = new Set(['sonar']);
const DEFAULT_MODEL = 'sonar';
const KNOWN_TIERS = new Set(['sprout', 'bud', 'bloom', 'canopy']);
const DEFAULT_TIER = 'bud';

interface CloudChatRequestBody {
  messages?: unknown;
  model?: string;
  max_tokens?: unknown;
  tier?: string;
}

// Images are sent as base64 data URLs inside message content, which can get
// large fast — this is an explicit, controlled failure instead of leaving
// it to whatever the platform's own default limit happens to be.
const MAX_BODY_BYTES = 8 * 1024 * 1024;
const MAX_TOKENS_CEILING = 1000;

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'content-type': 'application/json' },
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL;
  if (!apiKey || !baseUrl) {
    return new Response(JSON.stringify({ error: 'Cloud AI is not configured.' }), {
      status: 503,
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

  const model =
    typeof body.model === 'string' && ALLOWED_MODELS.has(body.model) ? body.model : DEFAULT_MODEL;
  const maxTokens =
    typeof body.max_tokens === 'number' && body.max_tokens > 0 && body.max_tokens <= MAX_TOKENS_CEILING
      ? body.max_tokens
      : undefined;
  const tier = typeof body.tier === 'string' && KNOWN_TIERS.has(body.tier) ? body.tier : DEFAULT_TIER;

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

  let upstream: Response;
  try {
    upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: body.messages,
        stream: true,
        ...(maxTokens ? { max_tokens: maxTokens } : {}),
      }),
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Cloud AI provider is unreachable.' }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    });
  }

  if (!upstream.ok || !upstream.body) {
    return new Response(JSON.stringify({ error: 'Cloud AI request failed.' }), {
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
