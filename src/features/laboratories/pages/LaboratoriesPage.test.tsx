import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockClinicService } from '../../clinics/services/mockClinicService';
import { mockPlanService } from '../../plans/services/mockPlanService';
import { mockPlatformManagementService } from '../../platformManagement/services/mockPlatformManagementService';
import { mockSubscriptionService } from '../../subscriptions/services/mockSubscriptionService';
import { mockLaboratoryService } from '../services/mockLaboratoryService';
import { LaboratoriesPage } from './LaboratoriesPage';

const setup = () => {
  localStorage.clear();
  mockPlatformManagementService.ensureSeedData();
  mockPlanService.initializePlans();
  mockSubscriptionService.initializeSubscriptions();
  mockClinicService.initializeClinics();
  mockLaboratoryService.initializeLaboratories();
};

describe('LaboratoriesPage', () => {
  beforeEach(setup);

  it('renders summaries, filters, tabs, table/card view, and row action menu', async () => {
    const user = userEvent.setup();
    render(<LaboratoriesPage navigate={vi.fn()} showToast={vi.fn()} refreshShell={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Laboratories' })).toBeInTheDocument();
    expect(screen.getByText('Without Clinic Connections')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'active' }));
    await user.type(screen.getByPlaceholderText('Lab, subscriber, city'), 'BrightSmile');
    expect(screen.getAllByText(/BrightSmile/i).length).toBeGreaterThan(0);
    await user.click(screen.getByLabelText('Card view'));
    expect(document.querySelector('.record-card')).toBeTruthy();
    await user.click(screen.getAllByLabelText(/Actions for laboratory/i)[0]);
    expect(screen.getByRole('menuitem', { name: 'View Laboratory' })).toBeInTheDocument();
  });
});
