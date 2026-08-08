import { StoredMessage } from '../lib/storage';

interface MessageBubbleProps {
  message: StoredMessage;
  pending?: boolean;
  images?: string[];
}

export function MessageBubble({ message, pending = false, images }: MessageBubbleProps) {
  const isBot = message.sender === 'bot';
  return (
    <div className={`message-row ${isBot ? 'message-row-bot' : 'message-row-user'}`}>
      <div
        className={`message-bubble ${isBot ? 'message-bubble-bot glass-strong' : 'message-bubble-user'} ${
          pending ? 'message-bubble-pending' : ''
        }`}
      >
        {isBot && <div className="rainbow-glow" aria-hidden="true" />}
        {images && images.length > 0 && (
          <div className="message-bubble-images">
            {images.map((src, i) => (
              <img key={i} src={src} alt="" className="message-bubble-image" />
            ))}
          </div>
        )}
        {pending && message.text === '' ? 'Solace is thinking…' : message.text}
      </div>
    </div>
  );
}
