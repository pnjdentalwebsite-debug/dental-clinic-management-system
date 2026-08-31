import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import type { ClinicOwnerBootstrap } from '../../../infrastructure/supabase/clinicOwnerApi';
import { ClinicOwnerReadProvider } from '../realData/ClinicOwnerReadProvider';
import { ClinicOwnerDashboardPage } from './ClinicOwnerDashboardPage';
import { ClinicBranchesPage } from './ClinicBranchesPage';

const bootstrap: ClinicOwnerBootstrap = {
  auth: { userId: 'auth-owner' },
  owner: {
    membershipId: 'membership-owner',
    displayName: 'Angelo Mhyr Lagsac',
    email: 'real-owner@example.com',
    mobileNumber: '09170000000',
    accountStatus: 'active',
  },
  subscriber: {
    id: 'subscriber-real',
    subscriberNumber: 'SUB-REAL',
    businessName: 'Angelo Dental Clinic',
    accountStatus: 'active',
    createdAt: '2026-08-30T00:00:00Z',
    activatedAt: '2026-08-30T00:00:00Z',
  },
  subscription: {
    id: 'subscription-real',
    status: 'active',
    billingCycle: 'monthly',
    amountCentavos: 850000,
    startsAt: '2026-08-30T00:00:00Z',
    expiresAt: '2026-09-30T00:00:00Z',
  },
  plan: {
    id: 'plan-plus',
    code: 'plus',
    name: 'Plus',
    monthlyAmountCentavos: 850000,
    annualAmountCentavos: 8670000,
    limits: [],
    features: [],
  },
  clinics: [{
    id: 'clinic-real-uuid',
    clinicNumber: 'CLN-REAL-001',
    branchType: 'main',
    name: 'Angelo Dental Clinic',
    isPrimary: true,
    status: 'active',
    email: 'clinic@example.com',
    contactNumber: '09171234567',
    addressLine1: '123 Real Street',
    addressLine2: null,
    barangay: 'Barangay Real',
    city: 'Bacoor',
    province: 'Cavite',
    postalCode: '4102',
    createdAt: '2026-08-30T00:00:00Z',
  }],
  auditEvents: [{
    id: 'audit-real',
    clinicId: 'clinic-real-uuid',
    eventType: 'platform.registration.approved',
    entityType: 'registration',
    entityId: 'registration-real',
    createdAt: '2026-08-30T08:00:00Z',
  }],
  resourceCounts: {
    activeClinics: 1,
    quotaConsumingClinics: 1,
    activeLaboratories: 0,
    activeAssociates: 6,
    activeStaff: 12,
  },
  quotas: {
    clinics: { key: 'clinics', limit: { kind: 'number', value: 3 }, activeUsage: 1 },
    laboratories: { key: 'laboratories', limit: { kind: 'number', value: 2 }, activeUsage: 0 },
    associates: { key: 'associates', limit: { kind: 'number', value: 6 }, activeUsage: 6 },
    staff: { key: 'staff', limit: { kind: 'number', value: 20 }, activeUsage: 12 },
  },
};

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

function renderWithOwnerRead(element: ReactElement, value = bootstrap) {
  const loadBootstrap = vi.fn().mockResolvedValue(value);
  const view = render(
    <ClinicOwnerReadProvider enabled loadBootstrap={loadBootstrap}>
      {element}
    </ClinicOwnerReadProvider>,
  );
  return { ...view, loadBootstrap };
}

