import { useState } from 'react';
import { 
  ArrowLeft, 
  Copy, 
  ExternalLink,
  GitBranch, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  Monitor, 
  Code
} from 'lucide-react';
import { mockAuditService } from '../services/mockAuditService';
import { PlatformPageHeader } from '../../../components/PlatformShared';

interface Props {
  auditLogId: string;
  navigate: (route: string) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

const labels = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, char => char.toUpperCase());

export function AuditDetailsPage({ auditLogId, navigate, showToast }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'snapshots' | 'correlation' | 'integrity'>('overview');
  const event = mockAuditService.getAuditEventById(auditLogId);

  const copy = (value: string, label = 'Copied to clipboard') => {
    navigator.clipboard.writeText(value);
    showToast(label, 'success');
  };

  if (!event) {
    return (
      <main className="main-content" style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '3rem 2rem',
          maxWidth: '480px',
          margin: '0 auto',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <AlertTriangle size={48} color="#dc2626" style={{ margin: '0 auto 1rem auto' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
            Audit Event Not Found
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>
            The requested audit record <code style={{ fontFamily: 'monospace' }}>{auditLogId}</code> does not exist in local persistent storage.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            style={{ width: 'auto', margin: '0 auto' }}
            onClick={() => navigate('/platform/audit-logs')}
          >
            <ArrowLeft size={14} /> Back to Audit Logs
          </button>
        </div>
      </main>
    );
  }

  const correlation = mockAuditService.getEventsByCorrelationId(event.correlationId);

  return (
    <main className="main-content" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 1. TOP HEADER & PRIMARY ACTIONS */}
      <PlatformPageHeader
        title={event.auditNumber}
        subtitle={event.summary}
        breadcrumbs={['Platform', 'System & Tools', 'Activity History', event.auditNumber]}
        secondaryAction={{
          label: 'Back to Activity History',
          icon: ArrowLeft,
          onClick: () => navigate('/platform/audit-logs')
        }}
        primaryAction={{
          label: 'Copy Action Details',
          icon: Copy,
          onClick: () => copy(JSON.stringify(event, null, 2), 'Action details copied')
        }}
        overflowActions={[
          { id: 'trace', label: 'View Connected Actions', icon: GitBranch, onSelect: () => navigate(`/platform/audit-logs/correlation/${event.correlationId}`) },
          { id: 'target', label: 'Open Target Record', icon: ExternalLink, hidden: !event.route, onSelect: event.route ? () => navigate(event.route!) : undefined }
        ]}
      />

      {/* 2. TOP 4 HERO QUICK METRICS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem'
      }}>
        {/* Action Type */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          padding: '1.15rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ fontSize: '0.725rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Action Performed
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
            {labels(event.action)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            {labels(event.module)} Module
          </div>
        </div>

        {/* Severity */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          padding: '1.15rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ fontSize: '0.725rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Importance Level
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: event.severity === 'critical' ? '#dc2626' : event.severity === 'high' ? '#d97706' : '#16a34a', marginTop: '0.25rem' }}>
            {labels(event.severity)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Status: <strong style={{ color: event.result === 'success' ? '#16a34a' : '#dc2626' }}>{labels(event.result)}</strong>
          </div>
        </div>

        {/* Actor */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          padding: '1.15rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ fontSize: '0.725rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            User Account
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
            {event.actorName}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600, marginTop: '0.25rem' }}>
            {labels(event.actorRole)} ({event.actorType})
          </div>
        </div>

        {/* Cryptographic Hash */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          padding: '1.15rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ fontSize: '0.725rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Security Stamp
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 800, color: '#16a34a', marginTop: '0.25rem' }}>
            {event.integrityHash}
          </div>
          <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <ShieldCheck size={13} color="#16a34a" /> Verified Security Record
          </div>
        </div>
      </div>

      {/* 3. SEGMENTED TABS CONTAINER */}
      <section style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '1.25rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e2e8f0',
          gap: '0.5rem',
          marginBottom: '1.25rem',
          overflowX: 'auto'
        }}>
          {[
            { key: 'overview', label: '📌 Action Overview & Info' },
            { key: 'snapshots', label: `🔄 Changes Comparison (${event.changedFields.length} updated)` },
            { key: 'correlation', label: `⛓️ Connected Actions (${correlation.length} steps)` },
            { key: 'integrity', label: '🔒 Security Verification Stamp' }
          ].map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key as typeof activeTab)}
              style={{
                padding: '0.65rem 1rem',
                borderRadius: '8px 8px 0 0',
                border: 'none',
                borderBottom: activeTab === t.key ? '2px solid #2563eb' : '2px solid transparent',
                backgroundColor: activeTab === t.key ? '#eff6ff' : 'transparent',
                color: activeTab === t.key ? '#2563eb' : '#64748b',
                fontWeight: activeTab === t.key ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW & FINGERPRINT */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Description Box */}
            <div style={{
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              padding: '1rem 1.25rem',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.35rem 0' }}>
                Summary & Intent
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#334155', margin: 0, lineHeight: 1.5 }}>
                {event.description}
              </p>
              {event.route && (
                <div style={{ marginTop: '0.75rem' }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ fontSize: '0.775rem', padding: '0.3rem 0.65rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    onClick={() => navigate(event.route!)}
                  >
                    Open Target Entity Record <ExternalLink size={12} />
                  </button>
                </div>
              )}
            </div>

            {/* Two-Column Detail Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.25rem'
            }}>
              {/* Event Metadata */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '1.25rem',
                border: '1px solid #e2e8f0'
              }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Clock size={16} color="#2563eb" /> Event Metadata
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.4rem' }}>
                    <span style={{ color: '#64748b' }}>Audit Number:</span>
                    <strong style={{ fontFamily: 'monospace' }}>{event.auditNumber}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.4rem' }}>
                    <span style={{ color: '#64748b' }}>Timestamp:</span>
                    <strong>{new Date(event.timestamp).toLocaleString('en-PH')}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.4rem' }}>
                    <span style={{ color: '#64748b' }}>Correlation ID:</span>
                    <strong style={{ fontFamily: 'monospace', color: '#7c3aed' }}>{event.correlationId}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.4rem' }}>
                    <span style={{ color: '#64748b' }}>Session ID:</span>
                    <strong style={{ fontFamily: 'monospace' }}>{event.sessionId}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Target Type & ID:</span>
                    <strong>{event.targetType} {event.targetId ? `(${event.targetId})` : ''}</strong>
                  </div>
                </div>
              </div>

              {/* Security & Client Fingerprint */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '1.25rem',
                border: '1px solid #e2e8f0'
              }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Monitor size={16} color="#0284c7" /> Client Fingerprint
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.4rem' }}>
                    <span style={{ color: '#64748b' }}>Device / Platform:</span>
                    <strong>{event.deviceLabel || 'Web Browser (Chrome/Edge)'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.4rem' }}>
                    <span style={{ color: '#64748b' }}>IP Address / Origin:</span>
                    <strong>{event.ipAddressLabel || 'Local Prototype Session'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.4rem' }}>
                    <span style={{ color: '#64748b' }}>Environment:</span>
                    <strong style={{ textTransform: 'capitalize' }}>{event.environment}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.4rem' }}>
                    <span style={{ color: '#64748b' }}>Source Service:</span>
                    <strong>{event.source}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Error Code:</span>
                    <strong style={{ color: event.errorCode ? '#dc2626' : '#64748b' }}>{event.errorCode || 'None (Clean Exec)'}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Metadata JSON */}
            {event.metadata && Object.keys(event.metadata).length > 0 && (
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '1.25rem',
                border: '1px solid #e2e8f0'
              }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Code size={16} color="#475569" /> Contextual Metadata
                </h4>
                <pre style={{
                  margin: 0,
                  padding: '1rem',
                  borderRadius: '8px',
                  backgroundColor: '#0f172a',
                  color: '#38bdf8',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  overflowX: 'auto'
                }}>
                  {JSON.stringify(event.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: VISUAL JSON SNAPSHOT DIFF */}
        {activeTab === 'snapshots' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Changed Fields Summary Banner */}
            <div style={{
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              padding: '1rem 1.25rem',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}>
              <div>
                <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>
                  Modified Fields:
                </strong>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
                  {event.changedFields.length > 0 ? (
                    event.changedFields.map(field => (
                      <span
                        key={field}
                        style={{
                          padding: '0.15rem 0.5rem',
                          borderRadius: '6px',
                          backgroundColor: '#fef3c7',
                          color: '#b45309',
                          border: '1px solid #fde68a',
                          fontWeight: 700,
                          fontSize: '0.725rem'
                        }}
                      >
                        {field}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      No discrete state change recorded for this action.
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                className="btn btn-outline"
                style={{ fontSize: '0.775rem', padding: '0.35rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                onClick={() => copy(JSON.stringify({ before: event.beforeSnapshot, after: event.afterSnapshot }, null, 2), 'Changes comparison copied')}
              >
                <Copy size={13} /> Copy Changes Details
              </button>
            </div>

            {/* Side-by-Side Diff Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1rem'
            }}>
              {/* Before Snapshot */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #fca5a5',
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: '#fef2f2',
                  borderBottom: '1px solid #fecaca',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <strong style={{ fontSize: '0.825rem', color: '#991b1b' }}>
                    🔴 Record Before Action
                  </strong>
                  <span style={{ fontSize: '0.7rem', color: '#dc2626' }}>Original Values</span>
                </div>
                <div style={{ padding: '1rem', maxHeight: '380px', overflowY: 'auto' }}>
                  <pre style={{
                    margin: 0,
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    color: '#7f1d1d',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {event.beforeSnapshot ? JSON.stringify(event.beforeSnapshot, null, 2) : '// No previous state recorded'}
                  </pre>
                </div>
              </div>

              {/* After Snapshot */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #86efac',
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: '#f0fdf4',
                  borderBottom: '1px solid #bbf7d0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <strong style={{ fontSize: '0.825rem', color: '#166534' }}>
                    🟢 Record After Action
                  </strong>
                  <span style={{ fontSize: '0.7rem', color: '#16a34a' }}>Updated Values</span>
                </div>
                <div style={{ padding: '1rem', maxHeight: '380px', overflowY: 'auto' }}>
                  <pre style={{
                    margin: 0,
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    color: '#14532d',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {event.afterSnapshot ? JSON.stringify(event.afterSnapshot, null, 2) : '// No updated state recorded'}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CORRELATION TIMELINE */}
        {activeTab === 'correlation' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              backgroundColor: '#f5f3ff',
              borderRadius: '12px',
              padding: '0.85rem 1.25rem',
              border: '1px solid #ddd6fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.825rem'
            }}>
              <div>
                Tracking Reference: <strong style={{ fontFamily: 'monospace', color: '#6d28d9' }}>{event.correlationId}</strong>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: '#6b21a8' }}>
                  Step-by-step history of all connected actions in this workflow.
                </p>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                style={{ fontSize: '0.775rem', width: 'auto' }}
                onClick={() => navigate(`/platform/audit-logs/correlation/${event.correlationId}`)}
              >
                View Complete Workflow
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {correlation.map((step, idx) => {
                const isCurrent = step.id === event.id;
                return (
                  <div
                    key={step.id}
                    style={{
                      backgroundColor: isCurrent ? '#eff6ff' : '#ffffff',
                      border: isCurrent ? '2px solid #2563eb' : '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '0.85rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: isCurrent ? '#2563eb' : '#f1f5f9',
                        color: isCurrent ? '#ffffff' : '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 800
                      }}>
                        {idx + 1}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>{step.auditNumber}</strong>
                          <span style={{ fontSize: '0.775rem', color: '#64748b' }}>— {step.action}</span>
                          {isCurrent && (
                            <span style={{ fontSize: '0.675rem', padding: '0.1rem 0.35rem', borderRadius: '4px', backgroundColor: '#dbeafe', color: '#1d4ed8', fontWeight: 700 }}>
                              CURRENT VIEW
                            </span>
                          )}
                        </div>
                        <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>{step.summary}</p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span style={{ fontSize: '0.725rem', color: '#94a3b8' }}>
                        {new Date(step.timestamp).toLocaleTimeString('en-PH')}
                      </span>

                      {!isCurrent && (
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{ fontSize: '0.725rem', padding: '0.2rem 0.5rem' }}
                          onClick={() => navigate(`/platform/audit-logs/${step.id}`)}
                        >
                          View
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: CRYPTOGRAPHIC HASH CHAIN */}
        {activeTab === 'integrity' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{
              backgroundColor: '#f0fdf4',
              borderRadius: '12px',
              padding: '1rem 1.25rem',
              border: '1px solid #bbf7d0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <ShieldCheck size={24} color="#16a34a" style={{ flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: '0.9rem', color: '#166534' }}>
                  Cryptographic Integrity Verified
                </strong>
                <p style={{ fontSize: '0.8rem', color: '#15803d', margin: '0.2rem 0 0 0' }}>
                  This record is mathematically anchored to prior platform operations via continuous hash linkage.
                </p>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1rem'
            }}>
              {/* Previous Block Hash */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '1.25rem',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>
                  Previous Block Hash
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.95rem', fontWeight: 800, color: '#475569', marginTop: '0.35rem' }}>
                  {event.previousIntegrityHash}
                </div>
                <p style={{ fontSize: '0.725rem', color: '#94a3b8', marginTop: '0.4rem' }}>
                  Hash signature of the immediately preceding audit event.
                </p>
              </div>

              {/* Current Block Hash */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '1.25rem',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>
                  Current Block Hash
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.95rem', fontWeight: 800, color: '#2563eb', marginTop: '0.35rem' }}>
                  {event.integrityHash}
                </div>
                <p style={{ fontSize: '0.725rem', color: '#94a3b8', marginTop: '0.4rem' }}>
                  SHA-256 equivalent payload digest of this immutable record.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ fontSize: '0.825rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                onClick={() => {
                  mockAuditService.verifyAuditChain();
                  navigate('/platform/audit-logs/integrity');
                }}
              >
                <ShieldCheck size={14} color="#2563eb" /> Run Full Platform Integrity Scan
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
