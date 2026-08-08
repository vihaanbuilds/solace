import { useEffect, useState } from 'react';
import {
  subscribeToEngineStatus,
  getEngineStatus,
  getEngineStatusText,
  loadEngine,
  isWebGPUSupported,
  getRecommendedTier,
  MODEL_TIERS,
  EngineStatus,
  ModelTier,
} from '../lib/ai/webllmEngine';
import { CLOUD_MODEL_INFO } from '../lib/ai/cloudEngine';
import { loadAiOptIn, saveAiOptIn, loadAiTier, saveAiTier } from '../lib/storage';

const TIER_ORDER: ModelTier[] = ['small', 'medium', 'large'];

// This banner is only about the on-device download decision — the stored
// preference can also be 'cloud' (picked via the model picker), which isn't
// a valid choice here, so fall back to the device recommendation for that.
function toLocalTier(stored: ModelTier | 'cloud' | null): ModelTier {
  return stored && stored !== 'cloud' ? stored : getRecommendedTier();
}

export function AiLoadingBanner() {
  const [status, setStatus] = useState<EngineStatus>(() => getEngineStatus());
  const [statusText, setStatusText] = useState<string>(() => getEngineStatusText());
  const [optIn, setOptIn] = useState<boolean | null>(() => loadAiOptIn());
  const [selectedTier, setSelectedTier] = useState<ModelTier>(() => toLocalTier(loadAiTier()));

  useEffect(() => {
    if (optIn === true && status === 'idle') {
      loadEngine(toLocalTier(loadAiTier()));
    }
  }, [optIn, status]);

  useEffect(
    () => subscribeToEngineStatus((nextStatus, _progress, nextText) => {
      setStatus(nextStatus);
      setStatusText(nextText);
    }),
    []
  );

  function handleEnable() {
    saveAiOptIn(true);
    saveAiTier(selectedTier);
    setOptIn(true);
  }

  function handleDecline() {
    saveAiOptIn(false);
    setOptIn(false);
  }

  if (optIn === null && isWebGPUSupported()) {
    const recommended = getRecommendedTier();

    return (
      <div className="ai-loading-banner ai-opt-in-banner glass" role="status">
        <p>
          Solace can run a smarter AI entirely on your device instead of quick pre-written
          replies — it works offline afterward, and your messages never leave your device
          either way. Pick how much data you're comfortable using; you can change this
          anytime in Settings.
        </p>
        <div className="ai-tier-picker" role="radiogroup" aria-label="AI model size">
          {TIER_ORDER.map((tier) => (
            <button
              key={tier}
              role="radio"
              aria-checked={selectedTier === tier}
              className={`ai-tier-pill ${selectedTier === tier ? 'ai-tier-pill-active' : ''}`}
              onClick={() => setSelectedTier(tier)}
            >
              <span className="ai-tier-pill-label">{MODEL_TIERS[tier].name}</span>
              <span className="ai-tier-pill-size">~{MODEL_TIERS[tier].approxSizeGB}GB</span>
            </button>
          ))}
        </div>
        <p className="ai-tier-description">
          <strong>
            {MODEL_TIERS[selectedTier].name} {MODEL_TIERS[selectedTier].version}
          </strong>{' '}
          — {MODEL_TIERS[selectedTier].tagline}. {MODEL_TIERS[selectedTier].description}
          {selectedTier !== recommended &&
            TIER_ORDER.indexOf(selectedTier) > TIER_ORDER.indexOf(recommended) &&
            " This is bigger than what we'd normally suggest for your device — it should still work, just expect a longer download."}
        </p>
        <div className="ai-opt-in-actions">
          <button onClick={handleEnable}>Enable on-device AI</button>
          <button onClick={handleDecline} className="ai-opt-in-decline">
            Not now
          </button>
        </div>
        <p className="ai-cloud-hint">
          In a hurry? Pick {CLOUD_MODEL_INFO.name} from the model menu next to the message box
          instead — no download, works instantly, but sends messages to a server to reply.
        </p>
      </div>
    );
  }

  if (status !== 'loading') return null;

  return (
    <div className="ai-loading-banner glass" role="status">
      <p>
        Solace's local AI is downloading onto your device — this usually takes about 1–3
        minutes depending on your connection. Until it's ready, you'll get quick pre-written
        responses instead of the AI's own replies.
      </p>
      {statusText && <p className="ai-loading-detail">{statusText}</p>}
    </div>
  );
}
