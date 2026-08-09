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
import * as cloudEngine from '../ai/cloudEngine';
import * as messageLimits from '../ai/messageLimits';
import * as storage from '../storage';

describe('getResponse (fallback path, cloud AI unavailable)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    vi.spyOn(cloudEngine, 'generateCloudReply').mockRejectedValue(new Error('network error'));
  });

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

describe('getResponse (cloud AI available — default tier)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('uses the cloud engine by default and returns its generated text', async () => {
    const generateCloudSpy = vi
      .spyOn(cloudEngine, 'generateCloudReply')
      .mockResolvedValue('A freshly generated, non-templated reply.');

    const reply = await getResponse('I feel really jealous of my friends', 'comforter');

    expect(reply.source).toBe('ai');
    expect(reply.isCrisis).toBe(false);
    expect(reply.text).toBe('A freshly generated, non-templated reply.');
    expect(generateCloudSpy).toHaveBeenCalled();
  });

  it('streams tokens via the onToken callback', async () => {
    vi.spyOn(cloudEngine, 'generateCloudReply').mockImplementation(
      async (_messages, _tier, _images, onToken) => {
        onToken?.('Partial');
        onToken?.('Partial reply');
        return 'Partial reply';
      }
    );

    const tokens: string[] = [];
    await getResponse('I feel happy today', 'uplifter', [], (partial) => tokens.push(partial));

    expect(tokens).toEqual(['Partial', 'Partial reply']);
  });

  it('passes recent conversation history to the AI as context', async () => {
    const generateCloudSpy = vi
      .spyOn(cloudEngine, 'generateCloudReply')
      .mockResolvedValue('A reply.');

    await getResponse('I feel sad today', 'comforter', [
      { role: 'user', content: 'earlier message' },
      { role: 'assistant', content: 'earlier reply' },
    ]);

    const messagesArg = generateCloudSpy.mock.calls[0][0];
    expect(messagesArg[0].role).toBe('system');
    expect(messagesArg).toContainEqual({ role: 'user', content: 'earlier message' });
    expect(messagesArg).toContainEqual({ role: 'assistant', content: 'earlier reply' });
    expect(messagesArg[messagesArg.length - 1]).toEqual({
      role: 'user',
      content: 'I feel sad today',
    });
  });

  it('crisis check takes priority over the AI engine and never calls it', async () => {
    const generateCloudSpy = vi.spyOn(cloudEngine, 'generateCloudReply');

    const reply = await getResponse('I want to die', 'comforter');

    expect(reply.isCrisis).toBe(true);
    expect(reply.source).toBe('fallback');
    expect(CRISIS_RESPONSES.comforter).toContain(reply.text);
    expect(generateCloudSpy).not.toHaveBeenCalled();
  });

  it('falls back gracefully to the deterministic system if the cloud call throws', async () => {
    vi.spyOn(cloudEngine, 'generateCloudReply').mockRejectedValue(new Error('cloud failure'));

    const reply = await getResponse('I feel really jealous of my friends', 'comforter');

    expect(reply.source).toBe('fallback');
    expect(reply.isCrisis).toBe(false);
    expect(RESPONSE_TEMPLATES.jealousy.comforter).toContain(reply.text);
  });

  it('drops images for every tier except canopy', async () => {
    vi.spyOn(storage, 'loadAiTier').mockReturnValue('bud');
    const generateCloudSpy = vi
      .spyOn(cloudEngine, 'generateCloudReply')
      .mockResolvedValue('A reply.');

    await getResponse('hello', 'comforter', [], undefined, null, ['data:image/jpeg;base64,abc']);

    expect(generateCloudSpy.mock.calls[0][2]).toEqual([]);
  });

  it('passes images through for canopy', async () => {
    vi.spyOn(storage, 'loadAiTier').mockReturnValue('canopy');
    const generateCloudSpy = vi
      .spyOn(cloudEngine, 'generateCloudReply')
      .mockResolvedValue('A reply.');
    const images = ['data:image/jpeg;base64,abc'];

    await getResponse('hello', 'comforter', [], undefined, null, images);

    expect(generateCloudSpy.mock.calls[0][2]).toEqual(images);
  });
});

