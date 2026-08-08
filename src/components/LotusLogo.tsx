const PETAL_PATH =
  'M50,62 C37,51 32,30 40,12 C44,5 47,1 50,-4 C53,1 56,5 60,12 C68,30 63,51 50,62 Z';
const PETAL_ANGLES = [-72, -48, -24, 0, 24, 48, 72];

interface LotusLogoProps {
  className?: string;
}

function LotusPetals() {
  return (
    <>
      {PETAL_ANGLES.map((angle) => (
        <path key={angle} d={PETAL_PATH} transform={`rotate(${angle} 50 62)`} />
      ))}
    </>
  );
}

// The solid mark for light mode and the line mark for dark mode are both
// always rendered; theme.css toggles which one is visible off of
// [data-theme] so the swap needs no JS and never flashes the wrong variant.
export function LotusLogo({ className = '' }: LotusLogoProps) {
  return (
    <span className={`lotus-logo ${className}`} aria-hidden="true">
      <svg viewBox="-20 -25 140 95" className="lotus-logo-svg lotus-logo-solid" fill="currentColor">
        <LotusPetals />
      </svg>
      <svg
        viewBox="-20 -25 140 95"
        className="lotus-logo-svg lotus-logo-outline"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <LotusPetals />
      </svg>
    </span>
  );
}
