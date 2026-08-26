import { mockNotificationService } from '../../notifications/services/mockNotificationService';
import type { ActivityLogLike } from '../../platformManagement/types';
import type { AuditAppendInput, AuditCategory, AuditEvent, AuditFilters, AuditIntegrityReport, AuditResultEnvelope, AuditRetentionPreview, AuditSeverity, AuditSnapshotValue, AuditSort, AuditSuspiciousAlert } from '../types';

const AUDIT_LOGS_KEY = 'pnj_mock_audit_logs';
const INTEGRITY_STATE_KEY = 'pnj_mock_audit_integrity_state';
const SETTINGS_KEY = 'pnj_mock_audit_settings';
const ALERTS_KEY = 'pnj_mock_audit_alerts';
const ACTIVITY_KEY = 'pnj_mock_activity_logs';
const SESSION_KEY = 'pnj_mock_session';

const categories: AuditCategory[] = ['authentication', 'authorization', 'registration', 'subscriber', 'user', 'plan', 'subscription', 'payment', 'clinic', 'laboratory', 'announcement', 'notification', 'analytics', 'audit', 'data_restore', 'platform_settings', 'security', 'system', 'data_quality'];
const sensitivePatterns = ['password', 'temporarypassword', 'temppassword', 'passwordhash', 'newpassword', 'confirmpassword', 'otp', 'token', 'accesstoken', 'refreshtoken', 'secret', 'apikey', 'servicerolekey', 'cvv', 'cardnumber'];

const today = () => new Date().toISOString().split('T')[0];
const nowIso = () => new Date().toISOString();
const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
const correlationId = () => `CORR-${today().replaceAll('-', '')}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
const sessionId = () => {
  const session = safeRead<{ email?: string; role?: string; name?: string } | null>(SESSION_KEY, null);
  return session?.email ? `SESS-${session.email.toLowerCase()}` : 'SESS-anonymous-prototype';
};

const MAX_AUDIT_EVENTS = 1000;

const safeRead = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
};
const safeWrite = <T,>(key: string, value: T) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded or storage unavailable: trim the largest known collections and retry once.
    if (key === AUDIT_LOGS_KEY && Array.isArray(value)) {
      const trimmed = value.slice(0, 200);
      try {
        localStorage.setItem(key, JSON.stringify(trimmed));
        return;
      } catch {
        try {
          localStorage.removeItem(key);
        } catch {
          // ignore
        }
        return;
      }
    }
    if (key === ACTIVITY_KEY && Array.isArray(value)) {
      const trimmed = value.slice(0, 200);
      try {
        localStorage.setItem(key, JSON.stringify(trimmed));
        return;
      } catch {
        try {
          localStorage.removeItem(key);
        } catch {
          // ignore
        }
        return;
      }
    }
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
};
const readEvents = () => safeRead<AuditEvent[]>(AUDIT_LOGS_KEY, []);
const writeEvents = (records: AuditEvent[]) => safeWrite(AUDIT_LOGS_KEY, records.slice(0, MAX_AUDIT_EVENTS));
const readAlerts = () => safeRead<AuditSuspiciousAlert[]>(ALERTS_KEY, []);
const writeAlerts = (records: AuditSuspiciousAlert[]) => safeWrite(ALERTS_KEY, records);

const normalizeCategory = (category: string): AuditCategory => {
  const singular = category.replace(/_management$/, '').replace(/s$/, '') as AuditCategory;
  if (categories.includes(category as AuditCategory)) return category as AuditCategory;
  if (categories.includes(singular)) return singular;
  if (category.includes('payment')) return 'payment';
  if (category.includes('subscription')) return 'subscription';
  if (category.includes('registration')) return 'registration';
  if (category.includes('auth')) return 'authentication';
  return 'system';
};

const stableStringify = (value: unknown): string => {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  return `{${Object.keys(value as Record<string, unknown>).sort().map(key => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`).join(',')}}`;
};

const hashString = (value: string) => {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) hash = ((hash << 5) + hash) ^ value.charCodeAt(index);
  return `AUDH-${(hash >>> 0).toString(16).padStart(8, '0')}`;
};

const hashPayload = (event: Omit<AuditEvent, 'integrityHash'>) => stableStringify({
  id: event.id,
  auditNumber: event.auditNumber,
  eventKey: event.eventKey,
  correlationId: event.correlationId,
  timestamp: event.timestamp,
  actorId: event.actorId,
  action: event.action,
  category: event.category,
  module: event.module,
  targetType: event.targetType,
  targetId: event.targetId,
  result: event.result,
  severity: event.severity,
  actorName: event.actorName,
  actorRole: event.actorRole,
  summary: event.summary,
  description: event.description,
  beforeSnapshot: event.beforeSnapshot,
  afterSnapshot: event.afterSnapshot,
  changedFields: event.changedFields,
  metadata: event.metadata,
  previousIntegrityHash: event.previousIntegrityHash
});

const redactedKey = (key: string) => sensitivePatterns.some(pattern => key.toLowerCase().replace(/[^a-z0-9]/g, '').includes(pattern));

const toSafeValue = (value: unknown, depth = 0, seen = new WeakSet<object>()): AuditSnapshotValue => {
  if (depth > 3) return '[TRUNCATED]';
  if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) return value as AuditSnapshotValue;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'undefined' || typeof value === 'function' || typeof value === 'symbol') return null;
  if (typeof value === 'object') {
    if (seen.has(value)) return '[CIRCULAR]';
    seen.add(value);
    if (Array.isArray(value)) return value.slice(0, 20).map(item => toSafeValue(item, depth + 1, seen));
    const entries = Object.entries(value as Record<string, unknown>).slice(0, 40);
    return Object.fromEntries(entries.map(([key, item]) => [key, redactedKey(key) ? '[REDACTED]' : toSafeValue(item, depth + 1, seen)]));
  }
  return String(value);
};

