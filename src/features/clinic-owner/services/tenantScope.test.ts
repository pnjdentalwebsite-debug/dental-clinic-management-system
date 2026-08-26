import { beforeEach, describe, expect, it } from 'vitest';
import { resolveClinicOwnerContext } from './tenantScope';

const writeStorage = (key: string, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value));
};

describe('resolveClinicOwnerContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('keeps an approved registration pending when subscriber provisioning is missing', () => {
    // Tenant resolution is read-only; platform payment approval must provision the account.
    writeStorage('pnj_mock_registrations', [
      {
        id: 'REG-2026-000999',
        plan: 'Plus',
        ownerName: 'Sef Owner',
        ownerEmail: 'sef@gmail.com',
        ownerMobile: '09171234567',
        ownerAddress: '123 Test St, Cavite',
        clinicName: 'Sef Dental Clinic',
        clinicEmail: 'clinic@sef.com',
        clinicMobile: '09171111111',
        clinicAddress: '456 Clinic Ave, Cavite',
        dentistsCount: 1,
        staffCount: 1,
        locationsCount: 1,
        worksWithLab: false,
        emailVerified: true,
        paymentStatus: 'approved',
        registrationStatus: 'account_ready',
        submittedDate: '2026-08-25',
        updatedDate: '2026-08-25',
        tempPassword: 'Temp-Ab12345!',
        subscriberId: 'SUB-999999',
        userId: 'USR-999999'
      }
    ]);

    const context = resolveClinicOwnerContext('sef@gmail.com', 'Sef Dental Clinic');

    expect(context.status).toBe('pending_approval');
    expect(context.subscriberId).toBe('');
    expect(context.subscriber).toBeNull();
    expect(context.message).toMatch(/re-run payment approval/i);
  });

  it('returns pending_approval for a registration still awaiting approval', () => {
    writeStorage('pnj_mock_registrations', [
      {
        id: 'REG-2026-000888',
        plan: 'Plus',
        ownerName: 'Pending Owner',
        ownerEmail: 'pending@gmail.com',
        ownerMobile: '09170000000',
        ownerAddress: 'Address',
        clinicName: 'Pending Clinic',
        clinicEmail: 'clinic@pending.com',
        clinicMobile: '09170000001',
        clinicAddress: 'Address',
        dentistsCount: 1,
        staffCount: 1,
        locationsCount: 1,
        worksWithLab: false,
        emailVerified: true,
        paymentStatus: 'pending_verification',
        registrationStatus: 'payment_under_review',
        submittedDate: '2026-08-25',
        updatedDate: '2026-08-25'
      }
    ]);

    const context = resolveClinicOwnerContext('pending@gmail.com', 'Pending Clinic');

    expect(context.status).toBe('pending_approval');
    expect(context.subscriberId).toBe('');
    expect(context.subscriber).toBeNull();
    expect(context.message).toMatch(/awaiting platform approval/i);
  });

  it('returns not_found when nothing can be linked', () => {
    const context = resolveClinicOwnerContext('unknown@gmail.com', 'Unknown Clinic');

    expect(context.status).toBe('not_found');
    expect(context.subscriberId).toBe('');
    expect(context.subscriber).toBeNull();
  });
});
