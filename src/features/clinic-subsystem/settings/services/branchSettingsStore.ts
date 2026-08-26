export interface DentalChair {
  id: string;
  name: string;
  room: string;
  color: string;
  active: boolean;
  isDefault: boolean;
}

export interface DaySchedule {
  enabled: boolean;
  openingTime: string;
  closingTime: string;
  breakEnabled: boolean;
  breakStart: string;
  breakEnd: string;
}

export interface BranchSettings {
  clinicId: string;
  profile: {
    branchName: string;
    contactNumber: string;
    landlineNumber: string;
    branchEmail: string;
    addressLine1: string;
    addressLine2: string;
    barangay: string;
    city: string;
    province: string;
    postalCode: string;
  };
  schedule: {
    businessHours: Record<string, DaySchedule>;
  };
  chairs: DentalChair[];
  clinicalDefaults: {
    toothNumberingSystem: 'FDI' | 'Universal' | 'Palmer';
    defaultChartView: 'adult' | 'pediatric';
    quickTaggingMode: boolean;
    showClinicalAlertBanner: boolean;
  };
  prescription: {
    autoPrintPrcNo: boolean;
    autoPrintPtrNo: boolean;
    defaultDisclaimer: string;
    doctorHeaderTitle: string;
  };
  waitlist: {
    queuePrefix: string;
    maxDailyCapacity: number;
    autoResetEndOfDay: boolean;
  };
  pos: {
    startingCashFloat: number;
    acceptedPaymentMethods: {
      cash: boolean;
      gcash: boolean;
      maya: boolean;
      card: boolean;
      hmo: boolean;
      bankTransfer: boolean;
    };
  };
  updatedAt: string;
}

const STORAGE_PREFIX = 'pnj_mock_branch_settings_';
export const BRANCH_SETTINGS_UPDATED_EVENT = 'branch-settings:updated';

const defaultWeekSchedule: Record<string, DaySchedule> = {
  Monday: { enabled: true, openingTime: '08:00', closingTime: '17:00', breakEnabled: true, breakStart: '12:00', breakEnd: '13:00' },
  Tuesday: { enabled: true, openingTime: '08:00', closingTime: '17:00', breakEnabled: true, breakStart: '12:00', breakEnd: '13:00' },
  Wednesday: { enabled: true, openingTime: '08:00', closingTime: '17:00', breakEnabled: true, breakStart: '12:00', breakEnd: '13:00' },
  Thursday: { enabled: true, openingTime: '08:00', closingTime: '17:00', breakEnabled: true, breakStart: '12:00', breakEnd: '13:00' },
  Friday: { enabled: true, openingTime: '08:00', closingTime: '17:00', breakEnabled: true, breakStart: '12:00', breakEnd: '13:00' },
  Saturday: { enabled: true, openingTime: '09:00', closingTime: '16:00', breakEnabled: true, breakStart: '12:00', breakEnd: '13:00' },
  Sunday: { enabled: false, openingTime: '09:00', closingTime: '15:00', breakEnabled: false, breakStart: '12:00', breakEnd: '13:00' }
};

import { mockClinicService } from '../../../clinics/services/mockClinicService';

