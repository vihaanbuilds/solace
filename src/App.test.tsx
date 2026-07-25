import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
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

    const input = screen.getByLabelText('Message input');
    await user.type(input, 'I feel really jealous of my friends');
    await user.click(screen.getByText('Send'));
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

    const input = screen.getByLabelText('Message input');
    await user.type(input, 'I feel really jealous of my friends');
    await user.click(screen.getByText('Send'));

    await user.click(screen.getByText('+ New chat'));
    expect(
      within(getMessageList()).queryByText('I feel really jealous of my friends')
    ).not.toBeInTheDocument();

    const sidebar = document.querySelector('.sidebar') as HTMLElement;
    await user.click(within(sidebar).getByText(/jealous of my friends/));

    expect(
      within(getMessageList()).getByText('I feel really jealous of my friends')
    ).toBeInTheDocument();
  });

  it('persists the active conversation across a remount', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    await user.click(screen.getByText("I'm ready"));

    const input = screen.getByLabelText('Message input');
    await user.type(input, 'I feel happy today');
    await user.click(screen.getByText('Send'));
    unmount();

    render(<App />);
    await user.click(screen.getByText("I'm ready"));
    expect(within(getMessageList()).getByText('I feel happy today')).toBeInTheDocument();
  });
});
