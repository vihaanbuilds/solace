import { Mode } from '../lib/responses/templates';

interface ModeSelectorProps {
  mode: Mode;
  onChange: (mode: Mode) => void;
}

const MODE_LABELS: Record<Mode, string> = {
  comforter: 'Comforter',
  uplifter: 'Uplifter',
  reflector: 'Reflector',
};

export function ModeSelector({ mode, onChange }: ModeSelectorProps) {
  return (
    <div className="mode-selector" role="tablist" aria-label="Response mode">
      {(Object.keys(MODE_LABELS) as Mode[]).map((m) => (
        <button
          key={m}
          role="tab"
          aria-selected={mode === m}
          className={`mode-pill ${mode === m ? 'mode-pill-active' : ''}`}
          onClick={() => onChange(m)}
        >
          {MODE_LABELS[m]}
        </button>
      ))}
    </div>
  );
}
