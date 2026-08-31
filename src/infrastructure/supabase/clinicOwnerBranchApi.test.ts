import { describe, expect, it, vi } from 'vitest';
import {
  ClinicOwnerApiError,
  clinicBranchHoursFromForm,
  clinicBranchInputFromForm,
  createClinicBranch,
  getClinicBranchDetail,
  updateClinicBranch,
} from './clinicOwnerApi';
import type { ClinicFormData } from '../../features/clinics/types';

const form: ClinicFormData = {
  subscriberId: 'must-not-send', primaryOwnerUserId: 'must-not-send', branchType: 'satellite', isPrimaryClinic: true,
  name: 'Real Branch', legalBusinessName: 'Real Branch Dental', email: 'branch@example.com', contactNumber: '09171234567', alternativeContactNumber: '',
  addressLine1: '1 Real Road', addressLine2: '', barangay: 'Real', city: 'Bacoor', province: 'Cavite', postalCode: '4102',
  country: 'Philippines', timezone: 'Asia/Manila', description: 'Real branch description', logoFileName: 'not-sent.png', logoFileType: 'image/png', visibility: 'visible',
  businessHours: {
    Monday: { enabled: true, openingTime: '09:00', closingTime: '17:00', breakEnabled: true, breakStart: '12:00', breakEnd: '13:00' },
    Tuesday: { enabled: true, openingTime: '09:00', closingTime: '17:00', breakEnabled: false, breakStart: 'ignored', breakEnd: 'ignored' },
    Wednesday: { enabled: true, openingTime: '09:00', closingTime: '17:00', breakEnabled: false, breakStart: '', breakEnd: '' },
    Thursday: { enabled: true, openingTime: '09:00', closingTime: '17:00', breakEnabled: false, breakStart: '', breakEnd: '' },
    Friday: { enabled: true, openingTime: '09:00', closingTime: '17:00', breakEnabled: false, breakStart: '', breakEnd: '' },
    Saturday: { enabled: false, openingTime: '09:00', closingTime: '17:00', breakEnabled: true, breakStart: '12:00', breakEnd: '13:00' },
    Sunday: { enabled: false, openingTime: '09:00', closingTime: '17:00', breakEnabled: false, breakStart: '', breakEnd: '' },
  },
  dentistUserIds: ['must-not-send'], staffUserIds: ['must-not-send'],
};

const dto = {
  id: 'clinic-real-uuid', clinicNumber: 'CLN-REAL-002', branchType: 'satellite', name: 'Real Branch', legalBusinessName: 'Real Branch Dental',
  email: 'branch@example.com', contactNumber: '09171234567', alternativeContactNumber: null, addressLine1: '1 Real Road', addressLine2: null,
  barangay: 'Real', city: 'Bacoor', province: 'Cavite', postalCode: '4102', country: 'Philippines', timezone: 'Asia/Manila', description: null,
  visibility: 'visible', status: 'active', isPrimary: false, createdAt: '2026-08-31T00:00:00Z', updatedAt: '2026-08-31T00:00:00Z',
  businessHours: clinicBranchHoursFromForm(form.businessHours),
};

function branchDetailClient(options: { hours?: unknown[]; clinic?: unknown; clinicError?: unknown; hoursError?: unknown } = {}) {
  const clinic = 'clinic' in options ? options.clinic : {
    id: dto.id, clinic_number: dto.clinicNumber, branch_type: dto.branchType, name: dto.name, legal_business_name: dto.legalBusinessName,
    email: dto.email, contact_number: dto.contactNumber, alternative_contact_number: dto.alternativeContactNumber,
    address_line_1: dto.addressLine1, address_line_2: dto.addressLine2, barangay: dto.barangay, city: dto.city, province: dto.province,
    postal_code: dto.postalCode, country: dto.country, timezone: dto.timezone, description: dto.description, visibility: dto.visibility,
    status: dto.status, is_primary: dto.isPrimary, created_at: dto.createdAt, updated_at: dto.updatedAt,
  };
  const hours = options.hours ?? dto.businessHours.map((row) => ({
    day_of_week: row.dayOfWeek, is_open: row.isOpen, opening_time: row.openingTime, closing_time: row.closingTime, break_start: row.breakStart, break_end: row.breakEnd,
  }));
  return {
    from: vi.fn((table: string) => {
      const builder: any = {
        select: vi.fn(() => builder),
        eq: vi.fn(() => builder),
        order: vi.fn(() => builder),
        maybeSingle: vi.fn().mockResolvedValue({ data: table === 'clinics' ? clinic : null, error: table === 'clinics' ? options.clinicError ?? null : null }),
        then: (resolve: (value: unknown) => unknown) => Promise.resolve(resolve({ data: hours, error: options.hoursError ?? null })),
      };
      return builder;
    }),
  } as any;
}

