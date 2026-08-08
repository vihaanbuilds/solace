import type { ChatTier } from '../storage';

export interface TierInfo {
  name: string;
  version: string;
  tagline: string;
  description: string;
}

// Branded product names/versions, not the underlying model — all four tiers
// are backed by the same cloud model by default (see cloudEngine.ts) and
// differ only in how the system prompt paces and deepens the reply (see
// systemPrompt.ts). Bloom is the one exception with an optional fully local
// mode (see webllmEngine.ts). Canopy is the only one that accepts images.
export const TIERS: Record<ChatTier, TierInfo> = {
  sprout: {
    name: 'Sprout',
    version: 'v1.4.12',
    tagline: 'Fastest replies',
    description: 'Quick, lighter-touch responses — great for a fast back-and-forth.',
  },
  bud: {
    name: 'Bud',
    version: 'v2.1.6',
    tagline: 'Balanced & understanding',
    description: 'Our standard experience — thoughtful pacing for most conversations.',
  },
  bloom: {
    name: 'Bloom',
    version: 'v3.0.9',
    tagline: 'Deepest thinking',
    description: 'Our most thoughtful responses, with the option to run entirely on your device instead of a server.',
  },
  canopy: {
    name: 'Canopy',
    version: 'v4.2.1',
    tagline: 'Deepest thinking + images',
    description: 'Same depth as Bloom, and you can share up to 3 images in a message.',
  },
};

export const TIER_ORDER: ChatTier[] = ['sprout', 'bud', 'bloom', 'canopy'];
