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

      await user.click(within(getSidebar()).getByLabelText(/^Options for/));
      await user.click(screen.getByRole('menuitem', { name: /rename/i }));
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
      await user.click(within(sidebar).getByLabelText(/^Options for.*happy today/));
      await user.click(screen.getByRole('menuitem', { name: /delete/i }));

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
      await user.click(within(sidebar).getByLabelText(/^Options for/));
      await user.click(screen.getByRole('menuitem', { name: /delete/i }));

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
      await user.click(within(sidebar).getByLabelText(/^Options for/));
      await user.click(screen.getByRole('menuitem', { name: /delete/i }));

      expect(loadConversations()).toHaveLength(1);

      vi.restoreAllMocks();
    });
  });

  describe('sidebar collapse', () => {
    it('hides the sidebar contents when the toggle is clicked, and shows them again on a second click', async () => {
      const user = userEvent.setup();
      await completeOnboarding(user);

      expect(screen.getByText('+ New chat')).toBeInTheDocument();

      await user.click(screen.getByLabelText('Hide chat history'));
      expect(screen.queryByText('+ New chat')).not.toBeInTheDocument();

      await user.click(screen.getByLabelText('Show chat history'));
      expect(screen.getByText('+ New chat')).toBeInTheDocument();
    });

    it('persists the collapsed preference across a remount', async () => {
      const user = userEvent.setup();
      const { unmount } = render(<App />);
      await user.click(screen.getByText("I'm ready"));
      await user.click(screen.getByLabelText('Hide chat history'));
      unmount();

      render(<App />);
      await user.click(screen.getByText("I'm ready"));
      expect(screen.queryByText('+ New chat')).not.toBeInTheDocument();
    });
  });

  describe('private chats', () => {
    function getPrivacyToggleButton(): HTMLElement {
      return document.querySelector('.privacy-toggle-btn') as HTMLElement;
    }

    async function typeDigits(user: ReturnType<typeof userEvent.setup>, code: string) {
      for (let i = 0; i < code.length; i += 1) {
        await user.type(screen.getByLabelText(`Passcode digit ${i + 1}`), code[i]);
      }
    }

    async function unlockPrivate(user: ReturnType<typeof userEvent.setup>, code = '13579') {
      await user.click(getPrivacyToggleButton());
      await typeDigits(user, code);
    }

    it('a new chat started while private is unlocked is hidden again once locked', async () => {
      const user = userEvent.setup();
      await completeOnboarding(user);

      await unlockPrivate(user);
      await user.click(screen.getByText('+ New chat'));
      expect(within(getSidebar()).getByText('🔒 Private', { exact: false })).toBeInTheDocument();
      expect(within(getSidebar()).getByText('Private conversation')).toBeInTheDocument();

      await user.click(getPrivacyToggleButton());
      expect(
        within(getSidebar()).queryByText('Private conversation')
      ).not.toBeInTheDocument();
      expect(
        within(getSidebar()).queryByText('🔒 Private', { exact: false })
      ).not.toBeInTheDocument();
    });

    it('re-locking while viewing the private chat switches back to a visible conversation', async () => {
      const user = userEvent.setup();
      await completeOnboarding(user);

      await unlockPrivate(user);
      await user.click(screen.getByText('+ New chat'));
      expect(screen.getByLabelText('Message input')).toBeInTheDocument();

      await user.click(getPrivacyToggleButton());

      // the chat window should no longer be showing the now-hidden private conversation
      expect(getMessageList()).toBeInTheDocument();
      expect(within(getSidebar()).queryByText('Private conversation')).not.toBeInTheDocument();
    });

    it('re-entering the correct passcode reveals the private chat again', async () => {
      const user = userEvent.setup();
      await completeOnboarding(user);

      await unlockPrivate(user);
      await user.click(screen.getByText('+ New chat'));
      await user.click(getPrivacyToggleButton()); // lock

      await unlockPrivate(user);
      expect(within(getSidebar()).getByText('Private conversation')).toBeInTheDocument();
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
});
