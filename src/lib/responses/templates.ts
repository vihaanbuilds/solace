import { Emotion } from '../emotions/lexicon';

export type Mode = 'comforter' | 'uplifter' | 'reflector';

type TemplateMap = Record<Emotion, Record<Mode, string[]>>;

export const RESPONSE_TEMPLATES: TemplateMap = {
  sadness: {
    comforter: [
      "That sounds really heavy to carry. I'm glad you told me.",
      "It makes sense that you'd feel this low given what you're going through.",
      "I'm sorry you're feeling this way. You don't have to explain it perfectly for it to matter.",
      "That sadness is real, and it's okay to just sit in it for a bit.",
      "Thank you for letting me in on this. I'm here with you in it.",
      "You don't have to put on a brave face right now. However you're feeling is okay.",
    ],
    uplifter: [
      "This feeling is real, and it won't be the last word. You don't have to carry it alone.",
      "You're allowed to feel sad about this — and you're still moving through it, one moment at a time.",
      "Some days are just heavier than others, and you're still here, still trying. That counts.",
      "This won't feel this way forever, even if it's hard to believe that right now.",
      "You're not stuck — you're in the middle of something hard, and that's different.",
      "Even naming this feeling out loud is a kind of strength.",
    ],
    reflector: [
      "What do you think is at the center of this sadness right now?",
      "When did this feeling start settling in?",
      "Is there a specific moment today that triggered this, or has it been building?",
      "What does this sadness feel like in your body right now?",
      "If this feeling could talk, what do you think it would be trying to tell you?",
      "Is there a part of this that feels heavier than the rest?",
    ],
  },
  grief: {
    comforter: [
      "I'm so sorry. That kind of loss leaves a mark that takes real time.",
      "There's no right way to grieve — however this feels for you is okay.",
      "That loss sounds like it's still very present for you, and that makes complete sense.",
      "I'm holding space for you and whoever you've lost.",
      "Grief doesn't follow a schedule. Wherever you are with it right now is valid.",
      "I'm really glad you shared this with me. You shouldn't have to carry it quietly.",
    ],
    uplifter: [
      "What you lost mattered, and carrying that forward is part of honoring it.",
      "Grief this size doesn't go away fast, but you don't have to move through it alone.",
      "Missing someone this much is proof of how much they meant to you.",
      "It's okay for grief to show up unexpectedly — it doesn't mean you're moving backward.",
      "You're allowed to hold both the loss and the good memories at the same time.",
      "Carrying this doesn't make you weak — it makes you someone who loved deeply.",
    ],
    reflector: [
      "Is there a memory of them that's been on your mind lately?",
      "What's felt hardest about this loss so far?",
      "Is there something you wish you'd said or done, or something you're glad you did?",
      "What does missing them feel like most days?",
      "Is there a particular time of day or place where this grief feels strongest?",
      "What would you want people to know about them?",
    ],
  },
  anger: {
    comforter: [
      "That sounds really frustrating — it makes sense you're upset.",
      "Your anger here is valid. Something unfair happened.",
      "I hear how frustrated you are. That reaction makes sense given what happened.",
      "It's okay to be angry about this — you don't need to justify it to me.",
      "That sounds like it really got under your skin, and rightly so.",
      "I'm not going anywhere — you can be as upset as you need to be right now.",
    ],
    uplifter: [
      "That fire you feel can be redirected once the heat settles a little — but first, it's okay to just be mad.",
      "You're allowed to be angry about this. Let's sit with it before deciding what's next.",
      "That anger is telling you something mattered to you. That's worth paying attention to.",
      "You don't have to have this figured out yet — just feeling it is enough for now.",
      "Being upset about something unfair is a sign you know what you deserve.",
      "This feeling is loud right now, but it doesn't have to run the whole show.",
    ],
    reflector: [
      "What part of this feels most unfair to you?",
      "What happened right before you started feeling this way?",
      "Is this anger more about what just happened, or something that's been building?",
      "What would feel like a fair outcome here, if you could have one?",
      "Who or what is this anger really directed at?",
      "Is there something underneath the anger — like hurt or disappointment?",
    ],
  },
  happiness: {
    comforter: [
      "I'm really glad to hear that — you deserve this moment.",
      "That sounds wonderful. Thank you for sharing it with me.",
      "This is lovely to hear. I'm happy for you.",
      "It's so nice when things go this way. Enjoy this.",
      "I love that you told me this. It means a lot that you wanted to share it.",
      "That sounds like a genuinely good moment — savor it.",
    ],
    uplifter: [
      'This is worth celebrating! What made this happen?',
      'Hold onto this feeling — you earned it.',
      "Look at you! I'm genuinely happy this is happening for you.",
      "This kind of good news deserves to be celebrated loudly.",
      "You should be proud of this moment, whatever led up to it.",
      "This is the kind of thing worth remembering on harder days.",
    ],
    reflector: [
      'What part of this feels the best to you?',
      'What made today different?',
      "What led up to this moment for you?",
      "Is this the kind of happiness you want more of, and if so, what would that look like?",
      "Who do you want to share this with?",
      "What does this moment tell you about what matters to you?",
    ],
  },
  jealousy: {
    comforter: [
      "It's okay to feel that pull — wanting something someone else has doesn't make you a bad person.",
      'That comparison feeling is really uncomfortable. I hear you.',
      "Feeling this way is more common than you'd think, and it doesn't make you a bad friend.",
      "It's hard watching other people seem to have it easier. That feeling makes sense.",
      "You're allowed to feel this without it meaning anything bad about who you are.",
      "That ache of comparing yourself to others is a really human thing to feel.",
    ],
    uplifter: [
      'That envy might be pointing at something you actually want for yourself — worth noticing.',
      "Feeling this way doesn't take anything away from your own path.",
      "Their timeline isn't yours, and that's genuinely okay.",
      "This feeling can be a clue about what you actually want, not just a reason to feel bad.",
      "You have your own things going for you, even if they're not as visible right now.",
      "Comparing chapter one of your story to chapter twenty of someone else's isn't fair to you.",
    ],
    reflector: [
      'What is it about their situation that stands out to you most?',
      "Is this feeling more about them, or about something you're missing right now?",
      "If you had what they have, what do you think would feel different for you?",
      "Is there a specific thing you're comparing, or is it more of a general feeling?",
      "What would it look like if you focused on your own progress instead of theirs?",
      "Has this feeling come up before with this person, or is it new?",
    ],
  },
  anxiety: {
    comforter: [
      "That worry sounds exhausting to carry around. I'm here with you.",
      "It makes sense your mind is racing about this.",
      "That sounds like a lot of anxious energy to be holding onto.",
      "I'm glad you told me — you don't have to sit with this by yourself.",
      "It's okay that your mind keeps circling this. That's what anxiety does.",
      "That uneasy feeling is uncomfortable, and it makes sense you'd want it to stop.",
    ],
    uplifter: [
      "You've gotten through anxious moments before, even when it didn't feel possible.",
      "One small thing at a time — you don't have to solve all of it right now.",
      "This feeling is intense, but it isn't permanent — it will ease.",
      "You don't need to have every answer right now, just the next small step.",
      "Your mind is trying to protect you, even if it feels like too much right now.",
      "Breathing through this one moment counts as progress.",
    ],
    reflector: [
      "What's the specific 'what if' that keeps coming up?",
      'When did you first notice this worry today?',
      "Is there a specific trigger, or does it feel like it's about everything at once?",
      "What's the worst-case thought your mind keeps going to?",
      "Does this worry feel more physical (racing heart, tight chest) or more mental (racing thoughts)?",
      "What would it feel like if this worry turned down just a little?",
    ],
  },
  loneliness: {
    comforter: [
      'Feeling alone like this is really hard, even when people are around you.',
      "I'm glad you're not keeping this to yourself right now.",
      "That kind of loneliness is a heavy thing to carry quietly.",
      "I'm here, and I'm listening — you're not alone in this conversation at least.",
      "It makes sense to feel this way, even if it's hard to explain to other people.",
      "Thank you for telling me instead of sitting with this by yourself.",
    ],
    uplifter: [
      'Reaching out, even just here, is a real step out of that isolation.',
      "This feeling can shift — it doesn't mean this is how things stay.",
      "Loneliness lies about how permanent it is. This can change.",
      "You reaching out here already breaks the pattern of facing this completely alone.",
      "There are people out there who'd want to know you're feeling this way.",
      "Feeling disconnected right now doesn't mean you're unlovable or forgettable.",
    ],
    reflector: [
      'When do you feel this loneliness the most?',
      "Is there anyone who's felt close to you recently, even a little?",
      "Is this more about missing people, or feeling misunderstood even around them?",
      "What does connection usually look like for you when it's working?",
      "Is there someone you've been wanting to reach out to but haven't yet?",
      "Has something changed recently that's made this feeling stronger?",
    ],
  },
  overwhelm: {
    comforter: [
      "That's a lot to be holding all at once. No wonder you're feeling this way.",
      "It's okay to feel maxed out right now.",
      "That sounds like way too much for one person to carry at once.",
      "I hear how much is piling up on you right now.",
      "It makes complete sense that you're feeling stretched thin.",
      "You don't have to have it all together right now.",
    ],
    uplifter: [
      "You don't have to carry all of it this second — just the next small piece.",
      "This much on your plate would be a lot for anyone. You're doing more than you're giving yourself credit for.",
      "You've handled a lot to get this far, even if it doesn't feel like it right now.",
      "It's okay to set some of this down for a moment and just breathe.",
      "One piece at a time is still real progress.",
      "You're allowed to ask for help carrying some of this.",
    ],
    reflector: [
      "What's the one piece of this that feels heaviest right now?",
      'If you had to name just one thing pulling at you most, what would it be?',
      "Is there anything on your plate right now that could wait or be handed off?",
      "What would it look like to tackle just one piece of this today?",
      "Is this feeling new, or has it been building for a while?",
      "What usually helps you feel less overwhelmed, even a little?",
    ],
  },
  guilt: {
    comforter: [
      "That guilt sounds heavy. It doesn't mean you're a bad person.",
      "It's okay — feeling responsible for this doesn't mean you deserve to feel this bad.",
      "Carrying guilt like this is exhausting, and it makes sense you'd want relief from it.",
      "I hear how much this is weighing on you.",
      "Feeling bad about this shows you care, even if it's a hard feeling to sit with.",
      "You're allowed to feel guilty and still be a good person.",
    ],
    uplifter: [
      "Noticing this and caring about it says something good about you.",
      'You can take responsibility without carrying it forever.',
      "This feeling can be a starting point for repair, not just self-punishment.",
      "Owning up to something hard is a sign of strength, not weakness.",
      "You're allowed to learn from this without holding onto it indefinitely.",
      "Caring this much about getting it right says a lot about your character.",
    ],
    reflector: [
      'What part of this feels like it was actually in your control?',
      'What would you tell a friend who felt this way about something similar?',
      "Is there something you could do now that might ease this guilt?",
      "What do you think you were trying to do, even if it didn't turn out the way you wanted?",
      "Is this guilt about something you did, or something you think you should have done?",
      "What would forgiving yourself for this actually look like?",
    ],
  },
};