describe('getResponse (Bloom local mode)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    vi.spyOn(storage, 'loadAiTier').mockReturnValue('bloom');
    vi.spyOn(storage, 'loadBloomLocalMode').mockReturnValue(true);
  });

  it('uses the local engine once it is ready', async () => {
    vi.spyOn(webllmEngine, 'getEngineStatus').mockReturnValue('ready');
    const generateReplySpy = vi
      .spyOn(webllmEngine, 'generateReply')
      .mockResolvedValue('A local reply.');
    const generateCloudSpy = vi.spyOn(cloudEngine, 'generateCloudReply');

    const reply = await getResponse('I feel really jealous of my friends', 'comforter');

    expect(reply.source).toBe('ai');
    expect(reply.text).toBe('A local reply.');
    expect(generateReplySpy).toHaveBeenCalled();
    expect(generateCloudSpy).not.toHaveBeenCalled();
  });

  it('falls back to cloud Bloom while the local engine is still loading', async () => {
    vi.spyOn(webllmEngine, 'getEngineStatus').mockReturnValue('loading');
    const generateReplySpy = vi.spyOn(webllmEngine, 'generateReply');
    const generateCloudSpy = vi
      .spyOn(cloudEngine, 'generateCloudReply')
      .mockResolvedValue('Cloud Bloom reply.');

    const reply = await getResponse('I feel really jealous of my friends', 'comforter');

    expect(reply.text).toBe('Cloud Bloom reply.');
    expect(generateReplySpy).not.toHaveBeenCalled();
    expect(generateCloudSpy).toHaveBeenCalled();
  });

  it('falls back to cloud Bloom if the local engine errored', async () => {
    vi.spyOn(webllmEngine, 'getEngineStatus').mockReturnValue('error');
    const generateCloudSpy = vi
      .spyOn(cloudEngine, 'generateCloudReply')
      .mockResolvedValue('Cloud Bloom reply.');

    const reply = await getResponse('I feel really jealous of my friends', 'comforter');

    expect(reply.text).toBe('Cloud Bloom reply.');
    expect(generateCloudSpy).toHaveBeenCalled();
  });

  it('crisis check still takes priority and calls neither engine', async () => {
    vi.spyOn(webllmEngine, 'getEngineStatus').mockReturnValue('ready');
    const generateReplySpy = vi.spyOn(webllmEngine, 'generateReply');
    const generateCloudSpy = vi.spyOn(cloudEngine, 'generateCloudReply');

    const reply = await getResponse('I want to die', 'comforter');

    expect(reply.isCrisis).toBe(true);
    expect(reply.source).toBe('fallback');
    expect(generateReplySpy).not.toHaveBeenCalled();
    expect(generateCloudSpy).not.toHaveBeenCalled();
  });
});

describe('getResponse (daily message limits)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('stops calling the cloud engine once the tier hits its daily cap, with an explanatory reply', async () => {
    vi.spyOn(storage, 'loadAiTier').mockReturnValue('canopy');
    const generateCloudSpy = vi
      .spyOn(cloudEngine, 'generateCloudReply')
      .mockResolvedValue('A reply.');

    const limit = messageLimits.getDailyLimit('canopy');
    for (let i = 0; i < limit; i += 1) {
      await getResponse('I feel really jealous of my friends', 'comforter');
    }
    expect(generateCloudSpy).toHaveBeenCalledTimes(limit);

    const reply = await getResponse('I feel really jealous of my friends', 'comforter');

    expect(reply.source).toBe('fallback');
    expect(reply.text).toMatch(/today's message limit for canopy/i);
    expect(generateCloudSpy).toHaveBeenCalledTimes(limit);
  });

  it('shows the limit-reached explanation once, then falls back silently after', async () => {
    vi.spyOn(storage, 'loadAiTier').mockReturnValue('sprout');
    vi.spyOn(cloudEngine, 'generateCloudReply').mockResolvedValue('A reply.');

    const limit = messageLimits.getDailyLimit('sprout');
    for (let i = 0; i < limit; i += 1) {
      await getResponse('I feel really jealous of my friends', 'comforter');
    }

    const first = await getResponse('I feel really jealous of my friends', 'comforter');
    expect(first.text).toMatch(/today's message limit/i);

    const second = await getResponse('I feel really jealous of my friends', 'comforter');
    expect(second.text).not.toMatch(/today's message limit/i);
    expect(RESPONSE_TEMPLATES.jealousy.comforter).toContain(second.text);
  });

  it('does not count a failed cloud call against the daily limit', async () => {
    vi.spyOn(storage, 'loadAiTier').mockReturnValue('bud');
    vi.spyOn(cloudEngine, 'generateCloudReply').mockRejectedValue(new Error('network error'));

    await getResponse('I feel really jealous of my friends', 'comforter');
    await getResponse('I feel really jealous of my friends', 'comforter');

    expect(messageLimits.getMessagesUsedToday('bud')).toBe(0);
  });

  it('never blocks a crisis message, even after the tier hits its daily cap', async () => {
    vi.spyOn(storage, 'loadAiTier').mockReturnValue('canopy');
    vi.spyOn(cloudEngine, 'generateCloudReply').mockResolvedValue('A reply.');

    const limit = messageLimits.getDailyLimit('canopy');
    for (let i = 0; i < limit; i += 1) {
      await getResponse('I feel really jealous of my friends', 'comforter');
    }

    const reply = await getResponse('I want to die', 'comforter');

    expect(reply.isCrisis).toBe(true);
    expect(CRISIS_RESPONSES.comforter).toContain(reply.text);
  });

  it('does not apply any daily limit to Bloom local mode', async () => {
    vi.spyOn(storage, 'loadAiTier').mockReturnValue('bloom');
    vi.spyOn(storage, 'loadBloomLocalMode').mockReturnValue(true);
    vi.spyOn(webllmEngine, 'getEngineStatus').mockReturnValue('ready');
    const generateReplySpy = vi
      .spyOn(webllmEngine, 'generateReply')
      .mockResolvedValue('A local reply.');

    const limit = messageLimits.getDailyLimit('bloom');
    for (let i = 0; i < limit + 3; i += 1) {
      const reply = await getResponse('I feel really jealous of my friends', 'comforter');
      expect(reply.source).toBe('ai');
    }
    expect(generateReplySpy).toHaveBeenCalledTimes(limit + 3);
  });
});