const inferRoute = (targetType?: string, targetId?: string) => {
  if (!targetType || !targetId) return undefined;
  const routes: Record<string, string> = {
    subscriber: `/platform/subscribers/${targetId}`,
    user: `/platform/users/${targetId}`,
    plan: `/platform/plans/${targetId}`,
    subscription: `/platform/subscriptions/${targetId}`,
    payment: `/platform/payments/${targetId}`,
    clinic: `/platform/clinics/${targetId}`,
    laboratory: `/platform/laboratories/${targetId}`,
    announcement: `/platform/announcements/${targetId}`,
    notification: `/platform/notifications/${targetId}`,
    audit: `/platform/audit-logs/${targetId}`
  };
  return routes[targetType];
};

const currentActor = () => {
  const session = safeRead<{ email?: string; role?: string; name?: string } | null>(SESSION_KEY, null);
  if (!session) return { actorType: 'anonymous' as const, actorName: 'Anonymous Prototype Actor', actorRole: 'anonymous' as const };
  return {
    actorType: session.role === 'platform_owner' ? 'platform_user' as const : 'subscriber_user' as const,
    actorId: session.email,
    actorName: session.name || session.email || 'Unknown Prototype Actor',
    actorRole: session.role === 'platform_owner' ? 'platform_owner' as const : 'clinic_owner' as const
  };
};

