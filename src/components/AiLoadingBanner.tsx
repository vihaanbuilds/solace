import { useEffect, useState } from 'react';
import { subscribeToEngineStatus, getEngineStatus, EngineStatus } from '../lib/ai/webllmEngine';

export function AiLoadingBanner() {
  const [status, setStatus] = useState<EngineStatus>(() => getEngineStatus());

  useEffect(() => {
    return subscribeToEngineStatus((nextStatus) => setStatus(nextStatus));
  }, []);

  if (status !== 'loading') return null;

  return (
    <div className="ai-loading-banner glass" role="status">
      Solace's local AI is downloading onto your device — this usually takes about 1–3
      minutes. Until it's ready, you'll get quick pre-written responses instead of the
      AI's own replies.
    </div>
  );
}
