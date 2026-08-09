import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  EngineStatus,
  LOCAL_MODEL_APPROX_SIZE_GB,
  cancelLoad,
  deviceSeemsUnderpowered,
  getEngineStatus,
  isWebGPUSupported,
  loadEngine,
  subscribeToEngineStatus,
} from '../lib/ai/webllmEngine';
import { TIERS, TIER_ORDER } from '../lib/ai/tiers';
import { getDailyLimit, getMessagesRemainingToday } from '../lib/ai/messageLimits';
import { ChatTier, loadAiTier, loadBloomLocalMode, saveAiTier, saveBloomLocalMode } from '../lib/storage';
import { ChevronDownIcon } from './icons';

const MENU_WIDTH = 270;

function remainingByTier(): Record<ChatTier, number> {
  return Object.fromEntries(TIER_ORDER.map((t) => [t, getMessagesRemainingToday(t)])) as Record<
    ChatTier,
    number
  >;
}

interface ModelPickerProps {
  onTierChange?: (tier: ChatTier) => void;
}

export function ModelPicker({ onTierChange }: ModelPickerProps = {}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<EngineStatus>(() => getEngineStatus());
  const [selected, setSelected] = useState<ChatTier>(() => loadAiTier() ?? 'bud');
  const [bloomLocal, setBloomLocal] = useState<boolean>(() => loadBloomLocalMode());
  const [menuPosition, setMenuPosition] = useState<{ bottom: number; left: number } | null>(null);
  const [remaining, setRemaining] = useState<Record<ChatTier, number>>(() => remainingByTier());
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => subscribeToEngineStatus((next) => setStatus(next)), []);

  // Refreshed on open rather than kept continuously live — usage only
  // changes when a message is actually sent elsewhere in the app, so
  // there's nothing to stay subscribed to between one open and the next.
  useEffect(() => {
    if (open) setRemaining(remainingByTier());
  }, [open]);

  // Resumes Bloom's local engine on mount if the user had left it on. Only
  // depends on the tier/toggle the user explicitly set, never on `status`
  // itself — that's deliberate, since a reactive dependency on status was
  // exactly what previously caused a cancelled load to silently restart
  // itself the moment it settled back to idle.
  useEffect(() => {
    if (selected === 'bloom' && bloomLocal && getEngineStatus() === 'idle') {
      loadEngine();
    }
  }, [selected, bloomLocal]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  function handleToggle() {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuPosition({
        bottom: window.innerHeight - rect.top + 8,
        left: Math.min(rect.left, window.innerWidth - MENU_WIDTH - 8),
      });
    }
    setOpen((prev) => !prev);
  }

  function handleSelect(tier: ChatTier) {
    saveAiTier(tier);
    setSelected(tier);
    onTierChange?.(tier);
    // Bloom stays open so its local-mode toggle is immediately visible and
    // usable in the same interaction, instead of requiring a second click
    // to reopen the menu.
    if (tier !== 'bloom') setOpen(false);
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

  const triggerLabel = (() => {
    if (selected === 'bloom' && bloomLocal) {
      if (status === 'loading') return 'Loading…';
      if (status === 'error') return 'Load failed';
    }
    return TIERS[selected].name;
  })();

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="model-picker-trigger glass"
        onClick={handleToggle}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Choose the AI model"
      >
        {triggerLabel} <ChevronDownIcon />
      </button>
      {open &&
        menuPosition &&
        createPortal(
          <div
            ref={menuRef}
            className="model-picker-menu glass-strong"
            role="menu"
            aria-label="Choose AI model"
            style={{ bottom: menuPosition.bottom, left: menuPosition.left, width: MENU_WIDTH }}
          >
            {TIER_ORDER.map((tier) => (
              <div key={tier}>
                <button
                  role="menuitemradio"
                  aria-checked={selected === tier}
                  className={`model-picker-item ${selected === tier ? 'model-picker-item-active' : ''}`}
                  onClick={() => handleSelect(tier)}
                >
                  <div className="model-picker-item-head">
                    <span className="model-picker-item-name">
                      {TIERS[tier].name} {TIERS[tier].version}
                    </span>
                  </div>
                  <span className="model-picker-item-tagline">{TIERS[tier].tagline}</span>
                  <span className="model-picker-item-remaining">
                    {tier === 'bloom' && bloomLocal
                      ? "Unlimited — local mode doesn't use this"
                      : `${remaining[tier]} of ${getDailyLimit(tier)} left today`}
                  </span>
                </button>
                {tier === 'bloom' && selected === 'bloom' && (
                  <div className="model-picker-local-panel">
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
                        {bloomLocal && status === 'loading' && (
                          <p className="model-picker-toggle-status">
                            Loading… this can take 1–3 minutes.
                          </p>
                        )}
                        {bloomLocal && status === 'error' && (
                          <p className="model-picker-toggle-status model-picker-toggle-error">
                            Didn't finish loading.{' '}
                            <button type="button" onClick={() => loadEngine()}>
                              Try again
                            </button>
                          </p>
                        )}
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
            ))}
            <div className="model-picker-divider" />
            <p className="model-picker-note">Canopy lets you share up to 3 images per message.</p>
          </div>,
          document.body
        )}
    </>
  );
}
