import { Emotion } from '../emotions/lexicon';

export type Mode = 'comforter' | 'uplifter' | 'reflector';

type TemplateMap = Record<Emotion, Record<Mode, string[]>>;

// This fallback engine is what a meaningful share of users actually get —
// not every device can run the on-device AI model — so its wording leans on
// a handful of well-established therapeutic principles rather than generic
// reassurance:
// - Unconditional positive regard & congruence (Rogers, "On Becoming a
//   Person"): accept the feeling completely, never implying it's wrong,
//   too much, or needs justifying.
// - Empathic reflection: name the specific feeling back instead of
//   reassuring in the abstract.
// - Presence over performance (Yalom, "The Gift of Therapy"): the
//   relationship itself is what helps, so responses stay in the
//   here-and-now and avoid sounding like a script reciting advice.
// - Trauma-informed pacing: offer choice and agency ("if you want to",
//   "when you're ready") instead of pushing, and include body-awareness
//   prompts, since heavy emotion is held physically, not just mentally.
// - Validation before problem-solving, and needs-based reframing (DBT /
//   Nonviolent Communication): reflect what's underneath the feeling
//   rather than rushing to advice.
export const RESPONSE_TEMPLATES: TemplateMap = {
  sadness: {
    comforter: [
      "That sounds heavy, and it makes complete sense that you'd feel this way. I'm right here with you — what's been happening?",
      "You don't have to justify this sadness to me, or to anyone else. What's been sitting heaviest on you?",
      "Thank you for letting me see this side of things. What's underneath it?",
      "It's okay to just feel low right now, without rushing to fix it. What's been going on?",
      "I'm not going anywhere, and neither is this feeling right this second — so let's just sit in it together. What happened?",
      "Whatever's making you feel this way is allowed to matter, exactly as much as it does to you. Want to tell me more?",
    ],
    uplifter: [
      "This sadness is real right now, and it also isn't the whole story of you. What's been weighing on you?",
      "You're allowed to feel this without rushing toward better. What's been happening?",
      "Even on a day this heavy, you're still here talking about it, and that counts for something. What's going on?",
      "This won't stay at exactly this intensity forever, even though it's hard to believe that today. What's on your mind?",
      "You're not failing at anything by feeling sad — you're just being honest. What's been the hardest part?",
      "Naming this out loud, the way you just did, is its own kind of strength. What's been going on?",
    ],
    reflector: [
      "What do you think is underneath this sadness right now?",
      "Where do you notice this feeling most — your chest, your energy, your thoughts?",
      "Was there a specific moment that brought this on, or has it been building quietly?",
      "If this sadness could put itself into words, what do you think it would say?",
      "What's different about today that's making this feel especially present?",
      "Is there a part of this you haven't said out loud yet, even here?",
    ],
  },
  grief: {
    comforter: [
      "I'm so sorry. A loss like that leaves a real mark, and there's no timeline you're supposed to be on. Do you want to tell me about them?",
      "However this is showing up for you right now — however messy or quiet — it's allowed to look like that. What's been on your mind?",
      "That loss is still very present for you, and that makes complete sense. What's been coming up?",
      "I'm holding space for you and for whoever you lost. Do you want to tell me about them, whenever you're ready?",
      "Grief doesn't follow rules, and you don't owe anyone a version of it that looks a certain way. What's been the hardest part lately?",
      "I'm really glad you brought this here instead of carrying it alone. What's on your mind about them?",
    ],
    uplifter: [
      "What you lost mattered, and carrying it forward is one way of honoring that. What do you want people to remember about them?",
      "This kind of grief doesn't move fast, but you're not moving through it by yourself. What's been helping, even a little?",
      "Missing someone this much is really just love with nowhere to go right now. What's been on your mind about them?",
      "It's okay for grief to resurface out of nowhere — that's not you moving backward. What brought it up today?",
      "You get to hold both the loss and the good memories at the same time, without one canceling out the other. What's a memory that's stayed with you?",
      "Carrying this doesn't make you fragile — it makes you someone who loved for real. What's been hardest to carry?",
    ],
    reflector: [
      "What memory of them has been closest to the surface lately?",
      "What does missing them feel like in your body most days — heavy, hollow, restless?",
      "Is there something you wish you'd said, or something you're glad you did?",
      "Is there a particular time or place where this grief shows up strongest?",
      "What would you want people to understand about them that they might not know?",
      "Is there a part of this loss you haven't let yourself feel all the way yet?",
    ],
  },
  anger: {
    comforter: [
      "That sounds genuinely frustrating, and you don't need to smooth it over for me. What happened?",
      "Your anger makes sense here — something happened that shouldn't have. Do you want to walk me through it?",
      "I hear how worked up this has gotten you, and that reaction makes sense given what happened. What's going on?",
      "You don't have to justify being angry to me. What's been building up?",
      "That really got to you, and understandably so. What happened?",
      "I'm right here — you can be as upset as you need to be. Want to talk through it?",
    ],
    uplifter: [
      "That fire in you can be pointed somewhere useful once it's had room to exist first. What happened?",
      "Being angry about this doesn't make you difficult — it makes you someone who noticed something unfair. What's going on?",
      "That anger is pointing at something that mattered to you. What was it?",
      "You don't need this figured out yet. What's on your mind about it?",
      "Feeling upset about something unfair is a sign you know what you deserve. What happened?",
      "This feeling is loud right now, but you're still the one driving. Want to tell me what's going on?",
    ],
    reflector: [
      "What part of this feels most unfair to you?",
      "What happened right before this feeling showed up?",
      "Is this more about what just happened, or something that's been building for a while?",
      "If you could name what you actually need right now, what would it be?",
      "Who or what is this anger really aimed at?",
      "Is there a softer feeling underneath the anger — hurt, disappointment, fear?",
    ],
  },
  happiness: {
    comforter: [
      "I'm really glad to hear that — you deserve this. What happened?",
      "That sounds wonderful, and I'm glad you brought it here to share. What's got you feeling this way?",
      "This is lovely to hear about. What made today feel this good?",
      "It's genuinely nice when things line up like this. What happened?",
      "I love that you told me this. What's been the best part?",
      "That sounds like a real, good moment. What led up to it?",
    ],
    uplifter: [
      "This is worth celebrating properly — what made it happen?",
      "Hold onto this feeling for a second before it rushes past you. What led up to it?",
      "Look at this! What's been going on?",
      "This deserves more than a passing mention. What happened?",
      "You should let yourself feel proud of this. What led up to it?",
      "This is the kind of thing worth remembering on a harder day. What made today different?",
    ],
    reflector: [
      "What part of this feels best to you?",
      "What made today different from the rest?",
      "What led up to this moment for you?",
      "Is this the kind of happiness you'd want more of — and if so, what would that take?",
      "Who do you want to tell about this?",
      "What does this moment tell you about what actually matters to you?",
    ],
  },
  jealousy: {
    comforter: [
      "Wanting something someone else has doesn't make you a bad person — it makes you human. What's been happening?",
      "That comparison feeling is genuinely uncomfortable to sit with. What's been bringing it up?",
      "This is more common than you'd think, and it doesn't make you a bad friend. What's going on?",
      "It's hard watching things look easier for someone else. What's been on your mind about it?",
      "You're allowed to feel this without it meaning anything bad about who you are. Want to tell me more?",
      "That ache of measuring yourself against someone else is a really human thing to carry. What's been happening?",
    ],
    uplifter: [
      "That envy might actually be pointing at something you want for yourself. Any idea what that is?",
      "Feeling this way doesn't take anything away from your own path. What's been going on?",
      "Their timeline was never supposed to be yours. What's been on your mind?",
      "This feeling can be a clue about what you actually want, not just something to feel bad about. What is it?",
      "You have things going for you too, even the ones that aren't as visible right now. What's been happening?",
      "Comparing your middle to someone else's highlight reel isn't a fair fight. What brought this up?",
    ],
    reflector: [
      "What is it about their situation that stands out to you most?",
      "Is this more about them, or about something you're missing right now?",
      "If you had what they have, what do you think would actually feel different?",
      "Underneath the comparison, what do you think you're really needing right now — recognition, security, progress?",
      "What would it look like to measure today against your own yesterday instead?",
      "Has this feeling come up before with this person, or does it feel new?",
    ],
  },
  anxiety: {
    comforter: [
      "That worry sounds exhausting to carry around all day. What's been on your mind?",
      "It makes sense your thoughts are racing about this. What's the biggest worry right now?",
      "That's a lot of anxious energy to be holding. What's it about?",
      "I'm glad you told me instead of sitting with it alone. What's been worrying you most?",
      "It's okay that your mind keeps circling back to this. What keeps coming up?",
      "That uneasy feeling is uncomfortable to be inside of. What's been triggering it?",
    ],
    uplifter: [
      "You've made it through anxious moments before, even when it didn't feel possible at the time. What's this one about?",
      "Just this next breath, this next moment. What's the very next thing on your mind?",
      "This feeling is intense right now, but intensity isn't the same as permanent. What's been bringing it on?",
      "You don't need every answer this second. What's the biggest 'what if' running through your head?",
      "Your mind is trying to protect you, even if it's misfiring a little. What's it worried about?",
      "Just staying with this one moment counts as real progress. What's going on?",
    ],
    reflector: [
      "What's the specific 'what if' that keeps looping?",
      "When did you first notice this worry today — was there a trigger?",
      "Does it feel like it's about one thing, or everything at once?",
      "Where do you feel this in your body right now — chest, stomach, somewhere else?",
      "What would it feel like if this worry turned down by just ten percent?",
      "If you could set this worry down for one minute, what would you notice instead?",
    ],
  },
  loneliness: {
    comforter: [
      "Feeling this alone, even with people around, is genuinely hard. What's been going on?",
      "I'm glad you're not sitting with this by yourself right now. What's been making you feel this way?",
      "That kind of loneliness is heavy to carry quietly. Want to tell me more?",
      "I'm here, and I'm actually listening. What's been happening?",
      "It makes sense to feel this way, even if it's hard to put into words for other people. What's on your mind?",
      "Thank you for bringing this here instead of sitting with it alone. What's been going on?",
    ],
    uplifter: [
      "Reaching out, even just here, is already a step out of that isolation. What's been happening?",
      "This feeling can shift, even if it doesn't feel that way right now. What's been the hardest part lately?",
      "Loneliness tends to lie about how permanent it is. What's brought this on?",
      "You showing up here already breaks the pattern of facing this completely alone. What's going on?",
      "There are people who'd want to know you're feeling this way, even if it doesn't feel like it right now. What's been happening?",
      "Feeling disconnected right now doesn't mean you're unlovable or forgettable — it means you're going through something. What's on your mind?",
    ],
    reflector: [
      "When does this loneliness hit hardest for you?",
      "Has anyone felt close to you recently, even a little?",
      "Is this more about missing people, or feeling misunderstood even when they're around?",
      "What does real connection usually feel like for you when it's working?",
      "Is there someone you've been wanting to reach out to but haven't yet?",
      "What changed recently that made this feeling stronger?",
    ],
  },
  overwhelm: {
    comforter: [
      "That's a lot to be holding all at once. What's actually on your plate right now?",
      "It's okay to feel maxed out. What's the biggest thing weighing on you?",
      "That sounds like too much for one person to carry alone. What's going on?",
      "I hear how much is piling up right now. What's been happening?",
      "It makes complete sense that you're feeling stretched this thin. What's the heaviest part?",
      "You don't have to have it together right now, not with me. What's on your mind?",
    ],
    uplifter: [
      "You don't have to carry all of it this second. What's the one thing weighing most?",
      "This much on your plate would be a lot for anyone, not just you. What's going on?",
      "You've gotten this far carrying a lot, even if it doesn't feel like it right now. What's the biggest thing?",
      "It's okay to set some of this down for a moment and just breathe. What's on your mind?",
      "One piece at a time still counts as real progress. What's the first piece?",
      "You're allowed to ask for help carrying some of this. What's been happening?",
    ],
    reflector: [
      "What's the one piece of this that feels heaviest right now?",
      "If you had to name just one thing pulling at you most, what would it be?",
      "Is there anything on this list that could wait, or be handed to someone else?",
      "What would it look like to only tackle one piece of this today?",
      "Is this new, or has it been building for a while?",
      "What's helped you feel less overwhelmed before, even a little?",
    ],
  },
  guilt: {
    comforter: [
      "That guilt sounds heavy to be carrying. What happened?",
      "Feeling responsible for this doesn't mean you deserve to feel this bad about it. What's going on?",
      "Carrying guilt like this is genuinely exhausting. What's been on your mind about it?",
      "I hear how much this is weighing on you. What happened?",
      "Feeling bad about this shows you care, even though it's an uncomfortable feeling to sit inside. What's the situation?",
      "You're allowed to feel guilty and still be a good person — those aren't opposites. Want to tell me more?",
    ],
    uplifter: [
      "Noticing this and caring about it already says something good about you. What happened?",
      "You can take responsibility for this without carrying it forever. What's going on?",
      "This feeling can be a starting point for repair, not just self-punishment. What happened?",
      "Owning something hard is a sign of strength, not weakness. What's the situation?",
      "You're allowed to learn from this without holding onto it indefinitely. What's on your mind?",
      "Caring this much about getting it right says a lot about who you are. What happened?",
    ],
    reflector: [
      "What part of this was actually within your control?",
      "What would you tell a friend who felt this way about something similar?",
      "Is there something you could do now that might ease this, even a little?",
      "What were you actually trying to do, even if it didn't land the way you wanted?",
      "Is this guilt about something you did, or something you think you should have done?",
      "What would it look like to forgive yourself for this, even partially?",
    ],
  },
};

