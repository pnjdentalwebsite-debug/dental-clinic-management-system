import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClinicOwnerReadProvider } from '../realData/ClinicOwnerReadProvider';
import { ClinicBranchCreatePage } from './ClinicBranchCreatePage';
import { ClinicOwnerApiError, type ClinicOwnerBootstrap } from '../../../infrastructure/supabase/clinicOwnerApi';

const branchApi = vi.hoisted(() => ({ getClinicBranchDetail: vi.fn(), createClinicBranch: vi.fn(), updateClinicBranch: vi.fn() }));

vi.mock('../../../infrastructure/supabase/clinicOwnerApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../infrastructure/supabase/clinicOwnerApi')>();
  return {
    ...actual,
    getClinicBranchDetail: branchApi.getClinicBranchDetail,
    createClinicBranch: branchApi.createClinicBranch,
    updateClinicBranch: branchApi.updateClinicBranch,
  };
});

const bootstrap: ClinicOwnerBootstrap = {
  auth: { userId: 'auth-owner' },
  owner: { membershipId: 'membership-owner', displayName: 'Angelo Mhyr Lagsac', email: 'owner@example.com', mobileNumber: null, accountStatus: 'active' },
  subscriber: { id: 'subscriber-real', subscriberNumber: 'SUB-REAL', businessName: 'Angelo Dental Clinic', accountStatus: 'active', createdAt: '2026-08-30T00:00:00Z', activatedAt: '2026-08-30T00:00:00Z' },
  subscription: { id: 'subscription-real', status: 'active', billingCycle: 'monthly', amountCentavos: 850000, startsAt: null, expiresAt: null },
  plan: { id: 'plan-plus', code: 'plus', name: 'Plus', monthlyAmountCentavos: 850000, annualAmountCentavos: 8670000, limits: [], features: [] },
  clinics: [], auditEvents: [],
  resourceCounts: { activeClinics: 1, quotaConsumingClinics: 1, activeLaboratories: 0, activeAssociates: 0, activeStaff: 0 },
  quotas: {
    clinics: { key: 'clinics', limit: { kind: 'number', value: 3 }, activeUsage: 1 },
    laboratories: { key: 'laboratories', limit: { kind: 'number', value: 0 }, activeUsage: 0 },
    associates: { key: 'associates', limit: { kind: 'number', value: 0 }, activeUsage: 0 },
    staff: { key: 'staff', limit: { kind: 'number', value: 0 }, activeUsage: 0 },
  },
};

const branch = {
  id: 'clinic-real-uuid', clinicNumber: 'CLN-REAL-002', branchType: 'satellite' as const, name: 'Real Branch', legalBusinessName: 'Real Branch Dental',
  email: 'branch@example.com', contactNumber: '09171234567', alternativeContactNumber: null, addressLine1: '1 Real Road', addressLine2: null,
  barangay: 'Real', city: 'Bacoor', province: 'Cavite', postalCode: '4102', country: 'Philippines', timezone: 'Asia/Manila', description: null,
  visibility: 'visible' as const, status: 'active', isPrimary: false, createdAt: '2026-08-31T00:00:00Z', updatedAt: '2026-08-31T00:00:00Z',
  businessHours: [], businessHoursConfigured: false,
};

const configuredBranch = {
  ...branch,
  businessHours: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
    dayOfWeek: dayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6,
    isOpen: dayOfWeek !== 0,
    openingTime: dayOfWeek !== 0 ? '09:00' : null,
    closingTime: dayOfWeek !== 0 ? '17:00' : null,
    breakStart: null,
    breakEnd: null,
  })),
  businessHoursConfigured: true,
};

function renderPage(mode: 'create' | 'view' | 'edit') {
  const loadBootstrap = vi.fn().mockResolvedValue(bootstrap);
  const view = render(
    <ClinicOwnerReadProvider enabled loadBootstrap={loadBootstrap}>
      <ClinicBranchCreatePage mode={mode} branchId={branch.id} onBack={vi.fn()} showToast={vi.fn()} />
    </ClinicOwnerReadProvider>,
  );
  return { ...view, loadBootstrap };
}

afterEach(() => vi.clearAllMocks());

