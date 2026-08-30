import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { installPlatformAdminSnapshot } from '../../platformManagement/realData/platformAdminRealDataService';
import { makePlatformAdminRealDataTestSnapshot } from '../../platformManagement/realData/platformAdminRealDataTestFixture';
import { PaymentsPage } from './PaymentsPage';

describe('PaymentsPage', () => {
  beforeEach(() => {
    installPlatformAdminSnapshot(makePlatformAdminRealDataTestSnapshot());
  });

  it('renders filters, tabs, card toggle, and row action menu', async () => {
    const user = userEvent.setup();
    render(<PaymentsPage navigate={vi.fn()} showToast={vi.fn()} />);
    expect(screen.getByRole('heading', { name: /payments & receipts/i })).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText(/transaction code, reference number/i), 'DEV');
    await user.click(screen.getByRole('button', { name: /^approved \(/i }));
    await user.click(screen.getByRole('button', { name: /card grid/i }));
    await user.click(screen.getByRole('button', { name: /table view/i }));
    await user.click(screen.getAllByRole('button', { name: /actions for payment/i })[0]);
    expect(screen.getByRole('menuitem', { name: /view payment/i })).toBeInTheDocument();
  });
});
