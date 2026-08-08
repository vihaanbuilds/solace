import { StoredMessage } from '../lib/storage';

interface MessageBubbleProps {
  message: StoredMessage;
  pending?: boolean;
}

export function MessageBubble({ message, pending = false }: MessageBubbleProps) {
  const isBot = message.sender === 'bot';
  return (
    <div className={`message-row ${isBot ? 'message-row-bot' : 'message-row-user'}`}>
      <div
        className={`message-bubble ${isBot ? 'message-bubble-bot glass-strong' : 'message-bubble-user'} ${
          pending ? 'message-bubble-pending' : ''
        }`}
      >
        {isBot && <div className="rainbow-glow" aria-hidden="true" />}
        {pending && message.text === '' ? 'Solace is thinking…' : message.text}
      </div>
    </div>
  );
}
