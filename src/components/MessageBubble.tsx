import { StoredMessage } from '../lib/storage';

export function MessageBubble({ message }: { message: StoredMessage }) {
  const isBot = message.sender === 'bot';
  return (
    <div className={`message-row ${isBot ? 'message-row-bot' : 'message-row-user'}`}>
      {isBot && <div className="rainbow-glow" aria-hidden="true" />}
      <div
        className={`message-bubble ${isBot ? 'message-bubble-bot glass-strong' : 'message-bubble-user'}`}
      >
        {message.text}
      </div>
    </div>
  );
}
