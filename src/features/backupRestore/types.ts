export type BackupType = 'full' | 'selected_modules' | 'settings_only' | 'pre_restore_checkpoint' | 'pre_reset_checkpoint';
export type RestorePointType = 'manual' | 'pre_restore' | 'pre_reset';
export type RestorePointStatus = 'available' | 'restored' | 'invalid' | 'deleted';
export type RestoreMode = 'replace' | 'merge_preserve' | 'merge_update';

export interface BackupModuleDefinition {
  key: string;
  label: string;
  storageKeys: string[];
  restoreOrder: number;
  dependencies: string[];
}

export interface BackupManifest {
  id: string;
  backupNumber: string;
  formatVersion: 'pnj-mock-backup-v1';
  schemaVersion: 1;
  applicationVersion: string;
  environment: 'mock_frontend';
  createdAt: string;
  createdBy: string;
  backupType: BackupType;
  includedModules: string[];
  recordCounts: Record<string, number>;
  storageKeys: string[];
  checksum: string;
  description: string;
  fileName: string;
  sizeBytes: number;
  source: string;
  warnings: string[];
}

export interface BackupPayload {
  manifest: BackupManifest;
  data: Record<string, Record<string, unknown>>;
}

export interface RestorePoint {
  id: string;
  restorePointNumber: string;
  name: string;
  description: string;
  type: RestorePointType;
  createdAt: string;
  createdBy: string;
  sourceBackupId?: string;
  includedModules: string[];
  recordCounts: Record<string, number>;
  payload: BackupPayload;
  checksum: string;
  sizeBytes: number;
  status: RestorePointStatus;
}

export interface RestoreHistoryRecord {
  id: string;
  restoreHistoryNumber: string;
  restorePointId?: string;
  backupId?: string;
  action: 'backup_created' | 'restore_previewed' | 'restore_completed' | 'restore_failed' | 'rollback_completed' | 'restore_point_deleted' | 'reset_completed' | 'stale_safe_purge_completed';
  mode?: RestoreMode;
  modules: string[];
  createdAt: string;
  actor: string;
  result: 'success' | 'failure' | 'warning';
  summary: string;
  warnings: string[];
}

export interface RestorePreviewModule {
  module: string;
  label: string;
  existingRecordCount: number;
  backupRecordCount: number;
  recordsToAdd: number;
  recordsToUpdate: number;
  recordsToPreserve: number;
  conflicts: number;
  invalidRecords: number;
  missingDependencies: string[];
  warnings: string[];
  blocking: boolean;
}

export interface RestorePreview {
  mode: RestoreMode;
  modules: RestorePreviewModule[];
  totalExisting: number;
  totalBackup: number;
  blockingIssues: string[];
  warnings: string[];
  checkpointWillBeCreated: boolean;
}

export interface BackupSummary {
  lastBackup?: string;
  availableRestorePoints: number;
  totalPrototypeRecords: number;
  lastRestore?: string;
  integrityWarnings: number;
  currentBackupFormat: string;
  currentSchemaVersion: number;
}

export interface BackupResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}
