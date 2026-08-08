import { detectEmotion, DetectionResult } from '../emotions/detectEmotion';
import { isCrisis } from '../emotions/crisisDetection';
import { isGreeting } from '../emotions/greeting';
import { isIdentityQuestion } from '../emotions/identity';
import { isOffTopicQuestion } from '../emotions/offTopic';
import {
  RESPONSE_TEMPLATES,
  CLARIFYING_QUESTIONS,
  CRISIS_RESPONSES,
  GREETING_RESPONSES,
  IDENTITY_RESPONSES,
  OFF_TOPIC_RESPONSES,
  Mode,
} from './templates';
import { buildSystemPrompt } from '../ai/systemPrompt';
import { getEngineStatus, generateReply, ChatMessage } from '../ai/webllmEngine';
import { generateCloudReply } from '../ai/cloudEngine';
import { loadAiTier, loadBloomLocalMode, ChatTier } from '../storage';

export interface BotReply {
  text: string;
  isCrisis: boolean;
  detection: DetectionResult;
  source: 'ai' | 'fallback';
}

export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

const DEFAULT_TIER: ChatTier = 'bud';
const MAX_HISTORY_MESSAGES = 12;
// Bloom and Canopy are the deepest-thinking tiers, and remembering more of
// the conversation is exactly what lets them weave earlier details back in
// naturally instead of treating each message in isolation.
const MAX_HISTORY_MESSAGES_DEEP = 24;

function pickRandom(options: string[]): string {
  return options[Math.floor(Math.random() * options.length)];
}

function getFallbackReply(message: string, mode: Mode, detection: DetectionResult): string {
  if (isGreeting(message)) return pickRandom(GREETING_RESPONSES[mode]);
  if (isIdentityQuestion(message)) return pickRandom(IDENTITY_RESPONSES[mode]);
  if (isOffTopicQuestion(message)) return pickRandom(OFF_TOPIC_RESPONSES[mode]);
  if (!detection.topEmotion) return pickRandom(CLARIFYING_QUESTIONS);
  return pickRandom(RESPONSE_TEMPLATES[detection.topEmotion][mode]);
}

export async function getResponse(
  message: string,
  mode: Mode,
  history: ConversationTurn[] = [],
  onToken?: (partial: string) => void,
  age?: number | null,
  images: string[] = []
): Promise<BotReply> {
  const crisis = isCrisis(message);
  const detection = detectEmotion(message);

  if (crisis) {
    return {
      text: pickRandom(CRISIS_RESPONSES[mode]),
      isCrisis: true,
      detection,
      source: 'fallback',
    };
  }

  const tier = loadAiTier() ?? DEFAULT_TIER;
  // Every tier is cloud-backed by default — Bloom is the sole exception,
  // and only once the user has explicitly flipped its local-mode toggle on
  // and the on-device engine has actually finished loading.
  const useLocal = tier === 'bloom' && loadBloomLocalMode() && getEngineStatus() === 'ready';
  const maxHistory = tier === 'bloom' || tier === 'canopy' ? MAX_HISTORY_MESSAGES_DEEP : MAX_HISTORY_MESSAGES;

  function toChatMessages(): ChatMessage[] {
    return history.slice(-maxHistory).map((turn) => ({ role: turn.role, content: turn.content }));
  }

  if (useLocal) {
    try {
      const messages: ChatMessage[] = [
        { role: 'system', content: buildSystemPrompt(mode, age, tier, true) },
        ...toChatMessages(),
        { role: 'user', content: message },
      ];
      const text = await generateReply(messages, onToken);
      if (text) {
        return { text, isCrisis: false, detection, source: 'ai' };
      }
    } catch {
      // Fall through to the deterministic fallback on any AI failure.
    }
  } else {
    try {
      const messages: ChatMessage[] = [
        { role: 'system', content: buildSystemPrompt(mode, age, tier, false) },
        ...toChatMessages(),
        { role: 'user', content: message },
      ];
      // Only Canopy supports images — dropped for every other tier even if
      // somehow passed in, since their prompts never mention images at all.
      const text = await generateCloudReply(messages, tier, tier === 'canopy' ? images : [], onToken);
      if (text) {
        return { text, isCrisis: false, detection, source: 'ai' };
      }
    } catch {
      // Fall through to the deterministic fallback on any cloud failure.
    }
  }

  return {
    text: getFallbackReply(message, mode, detection),
    isCrisis: false,
    detection,
    source: 'fallback',
  };
}
