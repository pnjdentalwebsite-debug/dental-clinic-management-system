import { mockAuditService } from '../../audit/services/mockAuditService';
import { mockAnnouncementService } from '../../announcements/services/mockAnnouncementService';
import { mockClinicService } from '../../clinics/services/mockClinicService';
import { mockLaboratoryService } from '../../laboratories/services/mockLaboratoryService';
import { mockNotificationService } from '../../notifications/services/mockNotificationService';
import { mockPaymentService } from '../../payments/services/mockPaymentService';
import { mockPlanService } from '../../plans/services/mockPlanService';
import { mockPlatformManagementService } from '../../platformManagement/services/mockPlatformManagementService';
import { mockPlatformSettingsService } from '../../platformSettings/services/mockPlatformSettingsService';
import { mockSubscriptionService } from '../../subscriptions/services/mockSubscriptionService';
import type { BackupManifest, BackupModuleDefinition, BackupPayload, BackupResult, BackupSummary, BackupType, RestoreHistoryRecord, RestoreMode, RestorePoint, RestorePreview } from '../types';

const FORMAT_VERSION = 'pnj-mock-backup-v1' as const;
const SCHEMA_VERSION = 1 as const;
const RESTORE_POINTS_KEY = 'pnj_mock_restore_points';
const RESTORE_HISTORY_KEY = 'pnj_mock_restore_history';
const SESSION_KEYS = ['pnj_mock_session', 'mock_session'];
const MAX_RESTORE_POINTS_FALLBACK = 5;
const STALE_SAFE_PURGE_CONFIRMATION = 'PURGE STALE DATA';
const STALE_SAFE_PURGE_KEYS = [
  'pnj_mock_subscribers',
  'pnj_mock_platform_users',
  'pnj_mock_registrations',
  'registrations',
  'pnj_mock_subscriptions',
  'pnj_mock_subscription_history',
  'pnj_mock_payments',
  'pnj_mock_payment_allocations',
  'pnj_mock_payment_history',
  'pnj_mock_refunds',
  'payments',
  'pnj_mock_clinics',
  'pnj_mock_clinic_assignments',
  'pnj_mock_clinic_history',
  'pnj_mock_laboratories',
  'pnj_mock_laboratory_services',
  'pnj_mock_clinic_laboratory_connections',
  'pnj_mock_laboratory_history',
  'clinic_owner_associate_dentists_v1',
  'pnj_mock_staff_members',
  'pnj_mock_deleted_subscribers',
  'pnj_mock_deleted_subscriptions',
  'pnj_mock_deleted_payments',
  'pnj_mock_deleted_clinics',
  'pnj_mock_deleted_laboratories',
  'pnj_mock_deleted_plans',
  'pnj_cleanup_reg_2026_000002_sad_v1',
  'pnj_cleanup_reg_2026_000002_sad_v2',
  'pnj_mock_otp_records',
  'pnj_mock_notifications',
  'pnj_mock_notification_history',
  'pnj_mock_announcement_recipients',
  'pnj_mock_activity_logs',
  'pnj_mock_audit_logs',
  'pnj_mock_audit_integrity_state',
  'pnj_mock_audit_alerts'
] as const;

const nowIso = () => new Date().toISOString();
const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
const safeName = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'backup';

const safeRead = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
};
const safeWrite = <T,>(key: string, value: T) => localStorage.setItem(key, JSON.stringify(value));
const safeRemove = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
};

