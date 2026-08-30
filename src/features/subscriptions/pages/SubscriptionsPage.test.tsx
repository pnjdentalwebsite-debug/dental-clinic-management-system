import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { makePlatformAdminRealDataTestSnapshot } from '../../platformManagement/realData/platformAdminRealDataTestFixture';
import { PlatformAdminReadProvider } from '../../platformManagement/realData/PlatformAdminReadProvider';
import { platformAdminApi } from '../../../infrastructure/supabase/platformAdminApi';
import { SubscriptionsPage } from './SubscriptionsPage';

describe('SubscriptionsPage', () => {
  beforeEach(() => {
    const snapshot = makePlatformAdminRealDataTestSnapshot();
    vi.spyOn(platformAdminApi, 'getSummary').mockResolvedValue({ summary: snapshot.summary });
    vi.spyOn(platformAdminApi, 'listAllReview').mockResolvedValue({ items: [], page: 1, pageSize: 100, total: 0 });
    vi.spyOn(platformAdminApi, 'readDirectory').mockImplementation(async resource => snapshot[resource as keyof typeof snapshot] as never);
  });

  it('renders the list, filters, tabs, and row action menu', async () => {
    const user = userEvent.setup();
    render(<PlatformAdminReadProvider enabled><SubscriptionsPage navigate={vi.fn()} showToast={vi.fn()} /></PlatformAdminReadProvider>);

    expect(await screen.findByText('Harbor Dental Clinic')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Active Clinic Subscriptions' })).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText(/subscriber, clinic name, owner/i), 'Basic');
    expect(screen.getByText(/showing/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^active \(/i }));
    await user.click(screen.getAllByRole('button', { name: /actions for subscription/i })[0]);
    expect(screen.getByRole('menuitem', { name: /view subscription/i })).toBeInTheDocument();
  });
});
