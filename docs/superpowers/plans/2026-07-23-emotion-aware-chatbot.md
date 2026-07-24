# Solace Emotion-Aware Chatbot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Solace, a fully client-side React + Vite + TypeScript web app that detects a user's emotion from free text (sadness, grief, anger, happiness, jealousy, anxiety, loneliness, overwhelm, guilt) via a curated lexicon, responds empathetically in one of three user-selectable tones (Comforter / Uplifter / Reflector), always checks for crisis language first, and presents it all in a baby-blue/blush-pink, light/dark, rainbow-glow immersive UI with local persistence.

**Architecture:** Pure client-side SPA — no backend, no API keys, no network calls. Emotion/crisis detection and response generation are pure TypeScript functions under `src/lib/`, fully unit-testable in isolation from React. UI components under `src/components/` consume those library functions and `localStorage` helpers for persistence.

**Tech Stack:** React 18, Vite, TypeScript, Vitest + @testing-library/react for tests, plain CSS (custom properties for theming) — no CSS framework, no state-management library (component state + a couple of small custom hooks is enough).

## Global Constraints

- No network calls, no analytics, no external API keys — everything runs in the browser (spec: Architecture).
- Crisis detection always runs before emotion detection and cannot be disabled by mode selection (spec: Crisis Safety).
- Response templates must never use minimizing language ("at least", "just try", "calm down", "cheer up") (spec: Response Generation & Modes).
- Three modes are named **Comforter**, **Uplifter**, **Reflector** (spec: Response Generation & Modes).
- Theme palette is baby blue + blush pink, with both light and dark variants, toggle persisted (spec: UI & Theming).
- Bot message bubbles get a slow-drifting pastel rainbow glow behind them; bubble text itself stays opaque/readable (spec: UI & Theming).
- Conversation history persists to `localStorage` across reloads; a confirmed "Start fresh" action clears it (spec: Persistence & Privacy).
- Repo root: `~/solace` (already `git init`'d with the design spec committed).

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx` (placeholder shell, replaced fully in Task 11)
- Create: `src/test/setup.ts`
- Create: `.gitignore`

**Interfaces:**
- Produces: a working `npm run dev`, `npm run build`, `npm test` toolchain that every later task's tests run under.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "solace",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.8",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "jsdom": "^24.1.1",
    "typescript": "^5.5.4",
    "vite": "^5.4.0",
    "vitest": "^2.0.5"
  }
}
```

- [ ] **Step 2: Create `vite.config.ts`**

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
});
```

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 4: Create `tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 5: Create `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Solace</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Create `src/main.tsx`**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 7: Create placeholder `src/App.tsx`**

```tsx
export default function App() {
  return <div>Solace</div>;
}
```

- [ ] **Step 8: Create `src/test/setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 9: Create `.gitignore`**

```
node_modules
dist
.DS_Store
```

- [ ] **Step 10: Install dependencies and verify the toolchain**

Run: `cd ~/solace && npm install`
Expected: install completes with no errors.

Run: `npm run build`
Expected: `dist/` is produced with no TypeScript errors.

Run: `npm test`
Expected: `No test files found` (no test files exist yet) — this confirms Vitest itself runs.

- [ ] **Step 11: Commit**

```bash
cd ~/solace
git add package.json vite.config.ts tsconfig.json tsconfig.node.json index.html src/main.tsx src/App.tsx src/test/setup.ts .gitignore
git commit -m "Scaffold Vite + React + TypeScript project"
```

---

## Task 2: Emotion Lexicon & Detection Engine

**Files:**
- Create: `src/lib/emotions/lexicon.ts`
- Create: `src/lib/emotions/detectEmotion.ts`
- Test: `src/lib/emotions/detectEmotion.test.ts`

**Interfaces:**
- Consumes: nothing (pure library, no dependencies on other tasks).
- Produces:
  - `type Emotion = 'sadness' | 'grief' | 'anger' | 'happiness' | 'jealousy' | 'anxiety' | 'loneliness' | 'overwhelm' | 'guilt'` (exported from `lexicon.ts`)
  - `interface EmotionScore { emotion: Emotion; score: number }`
  - `interface DetectionResult { topEmotion: Emotion | null; scores: EmotionScore[]; ambiguous: boolean }`
  - `function detectEmotion(text: string): DetectionResult` (exported from `detectEmotion.ts`) — used by Task 4's response engine.

- [ ] **Step 1: Create `src/lib/emotions/lexicon.ts`**

