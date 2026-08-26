import type {
  AssociateDentistFormData,
  AssociateDentistPrivileges,
  AssociateDentistRecord,
  AssociateDentistResult,
  AssociateDentistStatus,
  AssociateDentistSummary,
  AssociateDentistWorkSchedule
} from '../types/associateDentists';
import { scopeRecordsBySubscriber } from './tenantScope';
import { mockClinicService } from '../../clinics/services/mockClinicService';

const STORAGE_KEY = 'clinic_owner_associate_dentists_v1';

const defaultSchedule = (): AssociateDentistWorkSchedule => ({
  Monday: { enabled: true, startTime: '09:00', endTime: '17:00' },
  Tuesday: { enabled: true, startTime: '09:00', endTime: '17:00' },
  Wednesday: { enabled: true, startTime: '09:00', endTime: '17:00' },
  Thursday: { enabled: true, startTime: '09:00', endTime: '17:00' },
  Friday: { enabled: true, startTime: '09:00', endTime: '17:00' },
  Saturday: { enabled: true, startTime: '09:00', endTime: '13:00' },
  Sunday: { enabled: false, startTime: '', endTime: '' }
});

export const defaultAssociatePrivileges = (): AssociateDentistPrivileges => ({
  viewCalendar: true,
  viewAssociates: true,
  viewAppointments: true,
  viewBirthdays: true,
  viewFollowUps: true,
  viewEventsSchedules: true,
  viewOnlineBookings: true,
  viewExpenses: true,
  postExpenses: false,
  addExpenses: true,
  viewPatientContactInfo: true,
  editPatientData: true,
  viewPatientsWithBalance: true
});

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

const normalizeIdList = (raw: string) =>
  raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const STALE_DENTIST_IDS = ['assoc-seed-001', 'assoc-seed-002', 'assoc-seed-003', 'assoc-angelomhyr-001'];

class MockAssociateDentistService {
  getNextAssociateNumber(records = this.listDentists()): string {
    const used = new Set(
      records
        .map((record) => String(record.associateNumber || '').match(/(\d+)$/)?.[1])
        .filter(Boolean)
        .map((value) => Number(value))
    );
    let next = 1;
    while (used.has(next)) next += 1;
    return `DEN-${String(next).padStart(6, '0')}`;
  }

