import { useState } from 'react';
import { LotusLogo } from './LotusLogo';

interface Exchange {
  tab: string;
  user: string;
  solace: string;
}

const EXCHANGES: Exchange[] = [
  {
    tab: 'Before finals',
    user: "i have finals this week and i feel like everything is falling apart, i can't focus on anything",
    solace:
      "That sounds like a lot to carry all at once — not just the studying, but the feeling that it's all piling up faster than you can handle. That's exhausting, and it makes total sense that focus feels impossible right now. You don't have to have it all figured out tonight. What's the one thing sitting heaviest on your mind — the test, or something underneath it?",
  },
  {
    tab: 'Feeling unheard',
    user: "nobody actually gets what i'm going through, everyone just says \"it'll be fine\"",
    solace:
      "\"It'll be fine\" can feel like being brushed off, even when someone means well — because it skips right past what you're actually feeling and jumps straight to the ending. You don't need it fixed right now. You just need someone to actually sit with how not-fine it feels today. I'm here for that part. What's going on?",
  },
  {
    tab: 'Family tension',
    user: "i got into a huge fight with my parents and i don't even know if i was wrong",
    solace:
      "Fights like that are messy — you can be hurt and still not be sure who's right, and both of those can be true at once. You don't have to decide who was wrong to talk about how it felt. What happened, and what's the part that's still sitting with you?",
  },
  {
    tab: 'After a breakup',
    user: 'my girlfriend broke up with me and i keep replaying everything in my head',
    solace:
      "Replaying it over and over is your mind trying to make sense of something that hurt — it's not you being dramatic, it's just how loss works. It's okay if it takes a while to stop hurting. I'm not going anywhere. Do you want to talk through what happened, or would it help more to talk about anything else for a bit?",
  },
];

export function ConversationShowcase() {
  const [active, setActive] = useState(0);
  const exchange = EXCHANGES[active];

  return (
    <section className="showcase" aria-label="Example conversations with Solace">
      <h2 className="showcase-heading">Hear it for yourself</h2>
      <p className="showcase-subhead">
        A few real ways people open up — and how Solace actually responds.
      </p>

      <div className="showcase-tabs" role="tablist" aria-label="Example conversation topics">
        {EXCHANGES.map((e, i) => (
          <button
            key={e.tab}
            role="tab"
            aria-selected={active === i}
            className={`showcase-tab ${active === i ? 'showcase-tab-active' : ''}`}
            onClick={() => setActive(i)}
          >
            {e.tab}
          </button>
        ))}
      </div>

      <div className="showcase-card glass" role="tabpanel">
        <div className="showcase-message">
          <span className="showcase-message-label">You</span>
          <p className="showcase-message-body showcase-message-user">{exchange.user}</p>
        </div>
        <div className="showcase-message">
          <span className="showcase-message-label showcase-message-label-solace">
            <LotusLogo className="showcase-message-icon" /> Solace
          </span>
          <p className="showcase-message-body showcase-message-solace">{exchange.solace}</p>
        </div>
      </div>
    </section>
  );
}