```ts
export type Emotion =
  | 'sadness'
  | 'grief'
  | 'anger'
  | 'happiness'
  | 'jealousy'
  | 'anxiety'
  | 'loneliness'
  | 'overwhelm'
  | 'guilt';

export interface LexiconEntry {
  phrase: string;
  weight: number;
}

export const EMOTION_LEXICON: Record<Emotion, LexiconEntry[]> = {
  sadness: [
    { phrase: 'sad', weight: 1 },
    { phrase: 'down', weight: 1 },
    { phrase: 'unhappy', weight: 1.2 },
    { phrase: 'empty', weight: 1.5 },
    { phrase: 'hopeless', weight: 2 },
    { phrase: 'crying', weight: 1.8 },
    { phrase: 'tears', weight: 1.5 },
    { phrase: 'depressed', weight: 2 },
    { phrase: 'miserable', weight: 1.8 },
    { phrase: 'heartbroken', weight: 2 },
  ],
  grief: [
    { phrase: 'passed away', weight: 2.5 },
    { phrase: 'gone forever', weight: 2.5 },
    { phrase: 'lost my', weight: 2 },
    { phrase: 'miss them', weight: 2 },
    { phrase: 'funeral', weight: 2 },
    { phrase: 'died', weight: 2.2 },
    { phrase: 'no longer here', weight: 2 },
    { phrase: 'losing someone', weight: 2 },
  ],
  anger: [
    { phrase: 'furious', weight: 2 },
    { phrase: 'pissed', weight: 1.8 },
    { phrase: 'angry', weight: 1.5 },
    { phrase: 'mad', weight: 1.2 },
    { phrase: 'hate', weight: 1.8 },
    { phrase: 'unfair', weight: 1.5 },
    { phrase: "can't stand", weight: 1.8 },
    { phrase: 'rage', weight: 2 },
    { phrase: 'fed up', weight: 1.6 },
  ],
  happiness: [
    { phrase: 'happy', weight: 1.5 },
    { phrase: 'excited', weight: 1.5 },
    { phrase: 'great', weight: 1 },
    { phrase: 'amazing', weight: 1.5 },
    { phrase: 'joy', weight: 1.8 },
    { phrase: 'thrilled', weight: 1.8 },
    { phrase: 'grateful', weight: 1.5 },
    { phrase: 'proud', weight: 1.5 },
  ],
  jealousy: [
    { phrase: 'jealous', weight: 2 },
    { phrase: 'envious', weight: 2 },
    { phrase: 'why not me', weight: 1.8 },
    { phrase: 'everyone else has', weight: 1.6 },
    { phrase: 'not fair that they', weight: 1.6 },
    { phrase: 'wish i had what', weight: 1.6 },
  ],
  anxiety: [
    { phrase: 'anxious', weight: 1.8 },
    { phrase: 'worried', weight: 1.5 },
    { phrase: 'nervous', weight: 1.3 },
    { phrase: 'panic', weight: 2 },
    { phrase: 'scared', weight: 1.5 },
    { phrase: 'on edge', weight: 1.6 },
    { phrase: "can't stop thinking", weight: 1.5 },
    { phrase: 'what if', weight: 1 },
  ],
  loneliness: [
    { phrase: 'lonely', weight: 2 },
    { phrase: 'alone', weight: 1.5 },
    { phrase: 'no one understands', weight: 1.8 },
    { phrase: 'isolated', weight: 1.8 },
    { phrase: 'nobody cares', weight: 2 },
    { phrase: 'left out', weight: 1.6 },
  ],
  overwhelm: [
    { phrase: 'overwhelmed', weight: 2 },
    { phrase: 'too much', weight: 1.5 },
    { phrase: "can't handle", weight: 1.8 },
    { phrase: 'drowning', weight: 2 },
    { phrase: 'burnt out', weight: 1.8 },
    { phrase: 'exhausted', weight: 1.5 },
    { phrase: 'breaking down', weight: 1.8 },
  ],
  guilt: [
    { phrase: 'guilty', weight: 2 },
    { phrase: 'my fault', weight: 1.8 },
    { phrase: 'ashamed', weight: 2 },
    { phrase: "shouldn't have", weight: 1.5 },
    { phrase: 'regret', weight: 1.6 },
    { phrase: 'let them down', weight: 1.8 },
  ],
};

export const NEGATION_WORDS = ['not', "n't", 'no', 'never', 'without', 'hardly'];

export const INTENSIFIERS: Record<string, number> = {
  really: 1.5,
  so: 1.4,
  extremely: 1.8,
  very: 1.4,
  totally: 1.3,
  absolutely: 1.6,
};

export const DAMPENERS: Record<string, number> = {
  kinda: 0.6,
  slightly: 0.5,
  somewhat: 0.6,
  'a bit': 0.5,
  'a little': 0.6,
};
```

- [ ] **Step 2: Create `src/lib/emotions/detectEmotion.ts`**

```ts
import { EMOTION_LEXICON, Emotion, NEGATION_WORDS, INTENSIFIERS, DAMPENERS } from './lexicon';

export interface EmotionScore {
  emotion: Emotion;
  score: number;
}

export interface DetectionResult {
  topEmotion: Emotion | null;
  scores: EmotionScore[];
  ambiguous: boolean;
}

const AMBIGUITY_THRESHOLD = 0.75;

function wordsBefore(normalized: string, index: number, maxChars = 25): string[] {
  const start = Math.max(0, index - maxChars);
  const before = normalized.slice(start, index).trim();
  return before.length ? before.split(/\s+/) : [];
}

export function detectEmotion(text: string): DetectionResult {
  const normalized = text.toLowerCase();
  const emotions = Object.keys(EMOTION_LEXICON) as Emotion[];
  const scores: Record<Emotion, number> = Object.fromEntries(
    emotions.map((e) => [e, 0])
  ) as Record<Emotion, number>;

  for (const emotion of emotions) {
    for (const entry of EMOTION_LEXICON[emotion]) {
      const idx = normalized.indexOf(entry.phrase);
      if (idx === -1) continue;

      let weight = entry.weight;
      const before = wordsBefore(normalized, idx);
      const lastWord = before[before.length - 1];
      const lastTwo = before.slice(-2).join(' ');
      const lastThree = before.slice(-3);

      const negated = lastThree.some((w) => NEGATION_WORDS.includes(w));
      if (negated) weight *= -1;

      const intensifier = INTENSIFIERS[lastWord] ?? INTENSIFIERS[lastTwo];
      const dampener = DAMPENERS[lastWord] ?? DAMPENERS[lastTwo];
      if (intensifier) weight *= intensifier;
      else if (dampener) weight *= dampener;

      scores[emotion] += weight;
    }
  }

  const ranked: EmotionScore[] = emotions
    .map((emotion) => ({ emotion, score: scores[emotion] }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  if (ranked.length === 0) {
    return { topEmotion: null, scores: ranked, ambiguous: false };
  }

  const [top, second] = ranked;
  const ambiguous = !!second && top.score - second.score < AMBIGUITY_THRESHOLD;

  return {
    topEmotion: ambiguous ? null : top.emotion,
    scores: ranked,
    ambiguous,
  };
}
```

