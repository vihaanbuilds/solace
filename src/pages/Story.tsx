import { SubpageLayout } from '../components/SubpageLayout';
import { QuoteIcon } from '../components/icons';
import '../styles/theme.css';
import '../styles/landing.css';

const BADGES = ['Llama 3.2', 'WebGPU', 'On-device', 'No backend'];

export function Story() {
  return (
    <SubpageLayout
      kicker="Our story"
      title="Built at a kitchen table"
      intro="Not in a boardroom. Solace is built and maintained by Vihaan Tanikonda, a student at Dougherty Valley High School."
    >
      <section className="subpage-section">
        <div className="quote-block glass">
          <QuoteIcon className="quote-block-icon" />
          <p>
            Solace grew up in a household that has always taken feelings seriously — where
            checking in on each other isn't an afterthought, it's just how things are done.
            That's the bar it's held to: something you'd trust to actually listen on a hard
            night, the way the people who raised its creator taught him to.
          </p>
          <p className="quote-block-attribution">— Vihaan Tanikonda, creator of Solace</p>
        </div>
      </section>

      <section className="subpage-section">
        <h2>Still growing</h2>
        <p>
          It's still growing, but it's ready to be that for you today — built quietly, tested
          honestly, and shipped because it was ready, not because it was finished being
          improved.
        </p>
        <div className="badge-row">
          {BADGES.map((b) => (
            <span className="badge-pill" key={b}>
              {b}
            </span>
          ))}
        </div>
      </section>
    </SubpageLayout>
  );
}
