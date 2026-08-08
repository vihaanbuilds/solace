import { useEffect, useState } from 'react';
import {
  subscribeToEngineStatus,
  getEngineStatus,
  loadEngine,
  isWebGPUSupported,
  EngineStatus,
} from '../lib/ai/webllmEngine';
import { loadAiOptIn, saveAiOptIn } from '../lib/storage';

export function AiLoadingBanner() {
  const [status, setStatus] = useState<EngineStatus>(() => getEngineStatus());
  const [optIn, setOptIn] = useState<boolean | null>(() => loadAiOptIn());

  useEffect(() => {
    if (optIn === true && status === 'idle') {
      loadEngine();
    }
  }, [optIn, status]);

  useEffect(() => subscribeToEngineStatus((nextStatus) => setStatus(nextStatus)), []);

  function handleEnable() {
    saveAiOptIn(true);
    setOptIn(true);
  }

  function handleDecline() {
    saveAiOptIn(false);
    setOptIn(false);
  }

  if (optIn === null && isWebGPUSupported()) {
    return (
      <div className="ai-loading-banner ai-opt-in-banner glass" role="status">
        <p>
          Solace can run a smarter AI entirely on your device instead of quick pre-written
          replies — it's a one-time ~1.7GB download and works offline afterward. Your
          messages never leave your device either way, and you can turn this on or off
          anytime in Settings.
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
