import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { installPlatformAdminSnapshot } from '../../platformManagement/realData/platformAdminRealDataService';
import { makePlatformAdminRealDataTestSnapshot } from '../../platformManagement/realData/platformAdminRealDataTestFixture';
import { SubscriptionsPage } from './SubscriptionsPage';

describe('SubscriptionsPage', () => {
  beforeEach(() => {
    installPlatformAdminSnapshot(makePlatformAdminRealDataTestSnapshot());
  });

  it('renders the list, filters, tabs, and row action menu', async () => {
    const user = userEvent.setup();
    render(<SubscriptionsPage navigate={vi.fn()} showToast={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Active Clinic Subscriptions' })).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText(/subscriber, clinic name, owner/i), 'Basic');
    expect(screen.getByText(/showing/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^active \(/i }));
    await user.click(screen.getAllByRole('button', { name: /actions for subscription/i })[0]);
    expect(screen.getByRole('menuitem', { name: /view subscription/i })).toBeInTheDocument();
  });
});
