import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { mockPlanService } from '../../plans/services/mockPlanService';
import { mockPlatformManagementService } from '../../platformManagement/services/mockPlatformManagementService';
import { mockSubscriptionService } from '../../subscriptions/services/mockSubscriptionService';
import { mockPaymentService } from '../services/mockPaymentService';
import { PaymentsPage } from './PaymentsPage';

describe('PaymentsPage', () => {
  beforeEach(() => {
    localStorage.clear();
    mockPlatformManagementService.ensureSeedData();
    mockPlanService.initializePlans();
    mockSubscriptionService.initializeSubscriptions();
    mockPaymentService.initializePayments();
  });

  it('renders filters, tabs, card toggle, and row action menu', async () => {
    const user = userEvent.setup();
    render(<PaymentsPage navigate={vi.fn()} showToast={vi.fn()} />);
    expect(screen.getByRole('heading', { name: /subscriber payments/i })).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText(/payment, payer, reference/i), 'MOCK');
    await user.click(screen.getByRole('tab', { name: /approved/i }));
    await user.click(screen.getByRole('button', { name: /card view/i }));
    await user.click(screen.getByRole('button', { name: /table view/i }));
    await user.click(screen.getByRole('button', { name: /clear filters/i }));
    await user.click(screen.getAllByRole('button', { name: /actions for payment/i })[0]);
    expect(screen.getByRole('menuitem', { name: /view payment/i })).toBeInTheDocument();
  });
});
