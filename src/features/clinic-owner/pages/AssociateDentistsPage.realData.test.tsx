import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { ClinicOwnerReadProvider } from '../realData/ClinicOwnerReadProvider';
import { AssociateDentistsPage } from './AssociateDentistsPage';
import { AssociateDentistFormPage } from './AssociateDentistFormPage';
import { ClinicOwnerAssociateApiError } from '../../../infrastructure/supabase/clinicOwnerAssociateApi';

const api = vi.hoisted(() => ({
  getClinicOwnerAssociateDirectory: vi.fn(),
  getClinicOwnerAssociateDetail: vi.fn(),
  provisionClinicOwnerAssociate: vi.fn(),
  updateClinicOwnerAssociate: vi.fn(),
}));

vi.mock('../../../infrastructure/supabase/clinicOwnerAssociateApi', async () => {
  const actual = await vi.importActual<typeof import('../../../infrastructure/supabase/clinicOwnerAssociateApi')>('../../../infrastructure/supabase/clinicOwnerAssociateApi');
  return { ...actual, ...api };
});

const bootstrap = {
  auth: { userId: 'owner-auth-user' },
  owner: { membershipId: 'owner-membership', displayName: 'Real Owner', email: 'owner@example.com', mobileNumber: null, accountStatus: 'active' },
  subscriber: { id: 'subscriber-authoritative', subscriberNumber: 'SUB-REAL', businessName: 'Real Dental', accountStatus: 'active', createdAt: '2026-08-01T00:00:00Z', activatedAt: '2026-08-01T00:00:00Z' },
  subscription: { id: 'subscription-real', status: 'active', billingCycle: 'monthly', amountCentavos: 850000, startsAt: null, expiresAt: null },
  plan: { id: 'plan-plus', code: 'plus', name: 'Plus', monthlyAmountCentavos: 850000, annualAmountCentavos: 8670000, limits: [], features: [] },
  clinics: [{ id: '11111111-1111-4111-8111-111111111111', name: 'Real Clinic', status: 'active', addressLine1: 'Real Street', city: 'Manila', province: 'Metro Manila' }], auditEvents: [], resourceCounts: { activeClinics: 1, quotaConsumingClinics: 1, activeLaboratories: 0, activeAssociates: 2, activeStaff: 0 },
  quotas: {
    clinics: { key: 'clinics', limit: { kind: 'number', value: 3 }, activeUsage: 1 },
    laboratories: { key: 'laboratories', limit: { kind: 'number', value: 2 }, activeUsage: 0 },
    associates: { key: 'associates', limit: { kind: 'number', value: 6 }, activeUsage: 2 },
    staff: { key: 'staff', limit: { kind: 'number', value: 20 }, activeUsage: 0 },
  },
} as any;

const associateA = { membershipId: 'membership-associate-a', associateNumber: 'DEN-A', displayName: 'Associate A', email: 'a@example.com', mobile: '09170000001', designation: 'Associate Dentist', specialization: 'Orthodontics', accountStatus: 'active', calendarColor: '#2563eb', workSchedule: { Monday: { enabled: true } }, clinics: [{ clinicId: 'clinic-a', clinicName: 'Clinic A', assignmentStatus: 'active' }], createdAt: '2026-08-01T00:00:00Z', updatedAt: '2026-08-01T00:00:00Z' };
const associateB = { ...associateA, membershipId: 'membership-associate-b', associateNumber: 'DEN-B', displayName: 'Associate B', accountStatus: 'suspended', clinics: [] };

function renderWithOwnerRead(element: ReactElement) {
  return render(<ClinicOwnerReadProvider enabled loadBootstrap={vi.fn().mockResolvedValue(bootstrap)}>{element}</ClinicOwnerReadProvider>);
}

afterEach(() => {
  api.getClinicOwnerAssociateDirectory.mockReset();
  api.getClinicOwnerAssociateDetail.mockReset();
  api.provisionClinicOwnerAssociate.mockReset();
  api.updateClinicOwnerAssociate.mockReset();
  localStorage.clear();
});

