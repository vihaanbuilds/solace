import { useEffect, useMemo, useState } from 'react';
import { ChatWindow } from './components/ChatWindow';
import { ThemeToggle } from './components/ThemeToggle';
import { AmbientBackground } from './components/AmbientBackground';
import { AiStatusIndicator } from './components/AiStatusIndicator';
import { Sidebar } from './components/Sidebar';
import { CursiveReveal, CURSIVE_DRAW_SECONDS } from './components/CursiveReveal';
import { PrivacyToggle } from './components/PrivacyToggle';
import { GoogleProfile, clearGoogleProfile, loadGoogleProfile } from './lib/googleAuth';
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

function createConversation(isPrivate = false): Conversation {
  return {
    id: createId(),
    title: isPrivate ? 'Private conversation' : 'New conversation',
    createdAt: Date.now(),
    messages: [],
    isPrivate,
  };
}

export default function App() {
  const [onboarded, setOnboarded] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => loadSidebarCollapsed() || window.matchMedia('(max-width: 768px)').matches
  );
  const [privateUnlocked, setPrivateUnlocked] = useState(false);
  const [googleProfile, setGoogleProfile] = useState<GoogleProfile | null>(() =>
    loadGoogleProfile()
  );
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

    // Private mode always starts locked, so the restored active conversation
    // must not be a private one even if that's what was last open.
    const storedActiveId = loadActiveConversationId();
    const restoredActive = loaded.find((c) => c.id === storedActiveId && !c.isPrivate);
    if (restoredActive) {
      setActiveConversationId(restoredActive.id);
      return;
    }

    const firstVisible = loaded.find((c) => !c.isPrivate);
    if (firstVisible) {
      setActiveConversationId(firstVisible.id);
      saveActiveConversationId(firstVisible.id);
      return;
    }

    const fresh = createConversation();
    const next = [fresh, ...loaded];
    setConversations(next);
    saveConversations(next);
    setActiveConversationId(fresh.id);
    saveActiveConversationId(fresh.id);
  }, []);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId) ?? null,
    [conversations, activeConversationId]
  );

  const visibleConversations = useMemo(
    () => conversations.filter((c) => !c.isPrivate || privateUnlocked),
    [conversations, privateUnlocked]
  );

  function persist(next: Conversation[]) {
    setConversations(next);
    saveConversations(next);
  }

  function closeSidebarOnMobile() {
    if (window.matchMedia('(max-width: 768px)').matches) {
      setSidebarCollapsed(true);
    }
  }

  function handleNewChat() {
    const fresh = createConversation(privateUnlocked);
    persist([fresh, ...conversations]);
    setActiveConversationId(fresh.id);
    saveActiveConversationId(fresh.id);
    closeSidebarOnMobile();
  }

  function handlePrivacyUnlock() {
    setPrivateUnlocked(true);
  }

  function handlePrivacyLock() {
    setPrivateUnlocked(false);
    if (activeConversation?.isPrivate) {
      const firstVisible = conversations.find((c) => !c.isPrivate);
      if (firstVisible) {
        setActiveConversationId(firstVisible.id);
        saveActiveConversationId(firstVisible.id);
      } else {
        const fresh = createConversation();
        persist([fresh, ...conversations]);
        setActiveConversationId(fresh.id);
        saveActiveConversationId(fresh.id);
      }
    }
  }

  function handleResetPrivateChats() {
    const remaining = conversations.filter((c) => !c.isPrivate);
    const finalList = remaining.length > 0 ? remaining : [createConversation()];
    persist(finalList);
    if (!finalList.some((c) => c.id === activeConversationId)) {
      setActiveConversationId(finalList[0].id);
      saveActiveConversationId(finalList[0].id);
    }
    setPrivateUnlocked(false);
  }

  function handleGoogleSignOut() {
    clearGoogleProfile();
    setGoogleProfile(null);
  }

  function handleSelectConversation(id: string) {
    setActiveConversationId(id);
    saveActiveConversationId(id);
    closeSidebarOnMobile();
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
          <CursiveReveal variant="solace" className="cursive-reveal-hero" />
          <CursiveReveal
            variant="tagline"
            className="cursive-reveal-tagline"
            delaySeconds={CURSIVE_DRAW_SECONDS - 0.3}
          />
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
      {!sidebarCollapsed && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarCollapsed(true)}
          aria-hidden="true"
        />
      )}
      <Sidebar
        conversations={visibleConversations}
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
              title={sidebarCollapsed ? 'Show chat history' : 'Hide chat history'}
            >
              {sidebarCollapsed ? '☰' : '⟨'}
            </button>
            <CursiveReveal variant="solace" className="cursive-reveal-header" />
          </div>
          <div className="app-header-controls app-header-controls-right">
            <AiStatusIndicator />
            <PrivacyToggle
              unlocked={privateUnlocked}
              onUnlock={handlePrivacyUnlock}
              onLock={handlePrivacyLock}
              onResetPrivateChats={handleResetPrivateChats}
            />
            {googleProfile && (
              <button
                className="google-profile-chip glass"
                onClick={handleGoogleSignOut}
                title={`Signed in as ${googleProfile.name || googleProfile.email} — click to sign out`}
              >
                {googleProfile.picture && (
                  <img src={googleProfile.picture} alt="" referrerPolicy="no-referrer" />
                )}
                <span>{googleProfile.name.split(' ')[0] || 'You'}</span>
              </button>
            )}
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
