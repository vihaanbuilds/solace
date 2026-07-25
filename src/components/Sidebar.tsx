import { useState } from 'react';
import { Conversation } from '../lib/storage';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}

export function Sidebar({
  conversations,
  activeConversationId,
  onSelect,
  onNewChat,
  onRename,
  onDelete,
}: SidebarProps) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');

  const sorted = [...conversations].sort((a, b) => b.createdAt - a.createdAt);

  function startRename(conversation: Conversation) {
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
    const confirmed = window.confirm(
      `Delete "${conversation.title}" permanently? There is no way to recover this conversation once it's deleted.`
    );
    if (confirmed) {
      onDelete(conversation.id);
    }
  }

  return (
    <nav className="sidebar glass" aria-label="Conversation history">
      <button className="sidebar-new-chat" onClick={onNewChat}>
        + New chat
      </button>
      {sorted.length > 0 && <div className="sidebar-label">Chats</div>}
      <div className="sidebar-list">
        {sorted.map((conversation) => (
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
            <div className="sidebar-row-actions">
              <button
                className="sidebar-icon-btn"
                aria-label={`Rename ${conversation.title}`}
                onClick={() => startRename(conversation)}
              >
                ✏️
              </button>
              <button
                className="sidebar-icon-btn"
                aria-label={`Delete ${conversation.title}`}
                onClick={() => handleDelete(conversation)}
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
}
