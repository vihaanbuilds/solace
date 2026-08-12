# Ambient Sounds (Music Therapy) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a soothing-sounds feature to Solace — four ambient layers (ocean, rain, birds, breeze) synthesized live via the Web Audio API, layerable with independent volumes, reachable from a circular button on the main chat without interrupting the conversation, plus a text box that turns a description into a custom blend via the existing cloud AI.

**Architecture:** `src/lib/audio/soundSynth.ts` owns all direct Web Audio API usage (the four layer factories + the shared `AudioContext`); `src/lib/audio/soundMixer.ts` is a pure state/orchestration module (module-level singleton, same pattern as `webllmEngine.ts`) with zero direct Web Audio calls, making it fully mockable in tests. `api/sound-blend.ts` mirrors `api/cloud-chat.ts`'s edge-function structure for the description→blend AI call. `SoundButton`/`SoundsOverlay` are React components wired into `App.tsx` the same way `SettingsModal` already is (an in-app overlay, not a route, so audio survives closing it).

**Tech Stack:** React 18 + TypeScript, Vite, Vitest + Testing Library, Web Audio API (native browser, no library), Vercel Edge Functions.

## Global Constraints

- No new npm dependencies — everything uses the native Web Audio API and the existing fetch-based provider pattern.
- No real/recorded audio files — everything is synthesized (per the approved spec's non-goals).
- No new synthesis primitives beyond the four layers (ocean/rain/birds/breeze) — the AI blend step only ever weights these four, never invents new sound types (per spec).
- `AudioContext` must be created lazily on first user interaction, never at module load — browsers block audio autoplay without a user gesture.
- All new `localStorage` keys must use the `solace.` prefix so the existing `clearAllLocalData()` sweep in `src/lib/storage.ts` covers them automatically — no changes needed to that function.
- `api/sound-blend.ts` must reuse `checkRateLimit`/`getClientIp` from `api/_lib/rateLimit.ts`, the same as `api/cloud-chat.ts`.
- Follow this codebase's existing conventions exactly: module-singleton pattern with `Set`-based subscribe/unsubscribe for stateful client modules (see `webllmEngine.ts`), one shared `src/styles/theme.css` (no CSS modules/new stylesheets), hand-drawn SVG icon set in `src/components/icons.tsx` (no icon library), in-app overlay components use `createPortal` to `document.body` with the `privacy-modal-backdrop`/`privacy-modal-card` base classes (see `SettingsModal.tsx`).

---

## Task 1: Sound mix persistence in storage.ts

**Files:**
- Modify: `src/lib/storage.ts`
- Test: `src/lib/storage.test.ts`

**Interfaces:**
- Produces: `SoundMix` interface `{ ocean: number; rain: number; birds: number; breeze: number }`; `saveSoundMix(mix: SoundMix): void`; `loadSoundMix(): SoundMix | null`; `saveSoundDescription(description: string): void`; `loadSoundDescription(): string`.

- [ ] **Step 1: Write the failing tests**

Add to the end of `src/lib/storage.test.ts` (extend the existing top-of-file import list to include the new names):

```ts
import {
  // ...existing imports...
  saveSoundMix,
  loadSoundMix,
  saveSoundDescription,
  loadSoundDescription,
  SoundMix,
} from './storage';
```

Add this new `describe` block at the end of the file, inside the outer `describe('storage', ...)`:

```ts
  describe('sound mix', () => {
    it('round-trips a sound mix through localStorage', () => {
      const mix: SoundMix = { ocean: 0.6, rain: 0.2, birds: 0, breeze: 0.4 };
      saveSoundMix(mix);
      expect(loadSoundMix()).toEqual(mix);
    });

    it('returns null when no mix has been saved', () => {
      expect(loadSoundMix()).toBeNull();
    });

    it('returns null for corrupted JSON instead of throwing', () => {
      localStorage.setItem('solace.soundMix', 'not json');
      expect(loadSoundMix()).toBeNull();
    });

    it('round-trips a sound description through localStorage', () => {
      saveSoundDescription('a quiet forest morning');
      expect(loadSoundDescription()).toBe('a quiet forest morning');
    });

    it('returns an empty string when no description has been saved', () => {
      expect(loadSoundDescription()).toBe('');
    });
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/storage.test.ts`
Expected: FAIL — `saveSoundMix`/`loadSoundMix`/`saveSoundDescription`/`loadSoundDescription`/`SoundMix` are not exported from `./storage`.

- [ ] **Step 3: Implement in storage.ts**

Add near the other key constants (after `const BLOOM_LOCAL_MODE_KEY = 'solace.bloomLocalMode';`):

```ts
const SOUND_MIX_KEY = 'solace.soundMix';
const SOUND_DESCRIPTION_KEY = 'solace.soundDescription';
```

Add this interface near the other interfaces at the top of the file (after `UserProfile`):

```ts
export interface SoundMix {
  ocean: number;
  rain: number;
  birds: number;
  breeze: number;
}
```

Add these functions near `saveBloomLocalMode`/`loadBloomLocalMode` (before `clearAllLocalData`):

```ts
export function saveSoundMix(mix: SoundMix): void {
  localStorage.setItem(SOUND_MIX_KEY, JSON.stringify(mix));
}

export function loadSoundMix(): SoundMix | null {
  const raw = localStorage.getItem(SOUND_MIX_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SoundMix;
  } catch {
    return null;
  }
}

export function saveSoundDescription(description: string): void {
  localStorage.setItem(SOUND_DESCRIPTION_KEY, description);
}

export function loadSoundDescription(): string {
  return localStorage.getItem(SOUND_DESCRIPTION_KEY) ?? '';
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/storage.test.ts`
Expected: PASS, all tests including the new `sound mix` block.

- [ ] **Step 5: Commit**

```bash
git add src/lib/storage.ts src/lib/storage.test.ts
git commit -m "Add sound mix and description persistence to storage.ts"
```

---

## Task 2: Sound synthesis engine (soundSynth.ts)

**Files:**
- Create: `src/lib/audio/soundSynth.ts`
- Modify: `src/test/setup.ts` (add a minimal fake `AudioContext` — jsdom has no real Web Audio API)
- Test: `src/lib/audio/soundSynth.test.ts`

**Interfaces:**
- Produces: `LayerController` interface `{ setVolume(volume: number): void; stop(): void }`; `SoundLayer` type `'ocean' | 'rain' | 'birds' | 'breeze'`; `SOUND_LAYERS: SoundLayer[]`; `isAudioSupported(): boolean`; `getAudioContext(): AudioContext`; `LAYER_FACTORIES: Record<SoundLayer, (context: AudioContext) => LayerController>`.

- [ ] **Step 1: Add the fake AudioContext to the shared test setup**

Append to the end of `src/test/setup.ts` (matching the existing polyfill style already in that file):

```ts
// jsdom does not implement the Web Audio API at all. This is a minimal fake
// AudioContext with just enough surface for src/lib/audio/soundSynth.ts to
// run without throwing — connections and audio output are no-ops, since
// tests only need this code path not to crash, not to produce real sound.
function createFakeAudioParam(initial: number) {
  return {
    value: initial,
    setValueAtTime: () => {},
    linearRampToValueAtTime: () => {},
  };
}

function createFakeAudioNode() {
  return {
    // Real AudioNode.connect() returns the destination node so calls can
    // chain (`a.connect(b).connect(c)`) — soundSynth.ts relies on that, so
    // the fake must too, or the second .connect() in a chain throws.
    connect: (target: unknown) => target,
    disconnect: () => {},
  };
}

class FakeAudioContext {
  sampleRate = 44100;
  currentTime = 0;
  state: 'running' | 'suspended' = 'running';
  destination = createFakeAudioNode();

  resume() {
    this.state = 'running';
    return Promise.resolve();
  }

  createBuffer(_channels: number, length: number) {
    const data = new Float32Array(length);
    return { getChannelData: () => data };
  }

  createBufferSource() {
    return { ...createFakeAudioNode(), buffer: null, loop: false, start: () => {}, stop: () => {} };
  }

  createBiquadFilter() {
    return {
      ...createFakeAudioNode(),
      type: 'lowpass',
      frequency: createFakeAudioParam(350),
      Q: createFakeAudioParam(1),
    };
  }

  createGain() {
    return { ...createFakeAudioNode(), gain: createFakeAudioParam(1) };
  }

  createOscillator() {
    return {
      ...createFakeAudioNode(),
      type: 'sine',
      frequency: createFakeAudioParam(440),
      start: () => {},
      stop: () => {},
    };
  }

  createConstantSource() {
    return { ...createFakeAudioNode(), offset: createFakeAudioParam(0), start: () => {}, stop: () => {} };
  }
}

Object.defineProperty(globalThis, 'AudioContext', {
  value: FakeAudioContext,
  configurable: true,
  writable: true,
});
```

- [ ] **Step 2: Write the failing tests**

Create `src/lib/audio/soundSynth.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { SOUND_LAYERS, LAYER_FACTORIES, getAudioContext, isAudioSupported } from './soundSynth';

describe('soundSynth', () => {
  it('defines exactly the four expected layers', () => {
    expect(SOUND_LAYERS).toEqual(['ocean', 'rain', 'birds', 'breeze']);
  });

  it('has a factory function for every layer', () => {
    SOUND_LAYERS.forEach((layer) => {
      expect(typeof LAYER_FACTORIES[layer]).toBe('function');
    });
  });

  it('reports audio as supported when AudioContext exists on the global (the test setup polyfill)', () => {
    expect(isAudioSupported()).toBe(true);
  });

  it('reports audio as unsupported when AudioContext is absent from the global', () => {
    const original = globalThis.AudioContext;
    // @ts-expect-error — intentionally deleting for this one test
    delete globalThis.AudioContext;
    expect(isAudioSupported()).toBe(false);
    globalThis.AudioContext = original;
  });

  it('each factory produces a controller whose setVolume and stop do not throw', () => {
    const context = getAudioContext();
    SOUND_LAYERS.forEach((layer) => {
      const controller = LAYER_FACTORIES[layer](context);
      expect(() => controller.setVolume(0.5)).not.toThrow();
      expect(() => controller.setVolume(1)).not.toThrow();
      expect(() => controller.stop()).not.toThrow();
    });
  });

  it('getAudioContext returns the same shared instance on repeated calls', () => {
    expect(getAudioContext()).toBe(getAudioContext());
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/lib/audio/soundSynth.test.ts`
Expected: FAIL — cannot find module `./soundSynth`.

- [ ] **Step 4: Implement soundSynth.ts**

Create `src/lib/audio/soundSynth.ts`:

```ts
// All direct Web Audio API usage lives in this one file — soundMixer.ts and
// everything above it only ever touches the LayerController interface, so
// it can be fully mocked in tests without needing a real AudioContext.

export interface LayerController {
  setVolume(volume: number): void;
  stop(): void;
}

export type SoundLayer = 'ocean' | 'rain' | 'birds' | 'breeze';
export const SOUND_LAYERS: SoundLayer[] = ['ocean', 'rain', 'birds', 'breeze'];

export function isAudioSupported(): boolean {
  return typeof AudioContext !== 'undefined';
}

let sharedContext: AudioContext | null = null;

// Created lazily on first call (i.e. the first time a layer is actually
// toggled on by a user gesture), never at module load — browsers block
// audio autoplay without one.
export function getAudioContext(): AudioContext {
  if (!sharedContext) {
    sharedContext = new AudioContext();
  }
  if (sharedContext.state === 'suspended') {
    sharedContext.resume();
  }
  return sharedContext;
}

function createNoiseBuffer(context: AudioContext): AudioBuffer {
  const seconds = 2;
  const buffer = context.createBuffer(1, context.sampleRate * seconds, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function createLoopingNoise(context: AudioContext): AudioBufferSourceNode {
  const source = context.createBufferSource();
  source.buffer = createNoiseBuffer(context);
  source.loop = true;
  source.start();
  return source;
}

// Two slightly-detuned oscillators (a non-integer frequency ratio) summed
// into one AudioParam create a slow wander around baseValue that never
// exactly repeats within a single playback, instead of one oscillator's
// perfectly periodic pulse.
function connectWanderingValue(
  context: AudioContext,
  target: AudioParam,
  baseValue: number,
  depth: number,
  baseRateHz: number
): () => void {
  const lfoA = context.createOscillator();
  const lfoB = context.createOscillator();
  lfoA.frequency.value = baseRateHz;
  lfoB.frequency.value = baseRateHz * 1.37;

  const depthGainA = context.createGain();
  const depthGainB = context.createGain();
  depthGainA.gain.value = depth * 0.5;
  depthGainB.gain.value = depth * 0.5;

  const offset = context.createConstantSource();
  offset.offset.value = baseValue;

  lfoA.connect(depthGainA).connect(target);
  lfoB.connect(depthGainB).connect(target);
  offset.connect(target);

  lfoA.start();
  lfoB.start();
  offset.start();

  return () => {
    lfoA.stop();
    lfoB.stop();
    offset.stop();
  };
}

function createVolumeGain(context: AudioContext): GainNode {
  const gain = context.createGain();
  gain.gain.value = 0;
  gain.connect(context.destination);
  return gain;
}

function makeController(volumeGain: GainNode, cleanup: () => void): LayerController {
  return {
    setVolume(volume: number) {
      volumeGain.gain.value = Math.max(0, Math.min(1, volume));
    },
    stop() {
      cleanup();
      volumeGain.disconnect();
    },
  };
}

// Low-pass-filtered noise with a slow, irregular gain envelope — the uneven
// rolling swell of waves breaking non-periodically.
export function createOceanLayer(context: AudioContext): LayerController {
  const noise = createLoopingNoise(context);
  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 500;
  noise.connect(filter);

  const shapeGain = context.createGain();
  shapeGain.gain.value = 0.7;
  filter.connect(shapeGain);

  const volumeGain = createVolumeGain(context);
  shapeGain.connect(volumeGain);

  const stopWander = connectWanderingValue(context, shapeGain.gain, 0.7, 0.3, 0.12);

  return makeController(volumeGain, () => {
    noise.stop();
    stopWander();
    noise.disconnect();
    filter.disconnect();
    shapeGain.disconnect();
  });
}

// Band-pass-filtered noise tuned to a steady hiss — texture from the filter
// shape, not individual drop simulation.
export function createRainLayer(context: AudioContext): LayerController {
  const noise = createLoopingNoise(context);
  const filter = context.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 3000;
  filter.Q.value = 0.5;
  noise.connect(filter);

  const volumeGain = createVolumeGain(context);
  filter.connect(volumeGain);

  return makeController(volumeGain, () => {
    noise.stop();
    noise.disconnect();
    filter.disconnect();
  });
}

// Band-pass-filtered noise with a slowly wandering filter cutoff — the soft
// whooshing wind character.
export function createBreezeLayer(context: AudioContext): LayerController {
  const noise = createLoopingNoise(context);
  const filter = context.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 800;
  filter.Q.value = 0.7;
  noise.connect(filter);

  const volumeGain = createVolumeGain(context);
  filter.connect(volumeGain);

  const stopWander = connectWanderingValue(context, filter.frequency, 800, 400, 0.05);

  return makeController(volumeGain, () => {
    noise.stop();
    stopWander();
    noise.disconnect();
    filter.disconnect();
  });
}

// Not continuous — short, randomly-timed pitch-swept oscillator bursts over
// a silent bed, so it reads as occasional chirps rather than a tone.
export function createBirdsLayer(context: AudioContext): LayerController {
  const volumeGain = createVolumeGain(context);
  let stopped = false;
  let timeoutId: ReturnType<typeof setTimeout>;

  function fireChirp() {
    const osc = context.createOscillator();
    osc.type = 'sine';
    const startFreq = 2200 + Math.random() * 1200;
    const endFreq = startFreq + (Math.random() > 0.5 ? 400 : -400);
    osc.frequency.setValueAtTime(startFreq, context.currentTime);
    osc.frequency.linearRampToValueAtTime(endFreq, context.currentTime + 0.12);

    const chirpGain = context.createGain();
    chirpGain.gain.setValueAtTime(0, context.currentTime);
    chirpGain.gain.linearRampToValueAtTime(1, context.currentTime + 0.02);
    chirpGain.gain.linearRampToValueAtTime(0, context.currentTime + 0.15);

    osc.connect(chirpGain);
    chirpGain.connect(volumeGain);
    osc.start();
    osc.stop(context.currentTime + 0.2);
  }

  function scheduleNextChirp() {
    const delayMs = 2000 + Math.random() * 4000; // every 2-6s, irregular
    timeoutId = setTimeout(() => {
      if (stopped) return;
      fireChirp();
      scheduleNextChirp();
    }, delayMs);
  }

  scheduleNextChirp();

  return makeController(volumeGain, () => {
    stopped = true;
    clearTimeout(timeoutId);
  });
}

export const LAYER_FACTORIES: Record<SoundLayer, (context: AudioContext) => LayerController> = {
  ocean: createOceanLayer,
  rain: createRainLayer,
  birds: createBirdsLayer,
  breeze: createBreezeLayer,
};
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/lib/audio/soundSynth.test.ts`
Expected: PASS, all 6 tests.

- [ ] **Step 6: Run the full test suite to confirm the AudioContext polyfill doesn't break anything else**

Run: `npx vitest run`
Expected: PASS, all existing tests still green plus the new ones.

- [ ] **Step 7: Commit**

```bash
git add src/lib/audio/soundSynth.ts src/lib/audio/soundSynth.test.ts src/test/setup.ts
git commit -m "Add Web Audio synthesis engine for the four ambient sound layers"
```

---

## Task 3: Sound mixer (soundMixer.ts)

**Files:**
- Create: `src/lib/audio/soundMixer.ts`
- Test: `src/lib/audio/soundMixer.test.ts`

**Interfaces:**
- Consumes: `SoundMix` from `../storage` (Task 1); `SoundLayer`, `SOUND_LAYERS`, `LAYER_FACTORIES`, `getAudioContext` from `./soundSynth` (Task 2).
- Produces: `LayerVolumes` type (alias of `SoundMix`); `setLayerVolume(layer: SoundLayer, volume: number): void`; `toggleLayer(layer: SoundLayer): void`; `applyBlend(blend: LayerVolumes): void`; `stopAll(): void`; `getVolumes(): LayerVolumes`; `isPlaying(): boolean`; `subscribeToSoundMixer(listener: (volumes: LayerVolumes) => void): () => void`.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/audio/soundMixer.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockFactories } = vi.hoisted(() => {
  function makeController() {
    return { setVolume: vi.fn(), stop: vi.fn() };
  }
  return {
    mockFactories: {
      ocean: vi.fn(() => makeController()),
      rain: vi.fn(() => makeController()),
      birds: vi.fn(() => makeController()),
      breeze: vi.fn(() => makeController()),
    },
  };
});

