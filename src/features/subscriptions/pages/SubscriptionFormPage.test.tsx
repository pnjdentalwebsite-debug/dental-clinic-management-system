import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { mockPlanService } from '../../plans/services/mockPlanService';
import { mockPlatformManagementService } from '../../platformManagement/services/mockPlatformManagementService';
import { SubscriptionFormPage } from './SubscriptionFormPage';

describe('SubscriptionFormPage', () => {
  beforeEach(() => {
    localStorage.clear();
    mockPlatformManagementService.ensureSeedData();
    mockPlanService.initializePlans();
    localStorage.setItem('pnj_mock_subscriptions', JSON.stringify([]));
  });

  it('validates missing create form fields with a friendly toast', async () => {
    const user = userEvent.setup();
    const showToast = vi.fn();
    render(<SubscriptionFormPage mode="create" navigate={vi.fn()} showToast={showToast} />);

    await user.click(screen.getByRole('button', { name: /create subscription/i }));
    expect(showToast).toHaveBeenCalledWith(expect.stringMatching(/subscriber/i), 'error');
  });

  it('shows missing subscription state for bad deep links', () => {
    render(<SubscriptionFormPage mode="edit" subscriptionId="missing" navigate={vi.fn()} showToast={vi.fn()} />);
    expect(screen.getByRole('heading', { name: /subscription not found/i })).toBeInTheDocument();
  });
});
