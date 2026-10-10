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
    // @ts-expect-error, intentionally deleting for this one test
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
