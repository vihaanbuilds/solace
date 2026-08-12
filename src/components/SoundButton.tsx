import { useEffect, useState } from 'react';
import { isPlaying, subscribeToSoundMixer } from '../lib/audio/soundMixer';
import { isAudioSupported } from '../lib/audio/soundSynth';
import { WaveIcon } from './icons';

interface SoundButtonProps {
  onClick: () => void;
}

export function SoundButton({ onClick }: SoundButtonProps) {
  const [playing, setPlaying] = useState(() => isPlaying());

  useEffect(() => subscribeToSoundMixer(() => setPlaying(isPlaying())), []);

  if (!isAudioSupported()) return null;

  return (
    <button
      className={`sound-button glass ${playing ? 'sound-button-playing' : ''}`}
      onClick={onClick}
      aria-label={playing ? 'Ambient sounds playing — open sound picker' : 'Open ambient sound picker'}
      title="Ambient sounds"
    >
      <WaveIcon />
    </button>
  );
}
