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
  titleIsCustom?: boolean;
  isPrivate?: boolean;
}

export interface PrivatePasscodeRecord {
  salt: string;
  hash: string;
}

export interface UserProfile {
  fullName: string;
  dateOfBirth: string;
}

// All four are cloud-backed (Sonar) by default, differentiated only by
// pacing/depth of the system prompt. Bloom is the sole exception: it can
// optionally run fully on-device instead, gated by bloomLocalMode below.
export type ChatTier = 'sprout' | 'bud' | 'bloom' | 'canopy';

const CONVERSATIONS_KEY = 'solace.conversations';
const ACTIVE_CONVERSATION_KEY = 'solace.activeConversationId';
const LEGACY_MESSAGES_KEY = 'solace.messages';
const MODE_KEY = 'solace.mode';
const THEME_KEY = 'solace.theme';
const SIDEBAR_COLLAPSED_KEY = 'solace.sidebarCollapsed';
const PRIVATE_PASSCODE_KEY = 'solace.privatePasscode';
const USER_PROFILE_KEY = 'solace.userProfile';
const AI_TIER_KEY = 'solace.aiTier';
const BLOOM_LOCAL_MODE_KEY = 'solace.bloomLocalMode';

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

export function saveSidebarCollapsed(collapsed: boolean): void {
  localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
}

export function loadSidebarCollapsed(): boolean {
  return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
}

export function savePrivatePasscodeRecord(record: PrivatePasscodeRecord): void {
  localStorage.setItem(PRIVATE_PASSCODE_KEY, JSON.stringify(record));
}

export function loadPrivatePasscodeRecord(): PrivatePasscodeRecord | null {
  const raw = localStorage.getItem(PRIVATE_PASSCODE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PrivatePasscodeRecord;
  } catch {
    return null;
  }
}

export function clearPrivatePasscodeRecord(): void {
  localStorage.removeItem(PRIVATE_PASSCODE_KEY);
}

export function saveUserProfile(profile: UserProfile): void {
  localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
}

export function loadUserProfile(): UserProfile | null {
  const raw = localStorage.getItem(USER_PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function clearUserProfile(): void {
  localStorage.removeItem(USER_PROFILE_KEY);
}

export function getFirstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || 'there';
}

export function calculateAge(dateOfBirth: string): number | null {
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;

  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}

export function saveAiTier(tier: ChatTier): void {
  localStorage.setItem(AI_TIER_KEY, tier);
}

export function loadAiTier(): ChatTier | null {
  const raw = localStorage.getItem(AI_TIER_KEY);
  return raw === 'sprout' || raw === 'bud' || raw === 'bloom' || raw === 'canopy' ? raw : null;
}

// Flipping this toggle on IS the consent to download — the warning lives
// right next to the toggle in the UI, so there's no separate opt-in step
// to track the way the old mandatory-download gate needed one.
export function saveBloomLocalMode(enabled: boolean): void {
  localStorage.setItem(BLOOM_LOCAL_MODE_KEY, String(enabled));
}

export function loadBloomLocalMode(): boolean {
  return localStorage.getItem(BLOOM_LOCAL_MODE_KEY) === 'true';
}

// Full local reset for the "delete account" settings action — sweeps every
// key this app has ever written rather than naming each one, so it can't
// silently miss a newly added piece of state.
export function clearAllLocalData(): void {
  // Collect keys before removing any — Storage.key(i) is index-based and
  // live, so deleting mid-iteration would skip entries as indices shift.
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key && key.startsWith('solace.')) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
}
