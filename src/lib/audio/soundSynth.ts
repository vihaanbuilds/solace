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

// ---- Noise sources -------------------------------------------------------
// White noise is what made the first version sound like static, so every
// layer is built from pink (equal energy per octave, natural-sounding) or
// brown (deep, rumbly) noise instead, shaped with filters and slow envelopes.

interface NoiseCache {
  context: AudioContext;
  pink: AudioBuffer;
  brown: AudioBuffer;
}
let noiseCache: NoiseCache | null = null;

function getNoise(context: AudioContext): NoiseCache {
  if (noiseCache && noiseCache.context === context) return noiseCache;
  const length = Math.floor(context.sampleRate * 10);

  const pink = context.createBuffer(1, length, context.sampleRate);
  const pinkData = pink.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < length; i += 1) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    pinkData[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
  }

  const brown = context.createBuffer(1, length, context.sampleRate);
  const brownData = brown.getChannelData(0);
  let last = 0;
  for (let i = 0; i < length; i += 1) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    brownData[i] = last * 3.5;
  }

  noiseCache = { context, pink, brown };
  return noiseCache;
}

// Starts at a random offset so two sources of the same buffer never line up.
function createLoopingSource(context: AudioContext, buffer: AudioBuffer): AudioBufferSourceNode {
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.start(0, Math.random() * (buffer.duration || 1));
  return source;
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

// Collects setTimeout ids so a layer can cancel everything it scheduled.
function createTimers() {
  const ids = new Set<ReturnType<typeof setTimeout>>();
  let stopped = false;
  return {
    after(ms: number, fn: () => void) {
      if (stopped) return;
      const id = setTimeout(() => {
        ids.delete(id);
        if (!stopped) fn();
      }, ms);
      ids.add(id);
    },
    stop() {
      stopped = true;
      ids.forEach(clearTimeout);
      ids.clear();
    },
  };
}

// Shared trim applied after every layer's own volumeGain, before the
// hardware destination — headroom against clipping when several layers are
// stacked at once.
const MASTER_TRIM = 0.75;

let masterGain: GainNode | null = null;

function getMasterGain(context: AudioContext): GainNode {
  if (!masterGain || (masterGain.context as AudioContext) !== context) {
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
// assignment is an audible click, and setVolume runs on every slider-drag
// tick. Stop ramps to silence first and only disconnects once the fade has
// finished.
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

// ---- Ocean ---------------------------------------------------------------
// A faint deep bed plus two overlapping wave voices. Each wave swells in
// (filter opening up as it builds), crests, then recedes into a soft "shhh"
// of foam — and the next one arrives at a different, irregular time.

function createOceanLayer(context: AudioContext): LayerController {
  const { pink, brown } = getNoise(context);
  const volumeGain = createVolumeGain(context);
  const timers = createTimers();
  const sources: AudioBufferSourceNode[] = [];
  const nodes: AudioNode[] = [];

  const bed = createLoopingSource(context, brown);
  const bedFilter = context.createBiquadFilter();
  bedFilter.type = 'lowpass';
  bedFilter.frequency.value = 220;
  const bedGain = context.createGain();
  bedGain.gain.value = 0.22;
  bed.connect(bedFilter).connect(bedGain).connect(volumeGain);
  sources.push(bed);
  nodes.push(bedFilter, bedGain);

  function createWaveVoice(initialDelayMs: number) {
    const body = createLoopingSource(context, pink);
    const bodyFilter = context.createBiquadFilter();
    bodyFilter.type = 'lowpass';
    bodyFilter.frequency.value = 300;
    const bodyGain = context.createGain();
    bodyGain.gain.value = 0;

    const foam = createLoopingSource(context, pink);
    const foamFilter = context.createBiquadFilter();
    foamFilter.type = 'bandpass';
    foamFilter.frequency.value = 2200;
    foamFilter.Q.value = 0.6;
    const foamGain = context.createGain();
    foamGain.gain.value = 0;

    body.connect(bodyFilter).connect(bodyGain).connect(volumeGain);
    foam.connect(foamFilter).connect(foamGain).connect(volumeGain);
    sources.push(body, foam);
    nodes.push(bodyFilter, bodyGain, foamFilter, foamGain);

    function wave() {
      const now = context.currentTime;
      const duration = rand(6, 11);
      const peak = rand(0.55, 1);
      const crestAt = now + duration * 0.4;

      bodyGain.gain.setValueAtTime(0.03, now);
      bodyGain.gain.linearRampToValueAtTime(peak, crestAt);
      bodyGain.gain.linearRampToValueAtTime(0.03, now + duration);
      bodyFilter.frequency.setValueAtTime(260, now);
      bodyFilter.frequency.linearRampToValueAtTime(rand(1100, 1900), crestAt);
      bodyFilter.frequency.linearRampToValueAtTime(380, now + duration);

      // Foam hiss lags the crest, like water draining back through sand.
      foamGain.gain.setValueAtTime(0, now);
      foamGain.gain.setValueAtTime(0, crestAt - 0.3);
      foamGain.gain.linearRampToValueAtTime(peak * 0.28, crestAt + duration * 0.12);
      foamGain.gain.linearRampToValueAtTime(0, now + duration * 1.1);

      timers.after(duration * 1000 + rand(300, 2800), wave);
    }

    timers.after(initialDelayMs, wave);
  }

  createWaveVoice(0);
  createWaveVoice(rand(3500, 5500));

  return makeController(context, volumeGain, () => {
    timers.stop();
    sources.forEach((source) => {
      source.stop();
      source.disconnect();
    });
    nodes.forEach((node) => node.disconnect());
  });
}

// ---- Rain ----------------------------------------------------------------
// A soft rolled-off hiss bed (no harsh highs), a mid "patter" band, and lots
// of tiny individual droplets so it has texture instead of a flat wash.

function createRainLayer(context: AudioContext): LayerController {
  const { pink } = getNoise(context);
  const volumeGain = createVolumeGain(context);
  const timers = createTimers();
  const sources: AudioBufferSourceNode[] = [];
  const nodes: AudioNode[] = [];

  const hiss = createLoopingSource(context, pink);
  const hissHigh = context.createBiquadFilter();
  hissHigh.type = 'highpass';
  hissHigh.frequency.value = 500;
  const hissLow = context.createBiquadFilter();
  hissLow.type = 'lowpass';
  hissLow.frequency.value = 4200;
  const hissGain = context.createGain();
  hissGain.gain.value = 0.5;
  hiss.connect(hissHigh).connect(hissLow).connect(hissGain).connect(volumeGain);
  sources.push(hiss);
  nodes.push(hissHigh, hissLow, hissGain);

  const patter = createLoopingSource(context, pink);
  const patterFilter = context.createBiquadFilter();
  patterFilter.type = 'bandpass';
  patterFilter.frequency.value = 1300;
  patterFilter.Q.value = 0.5;
  const patterGain = context.createGain();
  patterGain.gain.value = 0.3;
  patter.connect(patterFilter).connect(patterGain).connect(volumeGain);
  sources.push(patter);
  nodes.push(patterFilter, patterGain);

  function drop() {
    const now = context.currentTime;
    const osc = context.createOscillator();
    osc.type = 'sine';
    const freq = rand(900, 3200);
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.linearRampToValueAtTime(freq * rand(0.6, 0.9), now + 0.05);
    const gain = context.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(rand(0.01, 0.045), now + 0.004);
    gain.gain.linearRampToValueAtTime(0, now + rand(0.03, 0.07));
    osc.connect(gain).connect(volumeGain);
    osc.start(now);
    osc.stop(now + 0.09);
    timers.after(rand(25, 90), drop);
  }
  timers.after(0, drop);
  timers.after(40, drop);

  return makeController(context, volumeGain, () => {
    timers.stop();
    sources.forEach((source) => {
      source.stop();
      source.disconnect();
    });
    nodes.forEach((node) => node.disconnect());
  });
}

// ---- Breeze --------------------------------------------------------------
// Wind is gusts: a low bandpassed body whose loudness and tone swell and fall
// every few seconds, a faint airy rustle on top, and a very quiet resonant
// whistle that drifts like wind through branches.

function createBreezeLayer(context: AudioContext): LayerController {
  const { pink } = getNoise(context);
  const volumeGain = createVolumeGain(context);
  const timers = createTimers();
  const sources: AudioBufferSourceNode[] = [];
  const nodes: AudioNode[] = [];

  const body = createLoopingSource(context, pink);
  const bodyFilter = context.createBiquadFilter();
  bodyFilter.type = 'bandpass';
  bodyFilter.frequency.value = 450;
  bodyFilter.Q.value = 1.1;
  const bodyGain = context.createGain();
  bodyGain.gain.value = 0.3;
  body.connect(bodyFilter).connect(bodyGain).connect(volumeGain);

  const air = createLoopingSource(context, pink);
  const airHigh = context.createBiquadFilter();
  airHigh.type = 'highpass';
  airHigh.frequency.value = 1800;
  const airLow = context.createBiquadFilter();
  airLow.type = 'lowpass';
  airLow.frequency.value = 5000;
  const airGain = context.createGain();
  airGain.gain.value = 0.05;
  air.connect(airHigh).connect(airLow).connect(airGain).connect(volumeGain);

  const whistle = createLoopingSource(context, pink);
  const whistleFilter = context.createBiquadFilter();
  whistleFilter.type = 'bandpass';
  whistleFilter.frequency.value = 650;
  whistleFilter.Q.value = 14;
  const whistleGain = context.createGain();
  whistleGain.gain.value = 0.02;
  whistle.connect(whistleFilter).connect(whistleGain).connect(volumeGain);

  sources.push(body, air, whistle);
  nodes.push(bodyFilter, bodyGain, airHigh, airLow, airGain, whistleFilter, whistleGain);

  function gust() {
    const now = context.currentTime;
    const strength = rand(0.1, 1);
    const rise = rand(1.2, 2.6);
    bodyGain.gain.setTargetAtTime(0.1 + strength * 0.9, now, rise);
    bodyFilter.frequency.setTargetAtTime(280 + strength * 520, now, rise);
    airGain.gain.setTargetAtTime(0.02 + strength * 0.2, now, rise);
    whistleGain.gain.setTargetAtTime(strength * strength * 0.07, now, rise);
    whistleFilter.frequency.setTargetAtTime(rand(480, 1100), now, rise);
    timers.after(rand(3000, 7500), gust);
  }
  gust();

  return makeController(context, volumeGain, () => {
    timers.stop();
    sources.forEach((source) => {
      source.stop();
      source.disconnect();
    });
    nodes.forEach((node) => node.disconnect());
  });
}

// ---- Birds ---------------------------------------------------------------
// A forest dawn chorus: several individual birds, each with its own pitch
// range, position in the stereo field and a couple of songs. Every bird
// independently sings, goes quiet for a while, and sings again, so the
// overall pattern is dense but never repeats. Notes are snapped to a
// pentatonic scale so overlapping birds sound musical rather than dissonant.

const PENTATONIC_STEPS = [0, 2, 4, 7, 9];

function pentatonic(baseHz: number, degree: number): number {
  const octave = Math.floor(degree / PENTATONIC_STEPS.length);
  const step = PENTATONIC_STEPS[((degree % PENTATONIC_STEPS.length) + PENTATONIC_STEPS.length) % PENTATONIC_STEPS.length];
  return baseHz * Math.pow(2, (octave * 12 + step) / 12);
}

function playNote(
  context: AudioContext,
  out: AudioNode,
  time: number,
  fromHz: number,
  toHz: number,
  duration: number,
  peak: number,
  vibrato = false
) {
  const osc = context.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(fromHz, time);
  osc.frequency.linearRampToValueAtTime(toHz, time + duration);

  const harmonic = context.createOscillator();
  harmonic.type = 'sine';
  harmonic.frequency.setValueAtTime(fromHz * 2, time);
  harmonic.frequency.linearRampToValueAtTime(toHz * 2, time + duration);
  const harmonicGain = context.createGain();
  harmonicGain.gain.value = 0.12;

  const gain = context.createGain();
  const attack = Math.min(0.025, duration * 0.25);
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(peak, time + attack);
  gain.gain.linearRampToValueAtTime(peak * 0.6, time + duration * 0.6);
  gain.gain.linearRampToValueAtTime(0, time + duration);

  osc.connect(gain);
  harmonic.connect(harmonicGain).connect(gain);
  gain.connect(out);

  let lfo: OscillatorNode | null = null;
  if (vibrato) {
    lfo = context.createOscillator();
    lfo.frequency.value = rand(5, 8);
    const lfoGain = context.createGain();
    lfoGain.gain.value = fromHz * 0.015;
    lfo.connect(lfoGain).connect(osc.frequency);
    lfo.start(time);
    lfo.stop(time + duration + 0.02);
  }

  osc.start(time);
  harmonic.start(time);
  osc.stop(time + duration + 0.02);
  harmonic.stop(time + duration + 0.02);
}

// Each song returns how long it lasted, in seconds.
type Song = (context: AudioContext, out: AudioNode, time: number, base: number) => number;

// Slow, flute-like phrase — a few glided pure notes (robin/thrush).
const whistleSong: Song = (context, out, time, base) => {
  let t = time;
  let degree = Math.floor(rand(0, 4));
  const count = Math.floor(rand(3, 6));
  for (let i = 0; i < count; i += 1) {
    const next = degree + Math.floor(rand(-2, 3));
    const dur = rand(0.18, 0.42);
    playNote(context, out, t, pentatonic(base, degree), pentatonic(base, next), dur, 0.11, true);
    degree = next;
    t += dur + rand(0.04, 0.16);
  }
  return t - time;
};

// Fast run of tiny notes bouncing between two pitches (warbler/canary).
const trillSong: Song = (context, out, time, base) => {
  const low = pentatonic(base, Math.floor(rand(0, 3)));
  const high = low * rand(1.1, 1.25);
  const count = Math.floor(rand(8, 17));
  const spacing = rand(0.045, 0.075);
  for (let i = 0; i < count; i += 1) {
    const f = i % 2 === 0 ? low : high;
    playNote(context, out, time + i * spacing, f, f * 1.04, spacing * 0.8, 0.07);
  }
  return count * spacing;
};

// Short repeated upward sweeps (sparrow/finch).
const chirpSong: Song = (context, out, time, base) => {
  const f = pentatonic(base, Math.floor(rand(0, 5)));
  const count = Math.floor(rand(2, 5));
  const gap = rand(0.13, 0.22);
  for (let i = 0; i < count; i += 1) {
    playNote(context, out, time + i * gap, f, f * rand(1.2, 1.4), 0.09, 0.09);
  }
  return count * gap;
};

// Two-note falling "fee-bee" (chickadee).
const feebeeSong: Song = (context, out, time, base) => {
  const high = pentatonic(base, Math.floor(rand(2, 6)));
  const low = high * 0.84;
  playNote(context, out, time, high, high * 0.98, 0.32, 0.1);
  playNote(context, out, time + 0.4, low, low * 0.97, 0.45, 0.1);
  return 0.85;
};

// Low, soft, slow cooing (dove) — adds depth under the bright birds.
const cooSong: Song = (context, out, time, base) => {
  const f = base * 0.28;
  const count = Math.floor(rand(3, 5));
  for (let i = 0; i < count; i += 1) {
    const dur = i === count - 1 ? 0.7 : 0.28;
    playNote(context, out, time + i * 0.42, f * 1.05, f * 0.92, dur, 0.1);
  }
  return count * 0.42 + 0.4;
};

// Each bird gets a base pitch, a stereo position and two songs it favours.
const BIRD_PROFILES: Array<{ base: number; pan: number; songs: Song[] }> = [
  { base: 1500, pan: -0.8, songs: [whistleSong, feebeeSong] },
  { base: 2000, pan: -0.4, songs: [trillSong, chirpSong] },
  { base: 2400, pan: 0.5, songs: [chirpSong, whistleSong] },
  { base: 1800, pan: 0.85, songs: [feebeeSong, trillSong] },
  { base: 3000, pan: -0.1, songs: [trillSong, whistleSong] },
  { base: 2700, pan: 0.2, songs: [chirpSong, feebeeSong] },
  { base: 1700, pan: -0.65, songs: [cooSong, whistleSong] },
];

// A synthetic room: exponentially-decaying noise, so birds feel like they're
// among trees rather than inside the speakers.
function createReverbImpulse(context: AudioContext): AudioBuffer {
  const seconds = 2.4;
  const length = Math.floor(context.sampleRate * seconds);
  const buffer = context.createBuffer(2, length, context.sampleRate);
  for (let channel = 0; channel < 2; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3);
    }
  }
  return buffer;
}

function createBirdsLayer(context: AudioContext): LayerController {
  const volumeGain = createVolumeGain(context);
  const timers = createTimers();
  const nodes: AudioNode[] = [];

  const bus = context.createGain();
  bus.gain.value = 1;
  bus.connect(volumeGain);
  const convolver = context.createConvolver();
  convolver.buffer = createReverbImpulse(context);
  const wet = context.createGain();
  wet.gain.value = 0.4;
  bus.connect(convolver).connect(wet).connect(volumeGain);
  nodes.push(bus, convolver, wet);

  BIRD_PROFILES.forEach((profile, index) => {
    const birdGain = context.createGain();
    birdGain.gain.value = rand(0.6, 1);
    let out: AudioNode = birdGain;
    if (typeof context.createStereoPanner === 'function') {
      const panner = context.createStereoPanner();
      panner.pan.value = profile.pan;
      birdGain.connect(panner);
      panner.connect(bus);
      nodes.push(panner);
    } else {
      birdGain.connect(bus);
    }
    nodes.push(birdGain);

    function sing() {
      const song = profile.songs[Math.floor(Math.random() * profile.songs.length)];
      // Small per-performance pitch drift so the same bird never sings
      // quite the same line twice.
      const length = song(context, out, context.currentTime + 0.02, profile.base * rand(0.96, 1.05));
      // Sometimes a bird repeats itself, as real ones do.
      const repeat = Math.random() < 0.35 ? length + rand(0.25, 0.7) : 0;
      timers.after((length + repeat) * 1000 + rand(1200, 6500), sing);
      if (repeat > 0) {
        timers.after((length + rand(0.25, 0.7)) * 1000, () => {
          song(context, out, context.currentTime + 0.02, profile.base * rand(0.96, 1.05));
        });
      }
    }

    // Stagger the birds so the chorus builds up instead of all starting at once.
    timers.after(index * 400 + rand(0, 1800), sing);
  });

  return makeController(context, volumeGain, () => {
    timers.stop();
    nodes.forEach((node) => node.disconnect());
  });
}

export { createOceanLayer, createRainLayer, createBreezeLayer, createBirdsLayer };

export const LAYER_FACTORIES: Record<SoundLayer, (context: AudioContext) => LayerController> = {
  ocean: createOceanLayer,
  rain: createRainLayer,
  birds: createBirdsLayer,
  breeze: createBreezeLayer,
};
