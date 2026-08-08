import { ChatBubbleIcon, PhoneIcon } from './icons';

export function CrisisBanner() {
  return (
    <div className="crisis-banner" role="alert">
      <p>
        It sounds like you're carrying something really heavy right now. You don't have
        to face this alone.
      </p>
      <p>
        <PhoneIcon /> <strong>988 Suicide &amp; Crisis Lifeline</strong> — call or text 988
      </p>
      <p>
        <ChatBubbleIcon /> <strong>Crisis Text Line</strong> — text HOME to 741741
      </p>
    </div>
  );
}
