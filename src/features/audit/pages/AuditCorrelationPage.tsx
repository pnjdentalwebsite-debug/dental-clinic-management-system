import { useState } from 'react';
import { 
  ArrowLeft, 
  Copy, 
  GitBranch, 
  CheckCircle2, 
  Download, 
  Printer, 
  Clock
} from 'lucide-react';
import { mockAuditService } from '../services/mockAuditService';
import { PlatformPageHeader } from '../../../components/PlatformShared';

interface Props {
  correlationId: string;
  navigate: (route: string) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

const labels = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, char => char.toUpperCase());

export function AuditCorrelationPage({ correlationId, navigate, showToast }: Props) {
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');
  const events = mockAuditService.getEventsByCorrelationId(correlationId);

  const copy = (value: string, label = 'Copied to clipboard') => {
    navigator.clipboard.writeText(value);
    showToast(label, 'success');
  };

  const start = events[0]?.timestamp;
  const end = events[events.length - 1]?.timestamp;
  const actors = [...new Set(events.map(item => item.actorName))];
  const targets = [...new Set(events.map(item => item.targetLabel || item.targetId || item.targetType))];
  const failures = events.filter(item => ['failure', 'denied', 'warning'].includes(item.result)).length;

  if (!events.length) {
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
          <GitBranch size={48} color="#94a3b8" style={{ margin: '0 auto 1rem auto' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
            Correlation Stream Not Found
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>
            No audit records are linked to correlation ID <code style={{ fontFamily: 'monospace' }}>{correlationId}</code>.
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

  const exportCorrelationCsv = () => {
    const csv = mockAuditService.exportAuditEventsToCsv(events);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `correlation-${correlationId}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    showToast('Correlation workflow CSV exported.', 'success');
  };

  return (
    <main className="main-content" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 1. TOP HEADER & PRIMARY ACTIONS */}
      <PlatformPageHeader
        title="Connected Actions Trail"
        subtitle={`Step-by-step timeline of all connected activities for tracking reference ${correlationId}`}
        breadcrumbs={['Platform', 'System & Tools', 'Activity History', 'Connected Actions', correlationId]}
        secondaryAction={{
          label: 'Back to Activity History',
          icon: ArrowLeft,
          onClick: () => navigate('/platform/audit-logs')
        }}
        primaryAction={{
          label: 'Export CSV',
          icon: Download,
          onClick: exportCorrelationCsv
        }}
        overflowActions={[
          { id: 'copy-id', label: 'Copy Tracking Number', icon: Copy, onSelect: () => copy(correlationId, 'Tracking number copied') },
          { id: 'print-report', label: 'Print Action History', icon: Printer, onSelect: () => window.print() }
        ]}
      />

      {/* 2. TOP 4 HERO KPI METRICS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem'
      }}>
        {/* Sequence Steps */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          padding: '1.15rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ fontSize: '0.725rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Workflow Steps
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
            {events.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
            <CheckCircle2 size={13} /> Complete Execution Link
          </div>
        </div>

        {/* Involved Actors */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          padding: '1.15rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ fontSize: '0.725rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Actors Involved
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
            {actors.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            {actors.join(', ')}
          </div>
        </div>

        {/* Security Issues */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          padding: '1.15rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ fontSize: '0.725rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Issues & Warnings
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: failures > 0 ? '#dc2626' : '#0f172a', marginTop: '0.25rem' }}>
            {failures}
          </div>
          <div style={{ fontSize: '0.75rem', color: failures > 0 ? '#dc2626' : '#16a34a', fontWeight: 600, marginTop: '0.25rem' }}>
            {failures > 0 ? `${failures} denied/failed step(s)` : '100% Clean Execution'}
          </div>
        </div>

        {/* Target Entities */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          padding: '1.15rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ fontSize: '0.725rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Target Entities
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
            {targets.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            {targets.join(', ') || 'System Root'}
          </div>
        </div>
      </div>

      {/* 3. STREAM DETAILS & TIMELINE SECTION */}
      <section style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '1.25rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        {/* Controls Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: '0.85rem',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>
              Execution Stream Sequence
            </span>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              (Started: {start ? new Date(start).toLocaleTimeString('en-PH') : 'N/A'} — Ended: {end ? new Date(end).toLocaleTimeString('en-PH') : 'N/A'})
            </span>
          </div>

          <div className="segmented-control" role="group" aria-label="View mode">
            <button className={viewMode === 'timeline' ? 'active' : ''} style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }} onClick={() => setViewMode('timeline')}>Visual Flow</button>
            <button className={viewMode === 'table' ? 'active' : ''} style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }} onClick={() => setViewMode('table')}>Table View</button>
          </div>
        </div>

        {/* VIEW 1: VISUAL FLOW TIMELINE */}
        {viewMode === 'timeline' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0', position: 'relative' }}>
            {events.map((event, idx) => {
              const isLast = idx === events.length - 1;
              const isSuccess = event.result === 'success';
              return (
                <div key={event.id} style={{ display: 'flex', gap: '1.25rem', position: 'relative' }}>
                  {/* Left Flow Line & Step Number */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: '36px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: isSuccess ? '#eff6ff' : '#fee2e2',
                      color: isSuccess ? '#2563eb' : '#dc2626',
                      border: `2px solid ${isSuccess ? '#93c5fd' : '#fca5a5'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      zIndex: 2
                    }}>
                      {idx + 1}
                    </div>

                    {!isLast && (
                      <div style={{
                        width: '2px',
                        flex: 1,
                        minHeight: '40px',
                        backgroundColor: '#e2e8f0',
                        margin: '4px 0'
                      }} />
                    )}
                  </div>

                  {/* Right Event Card */}
                  <div style={{
                    flex: 1,
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '1rem 1.25rem',
                    marginBottom: isLast ? '0' : '1rem',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>
                            {event.auditNumber}
                          </span>
                          <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.85rem' }}>
                            — {event.action}
                          </span>
                        </div>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#475569' }}>
                          {event.summary}
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <span style={{
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          backgroundColor: isSuccess ? '#dcfce7' : '#fee2e2',
                          color: isSuccess ? '#15803d' : '#dc2626',
                          fontWeight: 700,
                          fontSize: '0.7rem'
                        }}>
                          {labels(event.result)}
                        </span>

                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{ fontSize: '0.725rem', padding: '0.2rem 0.5rem' }}
                          onClick={() => navigate(`/platform/audit-logs/${event.id}`)}
                        >
                          Details
                        </button>
                      </div>
                    </div>

                    <div style={{
                      marginTop: '0.65rem',
                      paddingTop: '0.5rem',
                      borderTop: '1px solid #f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                      fontSize: '0.725rem',
                      color: '#64748b'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span>Actor: <strong>{event.actorName}</strong> ({labels(event.actorRole)})</span>
                        <span>Target: <strong>{event.targetLabel || event.targetType}</strong></span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={11} /> {new Date(event.timestamp).toLocaleString('en-PH')}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* VIEW 2: ORDERED TABLE */
          <div style={{
            maxHeight: '480px',
            overflowY: 'auto',
            border: '1px solid #e2e8f0',
            borderRadius: '12px'
          }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
              <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <tr>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Step #</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Audit ID</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Timestamp</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Action & Summary</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Actor</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Target</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Result</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event, idx) => (
                  <tr key={event.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 800, color: '#2563eb' }}>#{idx + 1}</td>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: 700 }}>{event.auditNumber}</td>
                    <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap', color: '#64748b' }}>{new Date(event.timestamp).toLocaleTimeString('en-PH')}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <strong>{event.action}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{event.summary}</div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>{event.actorName}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{event.targetLabel || event.targetType}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        backgroundColor: event.result === 'success' ? '#dcfce7' : '#fee2e2',
                        color: event.result === 'success' ? '#15803d' : '#dc2626',
                        fontWeight: 700,
                        fontSize: '0.7rem'
                      }}>
                        {labels(event.result)}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                        onClick={() => navigate(`/platform/audit-logs/${event.id}`)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
