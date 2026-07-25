import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sidebar } from './Sidebar';
import { Conversation } from '../lib/storage';

const conversations: Conversation[] = [
  { id: 'a', title: 'First chat', createdAt: 100, messages: [] },
  { id: 'b', title: 'Second chat', createdAt: 200, messages: [] },
];

describe('Sidebar', () => {
  it('lists all conversations', () => {
    render(
      <Sidebar
        conversations={conversations}
        activeConversationId="a"
        onSelect={() => {}}
        onNewChat={() => {}}
      />
    );
    expect(screen.getByText('First chat')).toBeInTheDocument();
    expect(screen.getByText('Second chat')).toBeInTheDocument();
  });

  it('marks the active conversation', () => {
    render(
      <Sidebar
        conversations={conversations}
        activeConversationId="b"
        onSelect={() => {}}
        onNewChat={() => {}}
      />
    );
    expect(screen.getByText('Second chat')).toHaveAttribute('aria-current', 'true');
    expect(screen.getByText('First chat')).not.toHaveAttribute('aria-current');
  });

  it('calls onSelect with the clicked conversation id', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <Sidebar
        conversations={conversations}
        activeConversationId="a"
        onSelect={onSelect}
        onNewChat={() => {}}
      />
    );
    await user.click(screen.getByText('Second chat'));
    expect(onSelect).toHaveBeenCalledWith('b');
  });

  it('calls onNewChat when "New chat" is clicked', async () => {
    const user = userEvent.setup();
    const onNewChat = vi.fn();
    render(
      <Sidebar
        conversations={conversations}
        activeConversationId="a"
        onSelect={() => {}}
        onNewChat={onNewChat}
      />
    );
    await user.click(screen.getByText('+ New chat'));
    expect(onNewChat).toHaveBeenCalled();
  });
});
