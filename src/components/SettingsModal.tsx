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
  LOCAL_MODEL_APPROX_SIZE_GB,
  cancelLoad,
  deviceSeemsUnderpowered,
  getEngineStatus,
  getEngineStatusText,
  isWebGPUSupported,
  loadEngine,
  subscribeToEngineStatus,
} from '../lib/ai/webllmEngine';
import { TIERS, TIER_ORDER } from '../lib/ai/tiers';
import { ChatTier, loadBloomLocalMode, saveAiTier, saveBloomLocalMode, loadAiTier } from '../lib/storage';

function describeAiStatus(tier: ChatTier, status: EngineStatus, bloomLocal: boolean): string {
  if (tier === 'bloom' && bloomLocal) {
    if (status === 'ready') return 'Active — running Bloom locally on your device.';
    if (status === 'loading') {
      return getEngineStatusText() || "Downloading — this usually takes 1–3 minutes. You'll get Bloom's cloud replies until then.";
    }
    if (status === 'error') {
      return getEngineStatusText() || "That didn't finish loading. Using Bloom's cloud replies instead — try again below, or turn local mode off.";
    }
  }
  return `Active — using ${TIERS[tier].name} ${TIERS[tier].version}. Your messages are sent to a server to generate replies.`;
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
  const [engineStatus, setEngineStatus] = useState<EngineStatus>(() => getEngineStatus());
  const [selectedTier, setSelectedTier] = useState<ChatTier>(() => loadAiTier() ?? 'bud');
  const [bloomLocal, setBloomLocal] = useState<boolean>(() => loadBloomLocalMode());

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => subscribeToEngineStatus((status) => setEngineStatus(status)), []);

  // Switching tiers never touches the engine — only Bloom's local-mode
  // toggle does, since every tier is cloud-backed by default now.
  function handleSelectTier(tier: ChatTier) {
    saveAiTier(tier);
    setSelectedTier(tier);
  }

  function handleBloomLocalToggle(enabled: boolean) {
    saveBloomLocalMode(enabled);
    setBloomLocal(enabled);
    if (enabled) {
      loadEngine();
    } else {
      cancelLoad();
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
              <p className="settings-row-desc settings-ai-desc">
                {describeAiStatus(selectedTier, engineStatus, bloomLocal)}
              </p>
              <div className="ai-tier-picker" role="radiogroup" aria-label="AI model">
                {TIER_ORDER.map((tier) => (
                  <button
                    key={tier}
                    role="radio"
                    aria-checked={selectedTier === tier}
                    className={`ai-tier-pill ${selectedTier === tier ? 'ai-tier-pill-active' : ''}`}
                    onClick={() => handleSelectTier(tier)}
                  >
                    <span className="ai-tier-pill-label">{TIERS[tier].name}</span>
                    <span className="ai-tier-pill-size">{TIERS[tier].tagline}</span>
                  </button>
                ))}
              </div>
              {selectedTier === 'bloom' && (
                <div className="model-picker-local-panel settings-local-panel">
                  {isWebGPUSupported() ? (
                    <>
                      <label className="model-picker-toggle-row">
                        <input
                          type="checkbox"
                          checked={bloomLocal}
                          onChange={(e) => handleBloomLocalToggle(e.target.checked)}
                        />
                        Run fully on your device instead
                      </label>
                      <p className="model-picker-toggle-warning">
                        Downloads about {LOCAL_MODEL_APPROX_SIZE_GB}GB and needs a genuinely
                        powerful phone or computer — it may not work on every device
                        {deviceSeemsUnderpowered() ? ', and this device might struggle with it' : ''}.
                        Nothing you type leaves your device in this mode, and it works offline
                        afterward.
                      </p>
                    </>
                  ) : (
                    <p className="model-picker-toggle-warning">
                      Local mode isn't supported in this browser — Bloom uses the cloud model
                      here instead.
                    </p>
                  )}
                </div>
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
