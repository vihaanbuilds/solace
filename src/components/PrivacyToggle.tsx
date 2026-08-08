import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  clearPrivatePasscodeRecord,
  loadPrivatePasscodeRecord,
  savePrivatePasscodeRecord,
} from '../lib/storage';
import { createPasscodeRecord, verifyPasscode } from '../lib/privacy/passcode';
import { LockIcon, UnlockIcon } from './icons';

const CODE_LENGTH = 5;

type Stage = 'closed' | 'create' | 'enter' | 'reset-confirm';

interface PrivacyToggleProps {
  unlocked: boolean;
  onUnlock: () => void;
  onLock: () => void;
  onResetPrivateChats: () => void;
}

export function PrivacyToggle({ unlocked, onUnlock, onLock, onResetPrivateChats }: PrivacyToggleProps) {
  const [stage, setStage] = useState<Stage>('closed');
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [error, setError] = useState<string | null>(null);
  const boxRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (stage === 'create' || stage === 'enter') {
      boxRefs.current[0]?.focus();
    }
  }, [stage]);

  useEffect(() => {
    if (stage === 'closed') return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closeModal();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [stage]);

  function closeModal() {
    setStage('closed');
    setDigits(Array(CODE_LENGTH).fill(''));
    setError(null);
  }

  function handleToggleClick() {
    if (unlocked) {
      onLock();
      return;
    }
    const record = loadPrivatePasscodeRecord();
    setError(null);
    setDigits(Array(CODE_LENGTH).fill(''));
    setStage(record ? 'enter' : 'create');
  }

  function handleDigitChange(index: number, rawValue: string) {
    const value = rawValue.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    setError(null);

    if (value && index < CODE_LENGTH - 1) {
      boxRefs.current[index + 1]?.focus();
    }

    if (value && index === CODE_LENGTH - 1 && next.every((d) => d !== '')) {
      void handleSubmit(next.join(''));
    }
  }

  function handleDigitKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      boxRefs.current[index - 1]?.focus();
    }
  }

  async function handleSubmit(code: string) {
    if (stage === 'create') {
      const record = await createPasscodeRecord(code);
      savePrivatePasscodeRecord(record);
      onUnlock();
      closeModal();
      return;
    }

    if (stage === 'enter') {
      const record = loadPrivatePasscodeRecord();
      const ok = record ? await verifyPasscode(code, record) : false;
      if (ok) {
        onUnlock();
        closeModal();
      } else {
        setError('Incorrect passcode — try again.');
        setDigits(Array(CODE_LENGTH).fill(''));
        boxRefs.current[0]?.focus();
      }
    }
  }

  function handleResetConfirm(confirmed: boolean) {
    if (!confirmed) {
      closeModal();
      return;
    }
    onResetPrivateChats();
    clearPrivatePasscodeRecord();
    setDigits(Array(CODE_LENGTH).fill(''));
    setError(null);
    setStage('create');
  }

  return (
    <>
      <button
        className={`privacy-toggle-btn glass ${unlocked ? 'privacy-toggle-btn-active' : ''}`}
        onClick={handleToggleClick}
        aria-pressed={unlocked}
      >
        {unlocked ? <UnlockIcon /> : <LockIcon />} Private
      </button>

      {stage !== 'closed' &&
        createPortal(
          <div className="privacy-modal-backdrop" onClick={closeModal}>
            <div
              className="privacy-modal-card glass-strong"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label={
                stage === 'create'
                  ? 'Create your private chat passcode'
                  : stage === 'enter'
                    ? 'Enter your private chat passcode'
                    : 'Reset private chat passcode'
              }
            >
              {stage === 'reset-confirm' ? (
                <>
                  <h2 className="privacy-modal-title">Reset your passcode?</h2>
                  <p className="privacy-modal-body">
                    This will permanently erase all your existing private chats. Do you still
                    wish to continue?
                  </p>
                  <div className="privacy-modal-actions">
                    <button
                      className="privacy-modal-btn-secondary"
                      onClick={() => handleResetConfirm(false)}
                    >
                      No
                    </button>
                    <button
                      className="privacy-modal-btn-danger"
                      onClick={() => handleResetConfirm(true)}
                    >
                      Yes, erase and reset
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="privacy-modal-title">
                    {stage === 'create' ? 'Create a private chat passcode' : 'Enter your passcode'}
                  </h2>
                  <p className="privacy-modal-body">
                    {stage === 'create'
                      ? 'Pick a 5-digit passcode. You’ll need it to open your private chats.'
                      : 'Your private chats are locked. Enter your 5-digit passcode to view them.'}
                  </p>
                  <div className="passcode-boxes">
                    {digits.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (boxRefs.current[index] = el)}
                        className="passcode-box"
                        type="tel"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleDigitChange(index, e.target.value)}
                        onKeyDown={(e) => handleDigitKeyDown(index, e)}
                        aria-label={`Passcode digit ${index + 1}`}
                      />
                    ))}
                  </div>
                  {error && <p className="privacy-modal-error">{error}</p>}
                  <div className="privacy-modal-links">
                    <button className="privacy-modal-link" onClick={closeModal}>
                      Cancel
                    </button>
                    {stage === 'enter' && (
                      <button
                        className="privacy-modal-link"
                        onClick={() => {
                          setError(null);
                          setStage('reset-confirm');
                        }}
                      >
                        Forgot passcode?
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
