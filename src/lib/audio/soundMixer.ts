// Pure state/orchestration for the ambient sound layers, no direct Web
// Audio API calls live here, only in soundSynth.ts, so this module can be
// fully unit-tested by mocking that one import. Module-level singleton
// state, same pattern as src/lib/ai/webllmEngine.ts.
import { LAYER_FACTORIES, LayerController, SoundLayer, SOUND_LAYERS, getAudioContext } from './soundSynth';
import { loadSoundMix, saveSoundMix, SoundMix } from '../storage';

export type LayerVolumes = SoundMix;
type Listener = (volumes: LayerVolumes) => void;

// Tapping a preset on for the first time starts it at this volume rather
// than 0, a toggle that turns something on silently would be confusing.
const DEFAULT_PRESET_VOLUME = 0.6;

function emptyVolumes(): LayerVolumes {
  return { ocean: 0, rain: 0, birds: 0, breeze: 0 };
}

const controllers: Partial<Record<SoundLayer, LayerController>> = {};
// Starts empty rather than restoring from storage, browsers block audio
// autoplay without a user gesture, so there is no safe way to "resume" a
// saved mix at module load. See loadSoundMix() usage in SoundsOverlay.tsx
// (Task 8) for how a saved mix gets offered as a one-tap resume instead.
let volumes: LayerVolumes = emptyVolumes();
const listeners = new Set<Listener>();

function notify(): void {
  saveSoundMix(volumes);
  listeners.forEach((listener) => listener({ ...volumes }));
}

export function setLayerVolume(layer: SoundLayer, volume: number): void {
  const clamped = Math.max(0, Math.min(1, volume));
  volumes = { ...volumes, [layer]: clamped };

  if (clamped === 0) {
    controllers[layer]?.stop();
    delete controllers[layer];
    notify();
    return;
  }

  if (!controllers[layer]) {
    controllers[layer] = LAYER_FACTORIES[layer](getAudioContext());
  }
  controllers[layer]!.setVolume(clamped);
  notify();
}

export function toggleLayer(layer: SoundLayer): void {
  setLayerVolume(layer, volumes[layer] > 0 ? 0 : DEFAULT_PRESET_VOLUME);
}

export function applyBlend(blend: LayerVolumes): void {
  SOUND_LAYERS.forEach((layer) => setLayerVolume(layer, blend[layer]));
}

export function stopAll(): void {
  SOUND_LAYERS.forEach((layer) => setLayerVolume(layer, 0));
}

export function getVolumes(): LayerVolumes {
  return { ...volumes };
}

export function isPlaying(): boolean {
  return SOUND_LAYERS.some((layer) => volumes[layer] > 0);
}

export function subscribeToSoundMixer(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Re-exported so callers that only need to check for a resumable mix don't
// have to import storage.ts directly.
export { loadSoundMix };
