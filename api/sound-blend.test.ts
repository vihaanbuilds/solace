import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import handler from './sound-blend';

const OPENAI_BASE_URL = 'https://example-provider.io/v1';
const OPENAI_API_KEY = 'test-key';

function makeRequest(body: unknown): Request {
  return new Request('https://example.com/api/sound-blend', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function completionResponse(content: string): Response {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

function urlOf(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

describe('api/sound-blend', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.OPENAI_API_KEY = OPENAI_API_KEY;
    process.env.OPENAI_BASE_URL = OPENAI_BASE_URL;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('returns a clamped blend parsed from the model response', async () => {
    vi.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const url = urlOf(input);
      if (url.startsWith(OPENAI_BASE_URL)) {
        return completionResponse('{"ocean": 1.5, "rain": 0.2, "birds": -0.1, "breeze": 0}');
      }
      throw new Error('unexpected fetch: ' + url);
    });

    const res = await handler(makeRequest({ description: 'a stormy ocean at night' }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ocean: 1, rain: 0.2, birds: 0, breeze: 0 });
  });

  it('extracts JSON even if the model adds surrounding text', async () => {
    vi.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const url = urlOf(input);
      if (url.startsWith(OPENAI_BASE_URL)) {
        return completionResponse(
          'Sure! Here is the blend: {"ocean": 0.4, "rain": 0.4, "birds": 0.1, "breeze": 0.1} Hope that helps!'
        );
      }
      throw new Error('unexpected fetch: ' + url);
    });

    const res = await handler(makeRequest({ description: 'chill lo-fi coffee shop' }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ocean: 0.4, rain: 0.4, birds: 0.1, breeze: 0.1 });
  });

  it('returns 502 when the model response has no valid JSON blend', async () => {
    vi.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const url = urlOf(input);
      if (url.startsWith(OPENAI_BASE_URL)) return completionResponse('sorry, I cannot help with that');
      throw new Error('unexpected fetch: ' + url);
    });

    const res = await handler(makeRequest({ description: 'a stormy ocean at night' }));
    expect(res.status).toBe(502);
  });

  it('treats a missing key as silent instead of failing', async () => {
    vi.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const url = urlOf(input);
      if (url.startsWith(OPENAI_BASE_URL)) return completionResponse('{"ocean": 0.5, "rain": 0.5, "birds": 0.1}');
      throw new Error('unexpected fetch: ' + url);
    });

    const res = await handler(makeRequest({ description: 'a stormy ocean at night' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ocean: 0.5, rain: 0.5, birds: 0.1, breeze: 0 });
  });

  it('returns 400 for a missing description', async () => {
    const res = await handler(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it('returns 400 for a description over the length limit', async () => {
    const res = await handler(makeRequest({ description: 'a'.repeat(301) }));
    expect(res.status).toBe(400);
  });

  it('returns 503 when the provider is not configured', async () => {
    delete process.env.OPENAI_API_KEY;
    const res = await handler(makeRequest({ description: 'ocean' }));
    expect(res.status).toBe(503);
  });

  it('returns 429 when the rate limit is exceeded', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://example-upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-upstash-token';

    vi.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const url = urlOf(input);
      if (url.startsWith('https://example-upstash.io')) {
        return new Response(JSON.stringify([{ result: 999 }, { result: 1 }]), { status: 200 });
      }
      throw new Error('unexpected fetch: ' + url);
    });

    const res = await handler(makeRequest({ description: 'ocean' }));
    expect(res.status).toBe(429);
  });
});