const registry: BackupModuleDefinition[] = [
  { key: 'settings', label: 'Platform Settings', storageKeys: ['pnj_mock_platform_settings', 'pnj_mock_platform_settings_history'], restoreOrder: 1, dependencies: [] },
  { key: 'plans', label: 'Plans', storageKeys: ['pnj_mock_plans', 'pnj_mock_plan_history'], restoreOrder: 2, dependencies: [] },
  { key: 'subscribers', label: 'Subscribers', storageKeys: ['pnj_mock_subscribers'], restoreOrder: 3, dependencies: ['plans'] },
  { key: 'users', label: 'Users', storageKeys: ['pnj_mock_platform_users', 'pnj_mock_users'], restoreOrder: 4, dependencies: ['subscribers'] },
  { key: 'registrations', label: 'Registrations', storageKeys: ['pnj_mock_registrations', 'registrations'], restoreOrder: 5, dependencies: ['plans'] },
  { key: 'subscriptions', label: 'Subscriptions', storageKeys: ['pnj_mock_subscriptions', 'pnj_mock_subscription_history'], restoreOrder: 6, dependencies: ['subscribers', 'plans'] },
  { key: 'payments', label: 'Payments', storageKeys: ['pnj_mock_payments', 'pnj_mock_payment_allocations', 'payments'], restoreOrder: 7, dependencies: ['subscribers', 'registrations'] },
  { key: 'clinics', label: 'Clinics', storageKeys: ['pnj_mock_clinics', 'pnj_mock_clinic_assignments', 'pnj_mock_clinic_history'], restoreOrder: 8, dependencies: ['subscribers', 'users'] },
  { key: 'laboratories', label: 'Laboratories', storageKeys: ['pnj_mock_laboratories', 'pnj_mock_laboratory_services', 'pnj_mock_clinic_laboratory_connections', 'pnj_mock_laboratory_history'], restoreOrder: 9, dependencies: ['subscribers', 'clinics'] },
  { key: 'branch_workspace', label: 'Branch Workspace Data', storageKeys: ['clinic-subsystem:patient-directory:v1', 'masterFileModifyPdfSettings'], restoreOrder: 10, dependencies: ['clinics'] },
  { key: 'announcements', label: 'Announcements', storageKeys: ['pnj_mock_announcements', 'pnj_mock_announcement_recipients', 'pnj_mock_announcement_history'], restoreOrder: 11, dependencies: ['users'] },
  { key: 'notifications', label: 'Notifications', storageKeys: ['pnj_mock_notifications', 'pnj_mock_notification_preferences', 'pnj_mock_notification_history'], restoreOrder: 12, dependencies: ['users', 'announcements'] },
  { key: 'activity_logs', label: 'Activity Logs', storageKeys: ['pnj_mock_activity_logs'], restoreOrder: 13, dependencies: [] },
  { key: 'audit_logs', label: 'Audit Logs', storageKeys: ['pnj_mock_audit_logs', 'pnj_mock_audit_integrity_state', 'pnj_mock_audit_settings', 'pnj_mock_audit_alerts'], restoreOrder: 14, dependencies: [] },
  { key: 'analytics_saved_views', label: 'Analytics Saved Views', storageKeys: ['pnj_mock_saved_report_views', 'pnj_mock_analytics_filter_state'], restoreOrder: 15, dependencies: [] }
];

const dynamicStorageKeysForModule = (moduleKey: string): string[] => {
  if (typeof localStorage === 'undefined' || moduleKey !== 'branch_workspace') return [];
  const prefixes = [
    'pnj_mock_branch_settings_',
    'clinicDentalChart:',
    'clinicDentalCharts:',
    'clinicBillPayments:',
    'clinicProgressNotes:',
    'clinicAppointments:',
    'clinicDentalRecalls:',
    'clinicPrescriptions:',
    'clinicCertificates:',
    'patientContractForm:',
    'clinicUploads:',
    'clinicUploadXrays:',
    'clinicScratchpad:',
    'clinicFollowup:',
    'clinicContractForm:',
    'clinicPatientForms:',
    'clinicTreatmentRecords:',
    'addPatientDraft:'
  ];
  return Object.keys(localStorage).filter(key => prefixes.some(prefix => key.startsWith(prefix)));
};

const storageKeysForModule = (module: BackupModuleDefinition): string[] =>
  Array.from(new Set([...module.storageKeys, ...dynamicStorageKeysForModule(module.key)]));

