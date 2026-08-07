import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrivacyToggle } from './PrivacyToggle';
import { loadPrivatePasscodeRecord } from '../lib/storage';

async function typeDigits(user: ReturnType<typeof userEvent.setup>, code: string) {
  for (let i = 0; i < code.length; i += 1) {
    await user.type(screen.getByLabelText(`Passcode digit ${i + 1}`), code[i]);
  }
}

function renderToggle(unlocked = false) {
  const props = {
    unlocked,
    onUnlock: vi.fn(),
    onLock: vi.fn(),
    onResetPrivateChats: vi.fn(),
  };
  const view = render(<PrivacyToggle {...props} />);
  return { ...view, props };
}

describe('PrivacyToggle', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('locks immediately (no popup) when clicked while unlocked', async () => {
    const user = userEvent.setup();
    const { props } = renderToggle(true);
    await user.click(screen.getByRole('button', { name: /private/i }));
    expect(props.onLock).toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('prompts to create a passcode the first time private is opened', async () => {
    const user = userEvent.setup();
    renderToggle();
    await user.click(screen.getByRole('button', { name: /private/i }));
    expect(
      screen.getByRole('dialog', { name: 'Create your private chat passcode' })
    ).toBeInTheDocument();
  });

  it('saves a hashed passcode and unlocks after entering 5 new digits', async () => {
    const user = userEvent.setup();
    const { props } = renderToggle();
    await user.click(screen.getByRole('button', { name: /private/i }));
    await typeDigits(user, '13579');

    expect(props.onUnlock).toHaveBeenCalled();
    const record = loadPrivatePasscodeRecord();
    expect(record).not.toBeNull();
    expect(record?.hash).not.toBe('13579');
  });

  it('prompts to enter the existing passcode on subsequent opens', async () => {
    const user = userEvent.setup();
    const { props } = renderToggle();
    await user.click(screen.getByRole('button', { name: /private/i }));
    await typeDigits(user, '13579');
    props.onUnlock.mockClear();

    // simulate being locked again with the same rendered instance
    render(<PrivacyToggle {...props} unlocked={false} />);
    await user.click(screen.getAllByRole('button', { name: /private/i })[1]);
    expect(
      screen.getByRole('dialog', { name: 'Enter your private chat passcode' })
    ).toBeInTheDocument();
  });

  it('rejects an incorrect passcode with an error and does not unlock', async () => {
    const user = userEvent.setup();
    renderToggle();
    await user.click(screen.getByRole('button', { name: /private/i }));
    await typeDigits(user, '11111');

    const { props: props2 } = renderToggle();
    await user.click(screen.getAllByRole('button', { name: /private/i })[1]);
    await typeDigits(user, '99999');

    expect(screen.getByText(/incorrect passcode/i)).toBeInTheDocument();
    expect(props2.onUnlock).not.toHaveBeenCalled();
  });

  it('resets the passcode and erases private chats when confirmed', async () => {
    const user = userEvent.setup();
    renderToggle();
    await user.click(screen.getByRole('button', { name: /private/i }));
    await typeDigits(user, '13579');

    const { props: props2 } = renderToggle();
    await user.click(screen.getAllByRole('button', { name: /private/i })[1]);
    await user.click(screen.getByRole('button', { name: /forgot passcode/i }));
    expect(screen.getByText(/erase all your existing private chats/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /yes, erase and reset/i }));
    expect(props2.onResetPrivateChats).toHaveBeenCalled();
    expect(loadPrivatePasscodeRecord()).toBeNull();
    expect(
      screen.getByRole('dialog', { name: 'Create your private chat passcode' })
    ).toBeInTheDocument();
  });

  it('does nothing and keeps the existing passcode when reset is declined', async () => {
    const user = userEvent.setup();
    renderToggle();
    await user.click(screen.getByRole('button', { name: /private/i }));
    await typeDigits(user, '13579');
    const recordBefore = loadPrivatePasscodeRecord();

    const { props: props2 } = renderToggle();
    await user.click(screen.getAllByRole('button', { name: /private/i })[1]);
    await user.click(screen.getByRole('button', { name: /forgot passcode/i }));
    await user.click(screen.getByRole('button', { name: /^no$/i }));

    expect(props2.onResetPrivateChats).not.toHaveBeenCalled();
    expect(loadPrivatePasscodeRecord()).toEqual(recordBefore);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes on Escape without unlocking', async () => {
    const user = userEvent.setup();
    const { props } = renderToggle();
    await user.click(screen.getByRole('button', { name: /private/i }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(props.onUnlock).not.toHaveBeenCalled();
  });
});
