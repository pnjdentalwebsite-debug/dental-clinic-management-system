import { describe, expect, it, vi } from 'vitest';
import {
  ClinicOwnerAssociateApiError,
  getClinicOwnerAssociateDetail,
  getClinicOwnerAssociateDirectory,
} from './clinicOwnerAssociateApi';

const scope = { subscriber: { id: 'subscriber-authoritative' } } as any;

const associateA = {
  id: 'membership-associate-a', subscriber_id: 'subscriber-authoritative', role: 'associate', account_status: 'active', created_at: '2026-08-01T00:00:00Z', updated_at: '2026-08-02T00:00:00Z',
  profiles: { email: 'a@example.com', display_name: 'Associate A', first_name: 'Associate', last_name: 'A', mobile_number: '09170000001' },
  associate_dentist_profiles: { associate_number: 'DEN-A', license_number: 'PRC-A', ptr_number: 'PTR-A', s2_license_number: 'S2-A', designation: 'Associate Dentist', specialization: 'Orthodontics', calendar_color: '#2563eb', certificates_and_qualifications: 'DDS', alternate_associate_ids: [], device_restriction_enabled: false, work_schedule: { Monday: { enabled: true } } },
};
const associateB = {
  ...associateA,
  id: 'membership-associate-b', account_status: 'suspended',
  profiles: { ...associateA.profiles, email: 'b@example.com', display_name: 'Associate B' },
  associate_dentist_profiles: { ...associateA.associate_dentist_profiles, associate_number: 'DEN-B', specialization: 'Endodontics' },
};

function clientFixture(options: { members?: unknown[]; detail?: unknown | null; assignments?: unknown[]; failTable?: string } = {}) {
  const logs: Array<{ table: string; filters: Array<[string, unknown]> }> = [];
  const members = options.members ?? [associateA, associateB];
  const from = vi.fn((table: string) => {
    const log = { table, filters: [] as Array<[string, unknown]> };
    logs.push(log);
    const builder: any = {
      select: vi.fn(() => builder),
      eq: vi.fn((column: string, value: unknown) => { log.filters.push([column, value]); return builder; }),
      in: vi.fn((column: string, value: unknown) => { log.filters.push([column, value]); return builder; }),
      order: vi.fn(() => builder),
      maybeSingle: vi.fn(async () => ({ data: options.detail === undefined ? associateB : options.detail, error: options.failTable === table ? { message: 'failed' } : null })),
      then: (resolve: (value: unknown) => unknown) => Promise.resolve(resolve({
        data: table === 'subscriber_memberships' ? members : options.assignments ?? [
          { membership_id: 'membership-associate-a', subscriber_id: 'subscriber-authoritative', assignment_role: 'associate', status: 'active', clinics: { id: 'clinic-a', subscriber_id: 'subscriber-authoritative', name: 'Clinic A' } },
          { membership_id: 'membership-associate-a', subscriber_id: 'another-subscriber', assignment_role: 'associate', status: 'active', clinics: { id: 'clinic-foreign', subscriber_id: 'another-subscriber', name: 'Foreign Clinic' } },
          { membership_id: 'membership-associate-b', subscriber_id: 'subscriber-authoritative', assignment_role: 'associate', status: 'inactive', clinics: { id: 'clinic-b', subscriber_id: 'subscriber-authoritative', name: 'Clinic B' } },
        ],
        error: options.failTable === table ? { message: 'failed' } : null,
      })),
    };
    return builder;
  });
  return { client: { from } as any, logs };
}

describe('Clinic Owner Associate real-data read adapter', () => {
  it('uses only the authoritative subscriber scope and makes two bounded directory queries', async () => {
    localStorage.setItem('clinic_owner_associate_dentists_v1', JSON.stringify([{ id: 'mock-associate' }]));
    const { client, logs } = clientFixture();
    const result = await getClinicOwnerAssociateDirectory(scope, client);

    expect(result).toEqual([
      expect.objectContaining({ membershipId: 'membership-associate-a', displayName: 'Associate A', clinics: [{ clinicId: 'clinic-a', clinicName: 'Clinic A', assignmentStatus: 'active' }] }),
      expect.objectContaining({ membershipId: 'membership-associate-b', displayName: 'Associate B', accountStatus: 'suspended', clinics: [{ clinicId: 'clinic-b', clinicName: 'Clinic B', assignmentStatus: 'inactive' }] }),
    ]);
    expect(logs).toHaveLength(2);
    expect(logs[0]).toMatchObject({ table: 'subscriber_memberships', filters: expect.arrayContaining([['subscriber_id', 'subscriber-authoritative'], ['role', 'associate']]) });
    expect(logs[1]).toMatchObject({ table: 'clinic_assignments', filters: expect.arrayContaining([['subscriber_id', 'subscriber-authoritative'], ['assignment_role', 'associate'], ['membership_id', ['membership-associate-a', 'membership-associate-b']]]) });
    expect(JSON.stringify(logs)).not.toContain('mock-associate');
  });

  it('loads detail by exact real membership ID, role, and authoritative subscriber', async () => {
    const { client, logs } = clientFixture();
    const result = await getClinicOwnerAssociateDetail(scope, 'membership-associate-b', client);

    expect(result).toMatchObject({ membershipId: 'membership-associate-b', associateNumber: 'DEN-B', licenseNumber: 'PRC-A', clinics: [{ clinicId: 'clinic-b', clinicName: 'Clinic B', assignmentStatus: 'inactive' }] });
    expect(logs[0]).toMatchObject({ table: 'subscriber_memberships', filters: expect.arrayContaining([['id', 'membership-associate-b'], ['subscriber_id', 'subscriber-authoritative'], ['role', 'associate']]) });
  });

  it('returns a safe not-found error when RLS hides the exact membership', async () => {
    const { client } = clientFixture({ detail: null });
    await expect(getClinicOwnerAssociateDetail(scope, 'membership-hidden', client)).rejects.toEqual(new ClinicOwnerAssociateApiError('ASSOCIATE_NOT_FOUND'));
  });

  it('does not expose a raw backend failure or substitute mock data', async () => {
    const { client } = clientFixture({ failTable: 'subscriber_memberships' });
    await expect(getClinicOwnerAssociateDirectory(scope, client)).rejects.toEqual(new ClinicOwnerAssociateApiError('DATA_UNAVAILABLE'));
  });
});
