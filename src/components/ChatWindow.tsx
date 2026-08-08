import { useEffect, useRef, useState } from 'react';
import { MessageBubble } from './MessageBubble';
import { ModeSelector } from './ModeSelector';
import { CrisisBanner } from './CrisisBanner';
import { AiLoadingBanner } from './AiLoadingBanner';
import { CursiveReveal } from './CursiveReveal';
import { TypewriterGreeting } from './TypewriterGreeting';
import { getResponse, ConversationTurn } from '../lib/responses/responseEngine';
import { Mode } from '../lib/responses/templates';
import {
  StoredMessage,
  createId,
  loadMode,
  saveMode,
  loadUserProfile,
  getFirstName,
  calculateAge,
} from '../lib/storage';

interface ChatWindowProps {
  messages: StoredMessage[];
  onMessagesChange: (messages: StoredMessage[]) => void;
}

export function ChatWindow({ messages, onMessagesChange }: ChatWindowProps) {
  const [mode, setMode] = useState<Mode>(() => (loadMode() as Mode) || 'comforter');
  const [input, setInput] = useState('');
  const [pendingBotText, setPendingBotText] = useState<string | null>(null);
  const [userProfile] = useState(() => loadUserProfile());
  const endRef = useRef<HTMLDivElement>(null);
  const age = userProfile ? calculateAge(userProfile.dateOfBirth) : null;
  const firstName = userProfile ? getFirstName(userProfile.fullName) : null;

  useEffect(() => {
    saveMode(mode);
  }, [mode]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, pendingBotText]);

  const lastBotMessage = [...messages].reverse().find((m) => m.sender === 'bot');
  const showCrisisBanner = lastBotMessage?.isCrisis === true;

  async function handleSend() {
    const text = input.trim();
    if (!text || pendingBotText !== null) return;
    setInput('');

    const userMessage: StoredMessage = {
      id: createId(),
      sender: 'user',
      text,
      timestamp: Date.now(),
    };
    const messagesWithUser = [...messages, userMessage];
    onMessagesChange(messagesWithUser);

    const history: ConversationTurn[] = messages.map((m) => ({
      role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
      content: m.text,
    }));

    setPendingBotText('');

    const reply = await getResponse(
      text,
      mode,
      history,
      (partial) => {
        setPendingBotText(partial);
      },
      age
    );

    const botMessage: StoredMessage = {
      id: createId(),
      sender: 'bot',
      text: reply.text,
      isCrisis: reply.isCrisis,
      timestamp: Date.now(),
    };

    setPendingBotText(null);
    onMessagesChange([...messagesWithUser, botMessage]);
  }

  function handleStartFresh() {
    if (window.confirm('This will clear your saved conversation. Continue?')) {
      onMessagesChange([]);
    }
  }

  return (
    <div className="chat-window">
      <ModeSelector mode={mode} onChange={setMode} />
      <AiLoadingBanner />
      {showCrisisBanner && <CrisisBanner />}
      <div className="message-list">
        {messages.length === 0 && pendingBotText === null && (
          <div className="chat-empty-state">
            <CursiveReveal variant="solace" className="cursive-reveal-chat-hero" />
            <TypewriterGreeting name={firstName} className="chat-hero-greeting" />
          </div>
        )}
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        {pendingBotText !== null && (
          <MessageBubble
            message={{ id: 'pending', sender: 'bot', text: pendingBotText, timestamp: Date.now() }}
            pending
          />
        )}
        <div ref={endRef} />
      </div>
      <div className="chat-input-row glass">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type how you're feeling..."
          aria-label="Message input"
          disabled={pendingBotText !== null}
        />
        <button onClick={handleSend} disabled={pendingBotText !== null}>
          Send
        </button>
        <button onClick={handleStartFresh} className="start-fresh-btn">
          Start fresh
        </button>
      </div>
    </div>
  );
}