describe('Clinic Owner branch mutation adapter', () => {
  it('maps named UI weekdays explicitly, includes all seven, and nulls disabled-day times', () => {
    expect(clinicBranchHoursFromForm(form.businessHours).map((row) => row.dayOfWeek)).toEqual([1, 2, 3, 4, 5, 6, 0]);
    expect(clinicBranchHoursFromForm(form.businessHours)[5]).toMatchObject({ dayOfWeek: 6, isOpen: false, openingTime: null, closingTime: null, breakStart: null, breakEnd: null });
    expect(clinicBranchHoursFromForm(form.businessHours)[1]).toMatchObject({ dayOfWeek: 2, breakStart: null, breakEnd: null });
  });

  it('calls the deployed create RPC with only its public allowlist', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: dto, error: null });
    const input = clinicBranchInputFromForm(form);
    await expect(createClinicBranch({ ...input, saveMode: 'active' }, { rpc } as any)).resolves.toMatchObject({ clinicNumber: 'CLN-REAL-002' });
    expect(rpc).toHaveBeenCalledWith('create_my_clinic_branch', { p_input: expect.objectContaining({ saveMode: 'active', businessHours: expect.any(Array) }) });
    const payload = rpc.mock.calls[0][1].p_input;
    for (const forbidden of ['subscriberId', 'subscriber_id', 'clinicNumber', 'clinic_number', 'status', 'isPrimary', 'is_primary', 'primaryOwnerUserId', 'dentistUserIds', 'staffUserIds']) {
      expect(payload).not.toHaveProperty(forbidden);
    }
  });

  it('calls the deployed update RPC without save mode or protected authority fields', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: dto, error: null });
    await updateClinicBranch('clinic-real-uuid', clinicBranchInputFromForm(form), { rpc } as any);
    expect(rpc).toHaveBeenCalledWith('update_my_clinic_branch', { p_clinic_id: 'clinic-real-uuid', p_input: expect.any(Object) });
    const payload = rpc.mock.calls[0][1].p_input;
    expect(payload).not.toHaveProperty('saveMode');
    expect(payload).not.toHaveProperty('isPrimary');
    expect(payload).not.toHaveProperty('subscriberId');
  });

  it('normalizes a stable backend error without exposing provider internals', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'PT409: CLINIC_QUOTA_REACHED constraint detail' } });
    await expect(createClinicBranch({ ...clinicBranchInputFromForm(form), saveMode: 'draft' }, { rpc } as any))
      .rejects.toEqual(new ClinicOwnerApiError('CLINIC_QUOTA_REACHED'));
  });

  it('uses only the exact clinic UUID for the RLS detail read and loads seven hours', async () => {
    const logs: Array<{ table: string; filters: Array<[string, unknown]> }> = [];
    const from = vi.fn((table: string) => {
      const log = { table, filters: [] as Array<[string, unknown]> };
      logs.push(log);
      const builder: any = {
        select: vi.fn(() => builder),
        eq: vi.fn((column: string, value: unknown) => { log.filters.push([column, value]); return builder; }),
        order: vi.fn(() => builder),
        maybeSingle: vi.fn().mockResolvedValue({ data: table === 'clinics' ? {
          id: dto.id, clinic_number: dto.clinicNumber, branch_type: dto.branchType, name: dto.name, legal_business_name: dto.legalBusinessName,
          email: dto.email, contact_number: dto.contactNumber, alternative_contact_number: dto.alternativeContactNumber,
          address_line_1: dto.addressLine1, address_line_2: dto.addressLine2, barangay: dto.barangay, city: dto.city, province: dto.province,
          postal_code: dto.postalCode, country: dto.country, timezone: dto.timezone, description: dto.description, visibility: dto.visibility,
          status: dto.status, is_primary: dto.isPrimary, created_at: dto.createdAt, updated_at: dto.updatedAt,
        } : null, error: null }),
        then: (resolve: (value: unknown) => unknown) => Promise.resolve(resolve({ data: dto.businessHours.map((row) => ({
          day_of_week: row.dayOfWeek, is_open: row.isOpen, opening_time: row.openingTime, closing_time: row.closingTime, break_start: row.breakStart, break_end: row.breakEnd,
        })), error: null })),
      };
      return builder;
    });
    await expect(getClinicBranchDetail('clinic-real-uuid', { from } as any)).resolves.toMatchObject({ id: 'clinic-real-uuid', businessHoursConfigured: true, businessHours: expect.arrayContaining([expect.objectContaining({ dayOfWeek: 0 })]) });
    expect(logs).toEqual([
      { table: 'clinics', filters: [['id', 'clinic-real-uuid']] },
      { table: 'clinic_business_hours', filters: [['clinic_id', 'clinic-real-uuid']] },
    ]);
  });

  it('returns an authorized legacy clinic detail when no business-hours rows exist', async () => {
    await expect(getClinicBranchDetail(dto.id, branchDetailClient({ hours: [] }))).resolves.toMatchObject({
      id: dto.id,
      businessHours: [],
      businessHoursConfigured: false,
    });
  });

  it('classifies a hidden or nonexistent clinic as not found and a true database failure as unavailable', async () => {
    await expect(getClinicBranchDetail('not-visible', branchDetailClient({ clinic: null }))).rejects.toEqual(new ClinicOwnerApiError('CLINIC_NOT_FOUND'));
    await expect(getClinicBranchDetail(dto.id, branchDetailClient({ clinicError: { message: 'network failure' } }))).rejects.toEqual(new ClinicOwnerApiError('DATA_UNAVAILABLE'));
    await expect(getClinicBranchDetail(dto.id, branchDetailClient({ hoursError: { message: 'network failure' } }))).rejects.toEqual(new ClinicOwnerApiError('DATA_UNAVAILABLE'));
  });

  it('fails closed when a persisted weekday is not a finite integer in the supported range', async () => {
    const malformedHours = dto.businessHours.map((row, index) => ({
      day_of_week: index === 0 ? '1' : row.dayOfWeek,
      is_open: row.isOpen,
      opening_time: row.openingTime,
      closing_time: row.closingTime,
      break_start: row.breakStart,
      break_end: row.breakEnd,
    }));
    await expect(getClinicBranchDetail(dto.id, branchDetailClient({ hours: malformedHours }))).rejects.toEqual(new ClinicOwnerApiError('DATA_UNAVAILABLE'));
  });
});
