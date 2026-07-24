import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatWindow } from './ChatWindow';
import { loadMessages } from '../lib/storage';

describe('ChatWindow', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('sends a message and renders both the user message and a bot reply', async () => {
    const user = userEvent.setup();
    const { container } = render(<ChatWindow />);
    const input = screen.getByLabelText('Message input');
    await user.type(input, 'I feel really sad today');
    await user.click(screen.getByText('Send'));

    expect(screen.getByText('I feel really sad today')).toBeInTheDocument();
    expect(loadMessages()).toHaveLength(2);
    expect(container.querySelectorAll('.message-bubble-bot')).toHaveLength(1);
  });

  it('switches mode via the mode selector', async () => {
    const user = userEvent.setup();
    render(<ChatWindow />);
    await user.click(screen.getByRole('tab', { name: 'Uplifter' }));
    expect(screen.getByRole('tab', { name: 'Uplifter' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });

  it('shows the crisis banner when crisis language is sent', async () => {
    const user = userEvent.setup();
    render(<ChatWindow />);
    const input = screen.getByLabelText('Message input');
    await user.type(input, 'I want to die');
    await user.click(screen.getByText('Send'));

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('shows the crisis banner even when the message also contains strong emotion words', async () => {
    const user = userEvent.setup();
    render(<ChatWindow />);
    const input = screen.getByLabelText('Message input');
    await user.type(input, 'I am so sad and hopeless I want to die');
    await user.click(screen.getByText('Send'));

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('persists messages across a remount', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<ChatWindow />);
    const input = screen.getByLabelText('Message input');
    await user.type(input, 'I feel happy today');
    await user.click(screen.getByText('Send'));
    unmount();

    render(<ChatWindow />);
    expect(screen.getByText('I feel happy today')).toBeInTheDocument();
  });
});
