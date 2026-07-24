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
