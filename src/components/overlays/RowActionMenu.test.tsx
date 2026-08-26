import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { RowActionMenu } from './RowActionMenu';

describe('RowActionMenu', () => {
  it('opens a portal menu and calls the selected action', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<RowActionMenu ariaLabel="Actions for record" items={[{ id: 'view', label: 'View Record', onSelect }]} />);

    await user.click(screen.getByRole('button', { name: /actions for record/i }));
    await user.click(screen.getByRole('menuitem', { name: /view record/i }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
