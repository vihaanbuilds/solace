import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageBubble } from './MessageBubble';
import { StoredMessage } from '../lib/storage';

describe('MessageBubble', () => {
  it('renders a bot message with the rainbow glow wrapper', () => {
    const message: StoredMessage = {
      id: '1',
      sender: 'bot',
      text: 'I hear you',
      timestamp: 1,
    };
    const { container } = render(<MessageBubble message={message} />);
    expect(screen.getByText('I hear you')).toBeInTheDocument();
    expect(container.querySelector('.rainbow-glow')).not.toBeNull();
  });

  it('renders a user message without the rainbow glow wrapper', () => {
    const message: StoredMessage = {
      id: '2',
      sender: 'user',
      text: 'I feel sad',
      timestamp: 1,
    };
    const { container } = render(<MessageBubble message={message} />);
    expect(screen.getByText('I feel sad')).toBeInTheDocument();
    expect(container.querySelector('.rainbow-glow')).toBeNull();
  });
});
