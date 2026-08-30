import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { makePlatformAdminRealDataTestSnapshot } from '../../platformManagement/realData/platformAdminRealDataTestFixture';
import { PlatformAdminReadProvider } from '../../platformManagement/realData/PlatformAdminReadProvider';
import { platformAdminApi } from '../../../infrastructure/supabase/platformAdminApi';
import { PaymentsPage } from './PaymentsPage';

describe('PaymentsPage', () => {
  beforeEach(() => {
    const snapshot = makePlatformAdminRealDataTestSnapshot();
    vi.spyOn(platformAdminApi, 'getSummary').mockResolvedValue({ summary: snapshot.summary });
    vi.spyOn(platformAdminApi, 'listAllReview').mockResolvedValue({ items: [], page: 1, pageSize: 100, total: 0 });
    vi.spyOn(platformAdminApi, 'readDirectory').mockImplementation(async resource => snapshot[resource as keyof typeof snapshot] as never);
  });

  it('renders filters, tabs, card toggle, and row action menu', async () => {
    const user = userEvent.setup();
    render(<PlatformAdminReadProvider enabled><PaymentsPage navigate={vi.fn()} showToast={vi.fn()} /></PlatformAdminReadProvider>);
    expect((await screen.findAllByText('Development Owner')).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: /payments & receipts/i })).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText(/transaction code, reference number/i), 'DEV');
    await user.click(screen.getByRole('button', { name: /^approved \(/i }));
    await user.click(screen.getByRole('button', { name: /card grid/i }));
    await user.click(screen.getByRole('button', { name: /table view/i }));
    await user.click(screen.getAllByRole('button', { name: /actions for payment/i })[0]);
    expect(screen.getByRole('menuitem', { name: /view payment/i })).toBeInTheDocument();
  });
});
