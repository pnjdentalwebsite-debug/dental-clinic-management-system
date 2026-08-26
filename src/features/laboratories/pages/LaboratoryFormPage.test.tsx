import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockClinicService } from '../../clinics/services/mockClinicService';
import { mockPlanService } from '../../plans/services/mockPlanService';
import { mockPlatformManagementService } from '../../platformManagement/services/mockPlatformManagementService';
import { mockSubscriptionService } from '../../subscriptions/services/mockSubscriptionService';
import { mockLaboratoryService } from '../services/mockLaboratoryService';
import { LaboratoryFormPage } from './LaboratoryFormPage';

const setup = () => {
  localStorage.clear();
  mockPlatformManagementService.ensureSeedData();
  mockPlanService.initializePlans();
  mockSubscriptionService.initializeSubscriptions();
  mockClinicService.initializeClinics();
  mockLaboratoryService.initializeLaboratories();
};

describe('LaboratoryFormPage', () => {
  beforeEach(setup);

  it('shows validation when required create fields are missing', async () => {
    const showToast = vi.fn();
    const user = userEvent.setup();
    render(<LaboratoryFormPage mode="create" navigate={vi.fn()} showToast={showToast} />);
    await user.click(screen.getByRole('button', { name: 'Create Laboratory' }));
    expect(showToast).toHaveBeenCalledWith('Subscriber is required.', 'error');
  });

  it('renders edit form and saves editable laboratory fields', async () => {
    const laboratory = mockLaboratoryService.getLaboratoriesBySubscriberId('SUB-MOCK-MAX')[0];
    const navigate = vi.fn();
    const showToast = vi.fn();
    const user = userEvent.setup();
    render(<LaboratoryFormPage mode="edit" laboratoryId={laboratory.id} navigate={navigate} showToast={showToast} />);
    await user.clear(screen.getByLabelText('Description'));
    await user.type(screen.getByLabelText('Description'), 'Updated lab description');
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));
    expect(navigate).toHaveBeenCalledWith(`/platform/laboratories/${laboratory.id}`);
  });
});
