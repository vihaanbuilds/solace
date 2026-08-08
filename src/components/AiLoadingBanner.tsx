import { useEffect, useState } from 'react';
import { subscribeToEngineStatus, getEngineStatus, getEngineStatusText, loadEngine, EngineStatus } from '../lib/ai/webllmEngine';
import { loadAiTier, loadBloomLocalMode } from '../lib/storage';

// Every tier works instantly by default (cloud-backed) — this only has
// anything to show when the user has opted into Bloom's local-mode toggle
// (see ModelPicker), and even then it's just a status note: the chat keeps
// working via Bloom's regular cloud replies the whole time it's loading.
export function AiLoadingBanner() {
  const [status, setStatus] = useState<EngineStatus>(() => getEngineStatus());
  const [statusText, setStatusText] = useState<string>(() => getEngineStatusText());
  const [tier, setTier] = useState(() => loadAiTier());
  const [bloomLocal, setBloomLocal] = useState(() => loadBloomLocalMode());

  useEffect(
    () =>
      subscribeToEngineStatus((nextStatus, _progress, nextText) => {
        setStatus(nextStatus);
        setStatusText(nextText);
        // Tier/toggle can change from the model picker without this
        // component remounting — cheap to re-read alongside status rather
        // than needing its own separate subscription for it.
        setTier(loadAiTier());
        setBloomLocal(loadBloomLocalMode());
      }),
    []
  );

  const relevant = tier === 'bloom' && bloomLocal;
  if (!relevant) return null;

  if (status === 'error') {
    return (
      <div className="ai-loading-banner ai-error-banner glass" role="alert">
        <p>
          {statusText || "That didn't finish loading."} You'll get Bloom's regular cloud replies
          in the meantime.
        </p>
        <div className="ai-opt-in-actions">
          <button onClick={() => loadEngine()}>Try again</button>
        </div>
      </div>
    );
  }

  if (status === 'unsupported') {
    return (
      <div className="ai-loading-banner glass" role="status">
        <p>Local mode isn't supported in this browser, so you're getting Bloom's regular cloud replies instead.</p>
      </div>
    );
  }

  if (status !== 'loading') return null;

  return (
    <div className="ai-loading-banner glass" role="status">
      <p>
        Bloom is downloading to run fully on your device — this usually takes about 1–3 minutes.
        You'll get Bloom's regular cloud replies until it's ready.
      </p>
      {statusText && <p className="ai-loading-detail">{statusText}</p>}
    </div>
  );
}
