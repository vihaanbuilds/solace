import { describe, it, expect, vi, afterEach } from 'vitest';
import { generateCloudReply } from './cloudEngine';

function sseResponse(text: string): Response {
  return new Response(`data: {"choices":[{"delta":{"content":${JSON.stringify(text)}}}]}\n\ndata: [DONE]\n\n`, {
    status: 200,
    headers: { 'content-type': 'text/event-stream' },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function lastRequestBody(fetchSpy: any): any {
  const calls = fetchSpy.mock.calls as Array<[RequestInfo | URL, RequestInit]>;
  const init = calls[calls.length - 1][1];
  return JSON.parse(init.body as string);
}

describe('generateCloudReply', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('appends the short-message clarifying hint to a bare one-word message', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(sseResponse('hi'));

    await generateCloudReply([{ role: 'user', content: 'whatever' }], 'bud');

    const body = lastRequestBody(fetchSpy);
    expect(body.messages[0].content).toContain('whatever');
    expect(body.messages[0].content).toMatch(/not a request to define/i);
  });

  it('does not append the hint to a normal, clearly-worded message', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(sseResponse('hi'));

    await generateCloudReply(
      [{ role: 'user', content: "I feel really anxious about school tomorrow" }],
      'bud'
    );

    const body = lastRequestBody(fetchSpy);
    expect(body.messages[0].content).toBe('I feel really anxious about school tomorrow');
  });

  it('only annotates the last user message, leaving history untouched', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(sseResponse('hi'));

    await generateCloudReply(
      [
        { role: 'user', content: 'idk' },
        { role: 'assistant', content: 'That sounds hard.' },
        { role: 'user', content: 'fine' },
      ],
      'bud'
    );

    const body = lastRequestBody(fetchSpy);
    expect(body.messages[0].content).toBe('idk');
    expect(body.messages[2].content).toContain('fine');
    expect(body.messages[2].content).toMatch(/not a request to define/i);
  });

  it('still attaches images alongside the hint on a short message', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(sseResponse('hi'));
    const image = 'data:image/jpeg;base64,abc';

    await generateCloudReply([{ role: 'user', content: 'idk' }], 'canopy', [image]);

    const body = lastRequestBody(fetchSpy);
    const content = body.messages[0].content;
    expect(Array.isArray(content)).toBe(true);
    expect(content[0].type).toBe('text');
    expect(content[0].text).toMatch(/not a request to define/i);
    expect(content[1]).toEqual({ type: 'image_url', image_url: { url: image } });
  });

  it('sends the tier and a tier-appropriate max_tokens value', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(sseResponse('hi'));

    await generateCloudReply([{ role: 'user', content: 'hello there' }], 'canopy');

    const body = lastRequestBody(fetchSpy);
    expect(body.tier).toBe('canopy');
    expect(body.max_tokens).toBeGreaterThan(0);
  });

  it('throws when the request fails, so the caller can fall back', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 500 }));

    await expect(generateCloudReply([{ role: 'user', content: 'hi' }], 'bud')).rejects.toThrow();
  });
});
