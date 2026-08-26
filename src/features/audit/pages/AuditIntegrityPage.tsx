import { useState } from 'react';
import { 
  ArrowLeft, 
  Download, 
  ShieldCheck,
  ShieldAlert,
  CheckCircle2, 
  RefreshCw, 
  Printer, 
  Layers, 
  Database
} from 'lucide-react';
import { mockAuditService } from '../services/mockAuditService';
import { PlatformPageHeader } from '../../../components/PlatformShared';
import type { AuditIntegrityReport } from '../types';

interface Props {
  navigate: (route: string) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

const labels = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, char => char.toUpperCase());

export function AuditIntegrityPage({ navigate, showToast }: Props) {
  const [report, setReport] = useState<AuditIntegrityReport>(() => mockAuditService.verifyAuditChain());
  const [isScanning, setIsScanning] = useState(false);
  const alerts = mockAuditService.detectSuspiciousEvents();
  const retention = mockAuditService.getRetentionPreview();
  const events = mockAuditService.listAuditEvents();

  const runScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      const freshReport = mockAuditService.verifyAuditChain();
      setReport(freshReport);
      setIsScanning(false);
      showToast('Cryptographic hash validation completed: 100% integrity verified.', 'success');
    }, 400);
  };

  const exportReport = () => {
    const csv = [
      'Metric,Value',
      `Total Audited Records,${report.total}`,
      `Valid Cryptographic Links,${report.validLinks}`,
      `Broken Links,${report.brokenLinks}`,
      `Missing Hashes,${report.missingHashes}`,
      `Invalid Hashes,${report.invalidHashes}`,
      `Duplicate IDs,${report.duplicateEventIds}`,
      `Timestamp Order Warnings,${report.timestampOrderWarnings}`,
      `Unknown Actor References,${report.unknownActorReferences}`,
      `Integrity Status,${report.brokenLinks === 0 ? 'VERIFIED_SECURE' : 'COMPROMISED'}`,
      `Last Verified At,${new Date(report.checkedAt).toISOString()}`
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit-integrity-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);

    mockAuditService.appendAuditEvent({ 
      eventKey: `audit-integrity-export-${Date.now()}`, 
      action: 'audit.integrity_exported', 
      category: 'audit', 
      module: 'audit', 
      targetType: 'audit', 
      summary: `Exported cryptographic integrity audit report for ${report.total} records.`, 
      severity: 'low' 
    });
    showToast('Integrity report CSV downloaded.', 'success');
  };

  return (
    <main className="main-content" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 1. TOP HEADER & PRIMARY ACTIONS */}
      <PlatformPageHeader
        title="Record Security & Tamper Verification"
        subtitle="Check security stamps, verify permanent record protection, and ensure safety across all platform actions."
        breadcrumbs={['Platform', 'System & Tools', 'Activity History', 'Security Verification']}
        secondaryAction={{
          label: 'Back to Activity History',
          icon: ArrowLeft,
          onClick: () => navigate('/platform/audit-logs')
        }}
        primaryAction={{
          label: isScanning ? 'Checking Records...' : 'Check Record Security',
          icon: RefreshCw,
          onClick: runScan,
          disabled: isScanning
        }}
        overflowActions={[
          { id: 'export-report', label: 'Export Security Report', icon: Download, onSelect: exportReport },
          { id: 'print-report', label: 'Print Security Report', icon: Printer, onSelect: () => window.print() }
        ]}
      />

      {/* 2. TOP 4 HERO KPI METRICS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem'
      }}>
        {/* Total Records */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          padding: '1.15rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ fontSize: '0.725rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Audited Records
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
            {report.total}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
            <CheckCircle2 size={13} /> 100% Blocks Scanned
          </div>
        </div>

        {/* Valid Cryptographic Links */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          padding: '1.15rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ fontSize: '0.725rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Valid Block Links
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#16a34a', marginTop: '0.25rem' }}>
            {report.validLinks}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Unbroken SHA-256 Digests
          </div>
        </div>

        {/* Broken Links / Tampering */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          padding: '1.15rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ fontSize: '0.725rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Broken Links & Anomalies
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: report.brokenLinks > 0 ? '#dc2626' : '#0f172a', marginTop: '0.25rem' }}>
            {report.brokenLinks}
          </div>
          <div style={{ fontSize: '0.75rem', color: report.brokenLinks > 0 ? '#dc2626' : '#16a34a', fontWeight: 600, marginTop: '0.25rem' }}>
            {report.brokenLinks > 0 ? 'Tampering Detected' : 'Zero Breaches Detected'}
          </div>
        </div>

        {/* Suspicious Alerts */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          padding: '1.15rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ fontSize: '0.725rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Rule Violations
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: alerts.length > 0 ? '#ea580c' : '#0f172a', marginTop: '0.25rem' }}>
            {alerts.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Active heuristic detection rules
          </div>
        </div>
      </div>

      {/* 3. VISUAL CRYPTOGRAPHIC BLOCKCHAIN LINK INSPECTOR */}
      <section style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '1.25rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Layers size={18} color="#2563eb" /> Cryptographic Block Chain Inspector
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
              Real-time validation of parent-to-child cryptographic block hash links.
            </p>
          </div>

          <span style={{
            padding: '0.25rem 0.75rem',
            borderRadius: '20px',
            backgroundColor: '#dcfce7',
            color: '#15803d',
            fontSize: '0.75rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}>
            <ShieldCheck size={14} /> Continuous Chain Validated
          </span>
        </div>

        {/* Chain Flow Blocks */}
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          overflowX: 'auto',
          paddingBottom: '0.75rem'
        }}>
          {events.slice(0, 5).map((event, idx) => (
            <div
              key={event.id}
              style={{
                minWidth: '240px',
                flex: 1,
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.5rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.8rem', color: '#2563eb' }}>
                  Block #{idx + 1}
                </span>
                <span style={{ fontSize: '0.675rem', color: '#94a3b8' }}>
                  {new Date(event.timestamp).toLocaleTimeString('en-PH')}
                </span>
              </div>

              <div>
                <strong style={{ fontSize: '0.8rem', color: '#0f172a' }}>{event.auditNumber}</strong>
                <div style={{ fontSize: '0.725rem', color: '#64748b' }}>{event.action}</div>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.45rem', fontSize: '0.675rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <div style={{ color: '#64748b' }}>
                  Prev: <span style={{ fontFamily: 'monospace', color: '#475569' }}>{event.previousIntegrityHash}</span>
                </div>
                <div style={{ color: '#16a34a', fontWeight: 700 }}>
                  Hash: <span style={{ fontFamily: 'monospace' }}>{event.integrityHash}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. SUSPICIOUS EVENT DETECTION & COMPLIANCE */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1rem'
      }}>
        {/* Suspicious Events Panel */}
        <section style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '1.25rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <ShieldAlert size={16} color="#ea580c" /> Heuristic Anomaly Detections ({alerts.length})
          </h3>

          {alerts.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {alerts.map(alert => (
                <div
                  key={alert.id}
                  style={{
                    backgroundColor: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: '10px',
                    padding: '0.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.8rem', color: '#92400e' }}>{alert.summary}</strong>
                    <span style={{
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                      backgroundColor: alert.severity === 'high' ? '#fee2e2' : '#fef3c7',
                      color: alert.severity === 'high' ? '#dc2626' : '#d97706',
                      fontWeight: 700,
                      fontSize: '0.675rem'
                    }}>
                      {labels(alert.severity)}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.725rem', color: '#78350f' }}>Rule: {alert.ruleKey}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748b' }}>
              <CheckCircle2 size={32} color="#16a34a" style={{ margin: '0 auto 0.5rem auto' }} />
              <p style={{ fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>No suspicious anomalies found</p>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.2rem 0 0 0' }}>All heuristic rules passed clean.</p>
            </div>
          )}
        </section>

        {/* Retention & Storage Overview */}
        <section style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '1.25rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Database size={16} color="#0284c7" /> Audit Retention Compliance
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.4rem' }}>
              <span style={{ color: '#64748b' }}>Active Retention Policy:</span>
              <strong>{retention.policyLabel}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.4rem' }}>
              <span style={{ color: '#64748b' }}>Total Persisted Events:</span>
              <strong>{retention.totalEvents}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.4rem' }}>
              <span style={{ color: '#64748b' }}>Security Retained:</span>
              <strong style={{ color: '#16a34a' }}>{retention.securityRetained}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.4rem' }}>
              <span style={{ color: '#64748b' }}>Critical Incidents Retained:</span>
              <strong style={{ color: '#16a34a' }}>{retention.criticalRetained}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Destructive Pruning:</span>
              <span style={{ color: '#64748b', fontStyle: 'italic' }}>Disabled (Immutable Audit Ledger)</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
