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

  const stopWander = connectWanderingValue(context, shapeGain.gain, 0.3, 0.12);

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

  const stopWander = connectWanderingValue(context, filter.frequency, 400, 0.05);

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
