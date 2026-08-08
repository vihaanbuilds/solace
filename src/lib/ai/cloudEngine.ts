import type { ChatMessage } from './webllmEngine';

const CLOUD_ENDPOINT = '/api/cloud-chat';

export const CLOUD_MODEL_INFO = {
  name: 'Canopy',
  version: 'v4.2.1',
  tagline: 'Cloud-assisted, most capable',
  description:
    'Runs on a server instead of your device, so it can be more capable — but that means your messages leave your device to generate a reply, unlike every other option here.',
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

// The cloud model runs on a real server, unlike WebLLM — this call sends
// the conversation to /api/cloud-chat (and from there to the provider), so
// it must only ever be used behind a clear, honest disclosure to the user.
export async function generateCloudReply(
  messages: ChatMessage[],
  onToken?: (partial: string) => void
): Promise<string> {
  const response = await fetch(CLOUD_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ messages, model: 'sonar' }),
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
