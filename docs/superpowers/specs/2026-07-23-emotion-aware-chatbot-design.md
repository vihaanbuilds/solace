# Solace — Emotion-Aware Support Chatbot Design

## Purpose

Solace is a web-based, empathetic chatbot for teens and above that recognizes
a user's emotional state from what they type (sadness, grief, anger,
happiness, jealousy, anxiety, loneliness, overwhelm, guilt/shame) and responds
in a way that validates that specific emotion rather than deflecting,
minimizing, or accidentally frustrating the user further. It is a supportive
companion, not a clinical or emergency service.

## Non-goals

- No account system, no server, no external API calls, no analytics.
- Not a diagnostic or clinical tool — framed clearly as a supportive companion.
- Not multi-language at launch — English only.

## Architecture

Fully client-side React + Vite + TypeScript app. All emotion detection,
response generation, crisis checks, and persistence run in the browser; no
backend or API keys required.

```
solace/
  src/
    components/
      ChatWindow.tsx        # message list + input
      MessageBubble.tsx     # bot/user bubble, rainbow-glow wrapper for bot messages
      ModeSelector.tsx      # Comforter / Uplifter / Reflector picker
      CrisisBanner.tsx      # crisis resource callout
      ThemeToggle.tsx       # light/dark switch
      AmbientBackground.tsx # drifting pastel blobs
    lib/
      emotions/
        lexicon.ts          # per-emotion keyword/phrase lists + weights
        detectEmotion.ts    # scoring, negation, intensity modifiers
        crisisDetection.ts  # separate, higher-priority check
      responses/
        templates.ts        # response templates keyed by [emotion][mode]
        responseEngine.ts   # picks template, handles variation/fallback
      storage.ts             # localStorage persistence helpers
    styles/
      theme.css              # baby blue / blush pink tokens, light+dark variants
    App.tsx
  index.html
  package.json
```

## Emotion Detection

A curated lexicon covers each target emotion: sadness, grief, anger,
happiness, jealousy, anxiety/fear, loneliness, overwhelm/stress,
guilt/shame. Each lexicon entry is a word or phrase with a weight (e.g.
"gone forever" scores higher for grief than "miss").

Scoring pipeline per message:

1. Tokenize and phrase-match against all emotion lexicons.
2. Apply negation handling (e.g. "I'm not sad" suppresses a nearby
   sadness hit).
3. Apply intensity modifiers ("really", "so", "extremely" boost score;
   "a bit", "kinda" dampen it).
4. The highest-scoring emotion wins. If the top two scores are close
   (ambiguous), the bot asks a gentle clarifying question instead of
   guessing (e.g. "It sounds like there's a lot going on — is it more
   sadness, or something closer to anger?").
5. Crisis detection (see below) runs first and separately, on every
   message, before the emotion pipeline, and always takes priority over
   normal emotion routing.

## Response Generation & Modes

Response templates form a matrix of emotion × mode, each with several
phrasing variants selected semi-randomly to avoid repetition within a
conversation.

Three user-selectable modes (persisted until changed, coloring every
response's tone):

- **Comforter** — validates and soothes ("That sounds really heavy to
  carry.")
- **Uplifter** — gently forward-looking, never dismissive ("You don't
  have to have it figured out today. Even naming this took courage.")
- **Reflector** — helps unpack the situation calmly ("What do you think
  is underneath that feeling?")

All templates are written against a shared guardrail list of phrases to
avoid (e.g. "at least", "just try", "calm down", "cheer up") so responses
never minimize or contradict the detected emotion.

## Crisis Safety

A separate, always-on lexicon flags crisis-indicating language (self-harm,
suicide, hopelessness-to-the-point-of-danger phrases). This check cannot
be disabled by mode selection and always runs before normal emotion
routing.

When triggered:

- A `CrisisBanner` appears above the chat with a calm acknowledgment and
  resources (988 Suicide & Crisis Lifeline; Crisis Text Line — text HOME
  to 741741).
- The bot's reply still responds warmly and specifically to what the user
  said (not a canned deflection), in whichever mode is active, drawn from
  a crisis-safe template set.
- Onboarding includes a short, clear note that Solace is not a substitute
  for a real person or professional help.

## UI & Theming

- Palette: baby blue and blush pink as primary tokens, with both a light
  theme (soft white/cream base) and dark theme (deep navy/plum base).
  Toggle lives in the header and persists across sessions.
- Rainbow glow: a soft, blurred pastel aurora behind each bot message
  bubble, hue drifting slowly (~8–12s cycle). The bubble itself stays
  solid/opaque so text remains fully readable.
- Ambient background: slow-drifting soft pastel blobs at low opacity
  behind the whole app (blue ↔ pink), with the chat panel floating above
  using a slight glass/blur effect.
- Onboarding: a brief, warm intro screen covering what Solace is, the
  professional-help disclaimer, and a short explainer of the three modes,
  shown before entering the chat.

## Persistence & Privacy

- Conversation history is saved to `localStorage` and restored on reload.
- A "Start fresh" button clears history, with a confirmation step since
  it destroys saved conversation data.
- No network calls, no analytics, no external storage — nothing leaves
  the browser. This is surfaced in onboarding copy as a privacy assurance
  given the sensitivity of the content.

## Testing

- Unit tests (Vitest) for `detectEmotion.ts`: lexicon scoring, negation
  handling, intensity modifiers, tie-breaking into clarifying questions.
- Unit tests for `crisisDetection.ts`: keyword coverage and false-positive
  spot checks.
- Component tests for mode switching and localStorage persistence
  round-trip.
