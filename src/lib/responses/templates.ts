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
