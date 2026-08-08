// Vercel Edge Function — the only place the cloud AI provider's API key
// touches the network. It never reaches the browser: the client calls this
// endpoint, this endpoint calls the provider, and the response streams back
// through. Keep it that way — moving this call into client code would leak
// the key to anyone who opens the Network tab on the live site.
export const config = { runtime: 'edge' };

// Only ever forward requests for models we've actually verified work on
// this account — the provider's catalog lists many more than actually
// function, and letting the client pick an arbitrary one risks silent
// failures or unexpected cost.
const ALLOWED_MODELS = new Set(['sonar']);
const DEFAULT_MODEL = 'sonar';

interface CloudChatRequestBody {
  messages?: unknown;
  model?: string;
}

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

  let body: CloudChatRequestBody;
  try {
    body = await req.json();
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