export const CLARIFYING_QUESTIONS = [
  "There's a lot going on in what you just said — can you tell me a bit more about what you're actually feeling?",
  "I want to make sure I'm understanding this right — what's the feeling underneath all of it?",
  "I'm listening, and I want to get this right — can you say a little more about what's going on?",
  "What's weighing on you most right now, underneath everything else?",
  "Tell me more, if you're up for it. I'm not going anywhere.",
  "I'm not sure I'm reading this correctly yet — what would you call this feeling?",
];

export const CRISIS_RESPONSES: Record<Mode, string[]> = {
  comforter: [
    "I'm really glad you told me that. That's an enormous amount of pain to be carrying, and you don't have to carry it by yourself. Can you tell me more about what's going on?",
    "Thank you for saying that out loud — that takes real courage, and I'm staying right here with you. What's been happening?",
    "That sounds like more pain than anyone should have to sit with alone. I'm here, and I'm listening. Can you tell me more?",
  ],
  uplifter: [
    "Thank you for trusting me with that. Saying it out loud took something, and reaching out right now matters more than you know. What's been going on?",
    "I'm really glad you're talking about this instead of facing it by yourself. That matters. Can you tell me more about what's happening?",
    "You reaching out right now, even just to me, is a real and important step. What's been going on for you?",
  ],
  reflector: [
    "I hear you, and I want to understand more — what's been happening that's brought you to this point?",
    "That's an enormous amount to be carrying. Can you tell me more about what's led you here?",
    "I want to understand what you're going through right now — what's been happening lately?",
  ],
};

export const GREETING_RESPONSES: Record<Mode, string[]> = {
  comforter: [
    "Hi there. I'm glad you're here — how are you doing today?",
    "Hey! Good to see you. What's on your mind?",
    "Hello — I'm here and actually listening. How are you feeling right now?",
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
