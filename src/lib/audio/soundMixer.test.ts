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
