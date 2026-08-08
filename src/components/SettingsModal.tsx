import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ThemeToggle } from './ThemeToggle';
import { CloseIcon } from './icons';
import {
  GoogleProfile,
  isGoogleSignInConfigured,
  renderGoogleSignInButton,
} from '../lib/googleAuth';
import {
  EngineStatus,
  ModelTier,
  MODEL_TIERS,
  getActiveTier,
  getEngineStatus,
  getRecommendedTier,
  isWebGPUSupported,
  loadEngine,
  switchTier,
  subscribeToEngineStatus,
} from '../lib/ai/webllmEngine';
import { loadAiOptIn, saveAiOptIn, saveAiTier } from '../lib/storage';

const TIER_ORDER: ModelTier[] = ['small', 'medium', 'large'];

function describeAiStatus(
  optIn: boolean | null,
  status: EngineStatus,
  activeTier: ModelTier | null
): string {
  if (!isWebGPUSupported()) {
    return "Not supported on this device — you'll always get quick pre-written responses.";
  }
  if (status === 'ready' && activeTier) {
    return `Active — running the ${MODEL_TIERS[activeTier].label.toLowerCase()} model locally on your device.`;
  }
  if (status === 'loading') return 'Downloading — this usually takes 1–3 minutes.';
  if (optIn) return 'Enabled — pick a size below.';
  return 'Off. Pick a size below to turn it on — everything runs on your device either way.';
}

interface SettingsModalProps {
  firstName: string;
  googleProfile: GoogleProfile | null;
  onGoogleProfileChange: (profile: GoogleProfile) => void;
  onDeleteAllChats: () => void;
  onDeleteAccount: () => void;
  onClose: () => void;
}

type View = 'main' | 'switch-account' | 'confirm-delete-chats' | 'confirm-delete-account';

