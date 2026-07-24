import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveMessages,
  loadMessages,
  clearMessages,
  saveMode,
  loadMode,
  saveTheme,
  loadTheme,
  StoredMessage,
} from './storage';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('round-trips messages through localStorage', () => {
    const messages: StoredMessage[] = [
      { id: '1', sender: 'user', text: 'hi', timestamp: 100 },
      { id: '2', sender: 'bot', text: 'hello', timestamp: 200 },
    ];
    saveMessages(messages);
    expect(loadMessages()).toEqual(messages);
  });

  it('returns an empty array when nothing is stored', () => {
    expect(loadMessages()).toEqual([]);
  });

  it('clears stored messages', () => {
    saveMessages([{ id: '1', sender: 'user', text: 'hi', timestamp: 100 }]);
    clearMessages();
    expect(loadMessages()).toEqual([]);
  });

  it('round-trips the selected mode', () => {
    saveMode('uplifter');
    expect(loadMode()).toBe('uplifter');
  });

  it('round-trips the selected theme', () => {
    saveTheme('dark');
    expect(loadTheme()).toBe('dark');
  });
});
