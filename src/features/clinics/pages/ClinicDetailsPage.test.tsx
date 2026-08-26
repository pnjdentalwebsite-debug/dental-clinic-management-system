import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockPlanService } from '../../plans/services/mockPlanService';
import { mockPlatformManagementService } from '../../platformManagement/services/mockPlatformManagementService';
import { mockSubscriptionService } from '../../subscriptions/services/mockSubscriptionService';
import { mockClinicService } from '../services/mockClinicService';
import { ClinicDetailsPage } from './ClinicDetailsPage';

const setup = () => {
  localStorage.clear();
  mockPlatformManagementService.ensureSeedData();
  mockPlanService.initializePlans();
  mockSubscriptionService.initializeSubscriptions();
  mockClinicService.initializeClinics();
};

describe('ClinicDetailsPage', () => {
  beforeEach(setup);

  it('renders detail tabs and assignment workflow entry points', async () => {
    const clinic = mockClinicService.getClinicsBySubscriberId('SUB-MOCK-MAX')[0];
    const user = userEvent.setup();
    render(<ClinicDetailsPage clinicId={clinic.id} navigate={vi.fn()} showToast={vi.fn()} refreshShell={vi.fn()} />);
    expect(screen.getByText(clinic.clinicNumber)).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Business Hours' }));
    expect(screen.getByText('Monday')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Dentists' }));
    await user.click(screen.getByRole('button', { name: 'Assign Dentist' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('renders missing clinic state', () => {
    render(<ClinicDetailsPage clinicId="missing" navigate={vi.fn()} showToast={vi.fn()} refreshShell={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Clinic not found' })).toBeInTheDocument();
  });
});