export function SettingsModal({
  firstName,
  googleProfile,
  onGoogleProfileChange,
  onDeleteAllChats,
  onDeleteAccount,
  onClose,
}: SettingsModalProps) {
  const [view, setView] = useState<View>('main');
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const [aiOptIn, setAiOptIn] = useState<boolean | null>(() => loadAiOptIn());
  const [engineStatus, setEngineStatus] = useState<EngineStatus>(() => getEngineStatus());

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => subscribeToEngineStatus((status) => setEngineStatus(status)), []);

  function handleSelectTier(tier: ModelTier) {
    saveAiOptIn(true);
    saveAiTier(tier);
    setAiOptIn(true);
    const current = getEngineStatus();
    if (current === 'idle' || current === 'unsupported' || current === 'error') {
      loadEngine(tier);
    } else if (current === 'ready' && getActiveTier() !== tier) {
      switchTier(tier);
    }
  }

  useEffect(() => {
    if (view !== 'switch-account' || !googleBtnRef.current || !isGoogleSignInConfigured()) return;
    renderGoogleSignInButton(googleBtnRef.current, (profile) => {
      onGoogleProfileChange(profile);
      setView('main');
    }).catch(() => {});
  }, [view, onGoogleProfileChange]);

  return createPortal(
    <div className="privacy-modal-backdrop" onClick={onClose}>
      <div
        className="privacy-modal-card glass-strong settings-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
      >
        <button className="settings-close-btn" onClick={onClose} aria-label="Close settings">
          <CloseIcon />
        </button>

        {view === 'main' && (
          <>
            <h2 className="privacy-modal-title settings-title">Settings</h2>

            <div className="settings-section">
              <p className="settings-section-label">Display &amp; appearance</p>
              <div className="settings-row">
                <div>
                  <p className="settings-row-title">Theme</p>
                  <p className="settings-row-desc">Switch between light and dark mode.</p>
                </div>
                <ThemeToggle />
              </div>
            </div>

            <div className="settings-section">
              <p className="settings-section-label">AI model</p>
              <p className="settings-row-title">On-device AI</p>
              <p className="settings-row-desc settings-ai-desc">
                {describeAiStatus(aiOptIn, engineStatus, getActiveTier())}
              </p>
              <div className="ai-tier-picker" role="radiogroup" aria-label="AI model size">
                {TIER_ORDER.map((tier) => (
                  <button
                    key={tier}
                    role="radio"
                    aria-checked={getActiveTier() === tier}
                    disabled={!isWebGPUSupported() || engineStatus === 'loading'}
                    className={`ai-tier-pill ${getActiveTier() === tier ? 'ai-tier-pill-active' : ''}`}
                    onClick={() => handleSelectTier(tier)}
                  >
                    <span className="ai-tier-pill-label">{MODEL_TIERS[tier].label}</span>
                    <span className="ai-tier-pill-size">~{MODEL_TIERS[tier].approxSizeGB}GB</span>
                  </button>
                ))}
              </div>
              {!getActiveTier() && (
                <p className="settings-row-desc">
                  Recommended for this device: {MODEL_TIERS[getRecommendedTier()].label}. Pick a
                  bigger one if you don't mind using more data.
                </p>
              )}
            </div>

            <div className="settings-section">
              <p className="settings-section-label">Account</p>
              <div className="settings-row">
                <div>
                  <p className="settings-row-title">Switch account</p>
                  <p className="settings-row-desc">
                    {googleProfile
                      ? `Signed in as ${googleProfile.name || googleProfile.email}`
                      : 'Connect a Google account to personalize your greeting.'}
                  </p>
                </div>
                <button className="settings-secondary-btn" onClick={() => setView('switch-account')}>
                  Switch
                </button>
              </div>
            </div>

            <div className="settings-section">
              <p className="settings-section-label">Data</p>
              <div className="settings-row">
                <div>
                  <p className="settings-row-title">Delete all chat history</p>
                  <p className="settings-row-desc">
                    Permanently erases every conversation, {firstName}.
                  </p>
                </div>
                <button
                  className="settings-danger-btn"
                  onClick={() => setView('confirm-delete-chats')}
                >
                  Delete
                </button>
              </div>
              <div className="settings-row">
                <div>
                  <p className="settings-row-title">Delete account</p>
                  <p className="settings-row-desc">
                    Erases your profile, chats, and sign-in from this device.
                  </p>
                </div>
                <button
                  className="settings-danger-btn"
                  onClick={() => setView('confirm-delete-account')}
                >
                  Delete
                </button>
              </div>
            </div>
          </>
        )}

        {view === 'switch-account' && (
          <>
            <h2 className="privacy-modal-title">Switch account</h2>
            <p className="privacy-modal-body">
              Choose a different Google account to personalize your greeting.
            </p>
            {isGoogleSignInConfigured() ? (
              <div className="settings-google-btn-wrap">
                <div ref={googleBtnRef} />
              </div>
            ) : (
              <p className="privacy-modal-body">
                Google sign-in isn't configured for this deployment.
              </p>
            )}
            <div className="privacy-modal-links">
              <button className="privacy-modal-link" onClick={() => setView('main')}>
                Back
              </button>
            </div>
          </>
        )}

        {view === 'confirm-delete-chats' && (
          <>
            <h2 className="privacy-modal-title">Delete all chat history?</h2>
            <p className="privacy-modal-body">
              This permanently deletes every conversation, including private ones. Do you
              still wish to continue?
            </p>
            <div className="privacy-modal-actions">
              <button className="privacy-modal-btn-secondary" onClick={() => setView('main')}>
                No
              </button>
              <button
                className="privacy-modal-btn-danger"
                onClick={() => {
                  onDeleteAllChats();
                  setView('main');
                }}
              >
                Yes, delete everything
              </button>
            </div>
          </>
        )}

        {view === 'confirm-delete-account' && (
          <>
            <h2 className="privacy-modal-title">Delete your account?</h2>
            <p className="privacy-modal-body">
              This permanently erases your name, date of birth, chat history, and sign-in
              info from this device. It can't be undone. Do you still wish to continue?
            </p>
            <div className="privacy-modal-actions">
              <button className="privacy-modal-btn-secondary" onClick={() => setView('main')}>
                No
              </button>
              <button className="privacy-modal-btn-danger" onClick={onDeleteAccount}>
                Yes, delete my account
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
