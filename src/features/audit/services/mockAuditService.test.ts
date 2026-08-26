import { beforeEach, describe, expect, it } from 'vitest';
import { mockAuditService } from './mockAuditService';

describe('mockAuditService', () => {
  beforeEach(() => localStorage.clear());

  it('appends audit events with immutable chain hashes', () => {
    mockAuditService.initializeAuditLogs();
    const before = mockAuditService.listAuditEvents().length;
    const event = mockAuditService.appendAuditEvent({ action: 'plan.updated', category: 'plan', module: 'plans', targetType: 'plan', targetId: 'plan-basic', summary: 'Plan updated.' }).data!;
    expect(mockAuditService.listAuditEvents()).toHaveLength(before + 1);
    expect(event.integrityHash).toMatch(/^AUDH-/);
    expect(event.previousIntegrityHash).toMatch(/^AUDH-/);
    expect(mockAuditService.verifyAuditChain().invalidHashes).toBe(0);
  });

  it('redacts sensitive payloads before persistence', () => {
    const event = mockAuditService.appendAuditEvent({ action: 'auth.login.failure', category: 'authentication', summary: 'Failed login.', metadata: { password: 'secret', nested: { otpCode: '123456', visible: 'safe' } } }).data!;
    expect(event.metadata.password).toBe('[REDACTED]');
    expect((event.metadata.nested as Record<string, string>).otpCode).toBe('[REDACTED]');
    expect((event.metadata.nested as Record<string, string>).visible).toBe('safe');
  });

  it('creates safe snapshots and changed fields', () => {
    const event = mockAuditService.appendAuditEvent({ action: 'subscriber.suspended', category: 'subscriber', summary: 'Subscriber suspended.', beforeSnapshot: { status: 'active', passwordHash: 'hidden' }, afterSnapshot: { status: 'suspended', passwordHash: 'new-hidden' } }).data!;
    expect(event.beforeSnapshot?.passwordHash).toBe('[REDACTED]');
    expect(event.afterSnapshot?.passwordHash).toBe('[REDACTED]');
    expect(event.changedFields).toEqual(['status']);
  });

  it('groups correlated audit events', () => {
    const results = mockAuditService.createCorrelatedAuditEvents([
      { action: 'payment.approved', category: 'payment', summary: 'Payment approved.' },
      { action: 'registration.account_provisioned', category: 'registration', summary: 'Account provisioned.' }
    ], 'CORR-UNIT');
    expect(results.every(result => result.ok)).toBe(true);
    expect(mockAuditService.getEventsByCorrelationId('CORR-UNIT')).toHaveLength(2);
  });

  it('reconciles legacy activity logs without duplicates', () => {
    localStorage.setItem('pnj_mock_activity_logs', JSON.stringify([{ id: 'LOG-UNIT', timestamp: '1:00 PM 7/26/2026', event: 'Payment Approved', details: 'Legacy payment approved.', role: 'platform_owner' }]));
    mockAuditService.reconcileExistingActivityLogs();
    mockAuditService.reconcileExistingActivityLogs();
    expect(mockAuditService.listAuditEvents().filter(item => item.eventKey === 'legacy-activity-LOG-UNIT')).toHaveLength(1);
  });

  it('detects broken integrity chains without repairing them', () => {
    const event = mockAuditService.appendAuditEvent({ action: 'audit.integrity_checked', category: 'audit', summary: 'Integrity check.' }).data!;
    const tampered = mockAuditService.listAuditEvents().map(item => item.id === event.id ? { ...item, summary: 'Tampered summary' } : item);
    localStorage.setItem('pnj_mock_audit_logs', JSON.stringify(tampered));
    const report = mockAuditService.verifyAuditChain();
    expect(report.invalidHashes).toBeGreaterThan(0);
    expect(mockAuditService.getAuditEventById(event.id)?.summary).toBe('Tampered summary');
  });

  it('exports CSV and previews retention', () => {
    mockAuditService.appendAuditEvent({ action: 'audit.exported', category: 'audit', summary: 'Exported, with comma.' });
    const csv = mockAuditService.exportAuditEventsToCsv(mockAuditService.listAuditEvents());
    expect(csv).toContain('"Exported, with comma."');
    expect(mockAuditService.getRetentionPreview().destructiveExecutionAvailable).toBe(false);
  });

  it('detects suspicious failed login events and creates alerts', () => {
    for (let index = 0; index < 3; index += 1) {
      mockAuditService.appendAuditEvent({ eventKey: `failed-${index}`, action: 'auth.login.failure', category: 'authentication', result: 'failure', severity: 'medium', summary: 'Failed login.' });
    }
    expect(mockAuditService.detectSuspiciousEvents().some(alert => alert.ruleKey === 'multiple_failed_login_attempts')).toBe(true);
  });
});