const appendWithoutAlert = (input: AuditAppendInput): AuditEvent => {
  const records = readEvents();
  const existing = input.eventKey ? records.find(item => item.eventKey === input.eventKey) : undefined;
  if (existing) return existing;
  const actor = currentActor();
  const previous = records[0];
  const beforeSnapshot = input.beforeSnapshot ? mockAuditService.createSafeSnapshot(input.beforeSnapshot) : undefined;
  const afterSnapshot = input.afterSnapshot ? mockAuditService.createSafeSnapshot(input.afterSnapshot) : undefined;
  const changedFields = beforeSnapshot && afterSnapshot ? mockAuditService.calculateChangedFields(beforeSnapshot, afterSnapshot) : [];
  const eventBase: Omit<AuditEvent, 'integrityHash'> = {
    id: makeId('AUD'),
    auditNumber: `AUD-${String(records.length + 1).padStart(6, '0')}`,
    eventKey: input.eventKey || `${input.action}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    correlationId: input.correlationId || correlationId(),
    sessionId: input.sessionId || sessionId(),
    timestamp: nowIso(),
    actorType: input.actorType || actor.actorType,
    actorId: input.actorId || actor.actorId,
    actorName: input.actorName || actor.actorName,
    actorRole: input.actorRole || actor.actorRole,
    actorSubscriberId: input.actorSubscriberId,
    action: input.action,
    category: normalizeCategory(input.category),
    module: input.module || normalizeCategory(input.category),
    targetType: input.targetType || 'system',
    targetId: input.targetId,
    targetLabel: input.targetLabel,
    result: input.result || 'success',
    severity: input.severity || 'informational',
    summary: input.summary,
    description: input.description || input.summary,
    beforeSnapshot,
    afterSnapshot,
    changedFields,
    metadata: mockAuditService.redactAuditPayload(input.metadata || {}) as Record<string, AuditSnapshotValue>,
    route: input.route || inferRoute(input.targetType, input.targetId),
    source: input.source || 'mock_frontend_service',
    environment: 'mock_frontend',
    deviceLabel: 'Local Prototype Browser',
    ipAddressLabel: 'Local Prototype Session',
    errorCode: input.errorCode,
    errorMessage: input.errorMessage,
    createdAt: nowIso(),
    previousIntegrityHash: previous?.integrityHash || 'AUDH-GENESIS'
  };
  const event = { ...eventBase, integrityHash: mockAuditService.calculateAuditHash(eventBase) };
  writeEvents([event, ...records]);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('AUDIT_LOG_APPENDED', { detail: event }));
  }
  return event;
};

const csvEscape = (value: unknown) => {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

export const mockAuditService = {
  initializeAuditLogs: () => {
    const existing = readEvents().filter(item => !item.eventKey?.startsWith('seed-'));
    writeEvents(existing);
    mockAuditService.reconcileExistingActivityLogs();
    mockAuditService.detectSuspiciousEvents();
    return mockAuditService.listAuditEvents();
  },
  listAuditEvents: () => readEvents(),
  getAuditEventById: (id: string) => mockAuditService.listAuditEvents().find(item => item.id === id || item.auditNumber === id) || null,
  appendAuditEvent: (input: AuditAppendInput): AuditResultEnvelope<AuditEvent> => {
    const validation = mockAuditService.validateAuditEvent(input);
    if (!validation.ok) return { ok: false, error: validation.error };
    const event = appendWithoutAlert(input);
    if (['high', 'critical'].includes(event.severity)) {
      mockNotificationService.createSystemNotification({ eventKey: `audit-critical-${event.eventKey}`, category: 'security', sourceModule: 'audit', sourceRecordId: event.id, title: event.severity === 'critical' ? 'Critical audit event detected' : 'High-severity audit event detected', message: event.summary, priority: event.severity === 'critical' ? 'urgent' : 'high', actionUrl: `/platform/audit-logs/${event.id}`, actionLabel: 'Open Audit Event' });
    }
    return { ok: true, data: event };
  },
  logAuthEvent: (action: string, summary: string, metadata?: Record<string, unknown>, severity: AuditSeverity = 'informational') => {
    return mockAuditService.appendAuditEvent({
      eventKey: `auth-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      action,
      category: 'authentication',
      module: 'auth',
      targetType: 'user',
      summary,
      severity,
      metadata: metadata as any
    });
  },
  logClinicalEvent: (action: string, summary: string, targetId?: string, targetLabel?: string, metadata?: Record<string, unknown>) => {
    return mockAuditService.appendAuditEvent({
      eventKey: `clinical-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      action,
      category: 'clinic',
      module: 'clinical_workspace',
      targetType: 'patient',
      targetId,
      targetLabel,
      summary,
      severity: 'informational',
      metadata: metadata as any
    });
  },
  logFinancialEvent: (action: string, summary: string, targetId?: string, targetLabel?: string, metadata?: Record<string, unknown>) => {
    return mockAuditService.appendAuditEvent({
      eventKey: `fin-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      action,
      category: 'payment',
      module: 'billing',
      targetType: 'invoice',
      targetId,
      targetLabel,
      summary,
      severity: 'low',
      metadata: metadata as any
    });
  },
  logAdminEvent: (action: string, summary: string, category: AuditCategory, targetType: string, targetId?: string, metadata?: Record<string, unknown>) => {
    return mockAuditService.appendAuditEvent({
      eventKey: `admin-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      action,
      category,
      module: 'platform_administration',
      targetType,
      targetId,
      summary,
      severity: 'low',
      metadata: metadata as any
    });
  },
  appendAuditEvents: (inputs: AuditAppendInput[]) => inputs.map(input => mockAuditService.appendAuditEvent(input)),
  createCorrelatedAuditEvents: (inputs: AuditAppendInput[], corr = correlationId()) => inputs.map(input => mockAuditService.appendAuditEvent({ ...input, correlationId: corr })),
  getEventsByActor: (actorId: string) => mockAuditService.listAuditEvents().filter(item => item.actorId === actorId || item.actorName === actorId),
  getEventsByTarget: (targetType: string, targetId: string) => mockAuditService.listAuditEvents().filter(item => item.targetType === targetType && item.targetId === targetId),
  getEventsByCorrelationId: (corr: string) => mockAuditService.listAuditEvents().filter(item => item.correlationId === corr).sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
  getEventsByCategory: (category: string) => mockAuditService.listAuditEvents().filter(item => item.category === normalizeCategory(category)),
  getEventsByModule: (module: string) => mockAuditService.listAuditEvents().filter(item => item.module === module),
  getEventsByDateRange: (from: string, to: string) => mockAuditService.listAuditEvents().filter(item => (!from || item.timestamp >= `${from}T00:00:00`) && (!to || item.timestamp <= `${to}T23:59:59`)),
  searchAuditEvents: (records: AuditEvent[], search: string) => {
    const term = search.trim().toLowerCase();
    if (!term) return records;
    return records.filter(item => [item.auditNumber, item.action, item.actorName, item.category, item.module, item.targetLabel, item.summary, item.description, item.correlationId].some(value => String(value || '').toLowerCase().includes(term)));
  },
  filterAuditEvents: (records: AuditEvent[], filters: AuditFilters) => {
    let next = mockAuditService.searchAuditEvents(records, filters.search);
    if (filters.tab === 'critical') next = next.filter(item => item.severity === 'critical');
    if (filters.tab === 'failed') next = next.filter(item => ['failure', 'denied'].includes(item.result));
    if (filters.tab === 'security') next = next.filter(item => ['security', 'authentication', 'authorization'].includes(item.category));
    if (filters.tab === 'financial') next = next.filter(item => ['payment', 'subscription', 'plan'].includes(item.category));
    if (filters.tab === 'clinical') next = next.filter(item => ['clinic', 'subscriber', 'user', 'laboratory', 'announcement'].includes(item.category));
    if (filters.actor !== 'all') next = next.filter(item => item.actorId === filters.actor || item.actorName === filters.actor || item.actorRole === filters.actor);
    if (filters.category !== 'all') next = next.filter(item => item.category === filters.category);
    if (filters.module !== 'all') next = next.filter(item => item.module === filters.module);
    if (filters.result !== 'all') next = next.filter(item => item.result === filters.result);
    if (filters.severity !== 'all') next = next.filter(item => item.severity === filters.severity);
    if (filters.correlationId !== 'all') next = next.filter(item => item.correlationId === filters.correlationId);
    if (filters.dateFrom || filters.dateTo) next = mockAuditService.getEventsByDateRange(filters.dateFrom, filters.dateTo).filter(item => next.some(current => current.id === item.id));
    return next;
  },
  sortAuditEvents: (records: AuditEvent[], sort: AuditSort) => [...records].sort((a, b) => String(a[sort.field] ?? '').localeCompare(String(b[sort.field] ?? '')) * (sort.direction === 'asc' ? 1 : -1)),
  paginateAuditEvents: (records: AuditEvent[], page: number, pageSize: number) => records.slice((page - 1) * pageSize, page * pageSize),
  getAuditSummary: () => {
    const records = mockAuditService.listAuditEvents();
    const integrity = mockAuditService.verifyAuditChain();
    return { total: records.length, critical: records.filter(item => item.severity === 'critical').length, high: records.filter(item => item.severity === 'high').length, failedLogins: records.filter(item => item.action === 'auth.login.failure').length, denied: records.filter(item => item.result === 'denied').length, integrityWarnings: integrity.issues.length, suspicious: mockAuditService.detectSuspiciousEvents().length, correlations: new Set(records.map(item => item.correlationId)).size };
  },
  redactAuditPayload: (payload: unknown) => toSafeValue(payload),
  createSafeSnapshot: (payload: unknown) => toSafeValue(payload) as Record<string, AuditSnapshotValue>,
  calculateChangedFields: (before: Record<string, unknown>, after: Record<string, unknown>) => [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(key => stableStringify(before[key]) !== stableStringify(after[key])),
  calculateAuditHash: (event: Omit<AuditEvent, 'integrityHash'>) => hashString(hashPayload(event)),
  verifyAuditChain: (): AuditIntegrityReport => {
    const newestFirst = mockAuditService.listAuditEvents();
    const oldestFirst = [...newestFirst].reverse();
    const ids = new Set<string>();
    const issues: string[] = [];
    let validLinks = 0;
    let brokenLinks = 0;
    let missingHashes = 0;
    let invalidHashes = 0;
    let duplicateEventIds = 0;
    let timestampOrderWarnings = 0;
    oldestFirst.forEach((event, index) => {
      if (ids.has(event.id)) duplicateEventIds += 1;
      ids.add(event.id);
      if (!event.integrityHash || !event.previousIntegrityHash) missingHashes += 1;
      const expectedPrevious = index === 0 ? 'AUDH-GENESIS' : oldestFirst[index - 1].integrityHash;
      if (event.previousIntegrityHash === expectedPrevious) validLinks += 1;
      else {
        brokenLinks += 1;
        issues.push(`${event.auditNumber} previous hash does not match the prior event.`);
      }
      const expectedHash = mockAuditService.calculateAuditHash(({ ...event, integrityHash: undefined }) as Omit<AuditEvent, 'integrityHash'>);
      if (event.integrityHash !== expectedHash) {
        invalidHashes += 1;
        issues.push(`${event.auditNumber} integrity hash is invalid.`);
      }
      if (index > 0 && event.timestamp < oldestFirst[index - 1].timestamp) timestampOrderWarnings += 1;
    });
    const report = { checkedAt: nowIso(), total: newestFirst.length, validLinks, brokenLinks, missingHashes, invalidHashes, duplicateEventIds, timestampOrderWarnings, unknownActorReferences: newestFirst.filter(item => item.actorName.includes('Unknown')).length, missingTargetReferences: newestFirst.filter(item => item.targetId && !item.route).length, issues };
    safeWrite(INTEGRITY_STATE_KEY, report);
    if (issues.length) mockNotificationService.createSystemNotification({ eventKey: `audit-integrity-warning-${issues.length}`, category: 'security', sourceModule: 'audit', title: 'Audit integrity warning', message: `${issues.length} prototype audit integrity issue(s) detected.`, priority: 'urgent', actionUrl: '/platform/audit-logs/integrity', actionLabel: 'Review Integrity' });
    return report;
  },
  rebuildAuditChainDevelopmentOnly: (approved = false) => {
    if (!approved) return { ok: false, error: 'Development-only rebuild requires explicit approval.' };
    const rebuilt: AuditEvent[] = [];
    [...mockAuditService.listAuditEvents()].reverse().forEach((event, index) => {
      const base = { ...event, previousIntegrityHash: index === 0 ? 'AUDH-GENESIS' : rebuilt[index - 1].integrityHash };
      rebuilt.push({ ...base, integrityHash: mockAuditService.calculateAuditHash(({ ...base, integrityHash: undefined }) as Omit<AuditEvent, 'integrityHash'>) });
    });
    writeEvents([...rebuilt].reverse());
    return { ok: true, data: mockAuditService.listAuditEvents() };
  },
  detectSuspiciousEvents: () => {
    const records = mockAuditService.listAuditEvents();
    const existing = readAlerts();
    const byKey = new Set(existing.map(item => item.ruleKey));
    const alerts: AuditSuspiciousAlert[] = [];
    const failedLogins = records.filter(item => item.action === 'auth.login.failure');
    if (failedLogins.length >= 3 && !byKey.has('multiple_failed_login_attempts')) alerts.push({ id: makeId('AAL'), ruleKey: 'multiple_failed_login_attempts', severity: 'high', eventIds: failedLogins.map(item => item.id), summary: 'Multiple failed login attempts detected.', detectedAt: nowIso(), status: 'open' });
    const denied = records.filter(item => item.result === 'denied');
    if (denied.length >= 2 && !byKey.has('repeated_access_denial')) alerts.push({ id: makeId('AAL'), ruleKey: 'repeated_access_denial', severity: 'medium', eventIds: denied.map(item => item.id), summary: 'Repeated access-denied events detected.', detectedAt: nowIso(), status: 'open' });
    const critical = records.filter(item => item.severity === 'critical');
    if (critical.length >= 1 && !byKey.has('critical_audit_events')) alerts.push({ id: makeId('AAL'), ruleKey: 'critical_audit_events', severity: 'critical', eventIds: critical.map(item => item.id), summary: 'Critical audit events require review.', detectedAt: nowIso(), status: 'open' });
    if (alerts.length) {
      writeAlerts([...alerts, ...existing]);
      alerts.filter(item => ['high', 'critical'].includes(item.severity)).forEach(alert => mockNotificationService.createSystemNotification({ eventKey: `audit-alert-${alert.ruleKey}`, category: 'security', sourceModule: 'audit', title: 'Suspicious audit activity detected', message: alert.summary, priority: alert.severity === 'critical' ? 'urgent' : 'high', actionUrl: '/platform/audit-logs/integrity', actionLabel: 'Review Audit Alert' }));
    }
    return readAlerts();
  },
  exportAuditEventsToCsv: (records: AuditEvent[]) => {
    const header = ['Audit ID', 'ISO Timestamp', 'Display Timestamp', 'Actor', 'Role', 'Action', 'Category', 'Module', 'Target', 'Result', 'Severity', 'Correlation ID', 'Summary'];
    const rows = records.map(item => [item.auditNumber, item.timestamp, new Date(item.timestamp).toLocaleString('en-PH'), item.actorName, item.actorRole, item.action, item.category, item.module, item.targetLabel || item.targetId || item.targetType, item.result, item.severity, item.correlationId, item.summary]);
    return [header, ...rows].map(row => row.map(csvEscape).join(',')).join('\n');
  },
  reconcileExistingActivityLogs: () => {
    const activities = safeRead<ActivityLogLike[]>(ACTIVITY_KEY, []);
    const existing = new Set(readEvents().map(item => item.eventKey));
    activities.forEach(activity => {
      const key = `legacy-activity-${activity.id}`;
      if (existing.has(key)) return;
      appendWithoutAlert({ eventKey: key, correlationId: `CORR-LEGACY-${activity.id}`, action: `legacy.${activity.event.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`, category: activity.event.toLowerCase().includes('payment') ? 'payment' : activity.event.toLowerCase().includes('sign') ? 'authentication' : 'system', module: 'legacy_activity', targetType: 'activity_log', targetId: activity.id, targetLabel: activity.event, result: 'success', severity: 'informational', summary: activity.event, description: activity.details, actorName: activity.role ? `${activity.role} Legacy Actor` : 'Unknown Prototype Actor', actorRole: activity.role === 'platform_owner' ? 'platform_owner' : activity.role === 'clinic_owner' ? 'clinic_owner' : 'anonymous', source: 'legacy_activity_reconciliation', metadata: { originalTimestamp: activity.timestamp, migratedFields: 'event, details, role, timestamp' } });
    });
    return mockAuditService.listAuditEvents();
  },
  validateAuditEvent: (input: AuditAppendInput): AuditResultEnvelope<AuditAppendInput> => {
    if (!input.action.trim()) return { ok: false, error: 'Audit action is required.' };
    if (!input.summary.trim()) return { ok: false, error: 'Audit summary is required.' };
    return { ok: true, data: input };
  },
  getRetentionPreview: (): AuditRetentionPreview => {
    const settings = safeRead<{ informationalDays?: number; policyLabel?: string }>(SETTINGS_KEY, { informationalDays: 90, policyLabel: 'Retain all audit events' });
    const records = mockAuditService.listAuditEvents();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (settings.informationalDays || 90));
    return { policyLabel: settings.policyLabel || 'Retention Preview Only', totalEvents: records.length, informationalAffected: records.filter(item => item.severity === 'informational' && new Date(item.timestamp) < cutoff).length, oldEventsAffected: records.filter(item => new Date(item.timestamp) < cutoff).length, securityRetained: records.filter(item => ['security', 'authentication', 'authorization'].includes(item.category)).length, criticalRetained: records.filter(item => item.severity === 'critical').length, destructiveExecutionAvailable: false };
  }
};