export const CLARIFYING_QUESTIONS = [
  "It sounds like there's a lot going on — could you tell me a bit more about what you're feeling?",
  "I want to make sure I understand — what's the main feeling underneath all this right now?",
  "I'm listening — can you say a little more about what's going on for you?",
  "I want to understand this the right way — what's weighing on you most right now?",
  "Tell me more about what's happening, if you're up for it. I'm here.",
  "I'm not quite sure I'm reading this right — what's the feeling you'd name here?",
];

export const CRISIS_RESPONSES: Record<Mode, string[]> = {
  comforter: [
    "I'm really glad you told me that. That sounds like an incredibly heavy thing to carry, and you don't have to carry it alone.",
    "Thank you for saying that out loud. That takes courage, and I'm not going anywhere.",
    "That sounds like an enormous amount of pain to be sitting with. I'm here, and I'm listening.",
  ],
  uplifter: [
    'Thank you for trusting me with that. It took something to say it out loud, and reaching out matters right now.',
    "I'm really glad you're talking about this instead of facing it alone. That matters more than you know.",
    "You reaching out right now, even just to me, is a real and important step.",
  ],
  reflector: [
    "I hear you, and I want to understand more — can you tell me what's been happening that's brought you to this point?",
    "That's a lot to be carrying. Can you tell me more about what's led you here?",
    "I want to understand what you're going through right now — what's been happening lately?",
  ],
};

