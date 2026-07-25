import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sidebar } from './Sidebar';
import { Conversation } from '../lib/storage';

const conversations: Conversation[] = [
  { id: 'a', title: 'First chat', createdAt: 100, messages: [] },
  { id: 'b', title: 'Second chat', createdAt: 200, messages: [] },
];

function renderSidebar(overrides: Partial<React.ComponentProps<typeof Sidebar>> = {}) {
  return render(
    <Sidebar
      conversations={conversations}
      activeConversationId="a"
      onSelect={() => {}}
      onNewChat={() => {}}
      onRename={() => {}}
      onDelete={() => {}}
      {...overrides}
    />
  );
}

describe('Sidebar', () => {
  it('lists all conversations', () => {
    renderSidebar();
    expect(screen.getByText('First chat')).toBeInTheDocument();
    expect(screen.getByText('Second chat')).toBeInTheDocument();
  });

  it('marks the active conversation', () => {
    renderSidebar({ activeConversationId: 'b' });
    expect(screen.getByText('Second chat')).toHaveAttribute('aria-current', 'true');
    expect(screen.getByText('First chat')).not.toHaveAttribute('aria-current');
  });

  it('calls onSelect with the clicked conversation id', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderSidebar({ onSelect });
    await user.click(screen.getByText('Second chat'));
    expect(onSelect).toHaveBeenCalledWith('b');
  });

  it('calls onNewChat when "New chat" is clicked', async () => {
    const user = userEvent.setup();
    const onNewChat = vi.fn();
    renderSidebar({ onNewChat });
    await user.click(screen.getByText('+ New chat'));
    expect(onNewChat).toHaveBeenCalled();
  });

  describe('rename', () => {
    it('switches to an inline input when the rename control is clicked', async () => {
      const user = userEvent.setup();
      renderSidebar();
      await user.click(screen.getByLabelText('Rename First chat'));
      expect(screen.getByLabelText('Rename conversation')).toHaveValue('First chat');
    });

    it('commits the new title on Enter', async () => {
      const user = userEvent.setup();
      const onRename = vi.fn();
      renderSidebar({ onRename });
      await user.click(screen.getByLabelText('Rename First chat'));
      const input = screen.getByLabelText('Rename conversation');
      await user.clear(input);
      await user.type(input, 'My renamed chat{Enter}');
      expect(onRename).toHaveBeenCalledWith('a', 'My renamed chat');
    });

    it('commits the new title on blur', async () => {
      const user = userEvent.setup();
      const onRename = vi.fn();
      renderSidebar({ onRename });
      await user.click(screen.getByLabelText('Rename First chat'));
      const input = screen.getByLabelText('Rename conversation');
      await user.clear(input);
      await user.type(input, 'Blurred title');
      await user.tab();
      expect(onRename).toHaveBeenCalledWith('a', 'Blurred title');
    });

    it('discards the edit on Escape without calling onRename', async () => {
      const user = userEvent.setup();
      const onRename = vi.fn();
      renderSidebar({ onRename });
      await user.click(screen.getByLabelText('Rename First chat'));
      const input = screen.getByLabelText('Rename conversation');
      await user.type(input, ' more text{Escape}');
      expect(onRename).not.toHaveBeenCalled();
      expect(screen.getByText('First chat')).toBeInTheDocument();
    });

    it('does not commit an empty title', async () => {
      const user = userEvent.setup();
      const onRename = vi.fn();
      renderSidebar({ onRename });
      await user.click(screen.getByLabelText('Rename First chat'));
      const input = screen.getByLabelText('Rename conversation');
      await user.clear(input);
      await user.keyboard('{Enter}');
      expect(onRename).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      vi.spyOn(window, 'confirm');
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('asks for confirmation mentioning permanence before deleting', async () => {
      const user = userEvent.setup();
      vi.mocked(window.confirm).mockReturnValue(true);
      const onDelete = vi.fn();
      renderSidebar({ onDelete });

      await user.click(screen.getByLabelText('Delete First chat'));

      expect(window.confirm).toHaveBeenCalledWith(expect.stringMatching(/no way to recover/i));
      expect(onDelete).toHaveBeenCalledWith('a');
    });

    it('does not delete if the confirmation is declined', async () => {
      const user = userEvent.setup();
      vi.mocked(window.confirm).mockReturnValue(false);
      const onDelete = vi.fn();
      renderSidebar({ onDelete });

      await user.click(screen.getByLabelText('Delete First chat'));

      expect(onDelete).not.toHaveBeenCalled();
    });
  });
});
