import { useEffect, useMemo, useState } from 'react';
import { ChatWindow } from './components/ChatWindow';
import { ThemeToggle } from './components/ThemeToggle';
import { AmbientBackground } from './components/AmbientBackground';
import { AiStatusIndicator } from './components/AiStatusIndicator';
import { Sidebar } from './components/Sidebar';
import {
  Conversation,
  StoredMessage,
  createId,
  deriveTitle,
  loadConversations,
  saveConversations,
  loadActiveConversationId,
  saveActiveConversationId,
  loadTheme,
  loadSidebarCollapsed,
  saveSidebarCollapsed,
} from './lib/storage';
import { WELCOME_MESSAGES } from './lib/content/welcomeMessages';
import './styles/theme.css';

function createConversation(): Conversation {
  return {
    id: createId(),
    title: 'New conversation',
    createdAt: Date.now(),
    messages: [],
  };
}

export default function App() {
  const [onboarded, setOnboarded] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => loadSidebarCollapsed());
  const [welcomeMessage] = useState(
    () => WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)]
  );

  useEffect(() => {
    saveSidebarCollapsed(sidebarCollapsed);
  }, [sidebarCollapsed]);

  useEffect(() => {
    const theme = loadTheme();
    if (theme) document.documentElement.setAttribute('data-theme', theme);

    const loaded = loadConversations();

    if (loaded.length === 0) {
      const fresh = createConversation();
      setConversations([fresh]);
      setActiveConversationId(fresh.id);
      saveConversations([fresh]);
      saveActiveConversationId(fresh.id);
      return;
    }

    setConversations(loaded);
    const storedActiveId = loadActiveConversationId();
    const activeExists = storedActiveId && loaded.some((c) => c.id === storedActiveId);
    setActiveConversationId(activeExists ? (storedActiveId as string) : loaded[0].id);
  }, []);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId) ?? null,
    [conversations, activeConversationId]
  );

  function persist(next: Conversation[]) {
    setConversations(next);
    saveConversations(next);
  }

  function handleNewChat() {
    const fresh = createConversation();
    persist([fresh, ...conversations]);
    setActiveConversationId(fresh.id);
    saveActiveConversationId(fresh.id);
  }

  function handleSelectConversation(id: string) {
    setActiveConversationId(id);
    saveActiveConversationId(id);
  }

  function handleMessagesChange(messages: StoredMessage[]) {
    if (!activeConversationId) return;
    const next = conversations.map((c) =>
      c.id === activeConversationId
        ? {
            ...c,
            messages,
            title: c.titleIsCustom ? c.title : deriveTitle(messages),
          }
        : c
    );
    persist(next);
  }

  function handleRenameConversation(id: string, title: string) {
    const next = conversations.map((c) =>
      c.id === id ? { ...c, title, titleIsCustom: true } : c
    );
    persist(next);
  }

  function handleDeleteConversation(id: string) {
    const remaining = conversations.filter((c) => c.id !== id);

    if (remaining.length === 0) {
      const fresh = createConversation();
      persist([fresh]);
      setActiveConversationId(fresh.id);
      saveActiveConversationId(fresh.id);
      return;
    }

    persist(remaining);

    if (id === activeConversationId) {
      const nextActiveId = remaining[0].id;
      setActiveConversationId(nextActiveId);
      saveActiveConversationId(nextActiveId);
    }
  }

  if (!onboarded) {
    return (
      <div className="onboarding-screen">
        <AmbientBackground />
        <div className="onboarding-card glass-strong">
          <div className="onboarding-icon" aria-hidden="true">
            🌿
          </div>
          <h1 className="brand-title">Welcome to Solace</h1>
          <p className="welcome-hero">{welcomeMessage}</p>
          <p>
            Solace is a supportive companion that listens and responds to how you're
            feeling. It's here to help you feel heard — it isn't a substitute for a real
            person or a mental health professional.
          </p>
          <p>
            Once you're in, you can pick a mode to shape how Solace responds:{' '}
            <strong>Comforter</strong>{' '}
            validates and soothes, <strong>Uplifter</strong> gently encourages, and{' '}
            <strong>Reflector</strong> helps you think things through.
          </p>
          <button onClick={() => setOnboarded(true)}>I'm ready</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <AmbientBackground />
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelect={handleSelectConversation}
        onNewChat={handleNewChat}
        onRename={handleRenameConversation}
        onDelete={handleDeleteConversation}
        collapsed={sidebarCollapsed}
      />
      <div className="main-column">
        <header className="app-header">
          <div className="app-header-controls">
            <button
              className="sidebar-toggle-btn glass"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              aria-label={sidebarCollapsed ? 'Show chat history' : 'Hide chat history'}
            >
              ☰
            </button>
            <h1 className="brand-title">Solace</h1>
          </div>
          <div className="app-header-controls">
            <AiStatusIndicator />
            <ThemeToggle />
          </div>
        </header>
        {activeConversation && (
          <ChatWindow
            messages={activeConversation.messages}
            onMessagesChange={handleMessagesChange}
          />
        )}
      </div>
    </div>
  );
}
