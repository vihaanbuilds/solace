import type { MLCEngine, InitProgressReport } from '@mlc-ai/web-llm';

export type ModelTier = 'small' | 'medium' | 'large';

export interface ModelTierInfo {
  modelId: string;
  label: string;
  description: string;
  approxSizeGB: number;
}

// Real, valid model IDs from @mlc-ai/web-llm's prebuilt config — quality
// scales with size, so this is a genuine light/balanced/strongest ladder,
// not just three names for the same thing.
export const MODEL_TIERS: Record<ModelTier, ModelTierInfo> = {
  small: {
    modelId: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
    label: 'Lighter',
    description: 'Smallest download — works well on almost any device.',
    approxSizeGB: 1,
  },
  medium: {
    modelId: 'gemma-2-2b-it-q4f16_1-MLC',
    label: 'Balanced',
    description: 'Noticeably more thoughtful, for a bit more data.',
    approxSizeGB: 1.6,
  },
  large: {
    modelId: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
    label: 'Strongest',
    description: 'The most capable responses, at the largest download.',
    approxSizeGB: 1.7,
  },
};

export type EngineStatus = 'idle' | 'loading' | 'ready' | 'unsupported' | 'error';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

type StatusListener = (status: EngineStatus, progress: number) => void;

let engine: MLCEngine | null = null;
let status: EngineStatus = 'idle';
let progress = 0;
let activeTier: ModelTier | null = null;
const listeners = new Set<StatusListener>();

function setStatus(next: EngineStatus, nextProgress: number = progress): void {
  status = next;
  progress = nextProgress;
  listeners.forEach((listener) => listener(status, progress));
}

export function getEngineStatus(): EngineStatus {
  return status;
}

export function getEngineProgress(): number {
  return progress;
}

export function getActiveTier(): ModelTier | null {
  return activeTier;
}

export function subscribeToEngineStatus(listener: StatusListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isWebGPUSupported(): boolean {
  return typeof navigator !== 'undefined' && 'gpu' in navigator;
}

function getDeviceMemoryGB(): number | null {
  const nav = navigator as Navigator & { deviceMemory?: number };
  return typeof nav.deviceMemory === 'number' ? nav.deviceMemory : null;
}

function isLikelyMobile(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
}

// Best-effort starting point, not a hard ceiling — navigator.deviceMemory
// isn't available on Safari/iOS at all, so this is only a recommendation.
// The user can always pick a bigger tier themselves; we just don't want to
// default anyone into a large download their device probably can't use well.
export function getRecommendedTier(): ModelTier {
  const memoryGB = getDeviceMemoryGB();
  if (memoryGB !== null) {
    if (memoryGB >= 6) return 'large';
    if (memoryGB >= 3) return 'medium';
    return 'small';
  }
  return isLikelyMobile() ? 'medium' : 'large';
}

export function loadEngine(tier: ModelTier = getRecommendedTier()): void {
  if (status === 'loading' || status === 'ready') return;

  if (!isWebGPUSupported()) {
    setStatus('unsupported');
    return;
  }

  activeTier = tier;
  setStatus('loading', 0);

  import('@mlc-ai/web-llm')
    .then(({ CreateMLCEngine }) =>
      CreateMLCEngine(MODEL_TIERS[tier].modelId, {
        initProgressCallback: (report: InitProgressReport) => {
          setStatus('loading', report.progress);
        },
      })
    )
    .then((created) => {
      engine = created;
      setStatus('ready', 1);
    })
    .catch(() => {
      setStatus('error');
    });
}

// Lets Settings offer a bigger (or smaller) tier after one is already
// loaded — CreateMLCEngine has no in-place "resize", so this just resets
// local state and starts a fresh load with the new tier's model.
export function switchTier(tier: ModelTier): void {
  engine = null;
  status = 'idle';
  loadEngine(tier);
}

export async function generateReply(
  messages: ChatMessage[],
  onToken?: (partial: string) => void
): Promise<string> {
  if (!engine || status !== 'ready') {
    throw new Error('WebLLM engine is not ready');
  }

  const stream = await engine.chat.completions.create({
    messages,
    stream: true,
  });

  let full = '';
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content ?? '';
    if (delta) {
      full += delta;
      onToken?.(full);
    }
  }

  return full.trim();
}
