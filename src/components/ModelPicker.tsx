import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  MODEL_TIERS,
  ModelTier as LocalTier,
  EngineStatus,
  cancelLoad,
  getActiveTier,
  getEngineStatus,
  isWebGPUSupported,
  loadEngine,
  subscribeToEngineStatus,
} from '../lib/ai/webllmEngine';
import { CLOUD_MODEL_INFO } from '../lib/ai/cloudEngine';
import { saveAiOptIn, saveAiTier, loadAiTier } from '../lib/storage';
import { ChevronDownIcon } from './icons';

const MENU_WIDTH = 250;
const LOCAL_TIER_ORDER: LocalTier[] = ['small', 'medium', 'large'];
type Choice = LocalTier | 'cloud';

export function ModelPicker() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<EngineStatus>(() => getEngineStatus());
  const [selected, setSelected] = useState<Choice | null>(() => loadAiTier());
  const [menuPosition, setMenuPosition] = useState<{ bottom: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => subscribeToEngineStatus((next) => setStatus(next)), []);

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

  function handleSelect(choice: Choice) {
    setOpen(false);
    saveAiTier(choice);
    setSelected(choice);

    if (choice === 'cloud') {
      // Cancel any in-flight/stuck local download so its "loading" state
      // can't keep showing after the user has already moved on to Canopy.
      cancelLoad();
      return;
    }

    saveAiOptIn(true);
    if (getEngineStatus() === 'ready' && getActiveTier() === choice) return;
    cancelLoad();
    loadEngine(choice);
  }

  const triggerLabel = (() => {
    if (selected === 'cloud') return CLOUD_MODEL_INFO.name;
    if (status === 'loading') return 'Loading…';
    if (status === 'error') return 'Load failed';
    if (selected) return MODEL_TIERS[selected].name;
    return 'Enable AI';
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
            {isWebGPUSupported() &&
              LOCAL_TIER_ORDER.map((tier) => (
                <button
                  key={tier}
                  role="menuitemradio"
                  aria-checked={selected === tier}
                  className={`model-picker-item ${selected === tier ? 'model-picker-item-active' : ''}`}
                  onClick={() => handleSelect(tier)}
                >
                  <div className="model-picker-item-head">
                    <span className="model-picker-item-name">
                      {MODEL_TIERS[tier].name} {MODEL_TIERS[tier].version}
                    </span>
                    <span className="model-picker-item-size">~{MODEL_TIERS[tier].approxSizeGB}GB</span>
                  </div>
                  <span className="model-picker-item-tagline">{MODEL_TIERS[tier].tagline}</span>
                </button>
              ))}
            {isWebGPUSupported() && <div className="model-picker-divider" />}
            <button
              role="menuitemradio"
              aria-checked={selected === 'cloud'}
              className={`model-picker-item ${selected === 'cloud' ? 'model-picker-item-active' : ''}`}
              onClick={() => handleSelect('cloud')}
            >
              <div className="model-picker-item-head">
                <span className="model-picker-item-name">
                  {CLOUD_MODEL_INFO.name} {CLOUD_MODEL_INFO.version}
                </span>
                <span className="model-picker-item-size">Cloud</span>
              </div>
              <span className="model-picker-item-tagline">
                {CLOUD_MODEL_INFO.tagline} — sends messages to a server
              </span>
            </button>
          </div>,
          document.body
        )}
    </>
  );
}
