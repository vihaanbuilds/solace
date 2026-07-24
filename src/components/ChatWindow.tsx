import { useEffect, useRef, useState } from 'react';
import { MessageBubble } from './MessageBubble';
import { ModeSelector } from './ModeSelector';
import { CrisisBanner } from './CrisisBanner';
import { getResponse } from '../lib/responses/responseEngine';
import { Mode } from '../lib/responses/templates';
import {
  StoredMessage,
  loadMessages,
  saveMessages,
  clearMessages,
  loadMode,
  saveMode,
} from '../lib/storage';

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ChatWindow() {
  const [messages, setMessages] = useState<StoredMessage[]>(() => loadMessages());
  const [mode, setMode] = useState<Mode>(() => (loadMode() as Mode) || 'comforter');
  const [input, setInput] = useState('');
  const [showCrisisBanner, setShowCrisisBanner] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  useEffect(() => {
    saveMode(mode);
  }, [mode]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSend() {
    const text = input.trim();
    if (!text) return;

    const userMessage: StoredMessage = {
      id: makeId(),
      sender: 'user',
      text,
      timestamp: Date.now(),
    };

    const reply = getResponse(text, mode);

    const botMessage: StoredMessage = {
      id: makeId(),
      sender: 'bot',
      text: reply.text,
      isCrisis: reply.isCrisis,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage, botMessage]);
    setShowCrisisBanner(reply.isCrisis);
    setInput('');
  }

  function handleStartFresh() {
    if (window.confirm('This will clear your saved conversation. Continue?')) {
      clearMessages();
      setMessages([]);
      setShowCrisisBanner(false);
    }
  }

  return (
    <div className="chat-window">
      <ModeSelector mode={mode} onChange={setMode} />
      {showCrisisBanner && <CrisisBanner />}
      <div className="message-list">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        <div ref={endRef} />
      </div>
      <div className="chat-input-row">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type how you're feeling..."
          aria-label="Message input"
        />
        <button onClick={handleSend}>Send</button>
        <button onClick={handleStartFresh} className="start-fresh-btn">
          Start fresh
        </button>
      </div>
    </div>
  );
}
