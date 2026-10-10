import type { LayerVolumes } from './soundMixer';

// Offline/backup interpretation of a description, used when the AI endpoint
// is unavailable (local dev has no /api, or the upstream model fails), so the
// "describe your own sound" box always produces something sensible.
const KEYWORDS: Record<keyof LayerVolumes, RegExp> = {
  ocean: /ocean|sea|beach|shore|wave|surf|coast|tide|water|lake|harbor|sail|boat|island|tropical/,
  rain: /rain|storm|thunder|drizzle|shower|wet|cozy|cosy|coffee|cafe|study|lo-?fi|night|sleep|cabin|melanchol|moody|gloomy/,
  birds: /bird|forest|wood|morning|dawn|sunrise|garden|spring|meadow|jungle|park|nature|happy|upbeat|energ|cheer|fresh|farm|camp/,
  breeze: /breez|wind|air|field|hill|mountain|desert|calm|peace|relax|meditat|gentle|soft|quiet|autumn|fall|open|sky|float/,
};

export function localSoundBlend(description: string): LayerVolumes {
  const text = description.toLowerCase();
  const blend: LayerVolumes = { ocean: 0, rain: 0, birds: 0, breeze: 0 };
  (Object.keys(KEYWORDS) as Array<keyof LayerVolumes>).forEach((layer) => {
    if (KEYWORDS[layer].test(text)) blend[layer] = 0.6;
  });
  if (/storm|heavy|thunder|intense|wild/.test(text)) {
    blend.rain = Math.max(blend.rain, 0.85);
    blend.breeze = Math.max(blend.breeze, 0.5);
  }
  if (/gentle|soft|light|quiet|calm|peace/.test(text)) {
    (Object.keys(blend) as Array<keyof LayerVolumes>).forEach((layer) => {
      blend[layer] = blend[layer] * 0.7;
    });
  }
  // Nothing recognisable: a soft, mixed ambience beats silence or an error.
  if (Object.values(blend).every((v) => v === 0)) {
    return { ocean: 0.35, rain: 0.25, birds: 0.3, breeze: 0.4 };
  }
  return blend;
}

export async function requestSoundBlend(description: string): Promise<LayerVolumes> {
  try {
    const response = await fetch('/api/sound-blend', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ description }),
    });
    if (response.ok) {
      const data = await response.json();
      if (data && ['ocean', 'rain', 'birds', 'breeze'].every((k) => typeof data[k] === 'number')) {
        return data as LayerVolumes;
      }
    }
  } catch {
    // fall through to the local interpretation below
  }
  return localSoundBlend(description);
}
