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

export interface BotReply {
  text: string;
  isCrisis: boolean;
  detection: DetectionResult;
}

function pickRandom(options: string[]): string {
  return options[Math.floor(Math.random() * options.length)];
}

export function getResponse(message: string, mode: Mode): BotReply {
  const crisis = isCrisis(message);
  const detection = detectEmotion(message);

  if (crisis) {
    return { text: pickRandom(CRISIS_RESPONSES[mode]), isCrisis: true, detection };
  }

  if (!detection.topEmotion) {
    if (isGreeting(message)) {
      return { text: pickRandom(GREETING_RESPONSES[mode]), isCrisis: false, detection };
    }
    if (isIdentityQuestion(message)) {
      return { text: pickRandom(IDENTITY_RESPONSES[mode]), isCrisis: false, detection };
    }
    if (isOffTopicQuestion(message)) {
      return { text: pickRandom(OFF_TOPIC_RESPONSES[mode]), isCrisis: false, detection };
    }
    return { text: pickRandom(CLARIFYING_QUESTIONS), isCrisis: false, detection };
  }

  return {
    text: pickRandom(RESPONSE_TEMPLATES[detection.topEmotion][mode]),
    isCrisis: false,
    detection,
  };
}
