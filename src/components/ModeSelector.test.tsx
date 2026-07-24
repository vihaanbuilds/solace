import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModeSelector } from './ModeSelector';

describe('ModeSelector', () => {
  it('marks the active mode as selected', () => {
    render(<ModeSelector mode="comforter" onChange={() => {}} />);
    expect(screen.getByRole('tab', { name: 'Comforter' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByRole('tab', { name: 'Uplifter' })).toHaveAttribute(
      'aria-selected',
      'false'
    );
  });

  it('calls onChange with the clicked mode', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ModeSelector mode="comforter" onChange={onChange} />);
    await user.click(screen.getByRole('tab', { name: 'Reflector' }));
    expect(onChange).toHaveBeenCalledWith('reflector');
  });
});
