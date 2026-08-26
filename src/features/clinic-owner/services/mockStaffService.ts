import type {
  StaffMemberFormData,
  StaffMemberRecord,
  StaffStatus,
  StaffSummary,
  StaffWorkSchedule,
  SystemPrivileges
} from '../types/staffManagement';
import { scopeRecordsBySubscriber } from './tenantScope';

const STORAGE_KEY = 'pnj_mock_staff_members';

const defaultStaffSchedule = (): StaffWorkSchedule => ({
  Monday: { enabled: true, startTime: '08:00', endTime: '18:00' },
  Tuesday: { enabled: true, startTime: '08:00', endTime: '18:00' },
  Wednesday: { enabled: true, startTime: '08:00', endTime: '18:00' },
  Thursday: { enabled: true, startTime: '08:00', endTime: '18:00' },
  Friday: { enabled: true, startTime: '08:00', endTime: '18:00' },
  Saturday: { enabled: true, startTime: '08:00', endTime: '17:00' },
  Sunday: { enabled: false, startTime: '', endTime: '' }
});

const DEFAULT_PRIVILEGES: SystemPrivileges = {
  viewProgressNotesActions: true,
  addNewProgressNote: true,
  viewOnlyProgressNotes: false,
  deleteTreatmentPlan: false,
  editExistingTreatmentPlan: true,
  addNewTreatmentPlan: true,
  generateProgressNote: true,
  deletePatientChart: false,
  addBill: true,
  editPatientBill: true,
  addPayment: true,
  applyAccountCredit: true,
  deletePatientBill: false,
  deletePatientPrescription: false,
  createPatientPrescription: true,
  editPatientPrescription: true,
  deletePatientAttachment: false,
  deletePatientCertificate: false,
  createPatientCertificate: true,
  editPatientCertificate: true,
  viewExpenses: true,
  postExpenses: false,
  addExpenses: true,
  canDeletePatients: false,
  viewPatientsWithBalance: true
};

const STALE_STAFF_IDS = ['stf_001', 'stf_002', 'stf_003', 'stf_004', 'stf_kimberly_005', 'STF-000005'];

class MockStaffService {
  private loadRecords(): StaffMemberRecord[] {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
      if (!raw) return [];
      const parsed = JSON.parse(raw) as StaffMemberRecord[];
      if (!Array.isArray(parsed) || parsed.length === 0) return [];

      // Purge old mock seeds (Maria Cristina, James, Sarah, Gary, Kimberly Pantua) if present in storage
      const cleaned = parsed.filter(
        (s) =>
          !STALE_STAFF_IDS.includes(s.id) &&
          !STALE_STAFF_IDS.includes(s.staffNumber) &&
          s.email !== 'pantuakhim@gmail.com' &&
          !s.email?.includes('pjtanarte.com')
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
      const normalized = cleaned.map((staff) => ({
        ...staff,
        authorizedLaboratories: (staff.authorizedLaboratories || []).filter((name) =>
          validLabNamesBySubscriber.get(String(staff.subscriberId))?.has(String(name))
        )
      }));
      if (JSON.stringify(normalized) !== JSON.stringify(parsed)) {
        this.saveRecords(normalized);
      }
      return normalized;
    } catch {
      return [];
    }
  }