export const getDefaultBranchSettings = (clinicId: string): BranchSettings => {
  const clinic = typeof window !== 'undefined' ? mockClinicService.listClinics().find((c: any) => c.id === clinicId) as any : null;
  const branchName = clinic?.name || (clinicId.includes('396924') ? 'Angelo Dental Clinic' : 'Dental Branch');
  const contactNumber = clinic?.contactNumber || clinic?.phone || '+63 917 123 4567';
  const addressLine1 = clinic?.addressLine1 || clinic?.address || 'Unit 204, MedTower Building, Aguinaldo Highway';
  const city = clinic?.city || 'Bacoor';
  const province = clinic?.province || 'Cavite';
  const branchEmail = clinic?.email || `${branchName.toLowerCase().replace(/[^a-z0-9]/g, '')}@dentalclinic.com`;

  return {
    clinicId,
    profile: {
      branchName,
      contactNumber,
      landlineNumber: '(046) 417 8900',
      branchEmail,
      addressLine1,
      addressLine2: '',
      barangay: '',
      city,
      province,
      postalCode: '4102'
    },
  schedule: {
    businessHours: defaultWeekSchedule
  },
  chairs: [
    { id: 'CH-01', name: 'Chair 1 - Primary Operatory', room: 'Operatory 1', color: '#3b82f6', active: true, isDefault: true },
    { id: 'CH-02', name: 'Chair 2 - Orthodontic Suite', room: 'Suite 202', color: '#10b981', active: true, isDefault: false },
    { id: 'CH-03', name: 'Chair 3 - Surgery & Diagnostics', room: 'Surg Room', color: '#f59e0b', active: true, isDefault: false }
  ],
  clinicalDefaults: {
    toothNumberingSystem: 'FDI',
    defaultChartView: 'adult',
    quickTaggingMode: true,
    showClinicalAlertBanner: true
  },
  prescription: {
    autoPrintPrcNo: true,
    autoPrintPtrNo: true,
    defaultDisclaimer: 'This prescription is valid for 7 days from the date of issue. Please take medications strictly according to doctor instructions.',
    doctorHeaderTitle: 'Dental Medicine & Orthodontics'
  },
  waitlist: {
    queuePrefix: 'WK-',
    maxDailyCapacity: 25,
    autoResetEndOfDay: true
  },
  pos: {
    startingCashFloat: 5000,
    acceptedPaymentMethods: {
      cash: true,
      gcash: true,
      maya: true,
      card: true,
      hmo: true,
      bankTransfer: true
    }
  },
  updatedAt: new Date().toISOString()
};
};

const safeRead = (clinicId: string): BranchSettings => {
  try {
    const key = `${STORAGE_PREFIX}${clinicId}`;
    const raw = localStorage.getItem(key);
    const defaults = getDefaultBranchSettings(clinicId);
    if (!raw) return defaults;
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return getDefaultBranchSettings(clinicId);
  }
};

const safeWrite = (clinicId: string, settings: BranchSettings) => {
  try {
    const key = `${STORAGE_PREFIX}${clinicId}`;
    localStorage.setItem(key, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent(BRANCH_SETTINGS_UPDATED_EVENT, { detail: settings }));
  } catch (err) {
    console.error('Failed to write branch settings:', err);
  }
};

export const branchSettingsStore = {
  getSettings: (clinicId: string): BranchSettings => safeRead(clinicId),
  updateSettings: (clinicId: string, partial: Partial<BranchSettings>): BranchSettings => {
    const current = safeRead(clinicId);
    const updated: BranchSettings = {
      ...current,
      ...partial,
      profile: { ...current.profile, ...(partial.profile || {}) },
      schedule: {
        businessHours: {
          ...current.schedule.businessHours,
          ...(partial.schedule?.businessHours || {})
        }
      },
      chairs: partial.chairs || current.chairs,
      clinicalDefaults: { ...current.clinicalDefaults, ...(partial.clinicalDefaults || {}) },
      prescription: { ...current.prescription, ...(partial.prescription || {}) },
      waitlist: { ...current.waitlist, ...(partial.waitlist || {}) },
      pos: {
        startingCashFloat: partial.pos?.startingCashFloat ?? current.pos.startingCashFloat,
        acceptedPaymentMethods: {
          ...current.pos.acceptedPaymentMethods,
          ...(partial.pos?.acceptedPaymentMethods || {})
        }
      },
      updatedAt: new Date().toISOString()
    };
    safeWrite(clinicId, updated);
    return updated;
  },
  resetSettings: (clinicId: string): BranchSettings => {
    const defaults = getDefaultBranchSettings(clinicId);
    safeWrite(clinicId, defaults);
    return defaults;
  }
};