vi.mock('./soundSynth', () => ({
  SOUND_LAYERS: ['ocean', 'rain', 'birds', 'breeze'],
  getAudioContext: vi.fn(() => ({})),
  LAYER_FACTORIES: mockFactories,
}));

import {
  setLayerVolume,
  toggleLayer,
  applyBlend,
  stopAll,
  getVolumes,
  isPlaying,
  subscribeToSoundMixer,
} from './soundMixer';

describe('soundMixer', () => {
  beforeEach(() => {
    localStorage.clear();
    stopAll();
    Object.values(mockFactories).forEach((factory) => factory.mockClear());
  });

  it('starts a layer at a nonzero default volume when toggled on', () => {
    toggleLayer('ocean');
    expect(getVolumes().ocean).toBeGreaterThan(0);
    expect(mockFactories.ocean).toHaveBeenCalledTimes(1);
  });

  it('stops a layer and removes its controller when toggled off again', () => {
    toggleLayer('rain');
    const controller = mockFactories.rain.mock.results[0].value;
    toggleLayer('rain');
    expect(getVolumes().rain).toBe(0);
    expect(controller.stop).toHaveBeenCalledTimes(1);
  });

  it('clamps setLayerVolume to the 0-1 range', () => {
    setLayerVolume('birds', 5);
    expect(getVolumes().birds).toBe(1);
    setLayerVolume('birds', -2);
    expect(getVolumes().birds).toBe(0);
  });

  it('applyBlend sets every layer from the given weights in one call', () => {
    applyBlend({ ocean: 0.5, rain: 0.2, birds: 0, breeze: 0.8 });
    expect(getVolumes()).toEqual({ ocean: 0.5, rain: 0.2, birds: 0, breeze: 0.8 });
  });

  it('stopAll silences every active layer', () => {
    applyBlend({ ocean: 0.5, rain: 0.2, birds: 0.3, breeze: 0.1 });
    stopAll();
    expect(getVolumes()).toEqual({ ocean: 0, rain: 0, birds: 0, breeze: 0 });
  });

  it('isPlaying reflects whether any layer has volume above zero', () => {
    expect(isPlaying()).toBe(false);
    toggleLayer('breeze');
    expect(isPlaying()).toBe(true);
  });

  it('notifies subscribers with the latest volumes on every change, and stops after unsubscribing', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToSoundMixer(listener);
    toggleLayer('ocean');
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ ocean: expect.any(Number) }));
    unsubscribe();
    listener.mockClear();
    toggleLayer('ocean');
    expect(listener).not.toHaveBeenCalled();
  });

  it('persists the mix to storage on every change', () => {
    toggleLayer('ocean');
    const raw = localStorage.getItem('solace.soundMix');
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!).ocean).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/audio/soundMixer.test.ts`
Expected: FAIL — cannot find module `./soundMixer`.

- [ ] **Step 3: Implement soundMixer.ts**

Create `src/lib/audio/soundMixer.ts`:

```ts
// Pure state/orchestration for the ambient sound layers — no direct Web
// Audio API calls live here, only in soundSynth.ts, so this module can be
// fully unit-tested by mocking that one import. Module-level singleton
// state, same pattern as src/lib/ai/webllmEngine.ts.
import { LAYER_FACTORIES, LayerController, SoundLayer, SOUND_LAYERS, getAudioContext } from './soundSynth';
import { loadSoundMix, saveSoundMix, SoundMix } from '../storage';

