import { mockAuditService } from '../../audit/services/mockAuditService';
import { mockNotificationService } from '../../notifications/services/mockNotificationService';
import type { FeatureFlagStatus, PlatformSettings, SettingsExportPayload, SettingsGroupKey, SettingsHistoryRecord, SettingsResult } from '../types';

const SETTINGS_KEY = 'pnj_mock_platform_settings';
const HISTORY_KEY = 'pnj_mock_platform_settings_history';
const SCHEMA_VERSION = 1 as const;
const FORMAT_VERSION = 'pnj-mock-settings-v1' as const;

const nowIso = () => new Date().toISOString();
const today = () => new Date().toISOString().split('T')[0];
const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
const correlationId = () => `CORR-${today().replaceAll('-', '')}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

export const PLATFORM_SETTINGS_CHANGED_EVENT = 'PLATFORM_SETTINGS_CHANGED';

const dispatchSettingsChange = () => {
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent(PLATFORM_SETTINGS_CHANGED_EVENT));
    }, 0);
  }
};

const safeRead = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
};
const safeWrite = <T,>(key: string, value: T) => localStorage.setItem(key, JSON.stringify(value));
const stableStringify = (value: unknown): string => {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  return `{${Object.keys(value as Record<string, unknown>).sort().map(key => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`).join(',')}}`;
};
const checksum = (value: unknown) => {
  const text = stableStringify(value);
  let hash = 5381;
  for (let index = 0; index < text.length; index += 1) hash = ((hash << 5) + hash) ^ text.charCodeAt(index);
  return `SET-${(hash >>> 0).toString(16).padStart(8, '0')}`;
};
const changedFields = (before: Record<string, unknown>, after: Record<string, unknown>) => [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(key => stableStringify(before[key]) !== stableStringify(after[key]));

const defaultFeatures = (): Record<string, FeatureFlagStatus> => ({
  subscriber_management: 'enabled',
  user_management: 'enabled',
  plans_management: 'enabled',
  subscriptions_management: 'enabled',
  payments_management: 'enabled',
  clinics_management: 'enabled',
  laboratories_management: 'enabled',
  analytics_reports: 'enabled',
  announcements: 'enabled',
  notifications: 'enabled',
  audit_logs: 'enabled',
  data_restore: 'enabled',
  clinic_owner_portal: 'enabled',
  patient_management: 'enabled',
  appointment_management: 'enabled',
  billing: 'enabled',
  online_booking: 'enabled',
  calendar_integration: 'enabled'
});

const defaults = (): PlatformSettings => ({
  general: { platformName: 'Dental Clinic Management Platform', supportEmail: 'support@pnj-dental.test', supportPhone: '+63 900 000 0000', defaultAdminName: 'PNJ Platform Administrator', environmentLabel: 'Prototype Mode' },
  branding: { logoText: 'Dental Clinic Platform', primaryColor: '#2563eb', accentColor: '#14b8a6', sidebarTheme: 'dark', faviconLabel: 'PNJ' },
  regional: { timezone: 'Asia/Manila', locale: 'en-PH', currency: 'PHP', dateFormat: 'MMM d, yyyy', timeFormat: '12h' },
  registration: { registrationEnabled: true, requireEmailVerification: true, requirePaymentBeforeApproval: true, defaultPlanId: 'plan-basic', allowDemoPayment: true },
  subscriptions: { renewalWarningDays: 14, expirationWarningDays: 7, allowManualRenewal: true, autoProvisionOnApproval: true },
  payments: { acceptedMethods: ['GCash', 'Maya', 'Bank Transfer', 'Demo Payment'], defaultMethod: 'GCash', requireReferenceNumber: true, mockReceiptRequired: false },
  notifications: { bellEnabled: true, emailPlaceholderEnabled: false, smsPlaceholderEnabled: false, pushPlaceholderEnabled: false, digestEnabled: false },
  announcements: { schedulingEnabled: true, acknowledgementEnabled: true, defaultExpiryDays: 30, allowUrgentPriority: true },
  security: { mockSessionTimeoutMinutes: 60, requirePasswordChangeOnTemporaryLogin: true, loginAttemptWarningThreshold: 3, accessDeniedAuditLogging: true, sensitiveDataRedactionEnabled: true, destructiveConfirmationRequired: true, maskContactInformation: false, developmentReadyLoginEnabled: true },
  auditData: { auditLoggingEnabled: true, logFailedActions: true, logAccessDenials: true, integrityCheckEnabled: true, auditExportEnabled: true, maximumLocalRestorePoints: 5, createPreRestoreCheckpoint: true, createPreResetCheckpoint: true, backupAuditLogsByDefault: true, backupActivityLogsByDefault: true, maximumBackupFileSizeMb: 10, automaticMockReconciliation: true },
  features: defaultFeatures(),
  maintenance: { enabled: false, title: 'Scheduled Maintenance', message: 'The prototype is temporarily unavailable for maintenance.', estimatedCompletion: '', allowPlatformOwnerBypass: true, allowRegistrationPage: true, allowedRoutes: ['/login', '/platform/settings'] },
  updatedAt: nowIso(),
  updatedBy: 'platform_owner',
  schemaVersion: SCHEMA_VERSION
});

const normalize = (value: Partial<PlatformSettings>): PlatformSettings => {
  const base = defaults();
  return {
    ...base,
    ...value,
    general: { ...base.general, ...(value.general || {}) },
    branding: { ...base.branding, ...(value.branding || {}) },
    regional: { ...base.regional, ...(value.regional || {}) },
    registration: { ...base.registration, ...(value.registration || {}) },
    subscriptions: { ...base.subscriptions, ...(value.subscriptions || {}) },
    payments: { ...base.payments, ...(value.payments || {}) },
    notifications: { ...base.notifications, ...(value.notifications || {}) },
    announcements: { ...base.announcements, ...(value.announcements || {}) },
    security: { ...base.security, ...(value.security || {}), sensitiveDataRedactionEnabled: true },
    auditData: { ...base.auditData, ...(value.auditData || {}) },
    features: { ...base.features, ...(value.features || {}) },
    maintenance: { ...base.maintenance, ...(value.maintenance || {}) },
    schemaVersion: SCHEMA_VERSION
  };
};

const writeHistory = (record: SettingsHistoryRecord) => safeWrite(HISTORY_KEY, [record, ...mockPlatformSettingsService.getSettingsHistory()]);

export const mockPlatformSettingsService = {
  initializeSettings: () => {
    const current = safeRead<Partial<PlatformSettings> | null>(SETTINGS_KEY, null);
    const normalized = normalize(current || {});
    safeWrite(SETTINGS_KEY, normalized);
    return normalized;
  },
  getSettings: () => normalize(safeRead<Partial<PlatformSettings>>(SETTINGS_KEY, defaults())),
  getGroup: <K extends SettingsGroupKey>(group: K): PlatformSettings[K] => mockPlatformSettingsService.getSettings()[group],
  getSettingsHistory: () => safeRead<SettingsHistoryRecord[]>(HISTORY_KEY, []),
  validateGroup: (group: SettingsGroupKey, patch: Record<string, unknown>): SettingsResult<Record<string, unknown>> => {
    if (group === 'regional' && patch.currency && patch.currency !== 'PHP') return { ok: false, error: 'Only PHP is supported in this prototype.' };
    if (group === 'security' && patch.sensitiveDataRedactionEnabled === false) return { ok: false, error: 'Sensitive-data redaction cannot be disabled.' };
    if (group === 'auditData' && Number(patch.maximumLocalRestorePoints) < 1) return { ok: false, error: 'At least one local restore point is required.' };
    if (group === 'subscriptions' && Number(patch.renewalWarningDays) < 0) return { ok: false, error: 'Warning days cannot be negative.' };
    return { ok: true, data: patch };
  },
  updateSettingsGroup: <K extends SettingsGroupKey>(group: K, patch: Partial<PlatformSettings[K]>, reason = 'Settings updated'): SettingsResult<PlatformSettings> => {
    const validation = mockPlatformSettingsService.validateGroup(group, patch as Record<string, unknown>);
    if (!validation.ok) return { ok: false, error: validation.error };
    const before = mockPlatformSettingsService.getSettings();
    const beforeGroup = before[group] as Record<string, unknown>;
    const afterGroup = { ...beforeGroup, ...(patch as Record<string, unknown>) };
    if (group === 'security') afterGroup.sensitiveDataRedactionEnabled = true;
    const after = normalize({ ...before, [group]: afterGroup, updatedAt: nowIso(), updatedBy: 'platform_owner' });
    safeWrite(SETTINGS_KEY, after);
    dispatchSettingsChange();
    const corr = correlationId();
    writeHistory({ id: makeId('SH'), settingsHistoryNumber: `SH-${String(mockPlatformSettingsService.getSettingsHistory().length + 1).padStart(6, '0')}`, group, changedFields: changedFields(beforeGroup, afterGroup), beforeSnapshot: mockAuditService.redactAuditPayload(beforeGroup), afterSnapshot: mockAuditService.redactAuditPayload(afterGroup), changedAt: nowIso(), changedBy: 'platform_owner', reason, correlationId: corr });
    mockAuditService.appendAuditEvent({ action: 'settings.group_updated', category: 'platform_settings', module: 'platform_settings', targetType: 'settings_group', targetId: group, targetLabel: group, correlationId: corr, summary: `${group} settings updated.`, beforeSnapshot: beforeGroup, afterSnapshot: afterGroup, severity: group === 'security' || group === 'auditData' ? 'medium' : 'low' });
    if (group === 'features') {
      Object.entries(patch as Record<string, FeatureFlagStatus>).forEach(([flag, status]) => {
        if (status === 'disabled') mockNotificationService.createSystemNotification({ eventKey: `settings-core-feature-disabled-${flag}`, category: 'system', sourceModule: 'platform_settings', title: 'Core feature disabled', message: `${flag.replaceAll('_', ' ')} was disabled in prototype feature flags.`, priority: 'high', actionUrl: '/platform/settings/features', actionLabel: 'Review Feature Flags' });
      });
    }
    return { ok: true, data: after };
  },
  updateMaintenanceMode: (patch: Partial<PlatformSettings['maintenance']>): SettingsResult<PlatformSettings> => {
    const before = mockPlatformSettingsService.getSettings().maintenance;
    const settings = mockPlatformSettingsService.getSettings();
    const after = { ...settings.maintenance, ...patch };
    const next = normalize({ ...settings, maintenance: after, updatedAt: nowIso(), updatedBy: 'platform_owner' });
    safeWrite(SETTINGS_KEY, next);
    dispatchSettingsChange();
    const corr = correlationId();
    writeHistory({ id: makeId('SH'), settingsHistoryNumber: `SH-${String(mockPlatformSettingsService.getSettingsHistory().length + 1).padStart(6, '0')}`, group: 'maintenance', changedFields: changedFields(before, after), beforeSnapshot: before, afterSnapshot: after, changedAt: nowIso(), changedBy: 'platform_owner', reason: 'Maintenance mode updated', correlationId: corr });
    mockAuditService.appendAuditEvent({ action: 'settings.maintenance_mode_changed', category: 'platform_settings', module: 'platform_settings', targetType: 'maintenance_mode', correlationId: corr, summary: after.enabled ? 'Maintenance mode enabled.' : 'Maintenance mode disabled.', beforeSnapshot: before, afterSnapshot: after, severity: after.enabled ? 'high' : 'medium' });
    if (after.enabled) mockNotificationService.createSystemNotification({ eventKey: 'settings-maintenance-enabled', category: 'system', sourceModule: 'platform_settings', title: 'Maintenance mode enabled', message: after.title, priority: 'high', actionUrl: '/platform/settings/features', actionLabel: 'Review Maintenance' });
    return { ok: true, data: next };
  },
  resetGroup: (group: SettingsGroupKey) => mockPlatformSettingsService.updateSettingsGroup(group, defaults()[group] as never, `Reset ${group} settings to defaults`),
  resetAllSettings: (): SettingsResult<PlatformSettings> => {
    const before = mockPlatformSettingsService.getSettings();
    const next = defaults();
    safeWrite(SETTINGS_KEY, next);
    dispatchSettingsChange();
    const corr = correlationId();
    writeHistory({ id: makeId('SH'), settingsHistoryNumber: `SH-${String(mockPlatformSettingsService.getSettingsHistory().length + 1).padStart(6, '0')}`, group: 'all', changedFields: ['all'], beforeSnapshot: mockAuditService.redactAuditPayload(before), afterSnapshot: next, changedAt: nowIso(), changedBy: 'platform_owner', reason: 'Reset all settings to defaults', correlationId: corr });
    mockAuditService.appendAuditEvent({ action: 'settings.reset', category: 'platform_settings', module: 'platform_settings', targetType: 'settings', correlationId: corr, summary: 'All platform settings reset to defaults.', severity: 'medium' });
    return { ok: true, data: next };
  },
  exportSettings: (): SettingsExportPayload => {
    const settings = mockPlatformSettingsService.getSettings();
    const payload = { manifest: { formatVersion: FORMAT_VERSION, schemaVersion: SCHEMA_VERSION, exportedAt: nowIso(), checksum: '' }, settings };
    payload.manifest.checksum = checksum(settings);
    mockAuditService.appendAuditEvent({ eventKey: `settings-export-${Date.now()}`, action: 'settings.exported', category: 'platform_settings', module: 'platform_settings', targetType: 'settings', summary: 'Platform settings exported.', severity: 'low' });
    return payload;
  },
  validateSettingsImport: (payload: unknown): SettingsResult<SettingsExportPayload> => {
    if (!payload || typeof payload !== 'object') return { ok: false, error: 'Settings import must be a JSON object.' };
    const candidate = payload as SettingsExportPayload;
    if (candidate.manifest?.formatVersion !== FORMAT_VERSION) return { ok: false, error: 'Unsupported settings format.' };
    if (candidate.manifest?.schemaVersion !== SCHEMA_VERSION) return { ok: false, error: 'Unsupported settings schema version.' };
    if (candidate.manifest.checksum !== checksum(candidate.settings)) return { ok: false, error: 'Settings checksum is invalid.' };
    return { ok: true, data: { ...candidate, settings: normalize(candidate.settings) } };
  },
  importSettings: (payload: unknown): SettingsResult<PlatformSettings> => {
    const validation = mockPlatformSettingsService.validateSettingsImport(payload);
    if (!validation.ok || !validation.data) return { ok: false, error: validation.error };
    const before = mockPlatformSettingsService.getSettings();
    const next = normalize(validation.data.settings);
    safeWrite(SETTINGS_KEY, next);
    dispatchSettingsChange();
    const corr = correlationId();
    writeHistory({ id: makeId('SH'), settingsHistoryNumber: `SH-${String(mockPlatformSettingsService.getSettingsHistory().length + 1).padStart(6, '0')}`, group: 'all', changedFields: changedFields(before as unknown as Record<string, unknown>, next as unknown as Record<string, unknown>), beforeSnapshot: mockAuditService.redactAuditPayload(before), afterSnapshot: mockAuditService.redactAuditPayload(next), changedAt: nowIso(), changedBy: 'platform_owner', reason: 'Imported settings JSON', correlationId: corr });
    mockAuditService.appendAuditEvent({ action: 'settings.imported', category: 'platform_settings', module: 'platform_settings', targetType: 'settings', correlationId: corr, summary: 'Platform settings imported.', severity: 'medium' });
    mockNotificationService.createSystemNotification({ eventKey: `settings-import-${validation.data.manifest.checksum}`, category: 'system', sourceModule: 'platform_settings', title: 'Settings import completed', message: 'Platform settings were imported in the local prototype.', priority: 'normal', actionUrl: '/platform/settings', actionLabel: 'Open Settings' });
    return { ok: true, data: next };
  },
  isFeatureAvailable: (flag: string) => mockPlatformSettingsService.getSettings().features[flag] !== 'disabled',
  isMaintenanceActiveForRoute: (route: string, role: string) => {
    const maintenance = mockPlatformSettingsService.getSettings().maintenance;
    if (!maintenance.enabled) return false;
    if (role === 'platform_owner' && maintenance.allowPlatformOwnerBypass) return false;
    if (maintenance.allowRegistrationPage && route.startsWith('/register')) return false;
    return !maintenance.allowedRoutes.some(allowed => route.startsWith(allowed));
  },
  checksum
};
