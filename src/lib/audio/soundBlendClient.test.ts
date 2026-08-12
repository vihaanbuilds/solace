import { describe, it, expect, vi, afterEach } from 'vitest';
import { requestSoundBlend } from './soundBlendClient';

describe('requestSoundBlend', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('posts the description and returns the parsed blend on success', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ ocean: 0.6, rain: 0.1, birds: 0, breeze: 0.3 }), { status: 200 })
      );

    const blend = await requestSoundBlend('a calm ocean morning');

    expect(blend).toEqual({ ocean: 0.6, rain: 0.1, birds: 0, breeze: 0.3 });
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('/api/sound-blend');
    expect(JSON.parse(init!.body as string)).toEqual({ description: 'a calm ocean morning' });
  });

  it('throws when the request fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('error', { status: 502 }));
    await expect(requestSoundBlend('anything')).rejects.toThrow();
  });
});
