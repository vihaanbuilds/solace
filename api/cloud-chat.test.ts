import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import handler from './cloud-chat';

const UPSTASH_URL = 'https://example-upstash.io';
const UPSTASH_TOKEN = 'test-upstash-token';
const OPENAI_BASE_URL = 'https://example-provider.io/v1';
const OPENAI_API_KEY = 'test-key';

function makeRequest(body: unknown): Request {
  return new Request('https://example.com/api/cloud-chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function upstashResponse(count: number): Response {
  return new Response(JSON.stringify([{ result: count }, { result: 1 }]), { status: 200 });
}

function sseUpstreamResponse(): Response {
  return new Response('data: {"choices":[{"delta":{"content":"hi"}}]}\n\ndata: [DONE]\n\n', {
    status: 200,
    headers: { 'content-type': 'text/event-stream' },
  });
}

function urlOf(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

describe('api/cloud-chat rate limiting', () => {
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

  it('skips rate limiting entirely when Upstash is not configured', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const url = urlOf(input);
      if (url.startsWith(OPENAI_BASE_URL)) return sseUpstreamResponse();
      throw new Error('unexpected fetch: ' + url);
    });

    const res = await handler(
      makeRequest({ messages: [{ role: 'user', content: 'hi' }], tier: 'bud' })
    );

    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('allows the request through and forwards it when under both rate limits', async () => {
    process.env.UPSTASH_REDIS_REST_URL = UPSTASH_URL;
    process.env.UPSTASH_REDIS_REST_TOKEN = UPSTASH_TOKEN;

    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const url = urlOf(input);
      if (url.startsWith(UPSTASH_URL)) return upstashResponse(3);
      if (url.startsWith(OPENAI_BASE_URL)) return sseUpstreamResponse();
      throw new Error('unexpected fetch: ' + url);
    });

    const res = await handler(
      makeRequest({ messages: [{ role: 'user', content: 'hi' }], tier: 'bud' })
    );

    expect(res.status).toBe(200);
    // burst check + daily check + the actual upstream call
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });

  it('returns 429 and never calls the upstream provider when the burst limit is exceeded', async () => {
    process.env.UPSTASH_REDIS_REST_URL = UPSTASH_URL;
    process.env.UPSTASH_REDIS_REST_TOKEN = UPSTASH_TOKEN;

    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const url = urlOf(input);
      if (url.startsWith(UPSTASH_URL)) return upstashResponse(999);
      if (url.startsWith(OPENAI_BASE_URL)) return sseUpstreamResponse();
      throw new Error('unexpected fetch: ' + url);
    });

    const res = await handler(
      makeRequest({ messages: [{ role: 'user', content: 'hi' }], tier: 'bud' })
    );

    expect(res.status).toBe(429);
    const responseBody = await res.json();
    expect(responseBody.error).toMatch(/too many requests/i);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('returns 429 for the daily per-tier cap even when under the burst limit, without calling upstream', async () => {
    process.env.UPSTASH_REDIS_REST_URL = UPSTASH_URL;
    process.env.UPSTASH_REDIS_REST_TOKEN = UPSTASH_TOKEN;

    let upstashCalls = 0;
    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const url = urlOf(input);
      if (url.startsWith(UPSTASH_URL)) {
        upstashCalls += 1;
        return upstashCalls === 1 ? upstashResponse(3) : upstashResponse(99999);
      }
      if (url.startsWith(OPENAI_BASE_URL)) return sseUpstreamResponse();
      throw new Error('unexpected fetch: ' + url);
    });

    const res = await handler(
      makeRequest({ messages: [{ role: 'user', content: 'hi' }], tier: 'canopy' })
    );

    expect(res.status).toBe(429);
    const responseBody = await res.json();
    expect(responseBody.error).toMatch(/daily/i);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('fails open and still serves the request if Upstash is unreachable', async () => {
    process.env.UPSTASH_REDIS_REST_URL = UPSTASH_URL;
    process.env.UPSTASH_REDIS_REST_TOKEN = UPSTASH_TOKEN;

    vi.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const url = urlOf(input);
      if (url.startsWith(UPSTASH_URL)) throw new Error('network error');
      if (url.startsWith(OPENAI_BASE_URL)) return sseUpstreamResponse();
      throw new Error('unexpected fetch: ' + url);
    });

    const res = await handler(
      makeRequest({ messages: [{ role: 'user', content: 'hi' }], tier: 'bud' })
    );

    expect(res.status).toBe(200);
  });

  it('falls back to the default daily limit for an unrecognized tier instead of erroring', async () => {
    process.env.UPSTASH_REDIS_REST_URL = UPSTASH_URL;
    process.env.UPSTASH_REDIS_REST_TOKEN = UPSTASH_TOKEN;

    vi.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const url = urlOf(input);
      if (url.startsWith(UPSTASH_URL)) return upstashResponse(2);
      if (url.startsWith(OPENAI_BASE_URL)) return sseUpstreamResponse();
      throw new Error('unexpected fetch: ' + url);
    });

    const res = await handler(
      makeRequest({ messages: [{ role: 'user', content: 'hi' }], tier: 'not-a-real-tier' })
    );

    expect(res.status).toBe(200);
  });

  it('still rejects requests with no messages, independent of rate limiting', async () => {
    const res = await handler(makeRequest({ messages: [] }));
    expect(res.status).toBe(400);
  });
});
