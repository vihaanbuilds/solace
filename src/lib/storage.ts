export interface StoredMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  isCrisis?: boolean;
  timestamp: number;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  messages: StoredMessage[];
}

const CONVERSATIONS_KEY = 'solace.conversations';
const ACTIVE_CONVERSATION_KEY = 'solace.activeConversationId';
const LEGACY_MESSAGES_KEY = 'solace.messages';
const MODE_KEY = 'solace.mode';
const THEME_KEY = 'solace.theme';

export function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function deriveTitle(messages: StoredMessage[]): string {
  const firstUserMessage = messages.find((m) => m.sender === 'user');
  if (!firstUserMessage) return 'New conversation';
  const trimmed = firstUserMessage.text.trim();
  if (!trimmed) return 'New conversation';
  return trimmed.length > 40 ? `${trimmed.slice(0, 40)}…` : trimmed;
}

function migrateLegacyMessages(): Conversation[] {
  const legacyRaw = localStorage.getItem(LEGACY_MESSAGES_KEY);
  if (!legacyRaw) return [];

  try {
    const legacyMessages = JSON.parse(legacyRaw) as StoredMessage[];
    if (!Array.isArray(legacyMessages) || legacyMessages.length === 0) return [];

    const migrated: Conversation[] = [
      {
        id: createId(),
        title: deriveTitle(legacyMessages),
        createdAt: legacyMessages[0].timestamp,
        messages: legacyMessages,
      },
    ];
    saveConversations(migrated);
    localStorage.removeItem(LEGACY_MESSAGES_KEY);
    return migrated;
  } catch {
    return [];
  }
}

export function saveConversations(conversations: Conversation[]): void {
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
}

export function loadConversations(): Conversation[] {
  const raw = localStorage.getItem(CONVERSATIONS_KEY);
  if (!raw) return migrateLegacyMessages();

  try {
    return JSON.parse(raw) as Conversation[];
  } catch {
    return [];
  }
}

export function saveActiveConversationId(id: string): void {
  localStorage.setItem(ACTIVE_CONVERSATION_KEY, id);
}

export function loadActiveConversationId(): string | null {
  return localStorage.getItem(ACTIVE_CONVERSATION_KEY);
}

export function saveMode(mode: string): void {
  localStorage.setItem(MODE_KEY, mode);
}

export function loadMode(): string | null {
  return localStorage.getItem(MODE_KEY);
}

export function saveTheme(theme: string): void {
  localStorage.setItem(THEME_KEY, theme);
}

export function loadTheme(): string | null {
  return localStorage.getItem(THEME_KEY);
}