  private saveRecords(records: StaffMemberRecord[]): void {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    }
  }

  listStaff(): StaffMemberRecord[] {
    return this.loadRecords();
  }

  listStaffForClinic(clinicId?: string): StaffMemberRecord[] {
    const list = this.loadRecords();
    if (!clinicId || clinicId === 'all') return list;
    const clinics = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('pnj_mock_clinics') || '[]') : [];
    const clinic = clinics.find((c: any) => c.id === clinicId);
    const targetClinicId = clinic?.id || clinicId;

    return list.filter((staff) => {
      if ((staff as any).clinicIds && Array.isArray((staff as any).clinicIds)) {
        return (staff as any).clinicIds.includes(targetClinicId);
      }
      if (staff.authorizedClinics && clinic?.name) {
        return staff.authorizedClinics.includes(clinic.name);
      }
      return false;
    });
  }

  getStaffBySubscriberId(subscriberId?: string): StaffMemberRecord[] {
    const list = this.loadRecords();
    return scopeRecordsBySubscriber(list, subscriberId);
  }

  getStaffById(id: string): StaffMemberRecord | undefined {
    return this.loadRecords().find((staff) => staff.id === id);
  }

  getEmptyFormData(): StaffMemberFormData {
    return {
      lastName: '',
      firstName: '',
      middleName: '',
      extensionName: '',
      mobileNumber: '',
      phoneNumber: '',
      address: '',
      role: 'Dental Assistant',
      authorizedClinics: [],
      authorizedLaboratories: [],
      privileges: { ...DEFAULT_PRIVILEGES },
      workSchedule: defaultStaffSchedule(),
      email: '',
      enableDeviceRestriction: false
    };
  }

  toFormData(record: StaffMemberRecord): StaffMemberFormData {
    return {
      lastName: record.lastName,
      firstName: record.firstName,
      middleName: record.middleName || '',
      extensionName: record.extensionName || '',
      mobileNumber: record.mobileNumber,
      phoneNumber: record.phoneNumber || '',
      address: record.address || '',
      role: record.role,
      authorizedClinics: record.authorizedClinics || [],
      authorizedLaboratories: record.authorizedLaboratories || [],
      privileges: record.privileges ? { ...record.privileges } : { ...DEFAULT_PRIVILEGES },
      workSchedule: record.workSchedule ? JSON.parse(JSON.stringify(record.workSchedule)) : defaultStaffSchedule(),
      email: record.email,
      password: record.password,
      enableDeviceRestriction: Boolean(record.enableDeviceRestriction)
    };
  }

  getNextStaffNumber(): string {
    const list = this.loadRecords();
    return `STF-${String(list.length + 1).padStart(6, '0')}`;
  }

  createStaff(
    formData: StaffMemberFormData,
    subscriberId = '',
    draft = false
  ): { ok: boolean; staff?: StaffMemberRecord; error?: string } {
    const list = this.loadRecords();
    const existing = list.find((item) => item.email.toLowerCase() === formData.email.trim().toLowerCase());
    if (existing) {
      return { ok: false, error: 'A staff member with this email already exists.' };
    }

    const now = new Date().toISOString();
    const staffNumber = `STF-${String(list.length + 1).padStart(6, '0')}`;

    const newRecord: StaffMemberRecord = {
      id: `stf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      subscriberId,
      staffNumber,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      middleName: formData.middleName?.trim() || '',
      extensionName: formData.extensionName?.trim() || '',
      role: formData.role.trim(),
      mobileNumber: formData.mobileNumber.trim(),
      phoneNumber: formData.phoneNumber?.trim() || '',
      address: formData.address?.trim() || '',
      email: formData.email.trim().toLowerCase(),
      password: formData.password?.trim() || undefined,
      authorizedClinics: formData.authorizedClinics || [],
      authorizedLaboratories: formData.authorizedLaboratories || [],
      privileges: formData.privileges ? { ...formData.privileges } : { ...DEFAULT_PRIVILEGES },
      workSchedule: formData.workSchedule ? JSON.parse(JSON.stringify(formData.workSchedule)) : defaultStaffSchedule(),
      enableDeviceRestriction: Boolean(formData.enableDeviceRestriction),
      status: draft ? 'draft' : 'active',
      createdAt: now,
      updatedAt: now
    };

    list.unshift(newRecord);
    this.saveRecords(list);
    return { ok: true, staff: newRecord };
  }

  updateStaff(
    id: string,
    formData: Partial<StaffMemberFormData>,
    draft = false
  ): { ok: boolean; staff?: StaffMemberRecord; error?: string } {
    const list = this.loadRecords();
    const index = list.findIndex((item) => item.id === id);
    if (index === -1) {
      return { ok: false, error: 'Staff member not found.' };
    }

    const current = list[index];
    if (formData.email && formData.email.trim().toLowerCase() !== current.email.toLowerCase()) {
      const conflict = list.some(
        (item) => item.id !== id && item.email.toLowerCase() === formData.email!.trim().toLowerCase()
      );
      if (conflict) {
        return { ok: false, error: 'A staff member with this email already exists.' };
      }
    }

    const updated: StaffMemberRecord = {
      ...current,
      firstName: formData.firstName !== undefined ? formData.firstName.trim() : current.firstName,
      lastName: formData.lastName !== undefined ? formData.lastName.trim() : current.lastName,
      middleName: formData.middleName !== undefined ? formData.middleName.trim() : current.middleName,
      extensionName: formData.extensionName !== undefined ? formData.extensionName.trim() : current.extensionName,
      role: formData.role !== undefined ? formData.role.trim() : current.role,
      mobileNumber: formData.mobileNumber !== undefined ? formData.mobileNumber.trim() : current.mobileNumber,
      phoneNumber: formData.phoneNumber !== undefined ? formData.phoneNumber.trim() : current.phoneNumber,
      address: formData.address !== undefined ? formData.address.trim() : current.address,
      email: formData.email !== undefined ? formData.email.trim().toLowerCase() : current.email,
      password: formData.password !== undefined ? (formData.password.trim() || undefined) : current.password,
      authorizedClinics: formData.authorizedClinics !== undefined ? formData.authorizedClinics : current.authorizedClinics,
      authorizedLaboratories:
        formData.authorizedLaboratories !== undefined
          ? formData.authorizedLaboratories
          : current.authorizedLaboratories,
      privileges: formData.privileges ? { ...formData.privileges } : current.privileges,
      workSchedule: formData.workSchedule
        ? JSON.parse(JSON.stringify(formData.workSchedule))
        : current.workSchedule,
      enableDeviceRestriction:
        formData.enableDeviceRestriction !== undefined
          ? Boolean(formData.enableDeviceRestriction)
          : current.enableDeviceRestriction,
      status: draft ? 'draft' : current.status,
      updatedAt: new Date().toISOString()
    };

    list[index] = updated;
    this.saveRecords(list);
    return { ok: true, staff: updated };
  }

  setStatus(id: string, status: StaffStatus): { ok: boolean; staff?: StaffMemberRecord; error?: string } {
    const list = this.loadRecords();
    const index = list.findIndex((item) => item.id === id);
    if (index === -1) {
      return { ok: false, error: 'Staff member not found.' };
    }
    list[index].status = status;
    list[index].updatedAt = new Date().toISOString();
    this.saveRecords(list);
    return { ok: true, staff: list[index] };
  }

  deleteStaff(id: string): boolean {
    const list = this.loadRecords();
    const filtered = list.filter((item) => item.id !== id);
    if (filtered.length === list.length) return false;
    this.saveRecords(filtered);
    return true;
  }

  getSummary(subscriberId?: string): StaffSummary {
    const list = subscriberId ? this.getStaffBySubscriberId(subscriberId) : this.loadRecords();
    return {
      total: list.length,
      active: list.filter((item) => item.status === 'active').length,
      inactive: list.filter((item) => item.status === 'inactive').length,
      draft: list.filter((item) => item.status === 'draft').length,
      rolesCount: new Set(list.map((item) => item.role)).size
    };
  }
}

export const mockStaffService = new MockStaffService();
