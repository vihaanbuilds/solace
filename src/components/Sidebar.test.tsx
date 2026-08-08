import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
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
      collapsed={false}
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

  describe('options menu', () => {
    it('opens the menu with Rename, Share, and Delete when the options button is clicked', async () => {
      const user = userEvent.setup();
      renderSidebar();
      await user.click(screen.getByLabelText('Options for First chat'));
      const menu = screen.getByRole('menu', { name: 'First chat actions' });
      expect(within(menu).getByRole('menuitem', { name: /rename/i })).toBeInTheDocument();
      expect(within(menu).getByRole('menuitem', { name: /share/i })).toBeInTheDocument();
      expect(within(menu).getByRole('menuitem', { name: /delete/i })).toBeInTheDocument();
    });

    it('closes the menu on Escape', async () => {
      const user = userEvent.setup();
      renderSidebar();
      await user.click(screen.getByLabelText('Options for First chat'));
      expect(screen.getByRole('menu')).toBeInTheDocument();
      await user.keyboard('{Escape}');
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('closes the menu when clicking outside of it', async () => {
      const user = userEvent.setup();
      renderSidebar();
      await user.click(screen.getByLabelText('Options for First chat'));
      expect(screen.getByRole('menu')).toBeInTheDocument();
      await user.click(document.body);
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  describe('rename', () => {
    async function openRename(user: ReturnType<typeof userEvent.setup>, label = 'First chat') {
      await user.click(screen.getByLabelText(`Options for ${label}`));
      await user.click(screen.getByRole('menuitem', { name: /rename/i }));
    }

    it('switches to an inline input when Rename is chosen from the menu', async () => {
      const user = userEvent.setup();
      renderSidebar();
      await openRename(user);
      expect(screen.getByLabelText('Rename conversation')).toHaveValue('First chat');
    });

    it('commits the new title on Enter', async () => {
      const user = userEvent.setup();
      const onRename = vi.fn();
      renderSidebar({ onRename });
      await openRename(user);
      const input = screen.getByLabelText('Rename conversation');
      await user.clear(input);
      await user.type(input, 'My renamed chat{Enter}');
      expect(onRename).toHaveBeenCalledWith('a', 'My renamed chat');
    });

    it('commits the new title on blur', async () => {
      const user = userEvent.setup();
      const onRename = vi.fn();
      renderSidebar({ onRename });
      await openRename(user);
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
      await openRename(user);
      const input = screen.getByLabelText('Rename conversation');
      await user.type(input, ' more text{Escape}');
      expect(onRename).not.toHaveBeenCalled();
      expect(screen.getByText('First chat')).toBeInTheDocument();
    });

    it('does not commit an empty title', async () => {
      const user = userEvent.setup();
      const onRename = vi.fn();
      renderSidebar({ onRename });
      await openRename(user);
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

    async function openDelete(user: ReturnType<typeof userEvent.setup>, label = 'First chat') {
      await user.click(screen.getByLabelText(`Options for ${label}`));
      await user.click(screen.getByRole('menuitem', { name: /delete/i }));
    }

    it('asks for confirmation mentioning permanence before deleting', async () => {
      const user = userEvent.setup();
      vi.mocked(window.confirm).mockReturnValue(true);
      const onDelete = vi.fn();
      renderSidebar({ onDelete });

      await openDelete(user);

      expect(window.confirm).toHaveBeenCalledWith(expect.stringMatching(/no way to recover/i));
      expect(onDelete).toHaveBeenCalledWith('a');
    });

    it('does not delete if the confirmation is declined', async () => {
      const user = userEvent.setup();
      vi.mocked(window.confirm).mockReturnValue(false);
      const onDelete = vi.fn();
      renderSidebar({ onDelete });

      await openDelete(user);

      expect(onDelete).not.toHaveBeenCalled();
    });
  });

  describe('share', () => {
    afterEach(() => {
      vi.restoreAllMocks();
      // @ts-expect-error -- test-only cleanup of a browser API not present in jsdom by default
      delete navigator.share;
      // @ts-expect-error -- test-only cleanup of a browser API not present in jsdom by default
      delete navigator.clipboard;
    });

    async function openShare(user: ReturnType<typeof userEvent.setup>, label = 'First chat') {
      await user.click(screen.getByLabelText(`Options for ${label}`));
      await user.click(screen.getByRole('menuitem', { name: /share/i }));
    }

    it('calls the native share API with the conversation title and transcript', async () => {
      const user = userEvent.setup();
      const share = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'share', { value: share, configurable: true });
      renderSidebar();

      await openShare(user);

      expect(share).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining('First chat'),
          text: expect.stringContaining('First chat'),
        })
      );
    });

    it('falls back to copying the transcript when the share API is unavailable', async () => {
      const user = userEvent.setup();
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
      vi.spyOn(window, 'alert').mockImplementation(() => {});
      renderSidebar();

      await openShare(user);

      expect(writeText).toHaveBeenCalledWith(expect.stringContaining('First chat'));
      expect(window.alert).toHaveBeenCalledWith(expect.stringMatching(/copied/i));
    });
  });

  describe('search', () => {
    const withMessages: Conversation[] = [
      { id: 'a', title: 'First chat', createdAt: 100, messages: [] },
      {
        id: 'b',
        title: 'Second chat',
        createdAt: 200,
        messages: [
          { id: 'm1', sender: 'user', text: 'talking about my dog Biscuit', timestamp: 1 },
        ],
      },
    ];

    it('shows a logo and brand name at the top of the sidebar', () => {
      renderSidebar();
      expect(screen.getByText('Solace')).toBeInTheDocument();
    });

    it('opens a search input when "Search chats" is clicked, focused and empty', async () => {
      const user = userEvent.setup();
      renderSidebar();
      await user.click(screen.getByText('🔍 Search chats'));
      expect(screen.getByLabelText('Search chats')).toHaveFocus();
    });

    it('filters the list by title as you type', async () => {
      const user = userEvent.setup();
      renderSidebar();
      await user.click(screen.getByText('🔍 Search chats'));
      await user.type(screen.getByLabelText('Search chats'), 'second');

      expect(screen.getByText('Second chat')).toBeInTheDocument();
      expect(screen.queryByText('First chat')).not.toBeInTheDocument();
    });

    it('also matches on message content, not just the title', async () => {
      const user = userEvent.setup();
      renderSidebar({ conversations: withMessages });
      await user.click(screen.getByText('🔍 Search chats'));
      await user.type(screen.getByLabelText('Search chats'), 'biscuit');

      expect(screen.getByText('Second chat')).toBeInTheDocument();
      expect(screen.queryByText('First chat')).not.toBeInTheDocument();
    });

    it('shows a no-results message when nothing matches', async () => {
      const user = userEvent.setup();
      renderSidebar();
      await user.click(screen.getByText('🔍 Search chats'));
      await user.type(screen.getByLabelText('Search chats'), 'nonexistent');

      expect(screen.getByText(/no chats match/i)).toBeInTheDocument();
    });

    it('clears the query and closes when the close button is clicked', async () => {
      const user = userEvent.setup();
      renderSidebar();
      await user.click(screen.getByText('🔍 Search chats'));
      await user.type(screen.getByLabelText('Search chats'), 'second');
      await user.click(screen.getByLabelText('Close search'));

      expect(screen.queryByLabelText('Search chats')).not.toBeInTheDocument();
      expect(screen.getByText('First chat')).toBeInTheDocument();
      expect(screen.getByText('Second chat')).toBeInTheDocument();
    });

    it('clears and closes on Escape', async () => {
      const user = userEvent.setup();
      renderSidebar();
      await user.click(screen.getByText('🔍 Search chats'));
      await user.type(screen.getByLabelText('Search chats'), 'second{Escape}');

      expect(screen.queryByLabelText('Search chats')).not.toBeInTheDocument();
      expect(screen.getByText('First chat')).toBeInTheDocument();
    });
  });

  describe('collapsed', () => {
    it('hides the conversation list and new-chat button when collapsed', () => {
      renderSidebar({ collapsed: true });
      expect(screen.queryByText('+ New chat')).not.toBeInTheDocument();
      expect(screen.queryByText('First chat')).not.toBeInTheDocument();
    });

    it('marks the nav as aria-hidden when collapsed', () => {
      renderSidebar({ collapsed: true });
      expect(screen.getByLabelText('Conversation history')).toHaveAttribute(
        'aria-hidden',
        'true'
      );
    });

    it('shows the conversation list again when not collapsed', () => {
      renderSidebar({ collapsed: false });
      expect(screen.getByText('+ New chat')).toBeInTheDocument();
      expect(screen.getByText('First chat')).toBeInTheDocument();
    });
  });
});
