import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getResponse } from './responseEngine';
import {
  RESPONSE_TEMPLATES,
  CLARIFYING_QUESTIONS,
  CRISIS_RESPONSES,
  GREETING_RESPONSES,
  IDENTITY_RESPONSES,
  OFF_TOPIC_RESPONSES,
} from './templates';
import * as webllmEngine from '../ai/webllmEngine';

describe('getResponse (fallback path, AI engine not ready)', () => {
  it('returns a grief comforter template for grief-indicating text', async () => {
    const reply = await getResponse('My grandma passed away and I miss them so much', 'comforter');
    expect(reply.isCrisis).toBe(false);
    expect(reply.source).toBe('fallback');
    expect(RESPONSE_TEMPLATES.grief.comforter).toContain(reply.text);
  });

  it('flags crisis language and returns a crisis-safe response', async () => {
    const reply = await getResponse('I want to die', 'comforter');
    expect(reply.isCrisis).toBe(true);
    expect(CRISIS_RESPONSES.comforter).toContain(reply.text);
  });

  it('returns a clarifying question when no emotion is detected', async () => {
    const reply = await getResponse('The weather today is cloudy', 'reflector');
    expect(reply.isCrisis).toBe(false);
    expect(CLARIFYING_QUESTIONS).toContain(reply.text);
  });

  it('crisis check takes priority even when emotion words are also present', async () => {
    const reply = await getResponse('I am so sad I want to die', 'uplifter');
    expect(reply.isCrisis).toBe(true);
    expect(CRISIS_RESPONSES.uplifter).toContain(reply.text);
  });

  it('returns a greeting response for a plain greeting instead of a clarifying question', async () => {
    const reply = await getResponse('hi', 'comforter');
    expect(reply.isCrisis).toBe(false);
    expect(GREETING_RESPONSES.comforter).toContain(reply.text);
  });

  it('returns an off-topic response for a factual question instead of a clarifying question', async () => {
    const reply = await getResponse('what is 1+1', 'reflector');
    expect(reply.isCrisis).toBe(false);
    expect(OFF_TOPIC_RESPONSES.reflector).toContain(reply.text);
  });

  it('returns an off-topic response for a homework request', async () => {
    const reply = await getResponse('can you solve this equation for me', 'uplifter');
    expect(reply.isCrisis).toBe(false);
    expect(OFF_TOPIC_RESPONSES.uplifter).toContain(reply.text);
  });

  it('returns an identity response for questions about what the bot is', async () => {
    const reply = await getResponse('what are you', 'comforter');
    expect(reply.isCrisis).toBe(false);
    expect(IDENTITY_RESPONSES.comforter).toContain(reply.text);
  });
});

describe('getResponse (AI engine ready)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('uses the AI engine for a non-crisis message and returns its generated text', async () => {
    vi.spyOn(webllmEngine, 'getEngineStatus').mockReturnValue('ready');
    vi.spyOn(webllmEngine, 'generateReply').mockResolvedValue('A freshly generated, non-templated reply.');

    const reply = await getResponse('I feel really jealous of my friends', 'comforter');

    expect(reply.source).toBe('ai');
    expect(reply.isCrisis).toBe(false);
    expect(reply.text).toBe('A freshly generated, non-templated reply.');
  });

  it('streams tokens via the onToken callback', async () => {
    vi.spyOn(webllmEngine, 'getEngineStatus').mockReturnValue('ready');
    vi.spyOn(webllmEngine, 'generateReply').mockImplementation(async (_messages, onToken) => {
      onToken?.('Partial');
      onToken?.('Partial reply');
      return 'Partial reply';
    });

    const tokens: string[] = [];
    await getResponse('I feel happy today', 'uplifter', [], (partial) => tokens.push(partial));

    expect(tokens).toEqual(['Partial', 'Partial reply']);
  });

  it('passes recent conversation history to the AI as context', async () => {
    vi.spyOn(webllmEngine, 'getEngineStatus').mockReturnValue('ready');
    const generateReplySpy = vi
      .spyOn(webllmEngine, 'generateReply')
      .mockResolvedValue('A reply.');

    await getResponse('I feel sad today', 'comforter', [
      { role: 'user', content: 'earlier message' },
      { role: 'assistant', content: 'earlier reply' },
    ]);

    const messagesArg = generateReplySpy.mock.calls[0][0];
    expect(messagesArg[0].role).toBe('system');
    expect(messagesArg).toContainEqual({ role: 'user', content: 'earlier message' });
    expect(messagesArg).toContainEqual({ role: 'assistant', content: 'earlier reply' });
    expect(messagesArg[messagesArg.length - 1]).toEqual({
      role: 'user',
      content: 'I feel sad today',
    });
  });

  it('crisis check takes priority over the AI engine and never calls it', async () => {
    vi.spyOn(webllmEngine, 'getEngineStatus').mockReturnValue('ready');
    const generateReplySpy = vi.spyOn(webllmEngine, 'generateReply');

    const reply = await getResponse('I want to die', 'comforter');

    expect(reply.isCrisis).toBe(true);
    expect(reply.source).toBe('fallback');
    expect(CRISIS_RESPONSES.comforter).toContain(reply.text);
    expect(generateReplySpy).not.toHaveBeenCalled();
  });

  it('falls back gracefully to the deterministic system if the AI call throws', async () => {
    vi.spyOn(webllmEngine, 'getEngineStatus').mockReturnValue('ready');
    vi.spyOn(webllmEngine, 'generateReply').mockRejectedValue(new Error('engine crashed'));

    const reply = await getResponse('I feel really jealous of my friends', 'comforter');

    expect(reply.source).toBe('fallback');
    expect(reply.isCrisis).toBe(false);
    expect(RESPONSE_TEMPLATES.jealousy.comforter).toContain(reply.text);
  });
});