const stableStringify = (value: unknown): string => {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  return `{${Object.keys(value as Record<string, unknown>).sort().map(key => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`).join(',')}}`;
};
const checksum = (value: unknown) => {
  const text = stableStringify(value);
  let hash = 5381;
  for (let index = 0; index < text.length; index += 1) hash = ((hash << 5) + hash) ^ text.charCodeAt(index);
  return `BKP-${(hash >>> 0).toString(16).padStart(8, '0')}`;
};
const sensitive = (key: string) => ['password', 'passwordhash', 'temppassword', 'temporarypassword', 'otp', 'token', 'secret', 'apikey', 'cvv', 'cardnumber', 'servicerolekey'].some(pattern => key.toLowerCase().replace(/[^a-z0-9]/g, '').includes(pattern));
const redact = (value: unknown, depth = 0): unknown => {
  if (depth > 4) return '[TRUNCATED]';
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(item => redact(item, depth + 1));
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, sensitive(key) ? '[REDACTED]' : redact(item, depth + 1)]));
};
const readKey = (key: string): unknown => SESSION_KEYS.includes(key) ? undefined : redact(safeRead<unknown>(key, []));
const countValue = (value: unknown) => Array.isArray(value) ? value.length : value && typeof value === 'object' ? Object.keys(value as Record<string, unknown>).length : value == null ? 0 : 1;
const modulesByKeys = (modules: string[]) => registry.filter(item => modules.includes(item.key)).sort((a, b) => a.restoreOrder - b.restoreOrder);
const defaultModules = () => registry.map(item => item.key);

const writeHistory = (record: RestoreHistoryRecord) => safeWrite(RESTORE_HISTORY_KEY, [record, ...mockBackupRestoreService.getRestoreHistory()]);

const collectData = (modules: string[]) => {
  const data: Record<string, Record<string, unknown>> = {};
  const recordCounts: Record<string, number> = {};
  const storageKeys: string[] = [];
  modulesByKeys(modules).forEach(module => {
    data[module.key] = {};
    let count = 0;
    storageKeysForModule(module).forEach(key => {
      if (SESSION_KEYS.includes(key)) return;
      const value = readKey(key);
      data[module.key][key] = value;
      storageKeys.push(key);
      count += countValue(value);
    });
    recordCounts[module.key] = count;
  });
  return { data, recordCounts, storageKeys };
};

const createPayload = (modules: string[], backupType: BackupType, description: string, source = 'manual'): BackupPayload => {
  const { data, recordCounts, storageKeys } = collectData(modules);
  const manifestBase = {
    id: makeId('BKP'),
    backupNumber: `BKP-${String(mockBackupRestoreService.getRestoreHistory().length + 1).padStart(6, '0')}`,
    formatVersion: FORMAT_VERSION,
    schemaVersion: SCHEMA_VERSION,
    applicationVersion: 'mock-m1b.4d',
    environment: 'mock_frontend' as const,
    createdAt: nowIso(),
    createdBy: 'platform_owner',
    backupType,
    includedModules: modulesByKeys(modules).map(item => item.key),
    recordCounts,
    storageKeys,
    checksum: '',
    description,
    fileName: `pnj-dental-mock-backup-${safeName(description || backupType)}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
    sizeBytes: 0,
    source,
    warnings: ['Prototype backup only. Excludes active session and redacts sensitive field names.']
  };
  const payload = { manifest: manifestBase, data };
  payload.manifest.checksum = checksum(data);
  payload.manifest.sizeBytes = new Blob([JSON.stringify(payload)]).size;
  return payload;
};

