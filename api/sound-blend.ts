// Vercel Edge Function, turns a short text description into a blend of
// the four ambient sound layers (ocean/rain/birds/breeze), via the same
// OPENAI_API_KEY/OPENAI_BASE_URL provider as api/cloud-chat.ts. Kept
// independent of src/ (no cross-imports) to match that file's existing
// api/ vs src/ boundary.
import { checkRateLimit, getClientIp } from './_lib/rateLimit';

export const config = { runtime: 'edge' };

// A public API address, not a secret. Pinned in code because the copy stored
// in OPENAI_BASE_URL on Vercel went stale and made every request 404.
const AQUA_BASE_URL = 'https://api.aquadevs.com/v1';

const MODEL = 'llama-3.1';
const MAX_DESCRIPTION_LENGTH = 300;
const SOUND_LAYERS = ['ocean', 'rain', 'birds', 'breeze'] as const;
type SoundLayer = (typeof SOUND_LAYERS)[number];

interface SoundBlendRequestBody {
  description?: unknown;
}

const SYSTEM_PROMPT = `You turn a short description into a blend of exactly four ambient sound layers: ocean, rain, birds, breeze. These are the ONLY four sounds that exist in this system, you are not generating new sound types, just deciding how loud each of the four should be for the described scene or vibe.

The description might be literal ("a stormy ocean at night") or a mood/genre vibe ("chill lo-fi coffee shop", "upbeat morning energy"), interpret either kind and translate it into weights for the four layers.

Respond with ONLY a JSON object, no other text, in exactly this shape:
{"ocean": 0.0, "rain": 0.0, "birds": 0.0, "breeze": 0.0}

Each value is a number from 0 (silent) to 1 (loudest). At least one value should be above 0.`;

function aquaConfig(): { apiKey: string; baseUrl: string } | null {
  const apiKey = process.env.OPENAI_API_KEY;
  return apiKey ? { apiKey, baseUrl: AQUA_BASE_URL } : null;
}

function parseBlend(text: string): Record<SoundLayer, number> | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(match[0]);
  } catch {
    return null;
  }

  if (typeof parsed !== 'object' || parsed === null) return null;
  const record = parsed as Record<string, unknown>;
  const blend = {} as Record<SoundLayer, number>;

  for (const layer of SOUND_LAYERS) {
    const value = record[layer];
    // Models sometimes return numbers as strings or omit a silent layer.
    const num = typeof value === 'string' ? Number(value) : value;
    blend[layer] = typeof num === 'number' && !Number.isNaN(num) ? Math.max(0, Math.min(1, num)) : 0;
  }
  if (Object.values(blend).every((v) => v === 0)) return null;

  return blend;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'content-type': 'application/json' },
    });
  }

  let body: SoundBlendRequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body.' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  if (
    typeof body.description !== 'string' ||
    body.description.trim().length === 0 ||
    body.description.length > MAX_DESCRIPTION_LENGTH
  ) {
    return new Response(
      JSON.stringify({
        error: `description must be a non-empty string up to ${MAX_DESCRIPTION_LENGTH} characters.`,
      }),
      { status: 400, headers: { 'content-type': 'application/json' } }
    );
  }

  const config = aquaConfig();
  if (!config) {
    return new Response(JSON.stringify({ error: 'Cloud AI is not configured.' }), {
      status: 503,
      headers: { 'content-type': 'application/json' },
    });
  }

  const ip = getClientIp(req);
  const rateLimit = await checkRateLimit(ip, 'sound-blend');
  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({
        error:
          rateLimit.reason === 'burst'
            ? 'Too many requests, please slow down and try again in a minute.'
            : 'Daily request limit reached for this network. It resets tomorrow.',
      }),
      { status: 429, headers: { 'content-type': 'application/json', 'retry-after': '60' } }
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify({
        model: MODEL,
        stream: false,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: body.description },
        ],
      }),
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Sound blend request failed.' }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    });
  }

  if (!upstream.ok) {
    return new Response(JSON.stringify({ error: 'Sound blend request failed.' }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    });
  }

  const data = await upstream.json().catch(() => null);
  const content = data?.choices?.[0]?.message?.content;
  const blend = typeof content === 'string' ? parseBlend(content) : null;

  if (!blend) {
    return new Response(JSON.stringify({ error: 'Could not create a sound blend from that description.' }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(blend), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}
