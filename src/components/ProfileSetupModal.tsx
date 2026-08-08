import { FormEvent, useState } from 'react';
import { createPortal } from 'react-dom';
import { UserProfile } from '../lib/storage';

interface ProfileSetupModalProps {
  onComplete: (profile: UserProfile) => void;
}

const TODAY = new Date().toISOString().slice(0, 10);

export function ProfileSetupModal({ onComplete }: ProfileSetupModalProps) {
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmedName = fullName.trim();

    if (!trimmedName) {
      setError('Let us know what to call you.');
      return;
    }
    if (!dateOfBirth) {
      setError('Your date of birth helps Solace tailor its advice to you.');
      return;
    }
    if (dateOfBirth > TODAY) {
      setError("That date of birth hasn't happened yet.");
      return;
    }

    onComplete({ fullName: trimmedName, dateOfBirth });
  }

  return createPortal(
    <div className="privacy-modal-backdrop">
      <form
        className="privacy-modal-card glass-strong profile-setup-card"
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-label="Set up your profile"
      >
        <h2 className="privacy-modal-title">Before we get started</h2>
        <p className="privacy-modal-body">
          Tell Solace a bit about you so it can tailor how it responds — this stays on your
          device, just like everything else here.
        </p>

        <label className="profile-setup-field">
          <span>Full name</span>
          <input
            type="text"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              setError(null);
            }}
            placeholder="Jamie Rivera"
            autoFocus
          />
        </label>

        <label className="profile-setup-field">
          <span>Date of birth</span>
          <input
            type="date"
            value={dateOfBirth}
            max={TODAY}
            onChange={(e) => {
              setDateOfBirth(e.target.value);
              setError(null);
            }}
          />
        </label>

        {error && <p className="privacy-modal-error">{error}</p>}

        <div className="privacy-modal-actions">
          <button type="submit" className="privacy-modal-btn-primary">
            Continue
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}
