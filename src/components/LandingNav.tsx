import { useState } from 'react';
import { CursiveReveal } from './CursiveReveal';
import { ThemeToggle } from './ThemeToggle';
import { LotusLogo } from './LotusLogo';
import { ArrowUpRightIcon } from './icons';
import { GoogleProfile, loadGoogleProfile } from '../lib/googleAuth';

export const LANDING_SECTIONS = [
  { path: '/how-it-works', label: 'How it listens' },
  { path: '/boundaries', label: "What it won't do" },
  { path: '/privacy', label: 'Privacy by design' },
  { path: '/story', label: 'Our story' },
];

function goToApp() {
  window.location.href = '/app';
}

export function LandingNav() {
  const [signedInProfile] = useState<GoogleProfile | null>(() => loadGoogleProfile());
  const currentPath = window.location.pathname.replace(/\/+$/, '') || '/';

  return (
    <header className="landing-nav">
      <a href="/" className="landing-nav-brand" aria-label="Solace home">
        <LotusLogo className="landing-nav-brand-icon" />
        <CursiveReveal variant="solace" className="cursive-reveal-nav" />
      </a>
      <nav className="landing-nav-links" aria-label="Page sections">
        {LANDING_SECTIONS.map((s) => (
          <a key={s.path} href={s.path} aria-current={currentPath === s.path ? 'page' : undefined}>
            {s.label}
          </a>
        ))}
      </nav>
      <div className="landing-nav-actions">
        <ThemeToggle />
        {signedInProfile ? (
          <button className="landing-nav-profile" onClick={goToApp}>
            {signedInProfile.picture && (
              <img src={signedInProfile.picture} alt="" referrerPolicy="no-referrer" />
            )}
            <span>{signedInProfile.name.split(' ')[0] || 'You'}</span>
          </button>
        ) : (
          <button className="landing-nav-btn-primary" onClick={goToApp}>
            Try Solace <ArrowUpRightIcon />
          </button>
        )}
      </div>
    </header>
  );
}