export const mockBackupRestoreService = {
  moduleRegistry: () => registry,
  createBackup: (modules = defaultModules(), backupType: BackupType = 'selected_modules', description = 'Manual backup'): BackupResult<BackupPayload> => {
    const payload = createPayload(modules, backupType, description);
    mockBackupRestoreService.createRestorePoint(payload, backupType === 'pre_restore_checkpoint' ? 'pre_restore' : backupType === 'pre_reset_checkpoint' ? 'pre_reset' : 'manual', description);
    writeHistory({ id: makeId('RH'), restoreHistoryNumber: `RH-${String(mockBackupRestoreService.getRestoreHistory().length + 1).padStart(6, '0')}`, backupId: payload.manifest.id, action: 'backup_created', modules: payload.manifest.includedModules, createdAt: nowIso(), actor: 'platform_owner', result: 'success', summary: `${payload.manifest.backupType} backup created.`, warnings: payload.manifest.warnings });
    mockAuditService.appendAuditEvent({ action: 'backup.created', category: 'data_restore', module: 'data_restore', targetType: 'backup', targetId: payload.manifest.id, summary: `Backup ${payload.manifest.backupNumber} created.`, metadata: { modules: payload.manifest.includedModules, checksum: payload.manifest.checksum }, severity: 'low' });
    return { ok: true, data: payload };
  },
  createFullBackup: (description = 'Full local prototype backup') => mockBackupRestoreService.createBackup(defaultModules(), 'full', description),
  createSelectedModuleBackup: (modules: string[], description = 'Selected module backup') => mockBackupRestoreService.createBackup(modules, 'selected_modules', description),
  createSettingsBackup: () => mockBackupRestoreService.createBackup(['settings'], 'settings_only', 'Settings only backup'),
  createPreRestoreCheckpoint: () => mockBackupRestoreService.createBackup(defaultModules(), 'pre_restore_checkpoint', 'Automatic pre-restore checkpoint'),
  createPreResetCheckpoint: () => mockBackupRestoreService.createBackup(defaultModules(), 'pre_reset_checkpoint', 'Automatic pre-reset checkpoint'),
  serializeBackup: (payload: BackupPayload) => JSON.stringify(payload, null, 2),
  downloadBackupFile: (payload: BackupPayload) => {
    const blob = new Blob([mockBackupRestoreService.serializeBackup(payload)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = payload.manifest.fileName;
    link.click();
    URL.revokeObjectURL(link.href);
  },
  parseBackupFile: (text: string): BackupResult<BackupPayload> => {
    try {
      return mockBackupRestoreService.validateBackup(JSON.parse(text));
    } catch {
      return { ok: false, error: 'Backup file is not valid JSON.' };
    }
  },
  validateManifest: (manifest: BackupManifest): BackupResult<BackupManifest> => {
    if (!manifest || manifest.formatVersion !== FORMAT_VERSION) return { ok: false, error: 'Unsupported backup format.' };
    if (manifest.schemaVersion !== SCHEMA_VERSION) return { ok: false, error: 'Unsupported backup schema version.' };
    const unknown = manifest.includedModules.filter(module => !registry.some(item => item.key === module));
    if (unknown.length) return { ok: false, error: `Unknown module(s): ${unknown.join(', ')}` };
    return { ok: true, data: manifest };
  },
  validateSchemaVersion: (payload: BackupPayload) => payload.manifest.schemaVersion === SCHEMA_VERSION,
  calculateBackupChecksum: (payload: BackupPayload) => checksum(payload.data),
  verifyBackupChecksum: (payload: BackupPayload) => payload.manifest.checksum === mockBackupRestoreService.calculateBackupChecksum(payload),
  validateBackup: (payload: unknown): BackupResult<BackupPayload> => {
    if (!payload || typeof payload !== 'object') return { ok: false, error: 'Backup must be an object with manifest and data.' };
    const candidate = payload as BackupPayload;
    const manifestResult = mockBackupRestoreService.validateManifest(candidate.manifest);
    if (!manifestResult.ok) return { ok: false, error: manifestResult.error };
    if (!candidate.data || typeof candidate.data !== 'object') return { ok: false, error: 'Backup data section is missing.' };
    if (!mockBackupRestoreService.verifyBackupChecksum(candidate)) return { ok: false, error: 'Backup checksum is invalid.' };
    const serialized = JSON.stringify(candidate);
    if (/passwordHash|temporaryPassword|otpCode|accessToken|refreshToken|serviceRoleKey|cardNumber|cvv/i.test(serialized) && !serialized.includes('[REDACTED]')) return { ok: false, error: 'Backup contains prohibited sensitive fields.' };
    return { ok: true, data: candidate };
  },
  previewRestore: (payload: BackupPayload, modules = payload.manifest.includedModules, mode: RestoreMode = 'replace'): RestorePreview => {
    const selected = modulesByKeys(modules);
    const blockingIssues: string[] = [];
    const modulePreviews = selected.map(module => {
      const missingDependencies = module.dependencies.filter(dep => !modules.includes(dep) && !payload.manifest.includedModules.includes(dep));
      const backupRecordCount = Object.values(payload.data[module.key] || {}).reduce<number>((sum, value) => sum + countValue(value), 0);
      const existingRecordCount = storageKeysForModule(module).reduce((sum, key) => sum + countValue(safeRead<unknown>(key, [])), 0);
      if (missingDependencies.length) blockingIssues.push(`${module.label} requires ${missingDependencies.join(', ')}.`);
      return { module: module.key, label: module.label, existingRecordCount, backupRecordCount, recordsToAdd: Math.max(0, backupRecordCount - existingRecordCount), recordsToUpdate: mode === 'merge_update' ? Math.min(existingRecordCount, backupRecordCount) : mode === 'replace' ? backupRecordCount : 0, recordsToPreserve: mode === 'merge_preserve' ? existingRecordCount : 0, conflicts: mode === 'merge_preserve' ? Math.min(existingRecordCount, backupRecordCount) : 0, invalidRecords: 0, missingDependencies, warnings: missingDependencies.length ? ['Missing dependency selected for restore.'] : [], blocking: missingDependencies.length > 0 };
    });
    mockAuditService.appendAuditEvent({ eventKey: `restore-preview-${payload.manifest.id}-${modules.join('-')}-${mode}`, action: 'restore.previewed', category: 'data_restore', module: 'data_restore', targetType: 'backup', targetId: payload.manifest.id, summary: 'Restore preview generated.', metadata: { modules, mode }, severity: blockingIssues.length ? 'medium' : 'low' });
    return { mode, modules: modulePreviews, totalExisting: modulePreviews.reduce((sum, item) => sum + item.existingRecordCount, 0), totalBackup: modulePreviews.reduce((sum, item) => sum + item.backupRecordCount, 0), blockingIssues, warnings: modulePreviews.flatMap(item => item.warnings), checkpointWillBeCreated: true };
  },
  restoreFullBackup: (payload: BackupPayload) => mockBackupRestoreService.restoreSelectedModules(payload, payload.manifest.includedModules, 'replace'),
  restoreSelectedModules: (payload: BackupPayload, modules: string[], mode: RestoreMode = 'replace'): BackupResult<RestorePreview> => {
    const validation = mockBackupRestoreService.validateBackup(payload);
    if (!validation.ok) return { ok: false, error: validation.error };
    const preview = mockBackupRestoreService.previewRestore(payload, modules, mode);
    if (preview.blockingIssues.length) return { ok: false, error: preview.blockingIssues.join(' ') };
    const checkpoint = mockBackupRestoreService.createPreRestoreCheckpoint().data;
    try {
      modulesByKeys(modules).forEach(module => {
        const moduleData = payload.data[module.key] || {};
        storageKeysForModule(module).forEach(key => {
          if (SESSION_KEYS.includes(key) || typeof moduleData[key] === 'undefined') return;
          if (mode === 'replace') safeWrite(key, moduleData[key]);
          else {
            const current = safeRead<unknown>(key, []);
            if (Array.isArray(current) && Array.isArray(moduleData[key])) {
              const map = new Map<string, unknown>();
              current.forEach(item => map.set(String((item as { id?: string }).id || Math.random()), item));
              (moduleData[key] as unknown[]).forEach(item => {
                const id = String((item as { id?: string }).id || Math.random());
                if (mode === 'merge_update' || !map.has(id)) map.set(id, item);
              });
              safeWrite(key, [...map.values()]);
            } else if (mode === 'merge_update') safeWrite(key, { ...(current as object), ...(moduleData[key] as object) });
          }
        });
      });
      mockBackupRestoreService.reconcileRestoredData();
      writeHistory({ id: makeId('RH'), restoreHistoryNumber: `RH-${String(mockBackupRestoreService.getRestoreHistory().length + 1).padStart(6, '0')}`, restorePointId: checkpoint?.manifest.id, backupId: payload.manifest.id, action: 'restore_completed', mode, modules, createdAt: nowIso(), actor: 'platform_owner', result: 'success', summary: `Restored ${modules.length} module(s).`, warnings: preview.warnings });
      mockAuditService.appendAuditEvent({ action: 'restore.completed', category: 'data_restore', module: 'data_restore', targetType: 'backup', targetId: payload.manifest.id, summary: 'Prototype restore completed.', metadata: { modules, mode, checkpoint: checkpoint?.manifest.id }, severity: 'medium' });
      mockNotificationService.createSystemNotification({ eventKey: `restore-completed-${payload.manifest.id}-${modules.join('-')}`, category: 'system', sourceModule: 'data_restore', title: 'Restore completed', message: `Restored ${modules.length} module(s) in the local prototype.`, priority: 'normal', actionUrl: '/platform/data-restore/history', actionLabel: 'View Restore History' });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('DATA_RESTORE_COMPLETED', { detail: { action: 'restore', timestamp: nowIso() } }));
      }
      return { ok: true, data: preview };
    } catch (error) {
      writeHistory({ id: makeId('RH'), restoreHistoryNumber: `RH-${String(mockBackupRestoreService.getRestoreHistory().length + 1).padStart(6, '0')}`, backupId: payload.manifest.id, action: 'restore_failed', mode, modules, createdAt: nowIso(), actor: 'platform_owner', result: 'failure', summary: 'Restore failed.', warnings: [String(error)] });
      mockNotificationService.createSystemNotification({ eventKey: `restore-failed-${payload.manifest.id}`, category: 'system', sourceModule: 'data_restore', title: 'Restore failed', message: 'A local prototype restore failed. Pre-restore checkpoint was preserved.', priority: 'urgent', actionUrl: '/platform/data-restore/history', actionLabel: 'View Restore History' });
      return { ok: false, error: 'Restore failed. Pre-restore checkpoint was preserved.' };
    }
  },
  createRestorePoint: (payload: BackupPayload, type: RestorePoint['type'] = 'manual', name = 'Manual restore point'): BackupResult<RestorePoint> => {
    const settings = mockPlatformSettingsService.getSettings();
    const max = settings.auditData.maximumLocalRestorePoints || MAX_RESTORE_POINTS_FALLBACK;
    const existing = mockBackupRestoreService.listRestorePoints().filter(item => item.status !== 'deleted');
    const point: RestorePoint = { id: makeId('RP'), restorePointNumber: `RP-${String(existing.length + 1).padStart(6, '0')}`, name, description: payload.manifest.description, type, createdAt: nowIso(), createdBy: 'platform_owner', sourceBackupId: payload.manifest.id, includedModules: payload.manifest.includedModules, recordCounts: payload.manifest.recordCounts, payload, checksum: payload.manifest.checksum, sizeBytes: payload.manifest.sizeBytes, status: 'available' };
    const retained = existing.length >= max ? existing.slice(0, max - 1) : existing;
    safeWrite(RESTORE_POINTS_KEY, [point, ...retained]);
    return { ok: true, data: point };
  },
  listRestorePoints: () => safeRead<RestorePoint[]>(RESTORE_POINTS_KEY, []),
  getRestorePointById: (id: string) => mockBackupRestoreService.listRestorePoints().find(item => item.id === id || item.restorePointNumber === id) || null,
  rollbackLatestRestore: (): BackupResult<RestorePreview> => {
    const point = mockBackupRestoreService.listRestorePoints().find(item => item.type === 'pre_restore' && item.status === 'available');
    if (!point) return { ok: false, error: 'No pre-restore checkpoint is available.' };
    const result = mockBackupRestoreService.restoreFullBackup(point.payload);
    if (result.ok) {
      safeWrite(RESTORE_POINTS_KEY, mockBackupRestoreService.listRestorePoints().map(item => item.id === point.id ? { ...item, status: 'restored' } : item));
      writeHistory({ id: makeId('RH'), restoreHistoryNumber: `RH-${String(mockBackupRestoreService.getRestoreHistory().length + 1).padStart(6, '0')}`, restorePointId: point.id, action: 'rollback_completed', modules: point.includedModules, createdAt: nowIso(), actor: 'platform_owner', result: 'success', summary: 'Rollback completed from latest checkpoint.', warnings: [] });
      mockNotificationService.createSystemNotification({ eventKey: `rollback-completed-${point.id}`, category: 'system', sourceModule: 'data_restore', title: 'Rollback completed', message: 'Latest restore checkpoint was applied.', priority: 'high', actionUrl: '/platform/data-restore/history', actionLabel: 'View History' });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('DATA_RESTORE_COMPLETED', { detail: { action: 'rollback', timestamp: nowIso() } }));
      }
    }
    return result;
  },
  deleteLocalRestorePoint: (id: string): BackupResult<RestorePoint> => {
    const target = mockBackupRestoreService.getRestorePointById(id);
    if (!target) return { ok: false, error: 'Restore point not found.' };
    safeWrite(RESTORE_POINTS_KEY, mockBackupRestoreService.listRestorePoints().map(item => item.id === target.id ? { ...item, status: 'deleted' } : item));
    writeHistory({ id: makeId('RH'), restoreHistoryNumber: `RH-${String(mockBackupRestoreService.getRestoreHistory().length + 1).padStart(6, '0')}`, restorePointId: target.id, action: 'restore_point_deleted', modules: target.includedModules, createdAt: nowIso(), actor: 'platform_owner', result: 'success', summary: `${target.restorePointNumber} deleted locally.`, warnings: [] });
    return { ok: true, data: target };
  },
  reconcileRestoredData: () => {
    mockPlatformSettingsService.initializeSettings();
    mockPlanService.initializePlans();
    mockPlatformManagementService.ensureSeedData();
    mockSubscriptionService.initializeSubscriptions();
    mockPaymentService.initializePayments();
    mockClinicService.initializeClinics();
    mockLaboratoryService.initializeLaboratories();
    mockNotificationService.initializeNotifications();
    mockAnnouncementService.initializeAnnouncements();
    mockAuditService.initializeAuditLogs();
  },
  getBackupSummary: (): BackupSummary => {
    const history = mockBackupRestoreService.getRestoreHistory();
    const points = mockBackupRestoreService.listRestorePoints().filter(item => item.status === 'available');
    const latestBackup = history.find(item => item.action === 'backup_created');
    const latestRestore = history.find(item => item.action === 'restore_completed' || item.action === 'rollback_completed');
    const total = registry.reduce((sum, module) => sum + storageKeysForModule(module).reduce((inner, key) => inner + countValue(safeRead<unknown>(key, [])), 0), 0);
    const integrityWarnings = mockAuditService.verifyAuditChain().issues.length;
    return { lastBackup: latestBackup?.createdAt, availableRestorePoints: points.length, totalPrototypeRecords: total, lastRestore: latestRestore?.createdAt, integrityWarnings, currentBackupFormat: FORMAT_VERSION, currentSchemaVersion: SCHEMA_VERSION };
  },
  getRestoreHistory: () => safeRead<RestoreHistoryRecord[]>(RESTORE_HISTORY_KEY, []),
  staleSafePurge: (typedConfirmation: string): BackupResult<boolean> => {
    if (typedConfirmation !== STALE_SAFE_PURGE_CONFIRMATION) {
      return { ok: false, error: `Type ${STALE_SAFE_PURGE_CONFIRMATION} to confirm.` };
    }

    const checkpoint = mockBackupRestoreService.createBackup(
      ['plans', 'subscribers', 'users', 'registrations', 'subscriptions', 'payments', 'clinics', 'laboratories', 'branch_workspace', 'notifications', 'activity_logs', 'audit_logs'],
      'selected_modules',
      'Automatic stale-safe purge checkpoint'
    );
    const preservedRestorePoints = mockBackupRestoreService.listRestorePoints();
    const checkpointPoint = preservedRestorePoints.find(point => point.sourceBackupId === checkpoint.data?.manifest.id);
    const preservedPlatformAuthUsers = safeRead<Array<Record<string, unknown>>>('pnj_mock_users', [])
      .filter(user => String(user.role || '') === 'platform_owner');

    STALE_SAFE_PURGE_KEYS.forEach(key => safeRemove(key));
    dynamicStorageKeysForModule('branch_workspace').forEach(key => safeRemove(key));

    if (preservedPlatformAuthUsers.length) {
      safeWrite('pnj_mock_users', preservedPlatformAuthUsers);
    }

    mockBackupRestoreService.reconcileRestoredData();
    safeWrite(RESTORE_POINTS_KEY, preservedRestorePoints);
    writeHistory({
      id: makeId('RH'),
      restoreHistoryNumber: `RH-${String(mockBackupRestoreService.getRestoreHistory().length + 1).padStart(6, '0')}`,
      restorePointId: checkpointPoint?.id,
      backupId: checkpoint.data?.manifest.id,
      action: 'stale_safe_purge_completed',
      modules: ['plans', 'subscribers', 'users', 'registrations', 'subscriptions', 'payments', 'clinics', 'laboratories', 'branch_workspace', 'notifications', 'activity_logs', 'audit_logs'],
      createdAt: nowIso(),
      actor: 'platform_owner',
      result: 'warning',
      summary: 'Stale-safe purge completed for onboarding and platform operational ledgers.',
      warnings: ['Platform admin access, settings baseline, and restore history were preserved.']
    });
    mockAuditService.appendAuditEvent({
      action: 'mock_data.stale_safe_purge',
      category: 'data_restore',
      module: 'data_restore',
      targetType: 'prototype_dataset',
      summary: 'Stale-safe purge cleared platform operational ledgers and linked branch workspace data.',
      severity: 'high'
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('DATA_RESTORE_COMPLETED', { detail: { action: 'stale-safe-purge', timestamp: nowIso() } }));
    }
    return { ok: true, data: true };
  },
  resetMockData: (typedConfirmation: string): BackupResult<boolean> => {
    if (typedConfirmation !== 'RESET MOCK DATA') return { ok: false, error: 'Type RESET MOCK DATA to confirm.' };
    const checkpoint = mockBackupRestoreService.createPreResetCheckpoint();
    const preservedRestorePoints = mockBackupRestoreService.listRestorePoints();
    const checkpointPoint = preservedRestorePoints.find(point => point.sourceBackupId === checkpoint.data?.manifest.id);
    Object.keys(localStorage).filter(key => !SESSION_KEYS.includes(key)).forEach(key => localStorage.removeItem(key));
    mockBackupRestoreService.reconcileRestoredData();
    safeWrite(RESTORE_POINTS_KEY, preservedRestorePoints);
    writeHistory({ id: makeId('RH'), restoreHistoryNumber: 'RH-000001', restorePointId: checkpointPoint?.id, backupId: checkpoint.data?.manifest.id, action: 'reset_completed', modules: defaultModules(), createdAt: nowIso(), actor: 'platform_owner', result: 'warning', summary: 'Prototype mock data reset after typed confirmation.', warnings: ['A pre-reset checkpoint was created before clearing local data.'] });
    mockAuditService.appendAuditEvent({ action: 'mock_data.reset', category: 'data_restore', module: 'data_restore', targetType: 'prototype_dataset', summary: 'Prototype data reset through Data Restore module.', severity: 'high' });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('DATA_RESTORE_COMPLETED', { detail: { action: 'reset', timestamp: nowIso() } }));
    }
    return { ok: true, data: true };
  },
  getStorageFootprint: () => {
    let totalBytes = 0;
    const moduleBytes: Record<string, { label: string; bytes: number; recordCount: number }> = {};
    
    registry.forEach(mod => {
      let modBytes = 0;
      let records = 0;
      storageKeysForModule(mod).forEach(key => {
        const raw = localStorage.getItem(key) || '';
        const b = new Blob([raw]).size;
        modBytes += b;
        records += countValue(safeRead<unknown>(key, []));
      });
      moduleBytes[mod.key] = { label: mod.label, bytes: modBytes, recordCount: records };
      totalBytes += modBytes;
    });

    return {
      totalBytes,
      totalFormatted: totalBytes < 1024 * 1024 
        ? `${(totalBytes / 1024).toFixed(1)} KB` 
        : `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`,
      moduleBytes
    };
  },
  ensureInitialRestorePoints: () => {
    const existing = mockBackupRestoreService.listRestorePoints();
    if (existing.length === 0) {
      mockBackupRestoreService.createFullBackup('Initial Genesis System Baseline');
    }
  },
  exportRestoreHistory: () => ['History ID,Action,Modules,Result,Created At,Summary', ...mockBackupRestoreService.getRestoreHistory().map(item => [item.restoreHistoryNumber, item.action, item.modules.join('|'), item.result, item.createdAt, item.summary].map(value => `"${String(value).replaceAll('"', '""')}"`).join(','))].join('\n')
};
