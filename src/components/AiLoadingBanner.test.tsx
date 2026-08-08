import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AiLoadingBanner } from './AiLoadingBanner';
import * as webllmEngine from '../lib/ai/webllmEngine';
import * as storage from '../lib/storage';

type Listener = (status: webllmEngine.EngineStatus, progress: number, statusText: string) => void;

describe('AiLoadingBanner', () => {
  let listeners: Listener[];

  beforeEach(() => {
    listeners = [];
    vi.spyOn(webllmEngine, 'getEngineStatus').mockReturnValue('idle');
    vi.spyOn(webllmEngine, 'getEngineStatusText').mockReturnValue('');
    vi.spyOn(webllmEngine, 'loadEngine').mockImplementation(() => {});
    vi.spyOn(webllmEngine, 'subscribeToEngineStatus').mockImplementation((listener: Listener) => {
      listeners.push(listener);
      return () => {
        listeners = listeners.filter((l) => l !== listener);
      };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing when Bloom local mode is off', () => {
    vi.spyOn(storage, 'loadAiTier').mockReturnValue('bloom');
    vi.spyOn(storage, 'loadBloomLocalMode').mockReturnValue(false);
    render(<AiLoadingBanner />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders nothing for other tiers even if local mode was left on', () => {
    vi.spyOn(storage, 'loadAiTier').mockReturnValue('canopy');
    vi.spyOn(storage, 'loadBloomLocalMode').mockReturnValue(true);
    render(<AiLoadingBanner />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  describe('when Bloom local mode is on', () => {
    beforeEach(() => {
      vi.spyOn(storage, 'loadAiTier').mockReturnValue('bloom');
      vi.spyOn(storage, 'loadBloomLocalMode').mockReturnValue(true);
    });

    it('shows nothing while idle', () => {
      render(<AiLoadingBanner />);
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('explains the download and the cloud fallback while loading', () => {
      render(<AiLoadingBanner />);
      act(() => {
        listeners.forEach((listener) => listener('loading', 0.2, ''));
      });
      expect(screen.getByText(/downloading to run fully on your device/i)).toBeInTheDocument();
      expect(screen.getByText(/1–3 minutes/)).toBeInTheDocument();
      expect(screen.getByText(/regular cloud replies/i)).toBeInTheDocument();
    });

    it('disappears once the engine is ready', () => {
      render(<AiLoadingBanner />);
      act(() => {
        listeners.forEach((listener) => listener('loading', 0.5, ''));
      });
      expect(screen.getByRole('status')).toBeInTheDocument();

      act(() => {
        listeners.forEach((listener) => listener('ready', 1, ''));
      });
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('shows an error state with a retry action on failure', async () => {
      const user = userEvent.setup();
      render(<AiLoadingBanner />);
      act(() => {
        listeners.forEach((listener) => listener('error', 0, "That didn't finish loading."));
      });
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/regular cloud replies/i)).toBeInTheDocument();

      await user.click(screen.getByText('Try again'));
      expect(webllmEngine.loadEngine).toHaveBeenCalled();
    });

    it('shows a note when local mode is unsupported in this browser', () => {
      render(<AiLoadingBanner />);
      act(() => {
        listeners.forEach((listener) => listener('unsupported', 0, ''));
      });
      expect(screen.getByText(/isn't supported in this browser/i)).toBeInTheDocument();
    });
  });
});