- [ ] **Step 3: Create `src/lib/emotions/detectEmotion.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { detectEmotion } from './detectEmotion';

describe('detectEmotion', () => {
  it('detects sadness from sad, empty language', () => {
    const result = detectEmotion('I feel so sad and empty lately');
    expect(result.topEmotion).toBe('sadness');
  });

  it('detects grief from loss-specific language over plain sadness', () => {
    const result = detectEmotion('My grandma passed away and I miss them so much');
    expect(result.topEmotion).toBe('grief');
  });

  it('suppresses a negated emotion word', () => {
    const result = detectEmotion("I'm not sad, everything is fine");
    expect(result.topEmotion).not.toBe('sadness');
  });

  it('boosts score with an intensifier compared to the bare phrase', () => {
    const plain = detectEmotion('I am anxious about this');
    const intensified = detectEmotion('I am extremely anxious about this');
    expect(intensified.scores[0].score).toBeGreaterThan(plain.scores[0].score);
  });

  it('returns null topEmotion and ambiguous flag when two emotions tie closely', () => {
    const result = detectEmotion('I am mad and I am sad');
    expect(result.ambiguous).toBe(true);
    expect(result.topEmotion).toBeNull();
  });

  it('returns null topEmotion for text with no matched emotion words', () => {
    const result = detectEmotion('The weather today is cloudy');
    expect(result.topEmotion).toBeNull();
    expect(result.scores).toHaveLength(0);
  });
});
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd ~/solace && npm test -- detectEmotion`
Expected: all 6 tests in `detectEmotion.test.ts` PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/emotions/lexicon.ts src/lib/emotions/detectEmotion.ts src/lib/emotions/detectEmotion.test.ts
git commit -m "Add emotion lexicon and detection engine"
```

---

## Task 3: Crisis Detection

**Files:**
- Create: `src/lib/emotions/crisisDetection.ts`
- Test: `src/lib/emotions/crisisDetection.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `function isCrisis(text: string): boolean` — used by Task 4's response engine, always checked before `detectEmotion`.

- [ ] **Step 1: Create `src/lib/emotions/crisisDetection.ts`**

```ts
const CRISIS_PHRASES = [
  'want to die',
  'kill myself',
  'end my life',
  'end it all',
  "don't want to be here anymore",
  'no reason to live',
  'better off dead',
  'suicide',
  'hurting myself',
  'harm myself',
  'self harm',
  'self-harm',
];

export function isCrisis(text: string): boolean {
  const normalized = text.toLowerCase();
  return CRISIS_PHRASES.some((phrase) => normalized.includes(phrase));
}
```

- [ ] **Step 2: Create `src/lib/emotions/crisisDetection.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { isCrisis } from './crisisDetection';

describe('isCrisis', () => {
  it('flags direct statements of wanting to die', () => {
    expect(isCrisis('I want to die')).toBe(true);
  });

  it('flags self-harm language', () => {
    expect(isCrisis('sometimes I think about hurting myself')).toBe(true);
  });

  it('flags "suicide" mentions', () => {
    expect(isCrisis('I keep having thoughts about suicide')).toBe(true);
  });

  it('does not flag ordinary text', () => {
    expect(isCrisis('I love pizza and I had a good day')).toBe(false);
  });

  it('does not flag ordinary sadness without crisis language', () => {
    expect(isCrisis('I feel really sad and empty today')).toBe(false);
  });
});
```

- [ ] **Step 3: Run tests to verify they pass**

Run: `cd ~/solace && npm test -- crisisDetection`
Expected: all 5 tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/lib/emotions/crisisDetection.ts src/lib/emotions/crisisDetection.test.ts
git commit -m "Add crisis detection lexicon and check"
```

---

## Task 4: Response Templates & Response Engine

**Files:**
- Create: `src/lib/responses/templates.ts`
- Create: `src/lib/responses/responseEngine.ts`
- Test: `src/lib/responses/responseEngine.test.ts`

**Interfaces:**
- Consumes: `detectEmotion` and `DetectionResult` from `../emotions/detectEmotion` (Task 2); `isCrisis` from `../emotions/crisisDetection` (Task 3).
- Produces:
  - `type Mode = 'comforter' | 'uplifter' | 'reflector'` (exported from `templates.ts`) — used by `ModeSelector` (Task 8) and `ChatWindow` (Task 11).
  - `interface BotReply { text: string; isCrisis: boolean; detection: DetectionResult }`
  - `function getResponse(message: string, mode: Mode): BotReply` (exported from `responseEngine.ts`) — used by `ChatWindow` (Task 11).

- [ ] **Step 1: Create `src/lib/responses/templates.ts`**

```ts
import { Emotion } from '../emotions/lexicon';

export type Mode = 'comforter' | 'uplifter' | 'reflector';

type TemplateMap = Record<Emotion, Record<Mode, string[]>>;

