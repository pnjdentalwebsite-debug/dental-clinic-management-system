import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { Modal } from './Modal';

describe('Modal', () => {
  it('renders through a portal and restores focus after Escape', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <>
        <button>Open source</button>
        <Modal open title="Portal Dialog" onClose={onClose}>
          <button>Inside action</button>
        </Modal>
      </>
    );

    screen.getByRole('button', { name: /open source/i }).focus();
    expect(document.body).toContainElement(screen.getByRole('dialog', { name: /portal dialog/i }));

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
