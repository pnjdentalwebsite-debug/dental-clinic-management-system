import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockPlanService } from '../../plans/services/mockPlanService';
import { mockPlatformManagementService } from '../../platformManagement/services/mockPlatformManagementService';
import { mockSubscriptionService } from '../../subscriptions/services/mockSubscriptionService';
import { mockClinicService } from '../services/mockClinicService';
import { ClinicFormPage } from './ClinicFormPage';

const setup = () => {
  localStorage.clear();
  mockPlatformManagementService.ensureSeedData();
  mockPlanService.initializePlans();
  mockSubscriptionService.initializeSubscriptions();
  mockClinicService.initializeClinics();
};

describe('ClinicFormPage', () => {
  beforeEach(setup);

  it('shows validation when required create fields are missing', async () => {
    const showToast = vi.fn();
    const user = userEvent.setup();
    render(<ClinicFormPage mode="create" navigate={vi.fn()} showToast={showToast} />);
    await user.click(screen.getByRole('button', { name: 'Create Clinic' }));
    expect(showToast).toHaveBeenCalledWith('Subscriber is required.', 'error');
  });

  it('renders edit form and saves editable clinic fields', async () => {
    const clinic = mockClinicService.getClinicsBySubscriberId('SUB-MOCK-MAX')[0];
    const navigate = vi.fn();
    const showToast = vi.fn();
    const user = userEvent.setup();
    render(<ClinicFormPage mode="edit" clinicId={clinic.id} navigate={navigate} showToast={showToast} />);
    await user.clear(screen.getByLabelText('Description'));
    await user.type(screen.getByLabelText('Description'), 'Updated description');
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));
    expect(navigate).toHaveBeenCalledWith(`/platform/clinics/${clinic.id}`);
  });
});
