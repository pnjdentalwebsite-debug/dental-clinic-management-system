import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { mockPlanService } from '../../plans/services/mockPlanService';
import { mockPlatformManagementService } from '../../platformManagement/services/mockPlatformManagementService';
import { mockSubscriptionService } from '../../subscriptions/services/mockSubscriptionService';
import { PaymentFormPage } from './PaymentFormPage';

describe('PaymentFormPage', () => {
  beforeEach(() => {
    localStorage.clear();
    mockPlatformManagementService.ensureSeedData();
    mockPlanService.initializePlans();
    mockSubscriptionService.initializeSubscriptions();
  });

  it('validates missing record payment fields', async () => {
    const user = userEvent.setup();
    const showToast = vi.fn();
    render(<PaymentFormPage mode="create" navigate={vi.fn()} showToast={showToast} />);
    await user.click(screen.getByRole('button', { name: /submit for verification/i }));
    expect(showToast).toHaveBeenCalledWith(expect.stringMatching(/registration or subscriber/i), 'error');
  });

  it('shows missing payment state for bad deep links', () => {
    render(<PaymentFormPage mode="edit" paymentId="missing" navigate={vi.fn()} showToast={vi.fn()} />);
    expect(screen.getByRole('heading', { name: /payment not found/i })).toBeInTheDocument();
  });
});
