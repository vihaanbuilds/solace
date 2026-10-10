import '@testing-library/jest-dom/vitest';

// Node's experimental built-in localStorage global shadows jsdom's working one in this Vitest version, so we provide a spec-faithful in-memory replacement.
class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

Object.defineProperty(globalThis, 'localStorage', {
  value: new MemoryStorage(),
  configurable: true,
  writable: true,
});

// jsdom does not implement scrollIntoView; polyfill as a no-op so components
// that call it (e.g. auto-scroll on new messages) don't throw in tests.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function scrollIntoView() {};
}

// jsdom does not implement matchMedia; polyfill with a static "no match" result
// so responsive/reduced-motion checks (e.g. mobile sidebar default, prefers-
// reduced-motion) don't throw. Tests that care about a specific match can
// override window.matchMedia themselves.
if (!window.matchMedia) {
  window.matchMedia = function matchMedia(query: string): MediaQueryList {
    return {
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    };
  };
}

// jsdom does not implement the Web Audio API at all. This is a minimal fake
// AudioContext with just enough surface for src/lib/audio/soundSynth.ts to
// run without throwing, connections and audio output are no-ops, since
// tests only need this code path not to crash, not to produce real sound.
function createFakeAudioParam(initial: number) {
  return {
    value: initial,
    setValueAtTime: () => {},
    linearRampToValueAtTime: () => {},
    setTargetAtTime: () => {},
  };
}

function createFakeAudioNode() {
  return {
    // Real AudioNode.connect() returns the destination node so calls can
    // chain (`a.connect(b).connect(c)`), soundSynth.ts relies on that, so
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
    return { getChannelData: () => data, duration: length / 44100 };
  }

  createStereoPanner() {
    return { ...createFakeAudioNode(), pan: createFakeAudioParam(0) };
  }

  createConvolver() {
    return { ...createFakeAudioNode(), buffer: null };
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
