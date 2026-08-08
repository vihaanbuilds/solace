import { SubpageLayout } from '../components/SubpageLayout';
import { DeviceIcon, ServerOffIcon, LockIcon, PersonIcon } from '../components/icons';
import '../styles/theme.css';
import '../styles/landing.css';

const POINTS = [
  {
    icon: DeviceIcon,
    title: 'No account needed',
    body: 'Open Solace and start talking — no email, no sign-up, nothing to create.',
  },
  {
    icon: LockIcon,
    title: 'Passcode-protected private chats',
    body: 'Lock any conversation behind a 5-digit passcode so it stays out of your regular history until you unlock it again.',
  },
  {
    icon: PersonIcon,
    title: 'Google sign-in is optional',
    body: 'It only personalizes your greeting — your name and photo stay on your device, right alongside everything else.',
  },
];

export function Privacy() {
  return (
    <SubpageLayout
      kicker="Privacy"
      title="Privacy by design"
      intro="You can use Solace completely anonymously — no account, no email, nothing to sign up for."
    >
      <section className="subpage-section">
        <div className="feature-grid feature-grid-compact">
          {POINTS.map((p) => (
            <div className="feature-card" key={p.title}>
              <p.icon className="feature-card-icon" />
              <h3>{p.title}</h3>
              <p>{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="subpage-section">
        <h2>Where your words actually go</h2>
        <div className="compare-row">
          <div className="compare-card compare-card-yes">
            <DeviceIcon className="compare-card-icon" />
            <h3>Your browser</h3>
            <p>Every conversation is stored only in local storage on your device.</p>
          </div>
          <div className="compare-card compare-card-no">
            <ServerOffIcon className="compare-card-icon" />
            <h3>Our servers</h3>
            <p>There isn't a backend to breach, because there isn't a backend at all.</p>
          </div>
        </div>
      </section>
    </SubpageLayout>
  );
}
