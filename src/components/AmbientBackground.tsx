import { LotusLogo } from './LotusLogo';

export function AmbientBackground() {
  return (
    <div className="ambient-background" aria-hidden="true">
      <div className="blob blob-blue" />
      <div className="blob blob-pink" />
      <LotusLogo className="ambient-lotus" />
    </div>
  );
}