export const RESPONSE_TEMPLATES: TemplateMap = {
  sadness: {
    comforter: [
      "That sounds really heavy to carry. I'm glad you told me.",
      "It makes sense that you'd feel this low given what you're going through.",
    ],
    uplifter: [
      "This feeling is real, and it won't be the last word. You don't have to carry it alone.",
      "You're allowed to feel sad about this — and you're still moving through it, one moment at a time.",
    ],
    reflector: [
      "What do you think is at the center of this sadness right now?",
      "When did this feeling start settling in?",
    ],
  },
  grief: {
    comforter: [
      "I'm so sorry. That kind of loss leaves a mark that takes real time.",
      "There's no right way to grieve — however this feels for you is okay.",
    ],
    uplifter: [
      "What you lost mattered, and carrying that forward is part of honoring it.",
      "Grief this size doesn't go away fast, but you don't have to move through it alone.",
    ],
    reflector: [
      "Is there a memory of them that's been on your mind lately?",
      "What's felt hardest about this loss so far?",
    ],
  },
  anger: {
    comforter: [
      "That sounds really frustrating — it makes sense you're upset.",
      "Your anger here is valid. Something unfair happened.",
    ],
    uplifter: [
      "That fire you feel can be redirected once the heat settles a little — but first, it's okay to just be mad.",
      "You're allowed to be angry about this. Let's sit with it before deciding what's next.",
    ],
    reflector: [
      "What part of this feels most unfair to you?",
      "What happened right before you started feeling this way?",
    ],
  },
  happiness: {
    comforter: [
      "I'm really glad to hear that — you deserve this moment.",
      "That sounds wonderful. Thank you for sharing it with me.",
    ],
    uplifter: [
      'This is worth celebrating! What made this happen?',
      'Hold onto this feeling — you earned it.',
    ],
    reflector: [
      'What part of this feels the best to you?',
      'What made today different?',
    ],
  },
  jealousy: {
    comforter: [
      "It's okay to feel that pull — wanting something someone else has doesn't make you a bad person.",
      'That comparison feeling is really uncomfortable. I hear you.',
    ],
    uplifter: [
      'That envy might be pointing at something you actually want for yourself — worth noticing.',
      "Feeling this way doesn't take anything away from your own path.",
    ],
    reflector: [
      'What is it about their situation that stands out to you most?',
      'Is this feeling more about them, or about something you\'re missing right now?',
    ],
  },
  anxiety: {
    comforter: [
      "That worry sounds exhausting to carry around. I'm here with you.",
      "It makes sense your mind is racing about this.",
    ],
    uplifter: [
      "You've gotten through anxious moments before, even when it didn't feel possible.",
      "One small thing at a time — you don't have to solve all of it right now.",
    ],
    reflector: [
      "What's the specific 'what if' that keeps coming up?",
      'When did you first notice this worry today?',
    ],
  },
  loneliness: {
    comforter: [
      'Feeling alone like this is really hard, even when people are around you.',
      "I'm glad you're not keeping this to yourself right now.",
    ],
    uplifter: [
      'Reaching out, even just here, is a real step out of that isolation.',
      "This feeling can shift — it doesn't mean this is how things stay.",
    ],
    reflector: [
      'When do you feel this loneliness the most?',
      'Is there anyone who\'s felt close to you recently, even a little?',
    ],
  },
  overwhelm: {
    comforter: [
      "That's a lot to be holding all at once. No wonder you're feeling this way.",
      "It's okay to feel maxed out right now.",
    ],
    uplifter: [
      "You don't have to carry all of it this second — just the next small piece.",
      "This much on your plate would be a lot for anyone. You're doing more than you're giving yourself credit for.",
    ],
    reflector: [
      "What's the one piece of this that feels heaviest right now?",
      'If you had to name just one thing pulling at you most, what would it be?',
    ],
  },
  guilt: {
    comforter: [
      "That guilt sounds heavy. It doesn't mean you're a bad person.",
      "It's okay — feeling responsible for this doesn't mean you deserve to feel this bad.",
    ],
    uplifter: [
      'Noticing this and caring about it says something good about you.',
      'You can take responsibility without carrying it forever.',
    ],
    reflector: [
      'What part of this feels like it was actually in your control?',
      'What would you tell a friend who felt this way about something similar?',
    ],
  },
};

export const CLARIFYING_QUESTIONS = [
  "It sounds like there's a lot going on — could you tell me a bit more about what you're feeling?",
  "I want to make sure I understand — what's the main feeling underneath all this right now?",
];

export const CRISIS_RESPONSES: Record<Mode, string[]> = {
  comforter: [
    "I'm really glad you told me that. That sounds like an incredibly heavy thing to carry, and you don't have to carry it alone.",
  ],
  uplifter: [
    'Thank you for trusting me with that. It took something to say it out loud, and reaching out matters right now.',
  ],
  reflector: [
    "I hear you, and I want to understand more — can you tell me what's been happening that's brought you to this point?",
  ],
};
```

- [ ] **Step 2: Create `src/lib/responses/responseEngine.ts`**

```ts
import { detectEmotion, DetectionResult } from '../emotions/detectEmotion';
import { isCrisis } from '../emotions/crisisDetection';
import { RESPONSE_TEMPLATES, CLARIFYING_QUESTIONS, CRISIS_RESPONSES, Mode } from './templates';

export interface BotReply {
  text: string;
  isCrisis: boolean;
  detection: DetectionResult;
}

function pickRandom(options: string[]): string {
  return options[Math.floor(Math.random() * options.length)];
}

export function getResponse(message: string, mode: Mode): BotReply {
  const detection = detectEmotion(message);
  const crisis = isCrisis(message);

  if (crisis) {
    return { text: pickRandom(CRISIS_RESPONSES[mode]), isCrisis: true, detection };
  }

  if (!detection.topEmotion) {
    return { text: pickRandom(CLARIFYING_QUESTIONS), isCrisis: false, detection };
  }

  return {
    text: pickRandom(RESPONSE_TEMPLATES[detection.topEmotion][mode]),
    isCrisis: false,
    detection,
  };
}
```

- [ ] **Step 3: Create `src/lib/responses/responseEngine.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { getResponse } from './responseEngine';
import { RESPONSE_TEMPLATES, CLARIFYING_QUESTIONS, CRISIS_RESPONSES } from './templates';

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
});
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd ~/solace && npm test -- responseEngine`
Expected: all 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/responses/templates.ts src/lib/responses/responseEngine.ts src/lib/responses/responseEngine.test.ts
git commit -m "Add response templates and response engine with crisis priority"
```

---

## Task 5: Local Storage Persistence

**Files:**
- Create: `src/lib/storage.ts`
- Test: `src/lib/storage.test.ts`

