export type SettingsGroupKey = 'general' | 'branding' | 'regional' | 'registration' | 'subscriptions' | 'payments' | 'notifications' | 'announcements' | 'security' | 'auditData' | 'features';
export type FeatureFlagStatus = 'enabled' | 'disabled' | 'under_development' | 'internal_only';

export interface PlatformSettings {
  general: {
    platformName: string;
    supportEmail: string;
    supportPhone: string;
    defaultAdminName: string;
    environmentLabel: string;
  };
  branding: {
    logoText: string;
    primaryColor: string;
    accentColor: string;
    sidebarTheme: 'dark' | 'light';
    faviconLabel: string;
  };
  regional: {
    timezone: string;
    locale: string;
    currency: 'PHP';
    dateFormat: string;
    timeFormat: '12h' | '24h';
  };
  registration: {
    registrationEnabled: boolean;
    requireEmailVerification: boolean;
    requirePaymentBeforeApproval: boolean;
    defaultPlanId: string;
    allowDemoPayment: boolean;
  };
  subscriptions: {
    renewalWarningDays: number;
    expirationWarningDays: number;
    allowManualRenewal: boolean;
    autoProvisionOnApproval: boolean;
  };
  payments: {
    acceptedMethods: string[];
    defaultMethod: string;
    requireReferenceNumber: boolean;
    mockReceiptRequired: boolean;
  };
  notifications: {
    bellEnabled: boolean;
    emailPlaceholderEnabled: boolean;
    smsPlaceholderEnabled: boolean;
    pushPlaceholderEnabled: boolean;
    digestEnabled: boolean;
  };
  announcements: {
    schedulingEnabled: boolean;
    acknowledgementEnabled: boolean;
    defaultExpiryDays: number;
    allowUrgentPriority: boolean;
  };
  security: {
    mockSessionTimeoutMinutes: number;
    requirePasswordChangeOnTemporaryLogin: boolean;
    loginAttemptWarningThreshold: number;
    accessDeniedAuditLogging: boolean;
    sensitiveDataRedactionEnabled: true;
    destructiveConfirmationRequired: boolean;
    maskContactInformation: boolean;
    developmentReadyLoginEnabled: boolean;
  };
  auditData: {
    auditLoggingEnabled: boolean;
    logFailedActions: boolean;
    logAccessDenials: boolean;
    integrityCheckEnabled: boolean;
    auditExportEnabled: boolean;
    maximumLocalRestorePoints: number;
    createPreRestoreCheckpoint: boolean;
    createPreResetCheckpoint: boolean;
    backupAuditLogsByDefault: boolean;
    backupActivityLogsByDefault: boolean;
    maximumBackupFileSizeMb: number;
    automaticMockReconciliation: boolean;
  };
  features: Record<string, FeatureFlagStatus>;
  maintenance: {
    enabled: boolean;
    title: string;
    message: string;
    estimatedCompletion: string;
    allowPlatformOwnerBypass: boolean;
    allowRegistrationPage: boolean;
    allowedRoutes: string[];
  };
  updatedAt: string;
  updatedBy: string;
  schemaVersion: number;
}

export interface SettingsHistoryRecord {
  id: string;
  settingsHistoryNumber: string;
  group: SettingsGroupKey | 'maintenance' | 'all';
  changedFields: string[];
  beforeSnapshot: unknown;
  afterSnapshot: unknown;
  changedAt: string;
  changedBy: string;
  reason: string;
  correlationId: string;
}

export interface SettingsExportPayload {
  manifest: {
    formatVersion: 'pnj-mock-settings-v1';
    schemaVersion: number;
    exportedAt: string;
    checksum: string;
  };
  settings: PlatformSettings;
}

export interface SettingsResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}