export const GREETING_RESPONSES: Record<Mode, string[]> = {
  comforter: [
    "Hi there. I'm really glad you're here — how are you doing today?",
    "Hey! Good to see you. What's on your mind?",
    "Hello — I'm here and listening. How are you feeling right now?",
    "Hi. Take your time — is everything okay, or did you just want to talk?",
    "Hey there. However you're doing today, I'm glad you stopped by.",
  ],
  uplifter: [
    "Hey! Glad you're here — what's going on with you today?",
    "Hi there! How's your day treating you so far?",
    "Hello! Whatever's on your mind, I'm ready to hear it.",
    "Hey — good to see you. What's been on your mind lately?",
    "Hi! You showing up here already counts for something. What's up?",
  ],
  reflector: [
    "Hi — what's been on your mind lately?",
    "Hello. What brought you here today?",
    "Hey there. What would be helpful to talk through right now?",
    "Hi. Is there something specific you've been thinking about, or just wanted to check in?",
    "Hello — what's going on for you today?",
  ],
};

export const OFF_TOPIC_RESPONSES: Record<Mode, string[]> = {
  comforter: [
    "I'm only made to provide emotional support, not to answer questions or do calculations or homework — but I'm here if something's on your mind.",
    "I can't help with that — I'm only built for emotional support, not facts or schoolwork. Is everything okay?",
    "That's outside what I do. I'm only here to support you emotionally, not answer or solve things like that.",
  ],
  uplifter: [
    "I'm only made to provide emotional support, not to answer questions or do calculations or homework — but if something's been on your mind, I'd love to hear it.",
    "I can't help with that one — I'm only built for emotional support, not facts or schoolwork. What's actually going on with you today?",
    "That's not something I do. I'm only here for the feelings side of things, not answers or homework.",
  ],
  reflector: [
    "I'm only made to provide emotional support, not to answer questions or do calculations or homework — what's actually on your mind?",
    "I can't help with that — I'm only built for emotional support, not facts or schoolwork. What brought you here today?",
    "That falls outside what I do. I'm only here to help you think through what you're feeling, not solve or answer things like that.",
  ],
};

export const IDENTITY_RESPONSES: Record<Mode, string[]> = {
  comforter: [
    "I'm Solace — I'm here to listen and support you emotionally, not to answer questions about myself. How are you doing?",
    "I'm just a supportive companion, here to listen. What's going on with you?",
  ],
  uplifter: [
    "I'm Solace — built to be here for you emotionally, not much else. What's on your mind today?",
    "I'm just here to support you, not to talk about myself. What's going on with you?",
  ],
  reflector: [
    "I'm Solace — a companion built to help you process how you're feeling, not to answer things about myself. What's on your mind?",
    "I'm just here to listen and help you think things through. What brought you here today?",
  ],
};
