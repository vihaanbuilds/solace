import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ThemeToggle } from './ThemeToggle';
import { CloseIcon } from './icons';
import {
  GoogleProfile,
  isGoogleSignInConfigured,
  renderGoogleSignInButton,
} from '../lib/googleAuth';

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

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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