describe('Phase 2E.3B.1 Clinic Owner Dashboard real-data cutover', () => {
  it('renders authoritative identity, active KPIs, tenant clinic, and real audit activity', async () => {
    renderWithOwnerRead(<ClinicOwnerDashboardPage showToast={vi.fn()} />);

    expect(await screen.findByRole('heading', { name: 'Welcome, Angelo Mhyr Lagsac' })).toBeInTheDocument();
    expect(screen.getAllByText('Angelo Dental Clinic').length).toBeGreaterThan(0);
    expect(screen.getByText('Plus Subscription')).toBeInTheDocument();

    const clinicsCard = screen.getByText('Active Clinics').closest('.metric-card') as HTMLElement;
    const associatesCard = screen.getByText('Associate Dentists').closest('.metric-card') as HTMLElement;
    const staffCard = screen.getByText('Staff Members').closest('.metric-card') as HTMLElement;
    expect(within(clinicsCard).getByText('1')).toBeInTheDocument();
    expect(within(associatesCard).getByText('6')).toBeInTheDocument();
    expect(within(staffCard).getByText('12')).toBeInTheDocument();

    expect(screen.getByText('CLN-REAL-001')).toBeInTheDocument();
    expect(screen.getByText('Primary Clinic')).toBeInTheDocument();
    expect(screen.getByText('Platform Registration Approved')).toBeInTheDocument();
    expect(screen.queryByText('Clinic Branch Active')).not.toBeInTheDocument();
    expect(screen.queryByText('Clinical Master Files Synced')).not.toBeInTheDocument();
  });

  it('keeps patients and clinical financials controlled-unavailable without fabricated zeroes', async () => {
    renderWithOwnerRead(<ClinicOwnerDashboardPage showToast={vi.fn()} />);
    await screen.findByText('Pending patient real-data cutover');
    expect(screen.getByText('Financial totals unavailable')).toBeInTheDocument();
    expect(screen.getByText('Setup progress unavailable')).toBeInTheDocument();
    expect(screen.queryByText(/PHP\s*0\.00/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Welcome, real-owner@example\.com/i })).not.toBeInTheDocument();
  });

  it('renders provider failure as unavailable rather than a false empty branch dataset', async () => {
    const loadBootstrap = vi.fn().mockRejectedValue(new Error('network internals'));
    render(
      <ClinicOwnerReadProvider enabled loadBootstrap={loadBootstrap}>
        <ClinicOwnerDashboardPage showToast={vi.fn()} />
      </ClinicOwnerReadProvider>,
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('Clinic Owner dashboard unavailable');
    expect(screen.queryByText('No clinic branches yet')).not.toBeInTheDocument();
  });
});

