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
    // Fire-and-forget: there's nothing user-visible to do with a rejection
    // here (the caller already has the context reference and just proceeds
    // to use it), but an unhandled promise rejection is still worth
    // avoiding, so catch and drop it.
    sharedContext.resume().catch(() => {});
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
// into one AudioParam create a slow wander around whatever value the target
// AudioParam already has — depth controls how far it wanders, baseRateHz
// how fast — that never exactly repeats within a single playback, instead
// of one oscillator's perfectly periodic pulse.
function connectWanderingValue(
  context: AudioContext,
  target: AudioParam,
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

  lfoA.connect(depthGainA).connect(target);
  lfoB.connect(depthGainB).connect(target);

  lfoA.start();
  lfoB.start();

  return () => {
    lfoA.stop();
    lfoB.stop();
  };
}

// Shared trim applied after every layer's own volumeGain, before the
// hardware destination — headroom against clipping when several layers are
// stacked at once, on top of each layer's own per-type trim below.
const MASTER_TRIM = 0.75;

let masterGain: GainNode | null = null;

function getMasterGain(context: AudioContext): GainNode {
  if (!masterGain) {
    masterGain = context.createGain();
    masterGain.gain.value = MASTER_TRIM;
    masterGain.connect(context.destination);
  }
  return masterGain;
}

function createVolumeGain(context: AudioContext): GainNode {
  const gain = context.createGain();
  gain.gain.value = 0;
  gain.connect(getMasterGain(context));
  return gain;
}

// Volume changes ramp instead of jumping instantly — a plain `gain.value =`
// assignment is an instantaneous step, which is an audible click/pop, and
// since setVolume is called on every slider-drag tick that would mean a
// "zipper" of clicks while dragging. Stop ramps to silence first and only
// disconnects once the fade has actually finished (on the real clock —
// Web Audio has no primitive for "run this JS callback at audio time X"),
// so it doesn't get cut off by an immediate disconnect.
const VOLUME_RAMP_SECONDS = 0.05;
const STOP_FADE_SECONDS = 0.1;

function makeController(context: AudioContext, volumeGain: GainNode, cleanup: () => void): LayerController {
  return {
    setVolume(volume: number) {
      const clamped = Math.max(0, Math.min(1, volume));
      volumeGain.gain.linearRampToValueAtTime(clamped, context.currentTime + VOLUME_RAMP_SECONDS);
    },
    stop() {
      volumeGain.gain.linearRampToValueAtTime(0, context.currentTime + STOP_FADE_SECONDS);
      setTimeout(() => {
        cleanup();
        volumeGain.disconnect();
      }, STOP_FADE_SECONDS * 1000);
    },
  };
}

// Per-layer trim constants so all four layers read as roughly balanced
// against each other at the same setVolume() input — without these, a
// layer's timbre (pure tone vs. filtered noise, which frequency range)
// affects perceived loudness far more than the 0-1 slider position does.
const OCEAN_SHAPE_GAIN = 0.7; // mostly low-frequency energy, already reads as gentler to the ear
const RAIN_TRIM = 0.55; // bandpass noise centered near 3kHz — the ear's most sensitive range, so trimmed down
const BREEZE_TRIM = 0.6; // bandpass noise centered near 800Hz — less sensitive range, trimmed mainly for headroom
// A raw sine burst at full scale is genuinely piercing, especially in the
// 2.2-3.4kHz range (the ear's most sensitive band) — trimmed hard so a chirp
// reads as a bright accent instead of dominating the other three layers.
const BIRDS_CHIRP_GAIN = 0.2;

// Low-pass-filtered noise with a slow, irregular gain envelope — the uneven
// rolling swell of waves breaking non-periodically.
export function createOceanLayer(context: AudioContext): LayerController {
  const noise = createLoopingNoise(context);
  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 500;
  noise.connect(filter);

  const shapeGain = context.createGain();
  shapeGain.gain.value = OCEAN_SHAPE_GAIN;
  filter.connect(shapeGain);

  const volumeGain = createVolumeGain(context);
  shapeGain.connect(volumeGain);

  const stopWander = connectWanderingValue(context, shapeGain.gain, 0.3, 0.12);

  return makeController(context, volumeGain, () => {
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

  const trimGain = context.createGain();
  trimGain.gain.value = RAIN_TRIM;
  filter.connect(trimGain);

  const volumeGain = createVolumeGain(context);
  trimGain.connect(volumeGain);

  return makeController(context, volumeGain, () => {
    noise.stop();
    noise.disconnect();
    filter.disconnect();
    trimGain.disconnect();
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

  const trimGain = context.createGain();
  trimGain.gain.value = BREEZE_TRIM;
  filter.connect(trimGain);

  const volumeGain = createVolumeGain(context);
  trimGain.connect(volumeGain);

  const stopWander = connectWanderingValue(context, filter.frequency, 400, 0.05);

  return makeController(context, volumeGain, () => {
    noise.stop();
    stopWander();
    noise.disconnect();
    filter.disconnect();
    trimGain.disconnect();
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
    chirpGain.gain.linearRampToValueAtTime(BIRDS_CHIRP_GAIN, context.currentTime + 0.02);
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

  return makeController(context, volumeGain, () => {
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
