import { useEffect, useState } from 'react';
import { ChatWindow } from './components/ChatWindow';
import { ThemeToggle } from './components/ThemeToggle';
import { AmbientBackground } from './components/AmbientBackground';
import { loadTheme } from './lib/storage';
import './styles/theme.css';

export default function App() {
  const [onboarded, setOnboarded] = useState(false);

  useEffect(() => {
    const theme = loadTheme();
    if (theme) document.documentElement.setAttribute('data-theme', theme);
  }, []);

  if (!onboarded) {
    return (
      <div className="onboarding-screen">
        <AmbientBackground />
        <div className="onboarding-card">
          <h1>Welcome to Solace</h1>
          <p>
            Solace is a supportive companion that listens and responds to how you're
            feeling. It's here to help you feel heard — it isn't a substitute for a real
            person or a mental health professional.
          </p>
          <p>
            Pick a mode below to shape how Solace responds: <strong>Comforter</strong>{' '}
            validates and soothes, <strong>Uplifter</strong> gently encourages, and{' '}
            <strong>Reflector</strong> helps you think things through.
          </p>
          <button onClick={() => setOnboarded(true)}>I'm ready</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <AmbientBackground />
      <header className="app-header">
        <h1>Solace</h1>
        <ThemeToggle />
      </header>
      <ChatWindow />
    </div>
  );
}