**Interfaces:**
- Consumes: nothing (uses browser `localStorage`, available in Vitest's jsdom environment).
- Produces:
  - `interface StoredMessage { id: string; sender: 'user' | 'bot'; text: string; isCrisis?: boolean; timestamp: number }` — used by `MessageBubble` (Task 9) and `ChatWindow` (Task 11).
  - `saveMessages(messages: StoredMessage[]): void`, `loadMessages(): StoredMessage[]`, `clearMessages(): void`
  - `saveMode(mode: string): void`, `loadMode(): string | null`
  - `saveTheme(theme: string): void`, `loadTheme(): string | null`

- [ ] **Step 1: Create `src/lib/storage.ts`**

```ts
export interface StoredMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  isCrisis?: boolean;
  timestamp: number;
}

const MESSAGES_KEY = 'solace.messages';
const MODE_KEY = 'solace.mode';
const THEME_KEY = 'solace.theme';

export function saveMessages(messages: StoredMessage[]): void {
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
}

export function loadMessages(): StoredMessage[] {
  const raw = localStorage.getItem(MESSAGES_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as StoredMessage[];
  } catch {
    return [];
  }
}

export function clearMessages(): void {
  localStorage.removeItem(MESSAGES_KEY);
}

export function saveMode(mode: string): void {
  localStorage.setItem(MODE_KEY, mode);
}

export function loadMode(): string | null {
  return localStorage.getItem(MODE_KEY);
}

export function saveTheme(theme: string): void {
  localStorage.setItem(THEME_KEY, theme);
}

export function loadTheme(): string | null {
  return localStorage.getItem(THEME_KEY);
}
```

- [ ] **Step 2: Create `src/lib/storage.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveMessages,
  loadMessages,
  clearMessages,
  saveMode,
  loadMode,
  saveTheme,
  loadTheme,
  StoredMessage,
} from './storage';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('round-trips messages through localStorage', () => {
    const messages: StoredMessage[] = [
      { id: '1', sender: 'user', text: 'hi', timestamp: 100 },
      { id: '2', sender: 'bot', text: 'hello', timestamp: 200 },
    ];
    saveMessages(messages);
    expect(loadMessages()).toEqual(messages);
  });

  it('returns an empty array when nothing is stored', () => {
    expect(loadMessages()).toEqual([]);
  });

  it('clears stored messages', () => {
    saveMessages([{ id: '1', sender: 'user', text: 'hi', timestamp: 100 }]);
    clearMessages();
    expect(loadMessages()).toEqual([]);
  });

  it('round-trips the selected mode', () => {
    saveMode('uplifter');
    expect(loadMode()).toBe('uplifter');
  });

  it('round-trips the selected theme', () => {
    saveTheme('dark');
    expect(loadTheme()).toBe('dark');
  });
});
```

- [ ] **Step 3: Run tests to verify they pass**

Run: `cd ~/solace && npm test -- storage`
Expected: all 5 tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/lib/storage.ts src/lib/storage.test.ts
git commit -m "Add localStorage persistence helpers"
```

---

## Task 6: Theme Tokens & Theme Toggle

**Files:**
- Create: `src/styles/theme.css`
- Create: `src/components/ThemeToggle.tsx`
- Test: `src/components/ThemeToggle.test.tsx`

**Interfaces:**
- Consumes: `loadTheme`, `saveTheme` from `../lib/storage` (Task 5).
- Produces: `ThemeToggle` component, mounted by `App` (Task 11). Sets `data-theme` attribute on `document.documentElement`, which `theme.css` selectors key off of.

- [ ] **Step 1: Create `src/styles/theme.css`**

```css
:root {
  --color-baby-blue: #aee1f9;
  --color-blush-pink: #f7c6d9;
  --color-bg: #fdfbff;
  --color-surface: #ffffff;
  --color-text: #2e2a38;
  --color-text-soft: #6b667a;
  --color-accent: var(--color-baby-blue);
  --color-accent-2: var(--color-blush-pink);
  --color-border: #e3d9f0;
}

:root[data-theme='dark'] {
  --color-bg: #1b1a2e;
  --color-surface: #262445;
  --color-text: #f1eefb;
  --color-text-soft: #b6b0d6;
  --color-accent: #6fb8e0;
  --color-accent-2: #e39ab8;
  --color-border: #3a3760;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: 'Segoe UI', system-ui, sans-serif;
  background: var(--color-bg);
  color: var(--color-text);
  transition: background 0.4s ease, color 0.4s ease;
}

.theme-toggle {
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  border-radius: 999px;
  width: 2.5rem;
  height: 2.5rem;
  font-size: 1.1rem;
  cursor: pointer;
}
```

- [ ] **Step 2: Create `src/components/ThemeToggle.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { loadTheme, saveTheme } from '../lib/storage';

type Theme = 'light' | 'dark';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => (loadTheme() as Theme) || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    saveTheme(theme);
  }, [theme]);

  return (
    <button
      onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
      aria-label="Toggle theme"
      className="theme-toggle"
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
```

- [ ] **Step 3: Create `src/components/ThemeToggle.test.tsx`**

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from './ThemeToggle';

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('defaults to light theme', () => {
    render(<ThemeToggle />);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('switches to dark theme on click and persists it', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    await user.click(screen.getByLabelText('Toggle theme'));
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('solace.theme')).toBe('dark');
  });
});
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd ~/solace && npm test -- ThemeToggle`
Expected: both tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/styles/theme.css src/components/ThemeToggle.tsx src/components/ThemeToggle.test.tsx
git commit -m "Add theme tokens and light/dark theme toggle"
```

---

## Task 7: Ambient Background

**Files:**
- Modify: `src/styles/theme.css` (append ambient background styles)
- Create: `src/components/AmbientBackground.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: `AmbientBackground` component, mounted once by `App` (Task 11).

- [ ] **Step 1: Append ambient background styles to `src/styles/theme.css`**

```css

.ambient-background {
  position: fixed;
  inset: 0;
  overflow: hidden;
  z-index: -1;
  pointer-events: none;
}

.blob {
  position: absolute;
  width: 40vw;
  height: 40vw;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.18;
  animation: drift 40s ease-in-out infinite;
}

.blob-blue {
  background: var(--color-baby-blue);
  top: -10%;
  left: -10%;
}

.blob-pink {
  background: var(--color-blush-pink);
  bottom: -15%;
  right: -10%;
  animation-delay: -20s;
}

@keyframes drift {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(6vw, 8vh) scale(1.15);
  }
}
```

- [ ] **Step 2: Create `src/components/AmbientBackground.tsx`**

```tsx
export function AmbientBackground() {
  return (
    <div className="ambient-background" aria-hidden="true">
      <div className="blob blob-blue" />
      <div className="blob blob-pink" />
    </div>
  );
}
```

- [ ] **Step 3: Verify it renders without errors**

Run: `cd ~/solace && npm run build`
Expected: build succeeds with no TypeScript errors (this component has no logic to unit test — it's pure decorative markup, verified visually in Task 12).

- [ ] **Step 4: Commit**

```bash
git add src/styles/theme.css src/components/AmbientBackground.tsx
git commit -m "Add ambient drifting background"
```

---

## Task 8: Mode Selector

**Files:**
- Modify: `src/styles/theme.css` (append mode selector styles)
- Create: `src/components/ModeSelector.tsx`
- Test: `src/components/ModeSelector.test.tsx`

**Interfaces:**
- Consumes: `Mode` type from `../lib/responses/templates` (Task 4).
- Produces: `ModeSelector` component with props `{ mode: Mode; onChange: (mode: Mode) => void }`, used by `ChatWindow` (Task 11).

- [ ] **Step 1: Append mode selector styles to `src/styles/theme.css`**

```css

.mode-selector {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem;
}

.mode-pill {
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-soft);
  border-radius: 999px;
  padding: 0.4rem 1rem;
  cursor: pointer;
  font-size: 0.9rem;
}

.mode-pill-active {
  background: linear-gradient(135deg, var(--color-accent), var(--color-accent-2));
  color: var(--color-text);
  font-weight: 600;
}
```

- [ ] **Step 2: Create `src/components/ModeSelector.tsx`**

```tsx
import { Mode } from '../lib/responses/templates';

interface ModeSelectorProps {
  mode: Mode;
  onChange: (mode: Mode) => void;
}

const MODE_LABELS: Record<Mode, string> = {
  comforter: 'Comforter',
  uplifter: 'Uplifter',
  reflector: 'Reflector',
};

export function ModeSelector({ mode, onChange }: ModeSelectorProps) {
  return (
    <div className="mode-selector" role="tablist" aria-label="Response mode">
      {(Object.keys(MODE_LABELS) as Mode[]).map((m) => (
        <button
          key={m}
          role="tab"
          aria-selected={mode === m}
          className={`mode-pill ${mode === m ? 'mode-pill-active' : ''}`}
          onClick={() => onChange(m)}
        >
          {MODE_LABELS[m]}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create `src/components/ModeSelector.test.tsx`**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModeSelector } from './ModeSelector';

describe('ModeSelector', () => {
  it('marks the active mode as selected', () => {
    render(<ModeSelector mode="comforter" onChange={() => {}} />);
    expect(screen.getByRole('tab', { name: 'Comforter' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByRole('tab', { name: 'Uplifter' })).toHaveAttribute(
      'aria-selected',
      'false'
    );
  });

  it('calls onChange with the clicked mode', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ModeSelector mode="comforter" onChange={onChange} />);
    await user.click(screen.getByRole('tab', { name: 'Reflector' }));
    expect(onChange).toHaveBeenCalledWith('reflector');
  });
});
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd ~/solace && npm test -- ModeSelector`
Expected: both tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/styles/theme.css src/components/ModeSelector.tsx src/components/ModeSelector.test.tsx
git commit -m "Add mode selector with Comforter/Uplifter/Reflector pills"
```

---

## Task 9: Message Bubble with Rainbow Glow

**Files:**
- Modify: `src/styles/theme.css` (append message bubble + rainbow glow styles)
- Create: `src/components/MessageBubble.tsx`
- Test: `src/components/MessageBubble.test.tsx`

**Interfaces:**
- Consumes: `StoredMessage` from `../lib/storage` (Task 5).
- Produces: `MessageBubble` component with prop `{ message: StoredMessage }`, used by `ChatWindow` (Task 11).

- [ ] **Step 1: Append message bubble styles to `src/styles/theme.css`**

```css

.message-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  overflow-y: auto;
  flex: 1;
}

.message-row {
  position: relative;
  display: flex;
}

.message-row-bot {
  justify-content: flex-start;
}

.message-row-user {
  justify-content: flex-end;
}

.message-bubble {
  position: relative;
  max-width: 70%;
  padding: 0.75rem 1rem;
  border-radius: 1rem;
  line-height: 1.4;
}

.message-bubble-bot {
  background: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.message-bubble-user {
  background: linear-gradient(135deg, var(--color-baby-blue), var(--color-blush-pink));
  color: #2e2a38;
}

.rainbow-glow {
  position: absolute;
  top: -8px;
  left: -8px;
  right: 30%;
  bottom: -8px;
  border-radius: 1.5rem;
  filter: blur(20px);
  opacity: 0.5;
  z-index: -1;
  background: linear-gradient(
    270deg,
    #ffb3ba,
    #ffdfba,
    #ffffba,
    #baffc9,
    #bae1ff,
    #d5baff
  );
  background-size: 400% 400%;
  animation: hue-drift 10s ease-in-out infinite;
}

@keyframes hue-drift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
```

- [ ] **Step 2: Create `src/components/MessageBubble.tsx`**

```tsx
import { StoredMessage } from '../lib/storage';

export function MessageBubble({ message }: { message: StoredMessage }) {
  const isBot = message.sender === 'bot';
  return (
    <div className={`message-row ${isBot ? 'message-row-bot' : 'message-row-user'}`}>
      {isBot && <div className="rainbow-glow" aria-hidden="true" />}
      <div className={`message-bubble ${isBot ? 'message-bubble-bot' : 'message-bubble-user'}`}>
        {message.text}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `src/components/MessageBubble.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageBubble } from './MessageBubble';
import { StoredMessage } from '../lib/storage';

describe('MessageBubble', () => {
  it('renders a bot message with the rainbow glow wrapper', () => {
    const message: StoredMessage = {
      id: '1',
      sender: 'bot',
      text: 'I hear you',
      timestamp: 1,
    };
    const { container } = render(<MessageBubble message={message} />);
    expect(screen.getByText('I hear you')).toBeInTheDocument();
    expect(container.querySelector('.rainbow-glow')).not.toBeNull();
  });

  it('renders a user message without the rainbow glow wrapper', () => {
    const message: StoredMessage = {
      id: '2',
      sender: 'user',
      text: 'I feel sad',
      timestamp: 1,
    };
    const { container } = render(<MessageBubble message={message} />);
    expect(screen.getByText('I feel sad')).toBeInTheDocument();
    expect(container.querySelector('.rainbow-glow')).toBeNull();
  });
});
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd ~/solace && npm test -- MessageBubble`
Expected: both tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/styles/theme.css src/components/MessageBubble.tsx src/components/MessageBubble.test.tsx
git commit -m "Add message bubble with rainbow glow behind bot replies"
```

---

## Task 10: Crisis Banner

**Files:**
- Modify: `src/styles/theme.css` (append crisis banner styles)
- Create: `src/components/CrisisBanner.tsx`
- Test: `src/components/CrisisBanner.test.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: `CrisisBanner` component (no props), rendered conditionally by `ChatWindow` (Task 11).

- [ ] **Step 1: Append crisis banner styles to `src/styles/theme.css`**

```css

.crisis-banner {
  margin: 0 1rem;
  padding: 1rem;
  border-radius: 0.75rem;
  background: var(--color-surface);
  border: 2px solid var(--color-accent-2);
}

.crisis-banner p {
  margin: 0.25rem 0;
}
```

- [ ] **Step 2: Create `src/components/CrisisBanner.tsx`**

```tsx
export function CrisisBanner() {
  return (
    <div className="crisis-banner" role="alert">
      <p>
        It sounds like you're carrying something really heavy right now. You don't have
        to face this alone.
      </p>
      <p>
        📞 <strong>988 Suicide &amp; Crisis Lifeline</strong> — call or text 988
      </p>
      <p>
        💬 <strong>Crisis Text Line</strong> — text HOME to 741741
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Create `src/components/CrisisBanner.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CrisisBanner } from './CrisisBanner';

describe('CrisisBanner', () => {
  it('renders as an alert with crisis resources', () => {
    render(<CrisisBanner />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/988/)).toBeInTheDocument();
    expect(screen.getByText(/741741/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd ~/solace && npm test -- CrisisBanner`
Expected: the test PASSes.

- [ ] **Step 5: Commit**

```bash
git add src/styles/theme.css src/components/CrisisBanner.tsx src/components/CrisisBanner.test.tsx
git commit -m "Add crisis resource banner"
```

---

## Task 11: Chat Window, Onboarding & App Wiring

**Files:**
- Create: `src/components/ChatWindow.tsx`
- Modify: `src/App.tsx` (replace placeholder from Task 1)
- Modify: `src/styles/theme.css` (append app shell + onboarding styles)
- Test: `src/components/ChatWindow.test.tsx`

**Interfaces:**
- Consumes: `getResponse`, `Mode` (Task 4); `StoredMessage`, `loadMessages`, `saveMessages`, `clearMessages`, `loadMode`, `saveMode`, `loadTheme` (Task 5); `ThemeToggle` (Task 6); `AmbientBackground` (Task 7); `ModeSelector` (Task 8); `MessageBubble` (Task 9); `CrisisBanner` (Task 10).
- Produces: the fully wired app — no further consumers, this is the top of the tree.

- [ ] **Step 1: Append app shell and onboarding styles to `src/styles/theme.css`**

```css

.app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
}

.chat-window {
  display: flex;
  flex-direction: column;
  flex: 1;
  max-width: 640px;
  width: 100%;
  margin: 0 auto;
}

.chat-input-row {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
}

.chat-input-row input {
  flex: 1;
  padding: 0.6rem 0.9rem;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
}

.chat-input-row button {
  border: none;
  border-radius: 999px;
  padding: 0.6rem 1.1rem;
  cursor: pointer;
  background: linear-gradient(135deg, var(--color-baby-blue), var(--color-blush-pink));
}

.start-fresh-btn {
  background: transparent !important;
  border: 1px solid var(--color-border) !important;
  color: var(--color-text-soft);
}

.onboarding-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.onboarding-card {
  max-width: 480px;
  padding: 2rem;
  border-radius: 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  text-align: center;
}

.onboarding-card button {
  margin-top: 1rem;
  border: none;
  border-radius: 999px;
  padding: 0.6rem 1.5rem;
  cursor: pointer;
  background: linear-gradient(135deg, var(--color-baby-blue), var(--color-blush-pink));
}
```

- [ ] **Step 2: Create `src/components/ChatWindow.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react';
import { MessageBubble } from './MessageBubble';
import { ModeSelector } from './ModeSelector';
import { CrisisBanner } from './CrisisBanner';
import { getResponse } from '../lib/responses/responseEngine';
import { Mode } from '../lib/responses/templates';
import {
  StoredMessage,
  loadMessages,
  saveMessages,
  clearMessages,
  loadMode,
  saveMode,
} from '../lib/storage';

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ChatWindow() {
  const [messages, setMessages] = useState<StoredMessage[]>(() => loadMessages());
  const [mode, setMode] = useState<Mode>(() => (loadMode() as Mode) || 'comforter');
  const [input, setInput] = useState('');
  const [showCrisisBanner, setShowCrisisBanner] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  useEffect(() => {
    saveMode(mode);
  }, [mode]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSend() {
    const text = input.trim();
    if (!text) return;

    const userMessage: StoredMessage = {
      id: makeId(),
      sender: 'user',
      text,
      timestamp: Date.now(),
    };

    const reply = getResponse(text, mode);

    const botMessage: StoredMessage = {
      id: makeId(),
      sender: 'bot',
      text: reply.text,
      isCrisis: reply.isCrisis,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage, botMessage]);
    setShowCrisisBanner(reply.isCrisis);
    setInput('');
  }

  function handleStartFresh() {
    if (window.confirm('This will clear your saved conversation. Continue?')) {
      clearMessages();
      setMessages([]);
      setShowCrisisBanner(false);
    }
  }

  return (
    <div className="chat-window">
      <ModeSelector mode={mode} onChange={setMode} />
      {showCrisisBanner && <CrisisBanner />}
      <div className="message-list">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        <div ref={endRef} />
      </div>
      <div className="chat-input-row">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type how you're feeling..."
          aria-label="Message input"
        />
        <button onClick={handleSend}>Send</button>
        <button onClick={handleStartFresh} className="start-fresh-btn">
          Start fresh
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Replace `src/App.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { ChatWindow } from './components/ChatWindow';
import { ThemeToggle } from './components/ThemeToggle';
import { AmbientBackground } from './components/AmbientBackground';
import { loadTheme } from './lib/storage';
import './styles/theme.css';

export default function App() {
  const [onboarded, setOnboarded] = useState(false);

  useEffect(() => {
    const theme = loadTheme();
    if (theme) document.documentElement.setAttribute('data-theme', theme);
  }, []);

  if (!onboarded) {
    return (
      <div className="onboarding-screen">
        <AmbientBackground />
        <div className="onboarding-card">
          <h1>Welcome to Solace</h1>
          <p>
            Solace is a supportive companion that listens and responds to how you're
            feeling. It's here to help you feel heard — it isn't a substitute for a real
            person or a mental health professional.
          </p>
          <p>
            Pick a mode below to shape how Solace responds: <strong>Comforter</strong>{' '}
            validates and soothes, <strong>Uplifter</strong> gently encourages, and{' '}
            <strong>Reflector</strong> helps you think things through.
          </p>
          <button onClick={() => setOnboarded(true)}>I'm ready</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <AmbientBackground />
      <header className="app-header">
        <h1>Solace</h1>
        <ThemeToggle />
      </header>
      <ChatWindow />
    </div>
  );
}
```

- [ ] **Step 4: Create `src/components/ChatWindow.test.tsx`**

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatWindow } from './ChatWindow';
import { loadMessages } from '../lib/storage';

describe('ChatWindow', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('sends a message and renders both the user message and a bot reply', async () => {
    const user = userEvent.setup();
    render(<ChatWindow />);
    const input = screen.getByLabelText('Message input');
    await user.type(input, 'I feel really sad today');
    await user.click(screen.getByText('Send'));

    expect(screen.getByText('I feel really sad today')).toBeInTheDocument();
    expect(loadMessages()).toHaveLength(2);
  });

  it('switches mode via the mode selector', async () => {
    const user = userEvent.setup();
    render(<ChatWindow />);
    await user.click(screen.getByRole('tab', { name: 'Uplifter' }));
    expect(screen.getByRole('tab', { name: 'Uplifter' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });

  it('shows the crisis banner when crisis language is sent', async () => {
    const user = userEvent.setup();
    render(<ChatWindow />);
    const input = screen.getByLabelText('Message input');
    await user.type(input, 'I want to die');
    await user.click(screen.getByText('Send'));

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('persists messages across a remount', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<ChatWindow />);
    const input = screen.getByLabelText('Message input');
    await user.type(input, 'I feel happy today');
    await user.click(screen.getByText('Send'));
    unmount();

    render(<ChatWindow />);
    expect(screen.getByText('I feel happy today')).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd ~/solace && npm test -- ChatWindow`
Expected: all 4 tests PASS.

- [ ] **Step 6: Run the full test suite**

Run: `cd ~/solace && npm test`
Expected: all test files across every task PASS with no failures.

- [ ] **Step 7: Run the build**

Run: `cd ~/solace && npm run build`
Expected: build succeeds with no TypeScript errors.

- [ ] **Step 8: Commit**

```bash
git add src/components/ChatWindow.tsx src/App.tsx src/styles/theme.css src/components/ChatWindow.test.tsx
git commit -m "Wire chat window, onboarding, and app shell together"
```

---

## Task 12: README, GitHub Repo & Manual Verification

**Files:**
- Create: `README.md`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing consumed by other tasks — this is the final integration/polish step.

- [ ] **Step 1: Create `README.md`**

```markdown
# Solace

Solace is a fully client-side web app that listens for how you're feeling —
sadness, grief, anger, happiness, jealousy, anxiety, loneliness, overwhelm,
or guilt — and responds with empathy in one of three tones: Comforter,
Uplifter, or Reflector. It always checks for crisis language first and
surfaces crisis resources when needed. Nothing you type leaves your
browser — there's no backend, no API keys, no analytics.

Solace is a supportive companion, not a substitute for a real person or a
mental health professional. If you're in crisis, call or text 988
(Suicide & Crisis Lifeline) or text HOME to 741741 (Crisis Text Line).

## Development

\`\`\`bash
npm install
npm run dev      # start the dev server
npm test         # run the test suite
npm run build    # production build
\`\`\`

## Design & Plan

See `docs/superpowers/specs/2026-07-23-emotion-aware-chatbot-design.md` and
`docs/superpowers/plans/2026-07-23-emotion-aware-chatbot.md`.
```

- [ ] **Step 2: Commit README**

```bash
cd ~/solace
git add README.md
git commit -m "Add README"
```

- [ ] **Step 3: Manually verify the app in a browser**

Run: `cd ~/solace && npm run dev`

Open the printed local URL and verify:
- The onboarding screen appears first, with the disclaimer and mode explainer visible.
- Clicking "I'm ready" reveals the chat window with the mode pills, ambient background, and theme toggle.
- Typing something like "I feel really sad and alone" and sending it produces a Comforter-toned reply, with a soft pastel glow drifting behind the bot bubble.
- Switching to Uplifter or Reflector changes the tone of subsequent replies.
- Typing crisis language (e.g. "I want to die") shows the crisis banner with 988 and 741741.
- Toggling the theme switches between light and dark palettes, and reloading the page keeps the chosen theme, mode, and conversation history.
- Clicking "Start fresh" (after confirming) clears the conversation.

Stop the dev server once verified (Ctrl+C).

- [ ] **Step 4: Create the GitHub repository and push**

Run: `cd ~/solace && gh repo create solace --public --source=. --remote=origin --push`
Expected: a new public GitHub repository named `solace` is created under your account, the local `master` branch is pushed, and `git remote -v` shows `origin` pointing at it.