describe('Phase 2E.3C.1 Associate Dentist directory real-data cutover', () => {
  it('uses each real membership ID for row and side-preview view routing', async () => {
    const user = userEvent.setup();
    const onViewDentist = vi.fn();
    api.getClinicOwnerAssociateDirectory.mockResolvedValue([associateA, associateB]);
    renderWithOwnerRead(<AssociateDentistsPage showToast={vi.fn()} onViewDentist={onViewDentist} />);

    expect(await screen.findByText('Associate B')).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: 'Associate dentist actions' })[1]);
    await user.click(screen.getByRole('button', { name: 'View Associate Dentist' }));
    expect(onViewDentist).toHaveBeenLastCalledWith('membership-associate-b');

    await user.click(screen.getByText('Associate B'));
    await user.click(screen.getByRole('button', { name: 'View Profile' }));
    expect(onViewDentist).toHaveBeenLastCalledWith('membership-associate-b');
  });

  it('shows truthful empty and unavailable states without mock fallback', async () => {
    api.getClinicOwnerAssociateDirectory.mockResolvedValue([]);
    renderWithOwnerRead(<AssociateDentistsPage showToast={vi.fn()} />);
    expect(await screen.findByText('No Associate Dentists yet')).toBeInTheDocument();
    expect(screen.getByText('0 associates')).toBeInTheDocument();

    api.getClinicOwnerAssociateDirectory.mockRejectedValue(new Error('raw backend details'));
    renderWithOwnerRead(<AssociateDentistsPage showToast={vi.fn()} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Associate Dentist service unavailable');
    expect(screen.queryByText('raw backend details')).not.toBeInTheDocument();
  });

  it('routes Add and Edit by real membership while lifecycle controls remain disabled', async () => {
    const user = userEvent.setup();
    const onAddDentist = vi.fn();
    const onEditDentist = vi.fn();
    const stored = JSON.stringify([{ id: 'mock-associate', password: 'never-use' }]);
    localStorage.setItem('clinic_owner_associate_dentists_v1', stored);
    api.getClinicOwnerAssociateDirectory.mockResolvedValue([associateA]);
    renderWithOwnerRead(<AssociateDentistsPage showToast={vi.fn()} onAddDentist={onAddDentist} onEditDentist={onEditDentist} />);
    expect((await screen.findAllByText('Associate A')).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: /Add Dentist/ }));
    expect(onAddDentist).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'Associate dentist actions' }));
    await user.click(screen.getByRole('button', { name: 'Edit Information' }));
    expect(onEditDentist).toHaveBeenCalledWith('membership-associate-a');
    expect(screen.queryByRole('button', { name: 'Save As Draft' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Associate dentist actions' }));
    expect(screen.getByRole('button', { name: 'Deactivate Associate' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Activate Selected' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Deactivate Selected' })).not.toBeInTheDocument();
    expect(localStorage.getItem('clinic_owner_associate_dentists_v1')).toBe(stored);
  });

  it('uses exact real detail data and renders RLS-hidden memberships as not found', async () => {
    api.getClinicOwnerAssociateDetail.mockResolvedValue({ ...associateB, licenseNumber: 'PRC-B', ptrNumber: 'PTR-B', s2LicenseNumber: 'S2-B', certificatesAndQualifications: null, alternateAssociateIds: [], deviceRestrictionEnabled: false });
    renderWithOwnerRead(<AssociateDentistFormPage mode="view" dentistId="membership-associate-b" onBack={vi.fn()} />);
    expect(await screen.findByText('PRC-B')).toBeInTheDocument();
    expect(api.getClinicOwnerAssociateDetail).toHaveBeenCalledWith(bootstrap, 'membership-associate-b');

    api.getClinicOwnerAssociateDetail.mockRejectedValue(new ClinicOwnerAssociateApiError('ASSOCIATE_NOT_FOUND'));
    renderWithOwnerRead(<AssociateDentistFormPage mode="view" dentistId="membership-hidden" onBack={vi.fn()} />);
    expect(await screen.findByText('Associate Dentist not found')).toBeInTheDocument();
  });

  it('creates using only real clinic UUIDs, refreshes authority, and never writes a mock row', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const showToast = vi.fn();
    const stored = JSON.stringify([{ id: 'mock-associate', password: 'never-use' }]);
    localStorage.setItem('clinic_owner_associate_dentists_v1', stored);
    api.provisionClinicOwnerAssociate.mockResolvedValue({ provisioningStatus: 'completed', membershipId: 'membership-created', associateNumber: 'DEN-SERVER', credentialDelivery: { status: 'sent' } });
    renderWithOwnerRead(<AssociateDentistFormPage onBack={vi.fn()} onEdit={onEdit} showToast={showToast} />);

    await user.type(await screen.findByLabelText('Last Name'), 'Dentist');
    await user.type(screen.getByLabelText('First Name'), 'Ava');
    await user.type(screen.getByLabelText('Email Address'), 'ava@example.com');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.type(screen.getByLabelText('PRC License Number'), 'LIC-1');
    await user.type(screen.getByLabelText('PTR Number'), 'PTR-1');
    await user.type(screen.getByLabelText('S2 License Number'), 'S2-1');
    await user.type(screen.getByLabelText('Designation'), 'Associate Dentist');
    await user.type(screen.getByLabelText('Specialization'), 'General Dentistry');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByLabelText('Assign Real Clinic'));
    await user.click(screen.getByRole('button', { name: 'Create Associate Dentist' }));

    await waitFor(() => expect(api.provisionClinicOwnerAssociate).toHaveBeenCalledWith(expect.objectContaining({
      email: 'ava@example.com', clinicIds: ['11111111-1111-4111-8111-111111111111'],
    })));
    const outgoing = api.provisionClinicOwnerAssociate.mock.calls[0][0];
    expect(outgoing).not.toHaveProperty('subscriberId');
    expect(outgoing).not.toHaveProperty('role');
    expect(outgoing).not.toHaveProperty('temporaryPassword');
    expect(outgoing).not.toHaveProperty('associateNumber');
    expect(onEdit).toHaveBeenCalledWith('membership-created');
    expect(showToast).toHaveBeenCalledWith(expect.stringContaining('Initial sign-in instructions were sent'), 'success');
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
    expect(localStorage.getItem('clinic_owner_associate_dentists_v1')).toBe(stored);
  });

  it('loads and updates the exact Associate membership while keeping email read-only', async () => {
    const user = userEvent.setup();
    const exactDetail = { ...associateB, firstName: 'Associate', middleName: null, lastName: 'B', address: 'Real Address', licenseNumber: 'PRC-B', ptrNumber: 'PTR-B', s2LicenseNumber: 'S2-B', certificatesAndQualifications: null, alternateAssociateIds: [], deviceRestrictionEnabled: false };
    api.getClinicOwnerAssociateDetail.mockResolvedValue(exactDetail);
    api.updateClinicOwnerAssociate.mockResolvedValue({ updated: true, membershipId: 'membership-associate-b' });
    const onEdit = vi.fn();
    renderWithOwnerRead(<AssociateDentistFormPage mode="edit" dentistId="membership-associate-b" onBack={vi.fn()} onEdit={onEdit} />);
    const email = await screen.findByLabelText('Email Address');
    expect(email).toHaveAttribute('readonly');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByLabelText('Assign Real Clinic'));
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));
    await waitFor(() => expect(api.updateClinicOwnerAssociate).toHaveBeenCalledWith('membership-associate-b', expect.objectContaining({ clinicIds: ['11111111-1111-4111-8111-111111111111'] })));
    expect(api.updateClinicOwnerAssociate.mock.calls[0][1]).not.toHaveProperty('email');
    expect(onEdit).toHaveBeenCalledWith('membership-associate-b');
  });
});
