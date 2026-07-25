import { Conversation } from '../lib/storage';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
}

export function Sidebar({
  conversations,
  activeConversationId,
  onSelect,
  onNewChat,
}: SidebarProps) {
  const sorted = [...conversations].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <nav className="sidebar glass" aria-label="Conversation history">
      <button className="sidebar-new-chat" onClick={onNewChat}>
        + New chat
      </button>
      <div className="sidebar-list">
        {sorted.map((conversation) => (
          <button
            key={conversation.id}
            className={`sidebar-item ${
              conversation.id === activeConversationId ? 'sidebar-item-active' : ''
            }`}
            onClick={() => onSelect(conversation.id)}
            aria-current={conversation.id === activeConversationId ? 'true' : undefined}
          >
            {conversation.title}
          </button>
        ))}
      </div>
    </nav>
  );
}
