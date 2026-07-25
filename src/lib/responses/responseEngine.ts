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

const MAX_HISTORY_MESSAGES = 12;

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
  onToken?: (partial: string) => void
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

  if (getEngineStatus() === 'ready') {
    try {
      const recentHistory = history.slice(-MAX_HISTORY_MESSAGES);
      const messages: ChatMessage[] = [
        { role: 'system', content: buildSystemPrompt(mode) },
        ...recentHistory.map(
          (turn): ChatMessage => ({ role: turn.role, content: turn.content })
        ),
        { role: 'user', content: message },
      ];
      const text = await generateReply(messages, onToken);
      if (text) {
        return { text, isCrisis: false, detection, source: 'ai' };
      }
    } catch {
      // Fall through to the deterministic fallback on any AI failure.
    }
  }

  return {
    text: getFallbackReply(message, mode, detection),
    isCrisis: false,
    detection,
    source: 'fallback',
  };
}
