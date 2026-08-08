import { useEffect, useState } from 'react';
import {
  subscribeToEngineStatus,
  getEngineStatus,
  loadEngine,
  isWebGPUSupported,
  getRecommendedTier,
  MODEL_TIERS,
  EngineStatus,
  ModelTier,
} from '../lib/ai/webllmEngine';
import { loadAiOptIn, saveAiOptIn, loadAiTier, saveAiTier } from '../lib/storage';

const TIER_ORDER: ModelTier[] = ['small', 'medium', 'large'];

export function AiLoadingBanner() {
  const [status, setStatus] = useState<EngineStatus>(() => getEngineStatus());
  const [optIn, setOptIn] = useState<boolean | null>(() => loadAiOptIn());
  const [selectedTier, setSelectedTier] = useState<ModelTier>(
    () => loadAiTier() ?? getRecommendedTier()
  );

  useEffect(() => {
    if (optIn === true && status === 'idle') {
      loadEngine(loadAiTier() ?? getRecommendedTier());
    }
  }, [optIn, status]);

  useEffect(() => subscribeToEngineStatus((nextStatus) => setStatus(nextStatus)), []);

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
              <span className="ai-tier-pill-label">{MODEL_TIERS[tier].label}</span>
              <span className="ai-tier-pill-size">~{MODEL_TIERS[tier].approxSizeGB}GB</span>
            </button>
          ))}
        </div>
        <p className="ai-tier-description">
          {MODEL_TIERS[selectedTier].description}
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
      </div>
    );
  }

  if (status !== 'loading') return null;

  return (
    <div className="ai-loading-banner glass" role="status">
      Solace's local AI is downloading onto your device — this usually takes about 1–3
      minutes. Until it's ready, you'll get quick pre-written responses instead of the
      AI's own replies.
    </div>
  );
}
