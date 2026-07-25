# Solace — In-Browser AI Responses & Sidebar Chat Management

## Purpose

Replace Solace's template-based non-crisis responses with genuine, freshly
generated replies from a small language model running entirely in the
user's browser (via WebLLM/WebGPU) — no API key, no server, no cost, no
data leaving the device. Crisis detection and its curated response stay
exactly as they are: deterministic, keyword-based, and never delegated to
the AI. Also adds real conversation-history management (rename, delete with
an irreversibility warning) to the sidebar, and continued visual polish.

## Non-goals

- Not replacing crisis detection with AI judgment — that stays hard-coded.
- Not adding a backend, external API, or any network call at runtime for
  chat responses. Model weights download once from a public CDN into the
  browser's own cache; after that, all inference is local.
- Not guaranteeing top-tier LLM quality — this is a small on-device model,
  explicitly weaker than a hosted model like Claude. Expected to be
  meaningfully better than static templates but not as sharp.

## Architecture

### AI response layer

- `src/lib/ai/webllmEngine.ts` — wraps `@mlc-ai/web-llm`. Exposes:
  - `loadEngine(onProgress)` — begins background download/initialization of
    the model, reporting progress; safe to call once at app start.
  - `getEngineStatus()` — `'loading' | 'ready' | 'unsupported' | 'error'`.
  - `generateReply(systemPrompt, history, userMessage, onToken)` — streams
    a completion from the loaded model; throws if the engine isn't ready.
- `src/lib/ai/systemPrompt.ts` — builds the per-mode (Comforter / Uplifter /
  Reflector) system prompt: persona description, an explicit instruction
  that the AI must stay a calm, steady presence and never adopt the user's
  emotion as its own, scope limits (emotional support only — decline
  homework/trivia requests warmly, explain what it is if asked), the
  existing guardrail against minimizing language, and an instruction to
  vary phrasing and end with a genuine follow-up question.
- Model default: `Llama-3.2-3B-Instruct-q4f16_1-MLC` (medium tier), defined
  as a single config constant so it can be swapped later.

### Response engine

`getResponse` becomes async:

1. Crisis check (unchanged, synchronous, always first, always wins).
2. If the AI engine is ready: build the system prompt for the active mode,
   pass the last ~12 messages of conversation history plus the new
   message, and return the model's generated reply.
3. If the AI engine is not ready (`loading`, `unsupported`, or `error`):
   fall back to the existing keyword/template pipeline (greeting, identity,
   off-topic, emotion detection, clarifying questions) exactly as it
   works today. Nothing is deleted — this becomes the permanent fallback
   for unsupported browsers/devices and the temporary experience while the
   model downloads.

### Loading & status UX

- `loadEngine` is kicked off once when the app enters the chat view (after
  onboarding), in the background — the user can chat immediately using the
  fallback system while this happens.
- A small, unobtrusive status indicator in the header shows download
  progress; once the engine reports `ready`, a brief one-time toast/notice
  appears ("Solace's AI is now active") and all subsequent non-crisis
  replies are AI-generated.
- If `unsupported` (no WebGPU) or `error` (download/init failure), the
  status indicator quietly disappears and the app continues indefinitely
  on the fallback system — no alarming error state for the user.
- While the AI is generating a reply, the chat shows a lightweight
  "thinking" indicator; the reply streams in token-by-token as it's
  generated rather than appearing all at once.

### Sidebar conversation management

- `Conversation` gains an optional `titleIsCustom?: boolean` flag. Renaming
  sets `title` and `titleIsCustom: true`; auto-derived titling (from the
  first message) only applies when this flag is not set, so a manual
  rename is never silently overwritten.
- Each sidebar item gets a rename control (inline edit) and a delete
  control. Delete requires confirmation with explicit wording that this
  is permanent and unrecoverable. Deleting the active conversation falls
  back to the next most recent conversation (or creates a fresh one if
  none remain).

### Testing

- WebLLM cannot run inside Vitest/jsdom (needs real WebGPU), so
  `webllmEngine` is written behind a small interface that tests replace
  with a fake implementation — tests verify routing logic (crisis always
  wins; AI used when ready; fallback used when not ready; conversation
  history is passed through) without invoking the real model.
- Rename/delete get component tests covering: inline rename persists and
  blocks auto-retitling, delete requires confirmation, deleting the active
  conversation falls back sensibly, deleting the last conversation creates
  a fresh one.

## Testing note on the AI reply content itself

Because the model's actual text is non-deterministic and can't be
meaningfully asserted on in an automated test, tests validate the
*plumbing* (correct prompt construction, correct routing, crisis priority,
graceful fallback) rather than the AI's specific wording — the same
approach any AI-integrated app takes.
