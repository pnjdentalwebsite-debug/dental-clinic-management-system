import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockPlanService } from '../../plans/services/mockPlanService';
import { mockPlatformManagementService } from '../../platformManagement/services/mockPlatformManagementService';
import { mockSubscriptionService } from '../../subscriptions/services/mockSubscriptionService';
import { mockClinicService } from '../services/mockClinicService';
import { ClinicsPage } from './ClinicsPage';

const setup = () => {
  localStorage.clear();
  mockPlatformManagementService.ensureSeedData();
  mockPlanService.initializePlans();
  mockSubscriptionService.initializeSubscriptions();
  mockClinicService.initializeClinics();
};

describe('ClinicsPage', () => {
  beforeEach(setup);

  it('renders summaries, filters, tabs, table/card view, and row action menu', async () => {
    const user = userEvent.setup();
    render(<ClinicsPage navigate={vi.fn()} showToast={vi.fn()} refreshShell={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Clinics' })).toBeInTheDocument();
    expect(screen.getByText('Clinics Without Dentists')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'active' }));
    await user.type(screen.getByPlaceholderText('Clinic, subscriber, city'), 'Harbor');
    expect(screen.getAllByText(/Harbor/i).length).toBeGreaterThan(0);
    await user.click(screen.getByLabelText('Card view'));
    expect(document.querySelector('.record-card')).toBeTruthy();
    await user.click(screen.getAllByLabelText(/Actions for clinic/i)[0]);
    expect(screen.getByRole('menuitem', { name: 'View Clinic' })).toBeInTheDocument();
  });
});