export type LayerVolumes = SoundMix;
type Listener = (volumes: LayerVolumes) => void;

// Tapping a preset on for the first time starts it at this volume rather
// than 0 — a toggle that turns something on silently would be confusing.
const DEFAULT_PRESET_VOLUME = 0.6;

function emptyVolumes(): LayerVolumes {
  return { ocean: 0, rain: 0, birds: 0, breeze: 0 };
}

const controllers: Partial<Record<SoundLayer, LayerController>> = {};
// Starts empty rather than restoring from storage — browsers block audio
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/audio/soundMixer.test.ts`
Expected: PASS, all 7 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/audio/soundMixer.ts src/lib/audio/soundMixer.test.ts
git commit -m "Add sound mixer state module for the ambient sound layers"
```

---

## Task 4: Sound-blend API endpoint (api/sound-blend.ts)

**Files:**
- Create: `api/sound-blend.ts`
- Test: `api/sound-blend.test.ts`

**Interfaces:**
- Consumes: `checkRateLimit`, `getClientIp` from `./_lib/rateLimit` (existing).
- Produces: `POST /api/sound-blend` — request `{ description: string }` (max 300 chars), response `{ ocean: number; rain: number; birds: number; breeze: number }` (200) or `{ error: string }` (400/429/502/503).

