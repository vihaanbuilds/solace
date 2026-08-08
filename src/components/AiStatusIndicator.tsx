import { useEffect, useState } from 'react';
import {
  subscribeToEngineStatus,
  getEngineStatus,
  getEngineProgress,
  getEngineStatusText,
  EngineStatus,
} from '../lib/ai/webllmEngine';

const READY_TOAST_DURATION_MS = 5000;

// Loading the model itself is triggered from AiLoadingBanner, gated behind
// the user's explicit opt-in (it's a ~1.7GB download) — this component only
// reflects whatever state that decision put the engine into.
export function AiStatusIndicator() {
  const [status, setStatus] = useState<EngineStatus>(() => getEngineStatus());
  const [progress, setProgress] = useState<number>(() => getEngineProgress());
  const [statusText, setStatusText] = useState<string>(() => getEngineStatusText());
  const [showReadyToast, setShowReadyToast] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToEngineStatus((nextStatus, nextProgress, nextText) => {
      setStatus((prevStatus) => {
        if (prevStatus !== 'ready' && nextStatus === 'ready') {
          setShowReadyToast(true);
          window.setTimeout(() => setShowReadyToast(false), READY_TOAST_DURATION_MS);
        }
        return nextStatus;
      });
      setProgress(nextProgress);
      setStatusText(nextText);
    });

    return unsubscribe;
  }, []);

  if (status === 'loading') {
    return (
      <div className="ai-status-pill glass" role="status" title={statusText || undefined}>
        Loading local AI… {Math.round(progress * 100)}%
      </div>
    );
  }

  if (showReadyToast) {
    return (
      <div className="ai-status-pill ai-status-ready glass" role="status">
        Solace's AI is now active
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="ai-status-pill ai-status-error glass" role="status" title={statusText || undefined}>
        AI load failed
      </div>
    );
  }

  return null;
}
