import type { MLCEngine, InitProgressReport } from '@mlc-ai/web-llm';

// Bloom is the only tier that can still run fully on-device, Sprout, Bud,
// and the default Bloom/Canopy experience are all cloud-backed (see
// cloudEngine.ts) now that a big upfront download isn't required to use the
// app at all. The real model stays an implementation detail (still
// disclosed honestly on the how-it-works page), branded as "Bloom" in the
// UI, never named directly.
//
// The model is sized to the device: phones and low-memory machines get the 1B
// model (under 1GB of GPU memory), because the 3B one needs over 2GB and a
// mobile browser tab is killed long before that. Devices without half-float
// shader support (common on iOS Safari) get the matching f32 build.
const MODEL_3B_F16 = 'Llama-3.2-3B-Instruct-q4f16_1-MLC';
const MODEL_3B_F32 = 'Llama-3.2-3B-Instruct-q4f32_1-MLC';
const MODEL_1B_F16 = 'Llama-3.2-1B-Instruct-q4f16_1-MLC';
const MODEL_1B_F32 = 'Llama-3.2-1B-Instruct-q4f32_1-MLC';
export const LOCAL_MODEL_APPROX_SIZE_GB = isSmallDevice() ? 0.9 : 1.7;

export type EngineStatus = 'idle' | 'loading' | 'ready' | 'unsupported' | 'error';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

type StatusListener = (status: EngineStatus, progress: number, statusText: string) => void;

const STALL_TIMEOUT_MS = 60000;
const STALL_MESSAGE =
  "This stalled without finishing, your device may not be powerful enough to run this locally. Turn local mode off to use the regular (cloud) Bloom instead.";
const FAILURE_MESSAGE =
  "That didn't finish loading, your device may not be powerful enough to run this locally. Turn local mode off to use the regular (cloud) Bloom instead.";

let engine: MLCEngine | null = null;
let status: EngineStatus = 'idle';
let progress = 0;
// Bumped on every loadEngine/cancelLoad call so a late-arriving resolution
// or progress event from an abandoned attempt can recognize it's stale and
// ignore itself instead of clobbering whatever's happened since.
let loadGeneration = 0;
let stallTimer: ReturnType<typeof setTimeout> | undefined;
let statusText = '';
const listeners = new Set<StatusListener>();

function setStatus(next: EngineStatus, nextProgress: number = progress, nextText: string = ''): void {
  status = next;
  progress = nextProgress;
  statusText = nextText;
  listeners.forEach((listener) => listener(status, progress, statusText));
}

export function getEngineStatus(): EngineStatus {
  return status;
}

export function getEngineProgress(): number {
  return progress;
}

export function getEngineStatusText(): string {
  return statusText;
}

export function subscribeToEngineStatus(listener: StatusListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function isSmallDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const memoryGB = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (typeof memoryGB === 'number') return memoryGB < 6;
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(pointer: coarse)').matches
    : false;
}

async function supportsShaderF16(): Promise<boolean> {
  try {
    const gpu = (navigator as Navigator & { gpu?: { requestAdapter(): Promise<{ features: Set<string> } | null> } }).gpu;
    const adapter = await gpu?.requestAdapter();
    return Boolean(adapter?.features.has('shader-f16'));
  } catch {
    return false;
  }
}

async function pickModelId(): Promise<string> {
  const f16 = await supportsShaderF16();
  if (isSmallDevice()) return f16 ? MODEL_1B_F16 : MODEL_1B_F32;
  return f16 ? MODEL_3B_F16 : MODEL_3B_F32;
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

// Soft hint only, not a hard gate, navigator.deviceMemory isn't available
// on Safari/iOS at all. Used to show an extra warning line next to Bloom's
// local-mode toggle rather than to block it outright; the user can always
// try it and turn it back off if it doesn't work well.
export function deviceSeemsUnderpowered(): boolean {
  const memoryGB = getDeviceMemoryGB();
  if (memoryGB !== null) return memoryGB < 6;
  return isLikelyMobile();
}

function armStallTimer(generation: number): void {
  window.clearTimeout(stallTimer);
  stallTimer = window.setTimeout(() => {
    if (loadGeneration !== generation) return;
    setStatus('error', 0, STALL_MESSAGE);
  }, STALL_TIMEOUT_MS);
}

export function loadEngine(): void {
  if (status === 'loading' || status === 'ready') return;

  if (!isWebGPUSupported()) {
    setStatus('unsupported');
    return;
  }

  const generation = ++loadGeneration;
  setStatus('loading', 0, '');
  armStallTimer(generation);

  Promise.all([import('@mlc-ai/web-llm'), pickModelId()])
    .then(([{ CreateMLCEngine }, modelId]) =>
      CreateMLCEngine(modelId, {
        initProgressCallback: (report: InitProgressReport) => {
          if (loadGeneration !== generation) return;
          armStallTimer(generation);
          setStatus('loading', report.progress, report.text);
        },
      })
    )
    .then((created) => {
      if (loadGeneration !== generation) return;
      window.clearTimeout(stallTimer);
      engine = created;
      setStatus('ready', 1, '');
    })
    .catch(() => {
      if (loadGeneration !== generation) return;
      window.clearTimeout(stallTimer);
      setStatus('error', 0, FAILURE_MESSAGE);
    });
}

// Invalidates any in-flight load (its promise chain checks loadGeneration
// and no-ops itself once stale) and drops back to idle, used whenever the
// user turns Bloom's local-mode toggle off, so a stuck or abandoned attempt
// can't keep the UI stranded in "loading" forever.
export function cancelLoad(): void {
  loadGeneration++;
  window.clearTimeout(stallTimer);
  engine = null;
  setStatus('idle', 0, '');
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
