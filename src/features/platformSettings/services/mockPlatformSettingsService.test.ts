import { beforeEach, describe, expect, it } from 'vitest';
import { mockPlatformSettingsService } from './mockPlatformSettingsService';

describe('mockPlatformSettingsService', () => {
  beforeEach(() => localStorage.clear());

  it('seeds normalized defaults and keeps redaction locked on', () => {
    const settings = mockPlatformSettingsService.initializeSettings();
    expect(settings.regional.currency).toBe('PHP');
    expect(settings.security.sensitiveDataRedactionEnabled).toBe(true);
    expect(mockPlatformSettingsService.getSettings().features.data_restore).toBe('enabled');
  });

  it('updates groups through validation, audit, and history', () => {
    mockPlatformSettingsService.initializeSettings();
    const result = mockPlatformSettingsService.updateSettingsGroup('general', { platformName: 'Unit Dental Platform' }, 'Unit test change');
    expect(result.ok).toBe(true);
    expect(mockPlatformSettingsService.getSettings().general.platformName).toBe('Unit Dental Platform');
    expect(mockPlatformSettingsService.getSettingsHistory()[0].changedFields).toContain('platformName');
  });

  it('rejects unsafe or unsupported settings', () => {
    expect(mockPlatformSettingsService.updateSettingsGroup('security', { sensitiveDataRedactionEnabled: false } as never).ok).toBe(false);
    expect(mockPlatformSettingsService.updateSettingsGroup('regional', { currency: 'USD' } as never).ok).toBe(false);
    expect(mockPlatformSettingsService.updateSettingsGroup('auditData', { maximumLocalRestorePoints: 0 }).ok).toBe(false);
  });

  it('exports, validates, and imports settings with a checksum', () => {
    mockPlatformSettingsService.initializeSettings();
    const payload = mockPlatformSettingsService.exportSettings();
    expect(mockPlatformSettingsService.validateSettingsImport(payload).ok).toBe(true);
    payload.settings.general.platformName = 'Imported Unit Platform';
    payload.manifest.checksum = mockPlatformSettingsService.checksum(payload.settings);
    const imported = mockPlatformSettingsService.importSettings(payload);
    expect(imported.ok).toBe(true);
    expect(mockPlatformSettingsService.getSettings().general.platformName).toBe('Imported Unit Platform');
  });

  it('resets settings and evaluates feature and maintenance availability', () => {
    mockPlatformSettingsService.updateSettingsGroup('features', { data_restore: 'disabled' });
    expect(mockPlatformSettingsService.isFeatureAvailable('data_restore')).toBe(false);
    mockPlatformSettingsService.updateMaintenanceMode({ enabled: true, allowPlatformOwnerBypass: false, allowedRoutes: ['/login'] });
    expect(mockPlatformSettingsService.isMaintenanceActiveForRoute('/platform/dashboard', 'clinic_owner')).toBe(true);
    expect(mockPlatformSettingsService.resetAllSettings().ok).toBe(true);
    expect(mockPlatformSettingsService.getSettings().maintenance.enabled).toBe(false);
  });
});
