import { describe, it, expect } from 'vitest';
import { getResponse } from './responseEngine';
import {
  RESPONSE_TEMPLATES,
  CLARIFYING_QUESTIONS,
  CRISIS_RESPONSES,
  GREETING_RESPONSES,
  OFF_TOPIC_RESPONSES,
} from './templates';

describe('getResponse', () => {
  it('returns a grief comforter template for grief-indicating text', () => {
    const reply = getResponse('My grandma passed away and I miss them so much', 'comforter');
    expect(reply.isCrisis).toBe(false);
    expect(RESPONSE_TEMPLATES.grief.comforter).toContain(reply.text);
  });

  it('flags crisis language and returns a crisis-safe response', () => {
    const reply = getResponse('I want to die', 'comforter');
    expect(reply.isCrisis).toBe(true);
    expect(CRISIS_RESPONSES.comforter).toContain(reply.text);
  });

  it('returns a clarifying question when no emotion is detected', () => {
    const reply = getResponse('The weather today is cloudy', 'reflector');
    expect(reply.isCrisis).toBe(false);
    expect(CLARIFYING_QUESTIONS).toContain(reply.text);
  });

  it('crisis check takes priority even when emotion words are also present', () => {
    const reply = getResponse('I am so sad I want to die', 'uplifter');
    expect(reply.isCrisis).toBe(true);
    expect(CRISIS_RESPONSES.uplifter).toContain(reply.text);
  });

  it('returns a greeting response for a plain greeting instead of a clarifying question', () => {
    const reply = getResponse('hi', 'comforter');
    expect(reply.isCrisis).toBe(false);
    expect(GREETING_RESPONSES.comforter).toContain(reply.text);
  });

  it('returns an off-topic response for a factual question instead of a clarifying question', () => {
    const reply = getResponse('what is 1+1', 'reflector');
    expect(reply.isCrisis).toBe(false);
    expect(OFF_TOPIC_RESPONSES.reflector).toContain(reply.text);
  });
});
