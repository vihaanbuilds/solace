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

  it('falls back to a local interpretation when the request fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('error', { status: 502 }));
    const blend = await requestSoundBlend('a stormy ocean at night');
    expect(blend.ocean).toBeGreaterThan(0);
    expect(blend.rain).toBeGreaterThan(0.5);
  });

  it('falls back when fetch itself rejects (no /api in local dev)', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network'));
    const blend = await requestSoundBlend('quiet forest morning');
    expect(blend.birds).toBeGreaterThan(0);
  });

  it('returns a gentle mix for a description with no recognisable keywords', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network'));
    const blend = await requestSoundBlend('zzz qqq');
    expect(Object.values(blend).some((v) => v > 0)).toBe(true);
  });
});
