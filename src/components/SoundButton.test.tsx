import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { mixerState, listeners } = vi.hoisted(() => ({
  mixerState: { playing: false },
  listeners: new Set<(volumes: unknown) => void>(),
}));

vi.mock('../lib/audio/soundMixer', () => ({
  isPlaying: vi.fn(() => mixerState.playing),
  subscribeToSoundMixer: vi.fn((listener: (volumes: unknown) => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }),
}));
vi.mock('../lib/audio/soundSynth', () => ({
  isAudioSupported: vi.fn(() => true),
}));

import { SoundButton } from './SoundButton';
import * as soundSynth from '../lib/audio/soundSynth';

describe('SoundButton', () => {
  afterEach(() => {
    mixerState.playing = false;
    listeners.clear();
    vi.mocked(soundSynth.isAudioSupported).mockReturnValue(true);
  });

  it('calls onClick when pressed', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<SoundButton onClick={onClick} />);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not show a playing state when nothing is playing', () => {
    mixerState.playing = false;
    render(<SoundButton onClick={() => {}} />);
    expect(screen.getByRole('button')).not.toHaveClass('sound-button-playing');
  });

  it('shows a playing state when the mixer reports something is playing', () => {
    mixerState.playing = true;
    render(<SoundButton onClick={() => {}} />);
    expect(screen.getByRole('button')).toHaveClass('sound-button-playing');
  });

  it('renders nothing when the browser has no Web Audio support', () => {
    vi.mocked(soundSynth.isAudioSupported).mockReturnValue(false);
    const { container } = render(<SoundButton onClick={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });
});