- [ ] **Step 1: Write the failing tests**

Create `api/sound-blend.test.ts`:

```ts
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

  it('returns 502 when the model response is missing one of the four keys', async () => {
    vi.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const url = urlOf(input);
      if (url.startsWith(OPENAI_BASE_URL)) return completionResponse('{"ocean": 0.5, "rain": 0.5, "birds": 0.1}');
      throw new Error('unexpected fetch: ' + url);
    });

    const res = await handler(makeRequest({ description: 'a stormy ocean at night' }));
    expect(res.status).toBe(502);
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run api/sound-blend.test.ts`
Expected: FAIL — cannot find module `./sound-blend`.

- [ ] **Step 3: Implement api/sound-blend.ts**

Create `api/sound-blend.ts`:

```ts
// Vercel Edge Function — turns a short text description into a blend of
// the four ambient sound layers (ocean/rain/birds/breeze), via the same
// OPENAI_API_KEY/OPENAI_BASE_URL provider as api/cloud-chat.ts. Kept
// independent of src/ (no cross-imports) to match that file's existing
// api/ vs src/ boundary.
import { checkRateLimit, getClientIp } from './_lib/rateLimit';

export const config = { runtime: 'edge' };

const MODEL = 'llama-3.1';
const MAX_DESCRIPTION_LENGTH = 300;
const SOUND_LAYERS = ['ocean', 'rain', 'birds', 'breeze'] as const;
type SoundLayer = (typeof SOUND_LAYERS)[number];

interface SoundBlendRequestBody {
  description?: unknown;
}

const SYSTEM_PROMPT = `You turn a short description into a blend of exactly four ambient sound layers: ocean, rain, birds, breeze. These are the ONLY four sounds that exist in this system — you are not generating new sound types, just deciding how loud each of the four should be for the described scene or vibe.

