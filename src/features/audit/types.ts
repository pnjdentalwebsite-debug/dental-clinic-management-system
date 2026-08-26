export type AuditActorType = 'platform_user' | 'subscriber_user' | 'system' | 'anonymous' | 'mock_scheduler';
export type AuditActorRole = 'platform_owner' | 'clinic_owner' | 'associate' | 'staff' | 'system' | 'anonymous';
export type AuditResult = 'success' | 'failure' | 'denied' | 'partial' | 'warning';
export type AuditSeverity = 'informational' | 'low' | 'medium' | 'high' | 'critical';
export type AuditCategory = 'authentication' | 'authorization' | 'registration' | 'subscriber' | 'user' | 'plan' | 'subscription' | 'payment' | 'clinic' | 'laboratory' | 'announcement' | 'notification' | 'analytics' | 'audit' | 'data_restore' | 'platform_settings' | 'security' | 'system' | 'data_quality';

export type AuditSnapshotValue = string | number | boolean | null | AuditSnapshotValue[] | { [key: string]: AuditSnapshotValue };

export interface AuditEvent {
  id: string;
  auditNumber: string;
  eventKey: string;
  correlationId: string;
  sessionId: string;
  timestamp: string;
  actorType: AuditActorType;
  actorId?: string;
  actorName: string;
  actorRole: AuditActorRole;
  actorSubscriberId?: string;
  action: string;
  category: AuditCategory;
  module: string;
  targetType: string;
  targetId?: string;
  targetLabel?: string;
  result: AuditResult;
  severity: AuditSeverity;
  summary: string;
  description: string;
  beforeSnapshot?: Record<string, AuditSnapshotValue>;
  afterSnapshot?: Record<string, AuditSnapshotValue>;
  changedFields: string[];
  metadata: Record<string, AuditSnapshotValue>;
  route?: string;
  source: string;
  environment: 'mock_frontend';
  deviceLabel?: string;
  ipAddressLabel?: string;
  errorCode?: string;
  errorMessage?: string;
  createdAt: string;
  integrityHash: string;
  previousIntegrityHash: string;
}

export interface AuditAppendInput {
  eventKey?: string;
  correlationId?: string;
  sessionId?: string;
  actorType?: AuditActorType;
  actorId?: string;
  actorName?: string;
  actorRole?: AuditActorRole;
  actorSubscriberId?: string;
  action: string;
  category: AuditCategory | string;
  module?: string;
  targetType?: string;
  targetId?: string;
  targetLabel?: string;
  result?: AuditResult;
  severity?: AuditSeverity;
  summary: string;
  description?: string;
  beforeSnapshot?: unknown;
  afterSnapshot?: unknown;
  metadata?: Record<string, unknown>;
  route?: string;
  source?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface AuditFilters {
  search: string;
  actor: string;
  category: string;
  module: string;
  result: string;
  severity: string;
  dateFrom: string;
  dateTo: string;
  correlationId: string;
  tab: string;
}

export interface AuditSort {
  field: keyof AuditEvent;
  direction: 'asc' | 'desc';
}

export interface AuditIntegrityReport {
  checkedAt: string;
  total: number;
  validLinks: number;
  brokenLinks: number;
  missingHashes: number;
  invalidHashes: number;
  duplicateEventIds: number;
  timestampOrderWarnings: number;
  unknownActorReferences: number;
  missingTargetReferences: number;
  issues: string[];
}

export interface AuditSuspiciousAlert {
  id: string;
  ruleKey: string;
  severity: AuditSeverity;
  eventIds: string[];
  actorId?: string;
  summary: string;
  detectedAt: string;
  status: 'open' | 'reviewed' | 'dismissed';
}

export interface AuditRetentionPreview {
  policyLabel: string;
  totalEvents: number;
  informationalAffected: number;
  oldEventsAffected: number;
  securityRetained: number;
  criticalRetained: number;
  destructiveExecutionAvailable: false;
}

export interface AuditResultEnvelope<T> {
  ok: boolean;
  data?: T;
  error?: string;
}
