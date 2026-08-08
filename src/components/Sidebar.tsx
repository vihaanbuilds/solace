import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Conversation } from '../lib/storage';
import { LotusLogo } from './LotusLogo';
import { CloseIcon, EditIcon, LockIcon, SearchIcon, SettingsIcon, ShareIcon, TrashIcon } from './icons';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  collapsed: boolean;
  userFirstName: string;
  avatarUrl?: string;
  onOpenSettings: () => void;
}

const MENU_WIDTH = 168;

function buildTranscript(conversation: Conversation): string {
  const lines = conversation.messages.map(
    (m) => `${m.sender === 'user' ? 'Me' : 'Solace'}: ${m.text}`
  );
  return [`Solace conversation — ${conversation.title}`, '', ...lines].join('\n');
}

function matchesQuery(conversation: Conversation, query: string): boolean {
  if (conversation.title.toLowerCase().includes(query)) return true;
  return conversation.messages.some((m) => m.text.toLowerCase().includes(query));
}

export function Sidebar({
  conversations,
  activeConversationId,
  onSelect,
  onNewChat,
  onRename,
  onDelete,
  collapsed,
  userFirstName,
  avatarUrl,
  onOpenSettings,
}: SidebarProps) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const kebabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const menuNodeRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const sorted = [...conversations].sort((a, b) => b.createdAt - a.createdAt);
  const trimmedQuery = searchQuery.trim().toLowerCase();
  const searched = trimmedQuery
    ? sorted.filter((c) => matchesQuery(c, trimmedQuery))
    : sorted;

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  function toggleSearch() {
    setSearchOpen((prev) => {
      const next = !prev;
      if (!next) setSearchQuery('');
      return next;
    });
  }

  useEffect(() => {
    if (!openMenuId) return;

    function isInsideMenu(target: EventTarget | null) {
      if (!(target instanceof Node)) return false;
      if (menuNodeRef.current?.contains(target)) return true;
      const kebab = openMenuId ? kebabRefs.current[openMenuId] : null;
      return kebab ? kebab.contains(target) : false;
    }

    function handlePointerDown(e: MouseEvent) {
      if (!isInsideMenu(e.target)) setOpenMenuId(null);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpenMenuId(null);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openMenuId]);

  function toggleMenu(conversation: Conversation) {
    if (openMenuId === conversation.id) {
      setOpenMenuId(null);
      return;
    }
    const btn = kebabRefs.current[conversation.id];
    if (btn) {
      const rect = btn.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 6,
        left: Math.max(8, rect.right - MENU_WIDTH),
      });
    }
    setOpenMenuId(conversation.id);
  }

  function startRename(conversation: Conversation) {
    setOpenMenuId(null);
    setRenamingId(conversation.id);
    setDraftTitle(conversation.title);
  }

  function commitRename(id: string) {
    const trimmed = draftTitle.trim();
    if (trimmed) {
      onRename(id, trimmed);
    }
    setRenamingId(null);
  }

  function handleDelete(conversation: Conversation) {
    setOpenMenuId(null);
    const confirmed = window.confirm(
      `Delete "${conversation.title}" permanently? There is no way to recover this conversation once it's deleted.`
    );
    if (confirmed) {
      onDelete(conversation.id);
    }
  }

  async function handleShare(conversation: Conversation) {
    setOpenMenuId(null);
    const transcript = buildTranscript(conversation);
    const shareData = { title: `Solace — ${conversation.title}`, text: transcript };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error)?.name !== 'AbortError') {
          console.error('Share failed', err);
        }
      }
      return;
    }

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(transcript);
        window.alert("Sharing isn't supported in this browser — copied the conversation to your clipboard instead.");
        return;
      } catch {
        // fall through to the final alert below
      }
    }

    window.alert("Sharing isn't supported in this browser.");
  }

  const menuConversation = openMenuId ? sorted.find((c) => c.id === openMenuId) : undefined;
  const normalConversations = searched.filter((c) => !c.isPrivate);
  const privateConversations = searched.filter((c) => c.isPrivate);
  const noResults = trimmedQuery.length > 0 && searched.length === 0;

  function renderRow(conversation: Conversation) {
    return (
      <div key={conversation.id} className="sidebar-row">
        {renamingId === conversation.id ? (
          <input
            className="sidebar-rename-input"
            value={draftTitle}
            autoFocus
            onChange={(e) => setDraftTitle(e.target.value)}
            onBlur={() => commitRename(conversation.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename(conversation.id);
              if (e.key === 'Escape') setRenamingId(null);
            }}
            aria-label="Rename conversation"
          />
        ) : (
          <button
            className={`sidebar-item ${
              conversation.id === activeConversationId ? 'sidebar-item-active' : ''
            }`}
            onClick={() => onSelect(conversation.id)}
            aria-current={conversation.id === activeConversationId ? 'true' : undefined}
          >
            {conversation.title}
          </button>
        )}
        <div
          className={`sidebar-row-actions ${
            openMenuId === conversation.id ? 'sidebar-row-actions-open' : ''
          }`}
        >
          <button
            ref={(el) => (kebabRefs.current[conversation.id] = el)}
            className="sidebar-menu-btn"
            aria-label={`Options for ${conversation.title}`}
            aria-haspopup="menu"
            aria-expanded={openMenuId === conversation.id}
            onClick={() => toggleMenu(conversation)}
          >
            ⋮
          </button>
        </div>
      </div>
    );
  }

  return (
    <nav
      className={`sidebar glass ${collapsed ? 'sidebar-collapsed' : ''}`}
      aria-label="Conversation history"
      aria-hidden={collapsed}
    >
      {!collapsed && (
        <>
          <div className="sidebar-brand">
            <LotusLogo className="sidebar-brand-icon" />
            <span className="sidebar-brand-text">Solace</span>
          </div>
          <button className="sidebar-new-chat" onClick={onNewChat}>
            + New chat
          </button>
          {searchOpen ? (
            <div className="sidebar-search-row">
              <input
                ref={searchInputRef}
                className="sidebar-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') toggleSearch();
                }}
                placeholder="Search chats..."
                aria-label="Search chats"
              />
              <button
                className="sidebar-search-close"
                onClick={toggleSearch}
                aria-label="Close search"
              >
                <CloseIcon />
              </button>
            </div>
          ) : (
            <button className="sidebar-search-btn" onClick={toggleSearch}>
              <SearchIcon /> Search chats
            </button>
          )}
          <div
            className="sidebar-list"
            ref={listRef}
            onScroll={() => setOpenMenuId(null)}
          >
            {noResults && <div className="sidebar-no-results">No chats match "{searchQuery.trim()}"</div>}
            {normalConversations.length > 0 && <div className="sidebar-label">Chats</div>}
            {normalConversations.map(renderRow)}
            {privateConversations.length > 0 && (
              <div className="sidebar-label sidebar-label-private">
                <LockIcon /> Private
              </div>
            )}
            {privateConversations.map(renderRow)}
          </div>
          <div className="sidebar-footer">
            <div className="sidebar-profile">
              {avatarUrl ? (
                <img className="sidebar-profile-avatar" src={avatarUrl} alt="" referrerPolicy="no-referrer" />
              ) : (
                <span className="sidebar-profile-avatar sidebar-profile-avatar-fallback" aria-hidden="true">
                  {userFirstName.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="sidebar-profile-name">{userFirstName}</span>
            </div>
            <button
              className="sidebar-settings-btn"
              onClick={onOpenSettings}
              aria-label="Open settings"
              title="Settings"
            >
              <SettingsIcon />
            </button>
          </div>
        </>
      )}
      {openMenuId &&
        menuConversation &&
        menuPosition &&
        createPortal(
          <div
            ref={menuNodeRef}
            className="sidebar-row-menu glass"
            role="menu"
            aria-label={`${menuConversation.title} actions`}
            style={{ top: menuPosition.top, left: menuPosition.left, width: MENU_WIDTH }}
          >
            <button
              role="menuitem"
              className="sidebar-row-menu-item"
              onClick={() => startRename(menuConversation)}
            >
              <EditIcon /> Rename
            </button>
            <button
              role="menuitem"
              className="sidebar-row-menu-item"
              onClick={() => handleShare(menuConversation)}
            >
              <ShareIcon /> Share
            </button>
            <button
              role="menuitem"
              className="sidebar-row-menu-item sidebar-row-menu-item-danger"
              onClick={() => handleDelete(menuConversation)}
            >
              <TrashIcon /> Delete
            </button>
          </div>,
          document.body
        )}
    </nav>
  );
}