  private read(): AssociateDentistRecord[] {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
      if (!raw) return [];
      const parsed = JSON.parse(raw) as AssociateDentistRecord[];
      if (!Array.isArray(parsed) || parsed.length === 0) return [];

      // Purge old mock seeds (Santos, Dela Cruz, Reyes, Angelo Mhyr) if present in storage
      const cleaned = parsed.filter(
        (d) =>
          !STALE_DENTIST_IDS.includes(d.id) &&
          !STALE_DENTIST_IDS.includes(d.associateNumber) &&
          d.email !== 'maria.santos@pjtanarte.com' &&
          d.email !== 'juan.delacruz@pjtanarte.com' &&
          d.email !== 'clarissa.reyes@pjtanarte.com' &&
          d.email !== 'angelomhyr@gmail.com' &&
          !d.email?.includes('pjtanarte.com')
      );
      const laboratories = typeof window !== 'undefined'
        ? JSON.parse(window.localStorage.getItem('pnj_mock_laboratories') || '[]')
        : [];
      const validLabNamesBySubscriber = new Map<string, Set<string>>();
      if (Array.isArray(laboratories)) {
        laboratories.forEach((lab: any) => {
          if (!lab?.subscriberId || !lab?.name || lab.status === 'archived') return;
          const names = validLabNamesBySubscriber.get(String(lab.subscriberId)) || new Set<string>();
          names.add(String(lab.name));
          validLabNamesBySubscriber.set(String(lab.subscriberId), names);
        });
      }
      const normalized = cleaned.map((dentist) => ({
        ...dentist,
        authorizedLaboratories: (dentist.authorizedLaboratories || []).filter((name) =>
          validLabNamesBySubscriber.get(String(dentist.subscriberId))?.has(String(name))
        )
      }));
      if (JSON.stringify(normalized) !== JSON.stringify(parsed)) {
        this.write(normalized);
      }
      return normalized;
    } catch {
      return [];
    }
  }

  private write(records: AssociateDentistRecord[]) {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    }
  }

  initializeDentists() {
    return this.read();
  }

  listDentists(): AssociateDentistRecord[] {
    return clone(this.read());
  }

  listDentistsForClinic(clinicId?: string): AssociateDentistRecord[] {
    const list = this.listDentists();
    if (!clinicId || clinicId === 'all') return list;
    return list.filter((dentist) => dentist.clinicIds && dentist.clinicIds.includes(clinicId));
  }

  getDentistsBySubscriberId(subscriberId: string): AssociateDentistRecord[] {
    const list = this.listDentists();
    return scopeRecordsBySubscriber(list, subscriberId);
  }

  getDentistById(id: string): AssociateDentistRecord | undefined {
    return this.listDentists().find((record) => record.id === id);
  }

  toFormData(record?: AssociateDentistRecord | null): AssociateDentistFormData {
    if (!record) {
      return {
        subscriberId: '',
        lastName: '',
        firstName: '',
        middleName: '',
        extensionName: '',
        mobileNumber: '',
        email: '',
        address: '',
        licenseNumber: '',
        ptrNumber: '',
        s2LicenseNumber: '',
        designation: '',
        specialization: '',
        calendarColor: '#4f46e5',
        certificatesAndQualifications: '',
        alternateAssociateIds: '',
        authorizedClinics: [],
        authorizedLaboratories: [],
        privileges: defaultAssociatePrivileges(),
        workSchedule: defaultSchedule(),
        deviceRestrictionEnabled: false,
        status: 'active',
        visibility: 'visible'
      };
    }

    return {
      subscriberId: record.subscriberId,
      lastName: record.lastName,
      firstName: record.firstName,
      middleName: record.middleName || '',
      extensionName: record.extensionName || '',
      mobileNumber: record.mobileNumber,
      email: record.email || '',
      address: record.address || '',
      licenseNumber: record.licenseNumber || '',
      ptrNumber: record.ptrNumber || '',
      s2LicenseNumber: record.s2LicenseNumber || '',
      designation: record.designation || '',
      specialization: record.specialization || '',
      calendarColor: record.calendarColor || '#4f46e5',
      certificatesAndQualifications: record.certificatesAndQualifications || '',
      alternateAssociateIds: (record.alternateAssociateIds || []).join(', '),
      authorizedClinics: record.authorizedClinics || [],
      authorizedLaboratories: record.authorizedLaboratories || [],
      privileges: record.privileges ? { ...record.privileges } : defaultAssociatePrivileges(),
      workSchedule: record.workSchedule ? clone(record.workSchedule) : defaultSchedule(),
      deviceRestrictionEnabled: Boolean(record.deviceRestrictionEnabled),
      status: record.status || 'active',
      visibility: record.visibility || 'visible'
    };
  }

  createDentist(
    data: AssociateDentistFormData,
    actorId = 'seed-user',
    draft = false
  ): AssociateDentistResult<AssociateDentistRecord> {
    const list = this.listDentists();
    if (data.email) {
      const existing = list.find((item) => item.email && item.email.toLowerCase() === data.email.trim().toLowerCase());
      if (existing) {
        return { ok: false, error: 'An associate dentist with this email address already exists.' };
      }
    }

    const now = new Date().toISOString();
    const associateNumber = this.getNextAssociateNumber(list);

    const record: AssociateDentistRecord = {
      id: `assoc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      associateNumber,
      subscriberId: data.subscriberId || '',
      lastName: data.lastName.trim(),
      firstName: data.firstName.trim(),
      middleName: data.middleName?.trim() || '',
      extensionName: data.extensionName?.trim() || '',
      mobileNumber: data.mobileNumber.trim(),
      email: data.email?.trim().toLowerCase() || '',
      password: data.password?.trim() || undefined,
      address: data.address?.trim() || '',
      licenseNumber: data.licenseNumber?.trim() || '',
      ptrNumber: data.ptrNumber?.trim() || '',
      s2LicenseNumber: data.s2LicenseNumber?.trim() || '',
      designation: data.designation.trim(),
      specialization: data.specialization.trim(),
      calendarColor: data.calendarColor || '#4f46e5',
      certificatesAndQualifications: data.certificatesAndQualifications?.trim() || '',
      alternateAssociateIds: normalizeIdList(data.alternateAssociateIds || ''),
      authorizedClinics: data.authorizedClinics || [],
      authorizedLaboratories: data.authorizedLaboratories || [],
      privileges: data.privileges ? { ...data.privileges } : defaultAssociatePrivileges(),
      workSchedule: data.workSchedule ? clone(data.workSchedule) : defaultSchedule(),
      deviceRestrictionEnabled: Boolean(data.deviceRestrictionEnabled),
      status: draft ? 'draft' : (data.status || 'active'),
      visibility: data.visibility || 'visible',
      clinicIds: Array.isArray((data as AssociateDentistFormData & { clinicIds?: string[] }).clinicIds)
        ? (data as AssociateDentistFormData & { clinicIds?: string[] }).clinicIds || []
        : mockClinicService.getClinicsBySubscriberId(data.subscriberId || '')
            .filter((clinic) => (data.authorizedClinics || []).some((name) => String(name).trim().toLowerCase() === String(clinic.name || '').trim().toLowerCase()))
            .map((clinic) => clinic.id),
      laboratoryIds: [],
      createdAt: now,
      updatedAt: now,
      createdBy: actorId,
      updatedBy: actorId
    };

    list.unshift(record);
    this.write(list);
    return { ok: true, data: record };
  }

  updateDentist(
    id: string,
    data: Partial<AssociateDentistFormData>,
    actorId = 'seed-user',
    draft = false
  ): AssociateDentistResult<AssociateDentistRecord> {
    const list = this.listDentists();
    const index = list.findIndex((item) => item.id === id);
    if (index === -1) {
      return { ok: false, error: 'Associate dentist not found.' };
    }

    const current = list[index];
    if (data.email && current.email && data.email.trim().toLowerCase() !== current.email.toLowerCase()) {
      const emailConflict = list.some(
        (item) => item.id !== id && item.email && item.email.toLowerCase() === data.email!.trim().toLowerCase()
      );
      if (emailConflict) {
        return { ok: false, error: 'An associate dentist with this email address already exists.' };
      }
    }

    const now = new Date().toISOString();
    const updated: AssociateDentistRecord = {
      ...current,
      lastName: data.lastName !== undefined ? data.lastName.trim() : current.lastName,
      firstName: data.firstName !== undefined ? data.firstName.trim() : current.firstName,
      middleName: data.middleName !== undefined ? data.middleName.trim() : current.middleName,
      extensionName: data.extensionName !== undefined ? data.extensionName.trim() : current.extensionName,
      mobileNumber: data.mobileNumber !== undefined ? data.mobileNumber.trim() : current.mobileNumber,
      email: data.email !== undefined ? data.email.trim().toLowerCase() : current.email,
      password: data.password !== undefined ? (data.password.trim() || undefined) : current.password,
      address: data.address !== undefined ? data.address.trim() : current.address,
      licenseNumber: data.licenseNumber !== undefined ? data.licenseNumber.trim() : current.licenseNumber,
      ptrNumber: data.ptrNumber !== undefined ? data.ptrNumber.trim() : current.ptrNumber,
      s2LicenseNumber: data.s2LicenseNumber !== undefined ? data.s2LicenseNumber.trim() : current.s2LicenseNumber,
      designation: data.designation !== undefined ? data.designation.trim() : current.designation,
      specialization: data.specialization !== undefined ? data.specialization.trim() : current.specialization,
      calendarColor: data.calendarColor !== undefined ? data.calendarColor : current.calendarColor,
      certificatesAndQualifications:
        data.certificatesAndQualifications !== undefined
          ? data.certificatesAndQualifications.trim()
          : current.certificatesAndQualifications,
      alternateAssociateIds:
        data.alternateAssociateIds !== undefined
          ? normalizeIdList(data.alternateAssociateIds)
          : current.alternateAssociateIds,
      authorizedClinics: data.authorizedClinics !== undefined ? data.authorizedClinics : current.authorizedClinics,
      authorizedLaboratories:
        data.authorizedLaboratories !== undefined ? data.authorizedLaboratories : current.authorizedLaboratories,
      privileges: data.privileges ? { ...data.privileges } : current.privileges,
      workSchedule: data.workSchedule ? clone(data.workSchedule) : current.workSchedule,
      deviceRestrictionEnabled:
        data.deviceRestrictionEnabled !== undefined
          ? Boolean(data.deviceRestrictionEnabled)
          : current.deviceRestrictionEnabled,
      status: draft ? 'draft' : (data.status !== undefined ? data.status : current.status),
      visibility: data.visibility !== undefined ? data.visibility : current.visibility,
      clinicIds: Array.isArray((data as AssociateDentistFormData & { clinicIds?: string[] }).clinicIds)
        ? (data as AssociateDentistFormData & { clinicIds?: string[] }).clinicIds || []
        : current.clinicIds,
      updatedAt: now,
      updatedBy: actorId
    };

    list[index] = updated;
    this.write(list);
    return { ok: true, data: updated };
  }

  setStatus(id: string, status: AssociateDentistStatus): AssociateDentistResult<AssociateDentistRecord> {
    const list = this.listDentists();
    const index = list.findIndex((item) => item.id === id);
    if (index === -1) {
      return { ok: false, error: 'Associate dentist not found.' };
    }
    list[index].status = status;
    list[index].updatedAt = new Date().toISOString();
    this.write(list);
    return { ok: true, data: list[index] };
  }

  deleteDentist(id: string): boolean {
    const list = this.listDentists();
    const next = list.filter((item) => item.id !== id);
    if (next.length === list.length) return false;
    this.write(next);
    return true;
  }

  getSummary(subscriberId?: string): AssociateDentistSummary {
    const list = subscriberId ? this.getDentistsBySubscriberId(subscriberId) : this.listDentists();
    return {
      total: list.length,
      active: list.filter((item) => item.status === 'active').length,
      inactive: list.filter((item) => item.status === 'inactive').length,
      draft: list.filter((item) => item.status === 'draft').length,
      clinicsCovered: new Set(list.flatMap((item) => item.clinicIds || [])).size
    };
  }
}

export const mockAssociateDentistService = new MockAssociateDentistService();