The description might be literal ("a stormy ocean at night") or a mood/genre vibe ("chill lo-fi coffee shop", "upbeat morning energy") — interpret either kind and translate it into weights for the four layers.

Respond with ONLY a JSON object, no other text, in exactly this shape:
{"ocean": 0.0, "rain": 0.0, "birds": 0.0, "breeze": 0.0}

Each value is a number from 0 (silent) to 1 (loudest). At least one value should be above 0.`;

function aquaConfig(): { apiKey: string; baseUrl: string } | null {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL;
  return apiKey && baseUrl ? { apiKey, baseUrl } : null;
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
    if (typeof value !== 'number' || Number.isNaN(value)) return null;
    blend[layer] = Math.max(0, Math.min(1, value));
  }

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
            ? 'Too many requests — please slow down and try again in a minute.'
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run api/sound-blend.test.ts`
Expected: PASS, all 8 tests.

- [ ] **Step 5: Commit**

```bash
git add api/sound-blend.ts api/sound-blend.test.ts
git commit -m "Add sound-blend edge function: description to ambient layer weights"
```

---

## Task 5: Client wrapper for the sound-blend endpoint

**Files:**
- Create: `src/lib/audio/soundBlendClient.ts`
- Test: `src/lib/audio/soundBlendClient.test.ts`

