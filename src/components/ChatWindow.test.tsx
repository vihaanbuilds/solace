import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatWindow } from './ChatWindow';
import { StoredMessage } from '../lib/storage';

function ControlledChatWindow({
  initialMessages = [],
  onMessagesChange,
}: {
  initialMessages?: StoredMessage[];
  onMessagesChange?: (messages: StoredMessage[]) => void;
}) {
  const [messages, setMessages] = useState<StoredMessage[]>(initialMessages);
  return (
    <ChatWindow
      messages={messages}
      onMessagesChange={(next) => {
        setMessages(next);
        onMessagesChange?.(next);
      }}
    />
  );
}

describe('ChatWindow', () => {
  it('sends a message and renders both the user message and a bot reply', async () => {
    const user = userEvent.setup();
    const onMessagesChange = vi.fn();
    const { container } = render(
      <ControlledChatWindow onMessagesChange={onMessagesChange} />
    );
    const input = screen.getByLabelText('Message input');
    await user.type(input, 'I feel really sad today');
    await user.click(screen.getByText('Send'));

    expect(screen.getByText('I feel really sad today')).toBeInTheDocument();
    expect(onMessagesChange).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ text: 'I feel really sad today' })])
    );
    expect(container.querySelectorAll('.message-bubble-bot')).toHaveLength(1);
  });

  it('switches mode via the mode selector', async () => {
    const user = userEvent.setup();
    render(<ControlledChatWindow />);
    await user.click(screen.getByRole('tab', { name: 'Uplifter' }));
    expect(screen.getByRole('tab', { name: 'Uplifter' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });

  it('shows the crisis banner when crisis language is sent', async () => {
    const user = userEvent.setup();
    render(<ControlledChatWindow />);
    const input = screen.getByLabelText('Message input');
    await user.type(input, 'I want to die');
    await user.click(screen.getByText('Send'));

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('shows the crisis banner even when the message also contains strong emotion words', async () => {
    const user = userEvent.setup();
    render(<ControlledChatWindow />);
    const input = screen.getByLabelText('Message input');
    await user.type(input, 'I am so sad and hopeless I want to die');
    await user.click(screen.getByText('Send'));

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('derives crisis banner visibility from the most recent bot message, not separate state', () => {
    const messages: StoredMessage[] = [
      { id: '1', sender: 'user', text: 'I want to die', timestamp: 1 },
      { id: '2', sender: 'bot', text: 'crisis reply', isCrisis: true, timestamp: 2 },
    ];
    render(<ControlledChatWindow initialMessages={messages} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('hides the crisis banner once a later non-crisis message is sent', async () => {
    const user = userEvent.setup();
    const messages: StoredMessage[] = [
      { id: '1', sender: 'user', text: 'I want to die', timestamp: 1 },
      { id: '2', sender: 'bot', text: 'crisis reply', isCrisis: true, timestamp: 2 },
    ];
    render(<ControlledChatWindow initialMessages={messages} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();

    const input = screen.getByLabelText('Message input');
    await user.type(input, 'hi');
    await user.click(screen.getByText('Send'));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders existing messages passed in as props', () => {
    const messages: StoredMessage[] = [
      { id: '1', sender: 'user', text: 'I feel happy today', timestamp: 1 },
    ];
    render(<ControlledChatWindow initialMessages={messages} />);
    expect(screen.getByText('I feel happy today')).toBeInTheDocument();
  });
});
