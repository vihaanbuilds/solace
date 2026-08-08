import { useEffect, useRef, useState } from 'react';
import { AmbientBackground } from './components/AmbientBackground';
import { LandingNav } from './components/LandingNav';
import { LandingFooter } from './components/LandingFooter';
import { ConversationShowcase } from './components/ConversationShowcase';
import { ArrowUpRightIcon, LinkIcon } from './components/icons';
import {
  GoogleProfile,
  isGoogleSignInConfigured,
  renderGoogleSignInButton,
} from './lib/googleAuth';
import { loadTheme } from './lib/storage';
import './styles/theme.css';
import './styles/landing.css';

const EYEBROW_DATE = new Date().toLocaleDateString('en-US', {
  month: 'long',
  year: 'numeric',
});

function goToApp() {
  window.location.href = '/app';
}

export function Landing() {
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const [googleAvailable, setGoogleAvailable] = useState(isGoogleSignInConfigured());

  useEffect(() => {
    const theme = loadTheme();
    if (theme) document.documentElement.setAttribute('data-theme', theme);
  }, []);

  useEffect(() => {
    if (!isGoogleSignInConfigured() || !googleBtnRef.current) return;
    renderGoogleSignInButton(googleBtnRef.current, (_profile: GoogleProfile) => {
      goToApp();
    }).catch(() => setGoogleAvailable(false));
  }, []);

  async function handleShare() {
    const shareData = {
      title: 'Solace — a companion that actually listens',
      text: 'Solace is a private, always-on companion that listens for how you’re feeling and responds with real empathy. Nothing you say ever leaves your browser.',
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error)?.name !== 'AbortError') {
          console.error('Share failed', err);
        }
      }
      return;
    }

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(shareData.url);
        window.alert('Link copied to your clipboard.');
        return;
      } catch {
        // fall through
      }
    }

    window.alert("Sharing isn't supported in this browser.");
  }

  return (
    <div className="landing">
      <AmbientBackground />
      <LandingNav />

      <main className="landing-article">
        <div className="landing-hero">
          <p className="landing-eyebrow">
            <span>{EYEBROW_DATE}</span>
            <span className="landing-eyebrow-dot" aria-hidden="true">
              •
            </span>
            <span>Product</span>
          </p>
          <h1 className="landing-headline">Meet Solace</h1>
          <p className="landing-subhead">
            A private, always-on companion that listens for how you're feeling and responds
            with real empathy — comforting, uplifting, or reflective, whichever you need
            right now. It runs entirely in your browser: nothing you say is ever sent to a
            server.
          </p>
          <div className="landing-cta-row">
            <button className="landing-cta-primary" onClick={goToApp}>
              Try Solace free <ArrowUpRightIcon />
            </button>
            <div className="landing-google-btn-wrap">
              {googleAvailable ? (
                <div ref={googleBtnRef} className="landing-google-btn-target" />
              ) : (
                <button
                  type="button"
                  className="landing-cta-secondary"
                  disabled
                  title="Google sign-in isn't configured for this deployment yet"
                >
                  Continue with Google
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="landing-meta-row">
          <span>4 min read</span>
          <button className="landing-share-btn" onClick={handleShare}>
            <LinkIcon /> Share
          </button>
        </div>

        <hr className="landing-divider" />

        <section className="landing-statement">
          <p>
            <strong>Why don't we get straight to the point?........</strong> A lot of things
            say they understand you and don't — a script that nods along, a chatbot that
            changes the subject, a friend who means well but just wants you to feel better
            fast. Solace was built to actually do the thing everyone else claims to: read
            what you're really saying, sit with it instead of rushing past it, and respond
            like it's actually paying attention — because it is. No lectures. No "everything
            happens for a reason." No pretending to get it while quietly not. Just steady,
            honest support, especially on the nights it's hardest to find anywhere else.
          </p>
        </section>

        <ConversationShowcase />
      </main>

      <LandingFooter />
    </div>
  );
}