describe('Clinic Owner branch detail routes', () => {
  it.each(['view', 'edit'] as const)('%s route reads the exact real branch detail without a directory cache', async (mode) => {
    const user = userEvent.setup();
    branchApi.getClinicBranchDetail.mockResolvedValue(configuredBranch);
    renderPage(mode);

    expect(await screen.findByDisplayValue('Real Branch')).toBeInTheDocument();
    expect(branchApi.getClinicBranchDetail).toHaveBeenCalledWith('clinic-real-uuid');
    if (mode === 'edit') expect(screen.queryByRole('button', { name: 'Save as Draft' })).not.toBeInTheDocument();
    const advance = mode === 'view' ? 'Next Section' : 'Continue';
    await user.click(screen.getByRole('button', { name: advance }));
    await user.click(screen.getByRole('button', { name: advance }));
    await user.click(screen.getByRole('button', { name: advance }));
    expect(screen.queryByText('Operating hours are not configured for this legacy branch. Select the hours to include when saving changes.')).not.toBeInTheDocument();
  });

  it('loads a legacy zero-hours branch with an explicit not-configured state', async () => {
    const user = userEvent.setup();
    branchApi.getClinicBranchDetail.mockResolvedValue(branch);
    renderPage('view');
    await screen.findByDisplayValue('Real Branch');
    await user.click(screen.getByRole('button', { name: 'Next Section' }));
    await user.click(screen.getByRole('button', { name: 'Next Section' }));
    await user.click(screen.getByRole('button', { name: 'Next Section' }));
    expect(screen.getByText('Operating hours are not configured for this legacy branch. Select the hours to include when saving changes.')).toBeInTheDocument();
  });

  it('shows controlled unavailable and not-found detail states without local substitution', async () => {
    branchApi.getClinicBranchDetail.mockRejectedValueOnce(new ClinicOwnerApiError('DATA_UNAVAILABLE'));
    const unavailable = renderPage('view');
    expect(await screen.findByRole('alert')).toHaveTextContent('Branch service unavailable');
    unavailable.unmount();

    branchApi.getClinicBranchDetail.mockRejectedValueOnce(new ClinicOwnerApiError('CLINIC_NOT_FOUND'));
    renderPage('edit');
    expect(await screen.findByRole('alert')).toHaveTextContent('Branch record not found');
  });

  it('uses only authenticated branch RPC adapters and refreshes the provider after a successful update', async () => {
    const user = userEvent.setup();
    branchApi.getClinicBranchDetail.mockResolvedValue(configuredBranch);
    branchApi.updateClinicBranch.mockResolvedValue(configuredBranch);
    const { loadBootstrap } = renderPage('edit');

    await screen.findByDisplayValue('Real Branch');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));

    expect(branchApi.updateClinicBranch).toHaveBeenCalledWith('clinic-real-uuid', expect.objectContaining({ businessHours: expect.any(Array) }));
    expect(branchApi.updateClinicBranch.mock.calls[0][1].businessHours).toHaveLength(7);
    expect(loadBootstrap).toHaveBeenCalledTimes(2);
  });

  it('uses the create RPC and refreshes the provider after a successful branch create', async () => {
    const user = userEvent.setup();
    branchApi.createClinicBranch.mockResolvedValue(configuredBranch);
    const { loadBootstrap } = renderPage('create');

    await screen.findByLabelText('Branch Name');
    await user.type(screen.getByLabelText('Branch Name'), 'New Real Branch');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.type(screen.getByLabelText('Complete Address'), '1 Real Road');
    await user.type(screen.getByLabelText('City / Municipality'), 'Bacoor');
    await user.type(screen.getByLabelText('Province'), 'Cavite');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.type(screen.getByLabelText('Branch Phone Number'), '09171234567');
    await user.type(screen.getByLabelText('Branch Email Address'), 'branch@example.com');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('button', { name: 'Create Branch' }));

    expect(branchApi.createClinicBranch).toHaveBeenCalledWith(expect.objectContaining({ saveMode: 'active', businessHours: expect.any(Array) }));
    expect(branchApi.createClinicBranch.mock.calls[0][0].businessHours).toHaveLength(7);
    expect(loadBootstrap).toHaveBeenCalledTimes(2);
  });
});