describe('Phase 2E.3B.1 Clinic Branch Directory real-data cutover', () => {
  it('shows only provider clinics, the real primary identity, and the normalized clinic quota', async () => {
    localStorage.setItem('pnj_mock_clinics', JSON.stringify([{ id: 'fake', name: 'Foreign Mock Clinic' }]));
    renderWithOwnerRead(<ClinicBranchesPage showToast={vi.fn()} />);

    expect(await screen.findAllByText('Angelo Dental Clinic')).not.toHaveLength(0);
    expect(screen.queryByText('Foreign Mock Clinic')).not.toBeInTheDocument();
    expect(screen.getAllByText('Primary Clinic').length).toBeGreaterThan(0);
    expect(screen.getAllByText('CLN-REAL-001').length).toBeGreaterThan(0);
    expect(screen.getByTitle('clinic-real-uuid')).toBeInTheDocument();
    expect(screen.getByText('Clinic quota: 1 / 3')).toBeInTheDocument();
  });

  it('uses real-route navigation for branch add/edit while lifecycle actions remain unavailable', async () => {
    const user = userEvent.setup();
    const showToast = vi.fn();
    const onAddBranch = vi.fn();
    const onEditBranch = vi.fn();
    const stored = JSON.stringify([{ id: 'fake', name: 'Do Not Mutate' }]);
    localStorage.setItem('pnj_mock_clinics', stored);
    renderWithOwnerRead(<ClinicBranchesPage showToast={showToast} onAddBranch={onAddBranch} onEditBranch={onEditBranch} />);
    await screen.findAllByText('Angelo Dental Clinic');

    await user.click(screen.getByRole('button', { name: '+ Add Branch' }));
    expect(onAddBranch).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Branch actions' }));
    await user.click(screen.getByRole('button', { name: 'Edit Branch' }));
    expect(onEditBranch).toHaveBeenCalledWith('clinic-real-uuid');

    await user.click(screen.getByRole('button', { name: 'Branch actions' }));
    await user.click(screen.getByRole('button', { name: 'Deactivate Branch' }));
    expect(showToast).toHaveBeenCalledWith('Branch action "Deactivate" is read-only until the dedicated lifecycle phase.', 'info');
    expect(localStorage.getItem('pnj_mock_clinics')).toBe(stored);
  });

  it('shows quota-consuming usage at 3 / 3 while active branch count remains 2, and keeps Draft Activate non-mutating', async () => {
    const user = userEvent.setup();
    const showToast = vi.fn();
    const quotaBootstrap: ClinicOwnerBootstrap = {
      ...bootstrap,
      clinics: [
        bootstrap.clinics[0],
        { ...bootstrap.clinics[0], id: 'clinic-active-2', clinicNumber: 'CLN-REAL-002', name: 'Testing Clinic', isPrimary: false },
        { ...bootstrap.clinics[0], id: 'clinic-draft', clinicNumber: 'CLN-REAL-003', name: 'testdraft', isPrimary: false, status: 'draft' },
      ],
      resourceCounts: { ...bootstrap.resourceCounts, activeClinics: 2, quotaConsumingClinics: 3 },
      quotas: { ...bootstrap.quotas, clinics: { key: 'clinics', limit: { kind: 'number', value: 3 }, activeUsage: 3 } },
    };
    const { loadBootstrap } = renderWithOwnerRead(<ClinicBranchesPage showToast={showToast} onAddBranch={vi.fn()} />, quotaBootstrap);
    await screen.findByText('Clinic quota: 3 / 3');
    expect(screen.getByText('Active Branches').closest('.metric-card')).toHaveTextContent('2');

    await user.click(screen.getByRole('button', { name: '+ Add Branch' }));
    expect(showToast).toHaveBeenCalledWith('The current plan clinic limit has been reached. The server remains authoritative for branch eligibility.', 'warning');

    const actionButtons = screen.getAllByRole('button', { name: 'Branch actions' });
    await user.click(actionButtons[2]);
    await user.click(screen.getByRole('button', { name: 'Activate Branch' }));
    expect(showToast).toHaveBeenCalledWith('Branch action "Activate" is read-only until the dedicated lifecycle phase.', 'info');
    expect(loadBootstrap).toHaveBeenCalledTimes(1);
    expect(screen.getByText('testdraft')).toBeInTheDocument();
  });

  it('restores the same provider directory after a page remount/direct-refresh equivalent', async () => {
    const first = renderWithOwnerRead(<ClinicBranchesPage showToast={vi.fn()} />);
    await screen.findAllByText('CLN-REAL-001');
    first.unmount();

    const second = renderWithOwnerRead(<ClinicBranchesPage showToast={vi.fn()} />);
    expect(await screen.findAllByText('CLN-REAL-001')).not.toHaveLength(0);
    expect(second.loadBootstrap).toHaveBeenCalledTimes(1);
  });

  it('contains no legacy tenant or mock-storage authority in the branch runtime path', () => {
    const dashboardSource = readFileSync(resolve(process.cwd(), 'src/features/clinic-owner/pages/ClinicOwnerDashboardPage.tsx'), 'utf8');
    const branchesSource = readFileSync(resolve(process.cwd(), 'src/features/clinic-owner/pages/ClinicBranchesPage.tsx'), 'utf8');
    const branchFormSource = readFileSync(resolve(process.cwd(), 'src/features/clinic-owner/pages/ClinicBranchCreatePage.tsx'), 'utf8');
    const stepperSource = readFileSync(resolve(process.cwd(), 'src/features/clinic-owner/components/AddBranchStepper.tsx'), 'utf8');
    const activitySource = readFileSync(resolve(process.cwd(), 'src/features/clinic-owner/components/ActivityFeed.tsx'), 'utf8');
    const headerSource = readFileSync(resolve(process.cwd(), 'src/features/clinic-owner/components/ClinicOwnerHeader.tsx'), 'utf8');

    for (const source of [dashboardSource, branchesSource, branchFormSource, stepperSource]) {
      expect(source).not.toMatch(/tenantScope|mockClinicService|mockPlatformManagementService|branchSettingsStore|mockAuditService|localStorage|sessionStorage/);
    }
    for (const source of [dashboardSource, branchesSource, branchFormSource]) {
      expect(source).toContain('useClinicOwnerRead');
    }
    expect(activitySource).not.toMatch(/mockClinicService|loadPatientDirectoryRecords|aggregateClinicFinancials|Clinic Branch Active|Clinical Master Files Synced/);
    expect(headerSource).not.toContain('Prototype Mode');
  });
});
