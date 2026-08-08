import { ReactNode } from 'react';
import { AmbientBackground } from './AmbientBackground';
import { LandingNav } from './LandingNav';
import { LandingFooter } from './LandingFooter';

interface SubpageLayoutProps {
  kicker: string;
  title: string;
  intro: string;
  children: ReactNode;
}

export function SubpageLayout({ kicker, title, intro, children }: SubpageLayoutProps) {
  return (
    <div className="landing">
      <AmbientBackground />
      <LandingNav />
      <main className="subpage-article">
        <p className="subpage-kicker">{kicker}</p>
        <h1 className="subpage-title">{title}</h1>
        <p className="subpage-intro">{intro}</p>
        {children}
        <div className="subpage-cta">
          <a href="/app" className="landing-cta-primary">
            Try Solace free
          </a>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
