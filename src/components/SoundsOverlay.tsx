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
import { SOUND_LAYERS, SoundLayer, getAudioContext } from '../lib/audio/soundSynth';
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
  // Computed once at mount, not re-derived on every render, once the user
  // acts (taps resume, or toggles anything), isPlaying() becomes true and
  // this affordance should simply disappear on the next volumes update.
  const [savedMix] = useState(() => loadSoundMix());
  // savedMix !== null isn't enough: the mixer persists on every change,
  // including stopAll() zeroing everything out, so "stop the sound" leaves
  // behind a non-null all-zero saved mix. Only offer resume if it actually
  // has something to resume.
  const showResume =
    !isPlaying() && savedMix !== null && SOUND_LAYERS.some((layer) => savedMix[layer] > 0);

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
    // Create/resume the AudioContext synchronously, before the await below,
    // so it happens inside this click's own task while the user gesture is
    // still "fresh". If this were deferred until after the network request
    // for the blend came back, browsers (notably Safari) can refuse to let
    // audio start, and the user would see a "success" UI with no sound.
    getAudioContext();
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
          <p className="sounds-error">Couldn't create that sound, try describing it differently.</p>
        )}

        <button className="settings-danger-btn sounds-stop-all" onClick={stopAll}>
          Stop all
        </button>
      </div>
    </div>,
    document.body
  );
}
