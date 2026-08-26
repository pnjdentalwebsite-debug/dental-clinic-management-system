import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockClinicService } from '../../clinics/services/mockClinicService';
import { mockPlanService } from '../../plans/services/mockPlanService';
import { mockPlatformManagementService } from '../../platformManagement/services/mockPlatformManagementService';
import { mockSubscriptionService } from '../../subscriptions/services/mockSubscriptionService';
import { SubscriberDetailsPage } from '../../platformManagement/pages/SubscriberDetailsPage';
import { ClinicDetailsPage } from '../../clinics/pages/ClinicDetailsPage';
import { mockLaboratoryService } from '../services/mockLaboratoryService';
import { LaboratoryDetailsPage } from './LaboratoryDetailsPage';

const setup = () => {
  localStorage.clear();
  mockPlatformManagementService.ensureSeedData();
  mockPlanService.initializePlans();
  mockSubscriptionService.initializeSubscriptions();
  mockClinicService.initializeClinics();
  mockLaboratoryService.initializeLaboratories();
};

describe('LaboratoryDetailsPage', () => {
  beforeEach(setup);

  it('renders details, service form, and missing laboratory state', async () => {
    const laboratory = mockLaboratoryService.getLaboratoriesBySubscriberId('SUB-MOCK-PLUS').find(item => item.status === 'active')!;
    const user = userEvent.setup();
    render(<LaboratoryDetailsPage laboratoryId={laboratory.id} navigate={vi.fn()} showToast={vi.fn()} refreshShell={vi.fn()} />);
    expect(screen.getByText(laboratory.laboratoryNumber)).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Services' }));
    await user.click(screen.getByRole('button', { name: 'Add Service' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Service Code')).toBeInTheDocument();
  });

  it('renders subscriber and clinic laboratory integrations', async () => {
    const user = userEvent.setup();
    render(<SubscriberDetailsPage subscriberId="SUB-MOCK-PLUS" navigate={vi.fn()} showToast={vi.fn()} />);
    await user.click(screen.getByRole('tab', { name: 'Laboratories' }));
    expect(screen.getByText('Linked Mock Laboratories')).toBeInTheDocument();

    const clinic = mockClinicService.getClinicsBySubscriberId('SUB-MOCK-PLUS')[0];
    render(<ClinicDetailsPage clinicId={clinic.id} navigate={vi.fn()} showToast={vi.fn()} refreshShell={vi.fn()} />);
    await user.click(screen.getAllByRole('tab', { name: 'Laboratories' }).at(-1)!);
    expect(screen.getByText('Laboratory Connections')).toBeInTheDocument();
  });

  it('renders missing laboratory state', () => {
    render(<LaboratoryDetailsPage laboratoryId="missing" navigate={vi.fn()} showToast={vi.fn()} refreshShell={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Laboratory not found' })).toBeInTheDocument();
  });
});
