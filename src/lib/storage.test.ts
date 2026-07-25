import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveConversations,
  loadConversations,
  saveActiveConversationId,
  loadActiveConversationId,
  saveMode,
  loadMode,
  saveTheme,
  loadTheme,
  deriveTitle,
  createId,
  Conversation,
  StoredMessage,
} from './storage';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('round-trips conversations through localStorage', () => {
    const conversations: Conversation[] = [
      {
        id: 'c1',
        title: 'hi',
        createdAt: 100,
        messages: [{ id: '1', sender: 'user', text: 'hi', timestamp: 100 }],
      },
    ];
    saveConversations(conversations);
    expect(loadConversations()).toEqual(conversations);
  });

  it('returns an empty array when nothing is stored', () => {
    expect(loadConversations()).toEqual([]);
  });

  it('migrates the legacy single-conversation format into a conversation', () => {
    const legacyMessages: StoredMessage[] = [
      { id: '1', sender: 'user', text: 'I feel sad today', timestamp: 100 },
      { id: '2', sender: 'bot', text: 'That sounds hard.', timestamp: 200 },
    ];
    localStorage.setItem('solace.messages', JSON.stringify(legacyMessages));

    const migrated = loadConversations();
    expect(migrated).toHaveLength(1);
    expect(migrated[0].messages).toEqual(legacyMessages);
    expect(migrated[0].title).toBe('I feel sad today');
    expect(localStorage.getItem('solace.messages')).toBeNull();

    // A second load should read the migrated conversation directly, not re-migrate.
    expect(loadConversations()).toEqual(migrated);
  });

  it('round-trips the active conversation id', () => {
    saveActiveConversationId('c1');
    expect(loadActiveConversationId()).toBe('c1');
  });

  it('round-trips the selected mode', () => {
    saveMode('uplifter');
    expect(loadMode()).toBe('uplifter');
  });

  it('round-trips the selected theme', () => {
    saveTheme('dark');
    expect(loadTheme()).toBe('dark');
  });

  it('derives a conversation title from the first user message', () => {
    const messages: StoredMessage[] = [
      { id: '1', sender: 'user', text: 'I feel really jealous of my friends', timestamp: 100 },
    ];
    expect(deriveTitle(messages)).toBe('I feel really jealous of my friends');
  });

  it('truncates a long first message for the title', () => {
    const longText = 'a'.repeat(60);
    const messages: StoredMessage[] = [
      { id: '1', sender: 'user', text: longText, timestamp: 100 },
    ];
    expect(deriveTitle(messages)).toBe(`${'a'.repeat(40)}…`);
  });

  it('falls back to "New conversation" when there is no user message yet', () => {
    expect(deriveTitle([])).toBe('New conversation');
  });

  it('generates unique-ish ids', () => {
    const a = createId();
    const b = createId();
    expect(a).not.toBe(b);
  });
});
