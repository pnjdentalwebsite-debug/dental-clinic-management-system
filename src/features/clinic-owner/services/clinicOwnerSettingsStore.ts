export interface ClinicOwnerSettings {
  organization: {
    legalBusinessName: string;
    clinicDisplayName: string;
    tinNumber: string;
    primaryEmail: string;
    primaryPhone: string;
    currency: string;
    dateFormat: string;
    timeFormat: '12h' | '24h';
  };
  subscription: {
    planTier: string;
    status: string;
    billingCycle: string;
    branchesUsed: number;
    branchesQuota: number;
    dentistsUsed: number;
    dentistsQuota: number;
    staffUsed: number;
    staffQuota: number;
  };
  financial: {
    taxMode: 'non_vat' | 'vat_registered';
    vatRate: number;
    hmoAgingThresholdDays: number;
    pettyCashStandardFloat: number;
    autoFlagOverdueInstallments: boolean;
  };
  security: {
    twoFactorEnabled: boolean;
    sessionTimeoutMinutes: number;
    rolePermissions: {
      associateDentist: {
        viewFinancials: boolean;
        editMasterFiles: boolean;
        deletePatients: boolean;
        issuePrescriptions: boolean;
        exportReports: boolean;
      };
      receptionStaff: {
        viewFinancials: boolean;
        editMasterFiles: boolean;
        deletePatients: boolean;
        issuePrescriptions: boolean;
        exportReports: boolean;
      };
    };
  };
  alerts: {
    dailyEodDigest: boolean;
    eodRecipientEmail: string;
    notifyOnPatientDelete: boolean;
    notifyOnHighValueVoid: boolean;
    notifyOnLowInventory: boolean;
  };
  updatedAt: string;
}

const STORAGE_KEY = 'pnj_mock_clinic_owner_settings';
export const CLINIC_OWNER_SETTINGS_UPDATED_EVENT = 'clinic-owner-settings:updated';

export const DEFAULT_CLINIC_OWNER_SETTINGS: ClinicOwnerSettings = {
  organization: {
    legalBusinessName: '',
    clinicDisplayName: '',
    tinNumber: '',
    primaryEmail: '',
    primaryPhone: '',
    currency: 'PHP (₱)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h'
  },
  subscription: {
    planTier: '',
    status: 'Inactive',
    billingCycle: 'Monthly',
    branchesUsed: 0,
    branchesQuota: 0,
    dentistsUsed: 0,
    dentistsQuota: 0,
    staffUsed: 0,
    staffQuota: 0
  },
  financial: {
    taxMode: 'non_vat',
    vatRate: 12,
    hmoAgingThresholdDays: 30,
    pettyCashStandardFloat: 5000,
    autoFlagOverdueInstallments: true
  },
  security: {
    twoFactorEnabled: false,
    sessionTimeoutMinutes: 480,
    rolePermissions: {
      associateDentist: {
        viewFinancials: false,
        editMasterFiles: true,
        deletePatients: false,
        issuePrescriptions: true,
        exportReports: false
      },
      receptionStaff: {
        viewFinancials: true,
        editMasterFiles: false,
        deletePatients: false,
        issuePrescriptions: false,
        exportReports: true
      }
    }
  },
  alerts: {
    dailyEodDigest: false,
    eodRecipientEmail: '',
    notifyOnPatientDelete: true,
    notifyOnHighValueVoid: true,
    notifyOnLowInventory: false
  },
  updatedAt: new Date().toISOString()
};

const safeRead = (): ClinicOwnerSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CLINIC_OWNER_SETTINGS;
    return { ...DEFAULT_CLINIC_OWNER_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CLINIC_OWNER_SETTINGS;
  }
};

const safeWrite = (settings: ClinicOwnerSettings) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent(CLINIC_OWNER_SETTINGS_UPDATED_EVENT, { detail: settings }));
  } catch (err) {
    console.error('Failed to write clinic owner settings:', err);
  }
};

export const clinicOwnerSettingsStore = {
  getSettings: (): ClinicOwnerSettings => safeRead(),
  updateSettings: (partial: Partial<ClinicOwnerSettings>): ClinicOwnerSettings => {
    const current = safeRead();
    const updated: ClinicOwnerSettings = {
      ...current,
      ...partial,
      organization: { ...current.organization, ...(partial.organization || {}) },
      subscription: { ...current.subscription, ...(partial.subscription || {}) },
      financial: { ...current.financial, ...(partial.financial || {}) },
      security: {
        ...current.security,
        ...(partial.security || {}),
        rolePermissions: {
          associateDentist: {
            ...current.security.rolePermissions.associateDentist,
            ...(partial.security?.rolePermissions?.associateDentist || {})
          },
          receptionStaff: {
            ...current.security.rolePermissions.receptionStaff,
            ...(partial.security?.rolePermissions?.receptionStaff || {})
          }
        }
      },
      alerts: { ...current.alerts, ...(partial.alerts || {}) },
      updatedAt: new Date().toISOString()
    };
    safeWrite(updated);
    return updated;
  },
  resetSettings: (): ClinicOwnerSettings => {
    safeWrite(DEFAULT_CLINIC_OWNER_SETTINGS);
    return DEFAULT_CLINIC_OWNER_SETTINGS;
  }
};