**Interfaces:**
- Consumes: `LayerVolumes` from `./soundMixer` (Task 3).
- Produces: `requestSoundBlend(description: string): Promise<LayerVolumes>` — throws on any non-2xx response.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/audio/soundBlendClient.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/audio/soundBlendClient.test.ts`
Expected: FAIL — cannot find module `./soundBlendClient`.

- [ ] **Step 3: Implement soundBlendClient.ts**

Create `src/lib/audio/soundBlendClient.ts`:

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/audio/soundBlendClient.test.ts`
Expected: PASS, both tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/audio/soundBlendClient.ts src/lib/audio/soundBlendClient.test.ts
git commit -m "Add client wrapper for the sound-blend endpoint"
```

---

## Task 6: SoundButton component

**Files:**
- Modify: `src/components/icons.tsx` (add `WaveIcon`)
- Create: `src/components/SoundButton.tsx`
- Modify: `src/styles/theme.css` (add `.sound-button`/`.sound-button-playing` styles)
- Test: `src/components/SoundButton.test.tsx`

**Interfaces:**
- Consumes: `isPlaying`, `subscribeToSoundMixer` from `../lib/audio/soundMixer` (Task 3); `isAudioSupported` from `../lib/audio/soundSynth` (Task 2).
- Produces: `SoundButton({ onClick: () => void })` component, `WaveIcon` icon.

- [ ] **Step 1: Write the failing tests**

Create `src/components/SoundButton.test.tsx`:

```tsx
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { mixerState, listeners } = vi.hoisted(() => ({
  mixerState: { playing: false },
  listeners: new Set<(volumes: unknown) => void>(),
}));

