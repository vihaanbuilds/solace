import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AiLoadingBanner } from './AiLoadingBanner';
import * as webllmEngine from '../lib/ai/webllmEngine';
import * as storage from '../lib/storage';

type Listener = (status: webllmEngine.EngineStatus, progress: number) => void;

describe('AiLoadingBanner', () => {
  let listeners: Listener[];

  beforeEach(() => {
    listeners = [];
    vi.spyOn(webllmEngine, 'getEngineStatus').mockReturnValue('idle');
    vi.spyOn(webllmEngine, 'isWebGPUSupported').mockReturnValue(true);
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

  describe('before a decision has been made', () => {
    beforeEach(() => {
      vi.spyOn(storage, 'loadAiOptIn').mockReturnValue(null);
    });

    it('asks for consent instead of downloading automatically', () => {
      render(<AiLoadingBanner />);
      expect(screen.getByText('Enable on-device AI')).toBeInTheDocument();
      expect(webllmEngine.loadEngine).not.toHaveBeenCalled();
    });

    it('does not ask on a device without WebGPU support', () => {
      vi.mocked(webllmEngine.isWebGPUSupported).mockReturnValue(false);
      render(<AiLoadingBanner />);
      expect(screen.queryByText('Enable on-device AI')).not.toBeInTheDocument();
    });

    it('starts the download and remembers the choice when enabled', async () => {
      const user = userEvent.setup();
      const saveSpy = vi.spyOn(storage, 'saveAiOptIn').mockImplementation(() => {});
      render(<AiLoadingBanner />);

      await user.click(screen.getByText('Enable on-device AI'));

      expect(saveSpy).toHaveBeenCalledWith(true);
      expect(webllmEngine.loadEngine).toHaveBeenCalled();
    });

    it('offers a size picker and remembers the picked tier when enabled', async () => {
      const user = userEvent.setup();
      let storedTier: webllmEngine.ModelTier | null = null;
      const saveTierSpy = vi
        .spyOn(storage, 'saveAiTier')
        .mockImplementation((tier) => (storedTier = tier));
      vi.spyOn(storage, 'loadAiTier').mockImplementation(() => storedTier);
      render(<AiLoadingBanner />);

      expect(screen.getByRole('radiogroup', { name: /ai model size/i })).toBeInTheDocument();
      await user.click(screen.getByRole('radio', { name: /lighter/i }));
      await user.click(screen.getByText('Enable on-device AI'));

      expect(saveTierSpy).toHaveBeenCalledWith('small');
      expect(webllmEngine.loadEngine).toHaveBeenCalledWith('small');
    });

    it('remembers a decline and never downloads', async () => {
      const user = userEvent.setup();
      const saveSpy = vi.spyOn(storage, 'saveAiOptIn').mockImplementation(() => {});
      render(<AiLoadingBanner />);

      await user.click(screen.getByText('Not now'));

      expect(saveSpy).toHaveBeenCalledWith(false);
      expect(webllmEngine.loadEngine).not.toHaveBeenCalled();
      expect(screen.queryByText('Enable on-device AI')).not.toBeInTheDocument();
    });
  });

  describe('once the user has already opted in', () => {
    beforeEach(() => {
      vi.spyOn(storage, 'loadAiOptIn').mockReturnValue(true);
    });

    it('starts loading automatically without asking again', () => {
      render(<AiLoadingBanner />);
      expect(screen.queryByText('Enable on-device AI')).not.toBeInTheDocument();
      expect(webllmEngine.loadEngine).toHaveBeenCalled();
    });

    it('explains the download and the temporary fallback while loading', () => {
      render(<AiLoadingBanner />);
      act(() => {
        listeners.forEach((listener) => listener('loading', 0.2));
      });
      expect(screen.getByText(/downloading onto your device/i)).toBeInTheDocument();
      expect(screen.getByText(/1–3 minutes/)).toBeInTheDocument();
      expect(screen.getByText(/quick pre-written responses/i)).toBeInTheDocument();
    });

    it('disappears once the engine is ready', () => {
      render(<AiLoadingBanner />);
      act(() => {
        listeners.forEach((listener) => listener('loading', 0.5));
      });
      expect(screen.getByRole('status')).toBeInTheDocument();

      act(() => {
        listeners.forEach((listener) => listener('ready', 1));
      });
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  describe('once the user has already declined', () => {
    it('renders nothing and never downloads', () => {
      vi.spyOn(storage, 'loadAiOptIn').mockReturnValue(false);
      render(<AiLoadingBanner />);
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      expect(webllmEngine.loadEngine).not.toHaveBeenCalled();
    });
  });
});
