import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { mockPlanService } from '../../plans/services/mockPlanService';
import { mockPlatformManagementService } from '../../platformManagement/services/mockPlatformManagementService';
import { mockSubscriptionService } from '../services/mockSubscriptionService';
import { SubscriptionsPage } from './SubscriptionsPage';

describe('SubscriptionsPage', () => {
  beforeEach(() => {
    localStorage.clear();
    mockPlatformManagementService.ensureSeedData();
    mockPlanService.initializePlans();
    mockSubscriptionService.initializeSubscriptions();
  });

  it('renders the list, filters, tabs, and row action menu', async () => {
    const user = userEvent.setup();
    render(<SubscriptionsPage navigate={vi.fn()} showToast={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Subscriptions' })).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText(/subscription, subscriber, plan/i), 'Basic');
    expect(screen.getByText(/showing/i)).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /active/i }));
    await user.click(screen.getAllByRole('button', { name: /actions for subscription/i })[0]);
    expect(screen.getByRole('menuitem', { name: /view subscription/i })).toBeInTheDocument();
  });
});
