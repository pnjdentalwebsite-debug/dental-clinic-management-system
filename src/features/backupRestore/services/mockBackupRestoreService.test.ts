import { beforeEach, describe, expect, it } from 'vitest';
import { mockPlatformSettingsService } from '../../platformSettings/services/mockPlatformSettingsService';
import { mockBackupRestoreService } from './mockBackupRestoreService';
import type { BackupPayload } from '../types';

describe('mockBackupRestoreService', () => {
  beforeEach(() => {
    localStorage.clear();
    mockPlatformSettingsService.initializeSettings();
  });

  it('creates local backups with manifest, checksum, restore point, and redaction', () => {
    localStorage.setItem('pnj_mock_users', JSON.stringify([{ id: 'user-1', passwordHash: 'secret', name: 'Unit User' }]));
    localStorage.setItem('pnj_mock_session', JSON.stringify({ token: 'active-session' }));
    const result = mockBackupRestoreService.createSelectedModuleBackup(['users'], 'Users backup');
    expect(result.ok).toBe(true);
    expect(result.data?.manifest.formatVersion).toBe('pnj-mock-backup-v1');
    expect(mockBackupRestoreService.verifyBackupChecksum(result.data!)).toBe(true);
    expect(JSON.stringify(result.data)).toContain('[REDACTED]');
    expect(result.data?.manifest.storageKeys).not.toContain('pnj_mock_session');
    expect(mockBackupRestoreService.listRestorePoints()).toHaveLength(1);
  });

  it('rejects invalid JSON, schema mismatches, and checksum tampering', () => {
    expect(mockBackupRestoreService.parseBackupFile('{bad json').ok).toBe(false);
    const payload = mockBackupRestoreService.createSettingsBackup().data!;
    const tampered: BackupPayload = { ...payload, data: { ...payload.data, settings: { ...payload.data.settings, pnj_mock_platform_settings: { tampered: true } } } };
    expect(mockBackupRestoreService.validateBackup(tampered).ok).toBe(false);
    expect(mockBackupRestoreService.validateManifest({ ...payload.manifest, schemaVersion: 999 as 1 }).ok).toBe(false);
  });

  it('previews and restores selected modules after creating a checkpoint', () => {
    localStorage.setItem('pnj_mock_platform_settings', JSON.stringify({ general: { platformName: 'Before Restore' } }));
    const backup = mockBackupRestoreService.createSettingsBackup().data!;
    const storedSettings = backup.data.settings.pnj_mock_platform_settings as { general: { platformName: string } };
    storedSettings.general.platformName = 'Restored Platform';
    backup.manifest.checksum = mockBackupRestoreService.calculateBackupChecksum(backup);
    const preview = mockBackupRestoreService.previewRestore(backup, ['settings'], 'replace');
    expect(preview.modules[0].backupRecordCount).toBeGreaterThan(0);
    const restored = mockBackupRestoreService.restoreSelectedModules(backup, ['settings'], 'replace');
    expect(restored.ok).toBe(true);
    expect(mockPlatformSettingsService.getSettings().general.platformName).toBe('Restored Platform');
    expect(mockBackupRestoreService.listRestorePoints().some(point => point.type === 'pre_restore')).toBe(true);
  });

  it('enforces restore point retention from platform settings', () => {
    mockPlatformSettingsService.updateSettingsGroup('auditData', { maximumLocalRestorePoints: 2 });
    mockBackupRestoreService.createSettingsBackup();
    mockBackupRestoreService.createSettingsBackup();
    mockBackupRestoreService.createSettingsBackup();
    expect(mockBackupRestoreService.listRestorePoints().filter(point => point.status !== 'deleted')).toHaveLength(2);
  });

  it('requires typed reset confirmation and preserves a pre-reset checkpoint', () => {
    expect(mockBackupRestoreService.resetMockData('reset').ok).toBe(false);
    localStorage.setItem('pnj_mock_users', JSON.stringify([{ id: 'user-reset' }]));
    const result = mockBackupRestoreService.resetMockData('RESET MOCK DATA');
    expect(result.ok).toBe(true);
    expect(mockBackupRestoreService.listRestorePoints().some(point => point.type === 'pre_reset')).toBe(true);
    expect(mockBackupRestoreService.getRestoreHistory()[0].action).toBe('reset_completed');
  });
});