vi.mock('../lib/audio/soundMixer', () => ({
  isPlaying: () => mixerState.playing,
  subscribeToSoundMixer: (listener: (volumes: unknown) => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
}));
vi.mock('../lib/audio/soundSynth', () => ({
  isAudioSupported: () => true,
}));

import { SoundButton } from './SoundButton';
import * as soundSynth from '../lib/audio/soundSynth';

describe('SoundButton', () => {
  afterEach(() => {
    mixerState.playing = false;
    listeners.clear();
    vi.mocked(soundSynth.isAudioSupported).mockReturnValue(true);
  });

  it('calls onClick when pressed', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<SoundButton onClick={onClick} />);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not show a playing state when nothing is playing', () => {
    mixerState.playing = false;
    render(<SoundButton onClick={() => {}} />);
    expect(screen.getByRole('button')).not.toHaveClass('sound-button-playing');
  });

  it('shows a playing state when the mixer reports something is playing', () => {
    mixerState.playing = true;
    render(<SoundButton onClick={() => {}} />);
    expect(screen.getByRole('button')).toHaveClass('sound-button-playing');
  });

  it('renders nothing when the browser has no Web Audio support', () => {
    vi.mocked(soundSynth.isAudioSupported).mockReturnValue(false);
    const { container } = render(<SoundButton onClick={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/SoundButton.test.tsx`
Expected: FAIL — cannot find module `./SoundButton`.

- [ ] **Step 3: Add WaveIcon to icons.tsx**

Add to `src/components/icons.tsx`, after the `QuoteIcon` function (end of file):

```tsx
export function WaveIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 12c1.5-3 3-3 4.5 0s3 3 4.5 0 3-3 4.5 0 3 3 4.5 0" />
    </svg>
  );
}
```

- [ ] **Step 4: Implement SoundButton.tsx**

Create `src/components/SoundButton.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { isPlaying, subscribeToSoundMixer } from '../lib/audio/soundMixer';
import { isAudioSupported } from '../lib/audio/soundSynth';
import { WaveIcon } from './icons';

interface SoundButtonProps {
  onClick: () => void;
}

export function SoundButton({ onClick }: SoundButtonProps) {
  const [playing, setPlaying] = useState(() => isPlaying());

  useEffect(() => subscribeToSoundMixer(() => setPlaying(isPlaying())), []);

  if (!isAudioSupported()) return null;

  return (
    <button
      className={`sound-button glass ${playing ? 'sound-button-playing' : ''}`}
      onClick={onClick}
      aria-label={playing ? 'Ambient sounds playing — open sound picker' : 'Open ambient sound picker'}
      title="Ambient sounds"
    >
      <WaveIcon />
    </button>
  );
}
```

- [ ] **Step 5: Add CSS**

Add to `src/styles/theme.css`, after the `.sidebar-toggle-btn:hover` block:

```css
.sound-button {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--glass-border) !important;
  border-radius: 999px;
  width: 2.5rem;
  height: 2.5rem;
  color: var(--color-text-soft);
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 0.15s ease, color 0.15s ease;
}

.sound-button:hover {
  transform: translateY(-1px);
  color: var(--color-text);
}

.sound-button-playing {
  color: var(--color-accent);
  animation: sound-glow-pulse 2.4s ease-in-out infinite;
}

@keyframes sound-glow-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 var(--color-accent);
  }
  50% {
    box-shadow: 0 0 10px 2px var(--color-accent);
  }
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run src/components/SoundButton.test.tsx`
Expected: PASS, all 4 tests.

- [ ] **Step 7: Commit**

```bash
git add src/components/icons.tsx src/components/SoundButton.tsx src/components/SoundButton.test.tsx src/styles/theme.css
git commit -m "Add circular SoundButton with a playing-state glow indicator"
```

---

## Task 7: SoundsOverlay component

**Files:**
- Create: `src/components/SoundsOverlay.tsx`
- Modify: `src/styles/theme.css` (add `.sounds-*` styles)

**Interfaces:**
- Consumes: `applyBlend`, `getVolumes`, `isPlaying`, `loadSoundMix`, `setLayerVolume`, `stopAll`, `subscribeToSoundMixer`, `toggleLayer`, `LayerVolumes` from `../lib/audio/soundMixer` (Task 3); `SOUND_LAYERS`, `SoundLayer` from `../lib/audio/soundSynth` (Task 2); `requestSoundBlend` from `../lib/audio/soundBlendClient` (Task 5); `loadSoundDescription`, `saveSoundDescription` from `../lib/storage` (Task 1); `CloseIcon` from `./icons`.
- Produces: `SoundsOverlay({ onClose: () => void })` component.

No dedicated component test file for this one — this codebase's existing convention for full-screen in-app overlays (`SettingsModal.tsx`, `ProfileSetupModal.tsx`) is to cover them via `App.test.tsx` integration tests rather than isolated component tests, since they're mostly composition of already-tested pieces (`soundMixer`, `soundBlendClient`) plus layout. Task 8 adds that App-level coverage; this task is verified manually via the dev server at the end.

- [ ] **Step 1: Implement SoundsOverlay.tsx**

Create `src/components/SoundsOverlay.tsx`:

```tsx
import { FormEvent, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from './icons';
import {
  applyBlend,
  getVolumes,
  isPlaying,
  loadSoundMix,
  setLayerVolume,
  stopAll,
  subscribeToSoundMixer,
  toggleLayer,
  LayerVolumes,
} from '../lib/audio/soundMixer';
import { SOUND_LAYERS, SoundLayer } from '../lib/audio/soundSynth';
import { requestSoundBlend } from '../lib/audio/soundBlendClient';
import { loadSoundDescription, saveSoundDescription } from '../lib/storage';

const LAYER_LABELS: Record<SoundLayer, string> = {
  ocean: 'Ocean',
  rain: 'Rain',
  birds: 'Birds',
  breeze: 'Breeze',
};

interface SoundsOverlayProps {
  onClose: () => void;
}

export function SoundsOverlay({ onClose }: SoundsOverlayProps) {
  const [volumes, setVolumes] = useState<LayerVolumes>(() => getVolumes());
  const [description, setDescription] = useState(() => loadSoundDescription());
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  // Computed once at mount, not re-derived on every render — once the user
  // acts (taps resume, or toggles anything), isPlaying() becomes true and
  // this affordance should simply disappear on the next volumes update.
  const [savedMix] = useState(() => loadSoundMix());
  const showResume = !isPlaying() && savedMix !== null;

  useEffect(() => subscribeToSoundMixer((next) => setVolumes(next)), []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  async function handleDescriptionSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = description.trim();
    if (!trimmed) return;
    setStatus('loading');
    try {
      const blend = await requestSoundBlend(trimmed);
      applyBlend(blend);
      saveSoundDescription(trimmed);
      setStatus('idle');
    } catch {
      setStatus('error');
    }
  }

  return createPortal(
    <div className="privacy-modal-backdrop" onClick={onClose}>
      <div
        className="privacy-modal-card glass-strong sounds-overlay-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Ambient sounds"
      >
        <button className="settings-close-btn" onClick={onClose} aria-label="Close ambient sounds">
          <CloseIcon />
        </button>

        <h2 className="privacy-modal-title settings-title">Ambient sounds</h2>

        {showResume && savedMix && (
          <button className="settings-secondary-btn sounds-resume-btn" onClick={() => applyBlend(savedMix)}>
            Resume last mix
          </button>
        )}

        <div className="sounds-preset-grid">
          {SOUND_LAYERS.map((layer) => {
            const volume = volumes[layer];
            const active = volume > 0;
            return (
              <div key={layer} className={`sounds-preset ${active ? 'sounds-preset-active' : ''}`}>
                <button
                  className="sounds-preset-toggle"
                  onClick={() => toggleLayer(layer)}
                  aria-pressed={active}
                >
                  {LAYER_LABELS[layer]}
                </button>
                {active && (
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={volume}
                    onChange={(e) => setLayerVolume(layer, Number(e.target.value))}
                    aria-label={`${LAYER_LABELS[layer]} volume`}
                  />
                )}
              </div>
            );
          })}
        </div>

        <form className="sounds-description-form" onSubmit={handleDescriptionSubmit}>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your own sound…"
            maxLength={300}
            aria-label="Describe your own sound"
          />
          <button
            type="submit"
            className="settings-secondary-btn"
            disabled={status === 'loading' || !description.trim()}
          >
            {status === 'loading' ? 'Creating…' : 'Create'}
          </button>
        </form>
        {status === 'error' && (
          <p className="sounds-error">Couldn't create that sound — try describing it differently.</p>
        )}

        <button className="settings-danger-btn sounds-stop-all" onClick={stopAll}>
          Stop all
        </button>
      </div>
    </div>,
    document.body
  );
}
```

- [ ] **Step 2: Add CSS**

Add to `src/styles/theme.css`, after the `.settings-ai-desc {}` block:

```css
.sounds-overlay-card {
  max-width: 420px;
  text-align: left;
  position: relative;
}

.sounds-resume-btn {
  margin-bottom: 1rem;
}

.sounds-preset-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.sounds-preset {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.sounds-preset-toggle {
  border: 1px solid var(--glass-border);
  background: var(--glass-bg);
  border-radius: 0.9rem;
  padding: 0.6rem 0.9rem;
  cursor: pointer;
  font-weight: 600;
  color: var(--color-text);
  transition: transform 0.15s ease, background 0.15s ease;
}

.sounds-preset-toggle:hover {
  transform: translateY(-1px);
}

.sounds-preset-active .sounds-preset-toggle {
  background: linear-gradient(135deg, var(--color-accent), var(--color-accent-2));
  border-color: transparent;
}

.sounds-preset input[type='range'] {
  width: 100%;
}

.sounds-description-form {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.sounds-description-form input[type='text'] {
  flex: 1;
  border: 1px solid var(--glass-border);
  background: var(--glass-bg);
  border-radius: 0.75rem;
  padding: 0.6rem 0.9rem;
  color: var(--color-text);
}

.sounds-error {
  font-size: 0.85rem;
  color: var(--color-text-soft);
  margin: 0 0 0.75rem;
}

.sounds-stop-all {
  width: 100%;
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc -b --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/SoundsOverlay.tsx src/styles/theme.css
git commit -m "Add SoundsOverlay: presets, per-layer volume, and AI custom description"
```

---

## Task 8: Wire into App.tsx and add integration tests

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

**Interfaces:**
- Consumes: `SoundButton` (Task 6), `SoundsOverlay` (Task 7).

- [ ] **Step 1: Write the failing integration tests**

Add this new `describe` block to `src/App.test.tsx`, right before the closing `afterEach` at the end of the outer `describe('App', ...)` block (i.e. after the `settings` describe block, following its exact style):

```tsx
  describe('ambient sounds', () => {
    function getSoundButton(): HTMLElement {
      return screen.getByLabelText('Open ambient sound picker');
    }

    it('opens the ambient sounds overlay from the chat header', async () => {
      const user = userEvent.setup();
      await completeOnboarding(user);

      await user.click(getSoundButton());

      expect(screen.getByRole('dialog', { name: 'Ambient sounds' })).toBeInTheDocument();
    });

    it('toggling a preset shows it as active, and closing the overlay keeps it playing', async () => {
      const user = userEvent.setup();
      await completeOnboarding(user);

      await user.click(getSoundButton());
      await user.click(screen.getByRole('button', { name: 'Ocean' }));
      expect(screen.getByRole('button', { name: 'Ocean' })).toHaveAttribute('aria-pressed', 'true');

      await user.click(screen.getByLabelText('Close ambient sounds'));
      expect(screen.queryByRole('dialog', { name: 'Ambient sounds' })).not.toBeInTheDocument();
      expect(screen.getByLabelText(/ambient sounds playing/i)).toBeInTheDocument();
    });
  });
```

Note: this relies on the fake `AudioContext` added to `src/test/setup.ts` in Task 2 — without it, clicking "Ocean" would throw since jsdom has no real Web Audio API.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/App.test.tsx`
Expected: FAIL — `getByLabelText('Open ambient sound picker')` not found (button doesn't exist in the tree yet).

- [ ] **Step 3: Wire SoundButton and SoundsOverlay into App.tsx**

Add imports to `src/App.tsx`, alongside the existing component imports (after the `SettingsModal` import):

```tsx
import { SoundButton } from './components/SoundButton';
import { SoundsOverlay } from './components/SoundsOverlay';
```

Add state near the existing `showSettings` state declaration:

```tsx
const [showSounds, setShowSounds] = useState(false);
```

In the header's `app-header-controls-right` div, add `<SoundButton />` right after `<AiStatusIndicator />` and before `<PrivacyToggle>`:

```tsx
          <div className="app-header-controls app-header-controls-right">
            <AiStatusIndicator />
            <SoundButton onClick={() => setShowSounds(true)} />
            <PrivacyToggle
```

Right after the existing `{showSettings && <SettingsModal ... />}` block, add:

```tsx
      {showSounds && <SoundsOverlay onClose={() => setShowSounds(false)} />}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/App.test.tsx`
Expected: PASS, all tests including the new `ambient sounds` block.

- [ ] **Step 5: Run the full test suite**

Run: `npx vitest run`
Expected: PASS, every test file green.

- [ ] **Step 6: Type-check**

Run: `npx tsc -b --noEmit`
Expected: No errors.

- [ ] **Step 7: Manual verification**

Run the dev server (`npm run dev`), open the app, complete onboarding, and confirm by ear/eye:
- The circular sound button appears in the chat header.
- Tapping it opens the overlay; tapping Ocean/Rain/Birds/Breeze actually produces the intended texture (rolling low hum, hiss, occasional chirps, wandering whoosh respectively) and each has a working volume slider.
- Multiple layers play simultaneously when more than one preset is active.
- Closing the overlay (X button, Escape key, or clicking the backdrop) keeps the sound playing, and the circular button shows its glow.
- Reopening the overlay while a saved mix from a previous visit exists (refresh the page after playing something) shows "Resume last mix" and tapping it starts audio.
- Typing a description (e.g. "a quiet forest morning" or "chill lo-fi coffee shop") and submitting produces a sensible blend within a few seconds, and an intentionally-empty/gibberish submission shows the inline error message instead of crashing.
- "Stop all" silences everything.

- [ ] **Step 8: Commit**

```bash
git add src/App.tsx src/App.test.tsx
git commit -m "Wire the ambient sounds button and overlay into the main chat"
```
