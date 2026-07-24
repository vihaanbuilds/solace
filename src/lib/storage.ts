export interface StoredMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  isCrisis?: boolean;
  timestamp: number;
}

const MESSAGES_KEY = 'solace.messages';
const MODE_KEY = 'solace.mode';
const THEME_KEY = 'solace.theme';

export function saveMessages(messages: StoredMessage[]): void {
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
}

export function loadMessages(): StoredMessage[] {
  const raw = localStorage.getItem(MESSAGES_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as StoredMessage[];
  } catch {
    return [];
  }
}

export function clearMessages(): void {
  localStorage.removeItem(MESSAGES_KEY);
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
