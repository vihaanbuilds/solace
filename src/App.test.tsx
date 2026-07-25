import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { loadConversations } from './lib/storage';

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  async function completeOnboarding(user: ReturnType<typeof userEvent.setup>) {
    render(<App />);
    await user.click(screen.getByText("I'm ready"));
  }

  function getMessageList(): HTMLElement {
    return document.querySelector('.message-list') as HTMLElement;
  }

  function getSidebar(): HTMLElement {
    return document.querySelector('.sidebar') as HTMLElement;
  }

  async function sendAndAwaitReply(user: ReturnType<typeof userEvent.setup>, text: string) {
    const input = screen.getByLabelText('Message input');
    await user.type(input, text);
    await user.click(screen.getByText('Send'));
    await waitFor(() => {
      expect(getMessageList().querySelectorAll('.message-bubble-bot')).toHaveLength(1);
    });
  }

  it('shows the onboarding screen with a random welcome line before entering the chat', () => {
    render(<App />);
    expect(screen.getByText("I'm ready")).toBeInTheDocument();
    expect(screen.getByText('Comforter', { exact: false })).toBeInTheDocument();
  });

  it('enters the chat and creates a first conversation after onboarding', async () => {
    const user = userEvent.setup();
    await completeOnboarding(user);

    expect(screen.getByLabelText('Message input')).toBeInTheDocument();
    expect(screen.getByText('+ New chat')).toBeInTheDocument();
    expect(loadConversations()).toHaveLength(1);
  });

  it('creates a new conversation and switches to it when "New chat" is clicked', async () => {
    const user = userEvent.setup();
    await completeOnboarding(user);

    await sendAndAwaitReply(user, 'I feel really jealous of my friends');
    expect(
      within(getMessageList()).getByText('I feel really jealous of my friends')
    ).toBeInTheDocument();

    await user.click(screen.getByText('+ New chat'));

    expect(
      within(getMessageList()).queryByText('I feel really jealous of my friends')
    ).not.toBeInTheDocument();
    expect(loadConversations()).toHaveLength(2);
  });

  it('switching back to a prior conversation in the sidebar restores its messages', async () => {
    const user = userEvent.setup();
    await completeOnboarding(user);

    await sendAndAwaitReply(user, 'I feel really jealous of my friends');

    await user.click(screen.getByText('+ New chat'));
    expect(
      within(getMessageList()).queryByText('I feel really jealous of my friends')
    ).not.toBeInTheDocument();

    await user.click(within(getSidebar()).getByText(/jealous of my friends/));

    expect(
      within(getMessageList()).getByText('I feel really jealous of my friends')
    ).toBeInTheDocument();
  });

  it('persists the active conversation across a remount', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    await user.click(screen.getByText("I'm ready"));

    await sendAndAwaitReply(user, 'I feel happy today');
    unmount();

    render(<App />);
    await user.click(screen.getByText("I'm ready"));
    expect(within(getMessageList()).getByText('I feel happy today')).toBeInTheDocument();
  });

  describe('sidebar conversation management', () => {
    it('renaming a conversation persists and is not overwritten by later auto-titling', async () => {
      const user = userEvent.setup();
      await completeOnboarding(user);

      await user.click(within(getSidebar()).getByLabelText(/^Rename/));
      const renameInput = screen.getByLabelText('Rename conversation');
      await user.clear(renameInput);
      await user.type(renameInput, 'My custom title{Enter}');

      expect(within(getSidebar()).getByText('My custom title')).toBeInTheDocument();

      await sendAndAwaitReply(user, 'I feel really jealous of my friends');

      expect(within(getSidebar()).getByText('My custom title')).toBeInTheDocument();
      expect(loadConversations()[0].titleIsCustom).toBe(true);
    });

    it('deleting a conversation removes it and falls back to another conversation', async () => {
      const user = userEvent.setup();
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      await completeOnboarding(user);

      await sendAndAwaitReply(user, 'I feel really jealous of my friends');
      await user.click(screen.getByText('+ New chat'));
      await sendAndAwaitReply(user, 'I feel happy today');
      expect(loadConversations()).toHaveLength(2);

      const sidebar = getSidebar();
      await user.click(within(sidebar).getByLabelText(/^Delete.*happy today/));

      expect(loadConversations()).toHaveLength(1);
      expect(
        within(getMessageList()).getByText('I feel really jealous of my friends')
      ).toBeInTheDocument();

      vi.restoreAllMocks();
    });

    it('deleting the last remaining conversation creates a fresh empty one', async () => {
      const user = userEvent.setup();
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      await completeOnboarding(user);

      await sendAndAwaitReply(user, 'I feel really jealous of my friends');

      const sidebar = getSidebar();
      await user.click(within(sidebar).getByLabelText(/^Delete/));

      expect(loadConversations()).toHaveLength(1);
      expect(loadConversations()[0].messages).toHaveLength(0);
      expect(
        within(getMessageList()).queryByText('I feel really jealous of my friends')
      ).not.toBeInTheDocument();

      vi.restoreAllMocks();
    });

    it('does not delete when the confirmation is declined', async () => {
      const user = userEvent.setup();
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      await completeOnboarding(user);

      const sidebar = getSidebar();
      await user.click(within(sidebar).getByLabelText(/^Delete/));

      expect(loadConversations()).toHaveLength(1);

      vi.restoreAllMocks();
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
});
