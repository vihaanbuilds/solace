import type { LayerVolumes } from './soundMixer';

export async function requestSoundBlend(description: string): Promise<LayerVolumes> {
  const response = await fetch('/api/sound-blend', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ description }),
  });

  if (!response.ok) {
    throw new Error('Could not create that sound — try describing it differently.');
  }

  return (await response.json()) as LayerVolumes;
}
