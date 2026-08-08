import { useEffect, useRef, useState } from 'react';
import { CursiveReveal } from './components/CursiveReveal';
import { AmbientBackground } from './components/AmbientBackground';
import { ThemeToggle } from './components/ThemeToggle';
import {
  GoogleProfile,
  isGoogleSignInConfigured,
  loadGoogleProfile,
  renderGoogleSignInButton,
} from './lib/googleAuth';
import { loadTheme } from './lib/storage';
import './styles/theme.css';
import './styles/landing.css';

const SECTIONS = [
  { id: 'how-it-works', label: 'How it listens' },
  { id: 'boundaries', label: "What it won't do" },
  { id: 'privacy', label: 'Privacy by design' },
  { id: 'story', label: 'Our story' },
];

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
  const [signedInProfile, setSignedInProfile] = useState<GoogleProfile | null>(() =>
    loadGoogleProfile()
  );

  useEffect(() => {
    const theme = loadTheme();
    if (theme) document.documentElement.setAttribute('data-theme', theme);
  }, []);

  useEffect(() => {
    if (!isGoogleSignInConfigured() || !googleBtnRef.current) return;
    renderGoogleSignInButton(googleBtnRef.current, (profile) => {
      setSignedInProfile(profile);
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

      <header className="landing-nav">
        <a href="/" className="landing-nav-brand" aria-label="Solace home">
          <CursiveReveal variant="solace" className="cursive-reveal-nav" />
        </a>
        <nav className="landing-nav-links" aria-label="Page sections">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`}>
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
              Try Solace ↗
            </button>
          )}
        </div>
      </header>

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
              Try Solace free ↗
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
            🔗 Share
          </button>
        </div>

        <hr className="landing-divider" />

        <div className="landing-body">
          <aside className="landing-sidebar" aria-label="Jump to section">
            {SECTIONS.map((s) => (
              <a key={s.id} href={`#${s.id}`}>
                {s.label}
              </a>
            ))}
          </aside>

          <div className="landing-content">
            <section id="how-it-works">
              <h2>How Solace listens</h2>
              <p>
                Every message is read for the feeling underneath it — sadness, grief, anger,
                anxiety, jealousy, loneliness, overwhelm, guilt, or joy — before Solace ever
                replies. You choose the tone that fits the moment: <strong>Comforter</strong>{' '}
                validates and soothes, <strong>Uplifter</strong> gently encourages, and{' '}
                <strong>Reflector</strong> helps you think things through out loud.
              </p>
              <p>
                Underneath, Solace is powered by an open, on-device language model (Llama
                3.2) running through WebGPU — right in your browser tab. There's no round
                trip to a server for a reply to reach you, which means it works even if
                you're offline once it's loaded, and it means your words never have to leave
                your device to be understood.
              </p>
            </section>

            <section id="boundaries">
              <h2>What Solace won't do</h2>
              <p>
                Solace is a supportive companion, not a replacement for a real person or a
                licensed mental health professional — and it's not trying to be. It won't
                diagnose you, and it won't pretend to have answers it doesn't have. Every
                message is checked for crisis language first, and if it finds any, Solace
                surfaces real crisis resources immediately, before anything else.
              </p>
              <p>
                If you're in crisis right now, please don't wait on an app — call or text{' '}
                <strong>988</strong> (Suicide &amp; Crisis Lifeline) or text{' '}
                <strong>HOME</strong> to <strong>741741</strong> (Crisis Text Line).
              </p>
            </section>

            <section id="privacy">
              <h2>Privacy by design</h2>
              <p>
                You can use Solace completely anonymously — no account, no email, nothing to
                sign up for. Every conversation is stored only in your browser's local
                storage; there's no backend to breach because there isn't a backend at all.
                You can also lock any conversation behind a passcode so it stays out of your
                regular chat history until you unlock it again.
              </p>
              <p>
                Signing in with Google is entirely optional and only personalizes your
                greeting — your name and photo stay on your device, right alongside
                everything else. It doesn't create an account on any server, because Solace
                doesn't have one.
              </p>
            </section>

            <section id="story">
              <h2>Our story</h2>
              <p>
                Solace started at a kitchen table, not in a boardroom. It's built and
                maintained by Vihaan Tanikonda, a student at Dougherty Valley High School, in
                a household that has always taken feelings seriously — where checking in on
                each other isn't an afterthought, it's just how things are done. That's the
                bar Solace is held to: something you'd trust to actually listen on a hard
                night, the way the people who raised its creator taught him to. It's still
                growing, but it's ready to be that for you today.
              </p>
            </section>
          </div>
        </div>
      </main>

      <footer className="landing-footer">
        <p>
          If you're in crisis, you don't have to wait for an app. Call or text{' '}
          <strong>988</strong> (Suicide &amp; Crisis Lifeline) or text <strong>HOME</strong>{' '}
          to <strong>741741</strong> (Crisis Text Line) — real people, right now.
        </p>
        <p className="landing-footer-copyright">Solace — built by Vihaan Tanikonda.</p>
      </footer>
    </div>
  );
}
