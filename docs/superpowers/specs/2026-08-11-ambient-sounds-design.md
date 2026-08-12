# Solace — Ambient Sounds (Music Therapy)

## Purpose

Add a soothing-sounds feature to Solace: four ambient textures (ocean,
rain, birds, breeze), synthesized live in the browser via the Web Audio
API, layerable and independently volume-controlled, reachable from a
circular button on the main chat without leaving the conversation. A text
box lets someone describe what they want ("a quiet forest morning", "chill
lo-fi coffee shop vibe") and the existing cloud AI translates that into a
blend of the same four layers.

## Non-goals

- Not adding real recorded audio files — everything is synthesized, no
  licensing, no bundle weight, works offline.
- Not attempting to recreate or imitate any specific existing song's beat
  or melody — raised as a real copyright/derivative-work concern during
  design and explicitly ruled out.
- Not adding real music/song streaming (Spotify, Apple Music, etc.) —
  would require licensed API credentials this project doesn't have; out of
  scope for this spec, could be its own separate project later if the user
  obtains such credentials.
- Not adding new synthesis primitives beyond the four layers (no drum
  machine, no melodic sequencer) — mood/genre descriptions get creatively
  mapped onto the same four layers' weights and characteristics, not onto
  new instrument types.
- Not guaranteeing audio autoplay on page load — browsers block audio
  without a user gesture; a saved mix restores as ready-to-resume, not
  auto-playing.

## Architecture

### Sound synthesis engine

`src/lib/audio/soundSynth.ts` — pure Web Audio primitives, one factory
function per layer, each taking an `AudioContext` and returning a
controller `{ setVolume(v: number), stop() }`:

- **Ocean** — low-pass-filtered noise with a slow, irregular gain envelope
  (LFO with randomized period/depth) producing an uneven rolling swell,
  like waves breaking non-periodically.
- **Rain** — band-pass-filtered noise tuned to a steady hiss; texture comes
  from the filter shape, not individual drop simulation.
- **Birds** — *not* continuous. Short, randomly-timed pitch-swept
  oscillator bursts (quick frequency glides in the 2–4kHz range) scheduled
  at irregular intervals over a very quiet bed, so it reads as occasional
  chirps rather than a tone.
- **Breeze** — band-pass-filtered noise with a slowly wandering filter
  cutoff (LFO on frequency) for a soft whooshing wind character.

Noise sources are generated via a buffer of random samples looped through
an `AudioBufferSourceNode`; filtering via `BiquadFilterNode`; envelopes and
LFOs via `GainNode`/`AudioParam` automation. No `AudioWorklet` needed at
this scope.

### Mixer

`src/lib/audio/soundMixer.ts` — owns the single shared `AudioContext` and
the four layer controllers. Exposes:

- `toggleLayer(name: SoundLayer): void` — starts or stops that layer.
- `setLayerVolume(name: SoundLayer, volume: number): void`
- `applyBlend(blend: Record<SoundLayer, number>): void` — sets all four
  volumes at once (used by both presets and AI-blend results), starting/
  stopping layers as their weight crosses zero.
- `stopAll(): void`
- `getState(): { layer: SoundLayer; volume: number }[]` — for persistence
  and UI sync.

The `AudioContext` is created lazily on first user interaction (required
by browser autoplay policy) and `resume()`d on every subsequent open, in
case the browser suspended it.

### Custom description → blend (cloud AI)

`api/sound-blend.ts` — new Vercel edge function, structurally mirroring
`api/cloud-chat.ts`:

- Request: `{ description: string }`.
- Reuses `OPENAI_API_KEY`/`OPENAI_BASE_URL` (the same Aqua-backed provider
  already configured) with a fast, non-streaming call — this doesn't need
  the tiered/empathetic system prompt machinery, just a single JSON
  completion.
- System prompt instructs the model to interpret *both* literal nature
  descriptions ("stormy ocean at night") *and* mood/genre/vibe language
  ("chill lo-fi coffee shop", "upbeat morning energy") and respond with
  strictly `{ ocean: number, rain: number, birds: number, breeze: number }`,
  each 0–1, nothing else. The model is explicitly told these are the only
  four available textures — it's blending existing ambient layers, not
  generating new sound types or attempting to match any real song.
- Server-side validation: response must parse as JSON with exactly those
  four numeric keys; each value clamped to `[0, 1]`; malformed responses
  return a 502 the same way `cloud-chat.ts` does for upstream failures.
- Reuses the existing `checkRateLimit`/`getClientIp` rate-limit infra from
  `api/_lib/rateLimit.ts` to prevent abuse.

### UI

- `src/components/SoundButton.tsx` — circular button rendered in the main
  chat view (`App.tsx`/`ChatWindow.tsx` header area). Tap toggles the
  `SoundsOverlay` open/closed. Shows a subtle pulsing glow whenever
  `mixer.getState()` has any layer with volume > 0, so playback state is
  visible without opening the overlay.
- `src/components/SoundsOverlay.tsx` — full-screen in-app overlay (styled
  like `SettingsModal`/`ProfileSetupModal` — a component conditionally
  rendered inside `App.tsx`, *not* a route, so closing it never tears down
  the `AudioContext` and sound keeps playing in the background):
  - Four preset toggle buttons (Ocean/Rain/Birds/Breeze). Tapping toggles
    that layer via `mixer.toggleLayer`; an active layer reveals its volume
    slider (`mixer.setLayerVolume`).
  - Text input below for a custom description; submit calls
    `api/sound-blend.ts` and applies the result via `mixer.applyBlend`,
    which updates the same preset toggles/sliders to reflect the new mix
    (custom descriptions and presets share one state representation).
  - "Stop all" clears every layer (`mixer.stopAll`).

### Persistence

Extend `src/lib/storage.ts` with `loadSoundMix()`/`saveSoundMix()`,
following the existing `localStorage` pattern used for theme/sidebar
state. Saves layer volumes (and the last custom description text, if any)
on every change. On load, the overlay pre-populates sliders/toggles from
the saved mix but does **not** auto-play — the first `toggleLayer`/tap
after load is what actually starts audio, satisfying the browser's
autoplay-requires-a-gesture constraint.

## Data flow

1. User taps the circular button → `SoundsOverlay` opens.
2. User taps a preset (e.g. Ocean) → `mixer.toggleLayer('ocean')` starts
   that layer at a default volume → state saved to `localStorage` →
   circular button starts pulsing.
3. User types a description and submits → `POST /api/sound-blend` →
   response validated/clamped → `mixer.applyBlend(...)` updates all four
   layers to match → same persistence/UI sync as step 2.
4. User closes the overlay → `SoundsOverlay` unmounts, `SoundButton`
   remains, sound keeps playing (same `AudioContext`, owned by the mixer
   singleton, not by the overlay component).

## Error handling

- `api/sound-blend.ts` upstream failure or malformed JSON → 502, overlay
  shows an inline "couldn't create that sound — try describing it
  differently" message; existing layer state is untouched (no partial
  application of a bad blend).
