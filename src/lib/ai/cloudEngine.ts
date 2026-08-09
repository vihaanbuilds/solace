import type { ChatMessage } from './webllmEngine';
import type { ChatTier } from '../storage';

const CLOUD_ENDPOINT = '/api/cloud-chat';

// Generous backstops, not a tool for forcing brevity — pacing comes from the
// system prompt (see systemPrompt.ts). These just cap runaway generation,
// set high enough above each tier's expected reply length that a truncated
// mid-sentence cutoff should never actually happen in practice.
const MAX_TOKENS: Record<ChatTier, number> = {
  sprout: 300,
  bud: 500,
  bloom: 800,
  canopy: 800,
};

// The cloud model is search-tuned and keeps emitting citation markers like
// [1][2] and markdown emphasis even when explicitly told not to in the
// system prompt — that instruction helps but doesn't fully hold, so this
// strips what gets through rather than trusting the model to comply.
function cleanCloudText(text: string): string {
  return text
    .replace(/(\[\d+\])+/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/(?<!\*)\*(?!\*)(.*?)\*(?!\*)/g, '$1')
    .replace(/ {2,}/g, ' ')
    .replace(/\s+([.,!?])/g, '$1')
    .trim();
}

// Only the last (current) user message can carry images — history stays
// plain text, matching what actually gets shown in the chat log.
function toPayloadMessages(messages: ChatMessage[], images: string[]): unknown[] {
  if (images.length === 0) return messages;

  const lastUserIndex = messages.map((m) => m.role).lastIndexOf('user');
  return messages.map((message, index) => {
    if (index !== lastUserIndex) return message;
    return {
      role: message.role,
      content: [
        { type: 'text', text: message.content },
        ...images.map((url) => ({ type: 'image_url', image_url: { url } })),
      ],
    };
  });
}

// The cloud model runs on a real server, unlike Bloom's local mode — this
// call sends the conversation to /api/cloud-chat (and from there to the
// provider), so it must only ever be used behind a clear, honest disclosure
// to the user.
export async function generateCloudReply(
  messages: ChatMessage[],
  tier: ChatTier,
  images: string[] = [],
  onToken?: (partial: string) => void
): Promise<string> {
  const response = await fetch(CLOUD_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      messages: toPayloadMessages(messages, images),
      model: 'sonar',
      max_tokens: MAX_TOKENS[tier],
      // Lets the server apply its own per-tier daily rate limit — the real
      // backstop behind this browser's own daily nudge (messageLimits.ts).
      tier,
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error('Cloud AI request failed');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let full = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const data = trimmed.slice(5).trim();
      if (!data || data === '[DONE]') continue;

      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content ?? '';
        if (delta) {
          full += delta;
          onToken?.(cleanCloudText(full));
        }
      } catch {
        // Ignore malformed/partial SSE chunks.
      }
    }
  }

  return cleanCloudText(full);
}
