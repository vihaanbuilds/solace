import { useEffect, useState } from 'react';

const TYPE_INTERVAL_MS = 28;

function buildGreetings(name: string | null): string[] {
  const who = name ? `, ${name}` : '';
  return [
    `No judgment. I'm all ears${who}.`,
    `Whenever you're ready${who} — I'm listening.`,
    `Say whatever's on your mind${who}. I'm here for it.`,
    `Hey${who ? who.replace(', ', ' ') : ' there'}, what's going on with you today?`,
    `I'm here${who}. No judgment, no rush.`,
    `Talk to me${who} — I'm all ears.`,
    `Whatever it is${who}, you can say it here.`,
    `I'm listening${who}, however this goes.`,
  ];
}

interface TypewriterGreetingProps {
  name?: string | null;
  className?: string;
}

export function TypewriterGreeting({ name = null, className = '' }: TypewriterGreetingProps) {
  const [message] = useState(() => {
    const options = buildGreetings(name);
    return options[Math.floor(Math.random() * options.length)];
  });
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setVisibleCount(message.length);
      return;
    }

    setVisibleCount(0);
    const intervalId = window.setInterval(() => {
      setVisibleCount((count) => {
        if (count >= message.length) {
          window.clearInterval(intervalId);
          return count;
        }
        return count + 1;
      });
    }, TYPE_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [message]);

  const done = visibleCount >= message.length;

  return (
    <p className={`typewriter-greeting ${className}`}>
      {message.slice(0, visibleCount)}
      {!done && (
        <span className="typewriter-cursor" aria-hidden="true">
          |
        </span>
      )}
    </p>
  );
}