- Rate limit hit → same 429 pattern as `cloud-chat.ts`, same user-facing
  message style.
- `AudioContext` creation failing (unsupported browser) → `SoundButton`
  simply doesn't render, matching how the app already hides cloud-only
  features when a prerequisite isn't available (e.g. `AiStatusIndicator`).

## Testing

- `api/sound-blend.test.ts` — mirrors `api/cloud-chat.test.ts`: mocked
  `fetch` covering success, malformed-JSON response, upstream failure, and
  rate-limit rejection; asserts weight clamping behavior explicitly.
- `soundMixer.test.ts` — unit tests for `toggleLayer`/`setLayerVolume`/
  `applyBlend`/`stopAll` state transitions, with `soundSynth`'s factory
  functions mocked (jsdom has no real Web Audio API, so these test mixer
  *logic*, not actual audio output).
- `SoundsOverlay.test.tsx` / `SoundButton.test.tsx` — testing-library
  tests for preset taps, slider changes, and the description-submit flow,
  with `fetch` and the mixer mocked, following the existing component test
  patterns in this codebase (e.g. `ModeSelector.test.tsx`).
- Actual synthesized sound quality (does the ocean layer sound like an
  ocean) isn't something automated tests can verify — confirmed manually
  by running the dev server and listening, same as any audio-output
  feature.
