import { SubpageLayout } from '../components/SubpageLayout';
import { HeartIcon, SparkleIcon, CompassIcon, ChipIcon, WifiOffIcon, ServerOffIcon } from '../components/icons';
import '../styles/theme.css';
import '../styles/landing.css';

const MODES = [
  {
    icon: HeartIcon,
    name: 'Comforter',
    description: 'Validates and soothes when things feel like too much.',
    example: '"That sounds like a lot to carry — you don\'t have to be okay right now."',
  },
  {
    icon: SparkleIcon,
    name: 'Uplifter',
    description: 'Gently encourages when you need a reason to keep going.',
    example: '"You\'ve gotten through hard days before. This one\'s no different."',
  },
  {
    icon: CompassIcon,
    name: 'Reflector',
    description: 'Helps you think it through out loud, at your own pace.',
    example: '"What part of this feels heaviest right now?"',
  },
];

const ON_DEVICE = [
  { icon: ChipIcon, title: 'Runs on your device', body: 'Llama 3.2 executes locally through WebGPU — no server ever sees your words.' },
  { icon: ServerOffIcon, title: 'No round trip to a server', body: "There's nothing to intercept, log, or leak, because nothing leaves your browser." },
  { icon: WifiOffIcon, title: 'Works even offline', body: 'Once the model has loaded once, Solace keeps responding without a connection.' },
];

export function HowItListens() {
  return (
    <SubpageLayout
      kicker="How it works"
      title="How Solace listens"
      intro="Every message is read for the feeling underneath it — sadness, grief, anger, anxiety, jealousy, loneliness, overwhelm, guilt, or joy — before Solace ever replies."
    >
      <section className="subpage-section">
        <h2>Three ways to be met</h2>
        <p>You choose the tone that fits the moment, and can switch any time mid-conversation.</p>
        <div className="feature-grid">
          {MODES.map((m) => (
            <div className="feature-card" key={m.name}>
              <m.icon className="feature-card-icon" />
              <h3>{m.name}</h3>
              <p>{m.description}</p>
              <p className="feature-card-example">{m.example}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="subpage-section">
        <h2>Built to run entirely on your device</h2>
        <p>
          Underneath, Solace is powered by an open, on-device language model (Llama 3.2)
          running through WebGPU — right in your browser tab. It means your words never have
          to leave your device to be understood.
        </p>
        <div className="feature-grid feature-grid-compact">
          {ON_DEVICE.map((f) => (
            <div className="feature-card" key={f.title}>
              <f.icon className="feature-card-icon" />
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </div>
          ))}
        </div>
      </section>
    </SubpageLayout>
  );
}
