import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PaymentDetailsPage } from '../../payments/pages/PaymentDetailsPage';
import { PlanDetailsPage } from '../../plans/pages/PlanDetailsPage';
import { installPlatformAdminSnapshot } from './platformAdminRealDataService';
import { makePlatformAdminRealDataTestSnapshot, platformAdminRealDataTestIds } from './platformAdminRealDataTestFixture';

describe('Phase 2E.2 final exact-detail consistency', () => {
  beforeEach(() => installPlatformAdminSnapshot(makePlatformAdminRealDataTestSnapshot()));

  it('renders the approved payment against its one real Plus subscription association after direct load', async () => {
    const user = userEvent.setup();
    render(<PaymentDetailsPage paymentId={platformAdminRealDataTestIds.paymentId} navigate={vi.fn()} showToast={vi.fn()} />);

    expect(screen.getAllByText('₱8,500').length).toBeGreaterThan(0);
    expect(screen.getByText('Applied to Plus Plan')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Subscription Allocation (1)' })).toBeInTheDocument();
    expect(screen.queryByText(/Max Plan/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Subscription Allocation (1)' }));
    expect(screen.getByText('Source Payment Association — Plus Plan')).toBeInTheDocument();
    expect(screen.getByText(platformAdminRealDataTestIds.subscriptionId)).toBeInTheDocument();
  });

  it('renders exact real Plus plan values and aggregate enrollment after direct load', () => {
    render(<PlanDetailsPage planId={platformAdminRealDataTestIds.planId} navigate={vi.fn()} showToast={vi.fn()} />);

    expect(screen.getAllByText('Plus').length).toBeGreaterThan(0);
    expect(screen.getByText('₱8,500')).toBeInTheDocument();
    expect(screen.getByText('Enrolled Subscribers').parentElement?.parentElement).toHaveTextContent('1');
    expect(screen.queryByText(/Max Plan/i)).not.toBeInTheDocument();
  });
});
