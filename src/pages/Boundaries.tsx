import { SubpageLayout } from '../components/SubpageLayout';
import { CrisisBanner } from '../components/CrisisBanner';
import { ChatBubbleIcon, PersonIcon, AlertIcon, CloseIcon } from '../components/icons';
import '../styles/theme.css';
import '../styles/landing.css';

const BOUNDARIES = [
  {
    icon: CloseIcon,
    title: "Won't diagnose you",
    body: "Solace isn't a clinician and never plays one — it won't label what you're going through.",
  },
  {
    icon: PersonIcon,
    title: "Won't replace a real person",
    body: 'A supportive companion, not a substitute for a real relationship or a licensed professional.',
  },
  {
    icon: ChatBubbleIcon,
    title: "Won't pretend to have answers",
    body: "If Solace doesn't know, it says so — instead of improvising something that sounds convincing.",
  },
  {
    icon: AlertIcon,
    title: 'Always surfaces crisis resources first',
    body: 'Every message is checked for crisis language before anything else happens.',
  },
];

export function Boundaries() {
  return (
    <SubpageLayout
      kicker="Boundaries"
      title="What Solace won't do"
      intro="Solace is a supportive companion, not a replacement for a real person or a licensed mental health professional — and it's not trying to be."
    >
      <section className="subpage-section">
        <div className="feature-grid">
          {BOUNDARIES.map((b) => (
            <div className="feature-card" key={b.title}>
              <b.icon className="feature-card-icon" />
              <h3>{b.title}</h3>
              <p>{b.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="subpage-section">
        <h2>If you're in crisis right now</h2>
        <p>Please don't wait on an app. Real people are ready to help, right now.</p>
        <CrisisBanner />
      </section>
    </SubpageLayout>
  );
}
