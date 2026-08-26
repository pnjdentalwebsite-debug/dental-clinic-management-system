import { useEffect, useMemo, useState } from 'react';
import { 
  Download, 
  Printer, 
  ShieldCheck, 
  AlertTriangle,
  XCircle,
  FileText,
  Search,
  Filter,
  Copy,
  CheckCircle2,
  Lock,
  Activity,
  Users,
  GitBranch,
  Calendar,
  ExternalLink,
  Code,
  X,
  ChevronLeft,
  ChevronRight,
  BarChart3
} from 'lucide-react';
import { AuditActionMenu } from '../components/AuditActionMenu';
import { mockAuditService } from '../services/mockAuditService';
import {
  PlatformPageHeader,
  MoreFiltersDrawer
} from '../../../components/PlatformShared';
import { HistogramAreaChart } from '../../analytics/components/charts/HistogramAreaChart';
import { DonutPieChart } from '../../analytics/components/charts/DonutPieChart';
import { HorizontalBarChart } from '../../analytics/components/charts/HorizontalBarChart';
import type { AuditEvent, AuditFilters, AuditSeverity, AuditSort } from '../types';

interface Props {
  navigate: (route: string) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

const tabs = [
  { key: 'all', label: 'All Events' },
  { key: 'critical', label: 'Critical' },
  { key: 'failed', label: 'Failed & Denied' },
  { key: 'security', label: 'Security & Auth' },
  { key: 'financial', label: 'Financial & Billing' },
  { key: 'clinical', label: 'Clinics & Clinical' }
] as const;

const labels = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, char => char.toUpperCase());
const PAGE_SIZE = 12;

const getSeverityBadge = (severity: AuditSeverity) => {
  switch (severity) {
    case 'critical':
      return {
        bg: '#fee2e2',
        color: '#dc2626',
        border: '#fca5a5',
        label: 'Critical'
      };
    case 'high':
      return {
        bg: '#ffedd5',
        color: '#ea580c',
        border: '#fdba74',
        label: 'High'
      };
    case 'medium':
      return {
        bg: '#fef3c7',
        color: '#d97706',
        border: '#fde68a',
        label: 'Medium'
      };
    case 'low':
      return {
        bg: '#e0f2fe',
        color: '#0284c7',
        border: '#bae6fd',
        label: 'Low'
      };
    case 'informational':
    default:
      return {
        bg: '#f1f5f9',
        color: '#475569',
        border: '#e2e8f0',
        label: 'Info'
      };
  }
};

const getResultBadge = (result: string) => {
  switch (result) {
    case 'success':
      return { bg: '#dcfce7', color: '#15803d', border: '#86efac', label: 'Success' };
    case 'denied':
      return { bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5', label: 'Denied' };
    case 'failure':
      return { bg: '#fee2e2', color: '#dc2626', border: '#fecaca', label: 'Failed' };
    case 'warning':
      return { bg: '#fef3c7', color: '#b45309', border: '#fde68a', label: 'Warning' };
    case 'partial':
      return { bg: '#ffedd5', color: '#c2410c', border: '#fed7aa', label: 'Partial' };
    default:
      return { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0', label: result };
  }
};

export function AuditLogsPage({ navigate, showToast }: Props) {
  const [, setVersion] = useState(0);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<AuditFilters>({ 
    search: '', 
    actor: 'all', 
    category: 'all', 
    module: 'all', 
    result: 'all', 
    severity: 'all', 
    dateFrom: '', 
    dateTo: '', 
    correlationId: 'all', 
    tab: 'all' 
  });
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [sort, setSort] = useState<AuditSort>({ field: 'timestamp', direction: 'desc' });
  const [jsonModalEvent, setJsonModalEvent] = useState<AuditEvent | null>(null);

  useEffect(() => {
    const handleUpdate = () => setVersion(v => v + 1);
    window.addEventListener('AUDIT_LOG_APPENDED', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('AUDIT_LOG_APPENDED', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const events = mockAuditService.listAuditEvents();
  const summary = mockAuditService.getAuditSummary();
  const filtered = useMemo(() => mockAuditService.sortAuditEvents(mockAuditService.filterAuditEvents(events, filters), sort), [events, filters, sort]);
  const paged = mockAuditService.paginateAuditEvents(filtered, page, PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const actors = useMemo(() => [...new Set(events.flatMap(item => [item.actorId, item.actorName, item.actorRole]).filter(Boolean))] as string[], [events]);
  const categories = useMemo(() => [...new Set(events.map(item => item.category))], [events]);
  const modules = useMemo(() => [...new Set(events.map(item => item.module))], [events]);
  const correlations = useMemo(() => [...new Set(events.map(item => item.correlationId))], [events]);

  const setFilter = (key: keyof AuditFilters, value: string) => { 
    setPage(1); 
    setFilters(prev => ({ ...prev, [key]: value })); 
  };

  const copy = (value: string, label = 'Copied to clipboard') => { 
    navigator.clipboard.writeText(value); 
    showToast(label, 'success'); 
  };

  const exportCsv = (records: AuditEvent[], name = 'audit-logs') => {
    const csv = mockAuditService.exportAuditEventsToCsv(records);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${name}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    mockAuditService.appendAuditEvent({ 
      eventKey: `audit-export-${Date.now()}`, 
      action: 'audit.exported', 
      category: 'audit', 
      module: 'audit', 
      targetType: 'audit', 
      summary: `Exported ${records.length} audit event(s) to CSV.`, 
      severity: 'low' 
    });
    showToast('Audit CSV export downloaded successfully.', 'success');
  };

  const activeFilterCount = (filters.actor !== 'all' ? 1 : 0) +
    (filters.category !== 'all' ? 1 : 0) +
    (filters.module !== 'all' ? 1 : 0) +
    (filters.result !== 'all' ? 1 : 0) +
    (filters.severity !== 'all' ? 1 : 0) +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0) +
    (filters.correlationId !== 'all' ? 1 : 0);
  const hasFilters = activeFilterCount > 0 || filters.search !== '';

  const tabCounts = useMemo(() => {
    return {
      all: events.length,
      critical: events.filter(e => e.severity === 'critical').length,
      failed: events.filter(e => ['failure', 'denied'].includes(e.result)).length,
      security: events.filter(e => ['security', 'authentication', 'authorization'].includes(e.category)).length,
      financial: events.filter(e => ['payment', 'subscription', 'plan'].includes(e.category)).length,
      clinical: events.filter(e => ['clinic', 'subscriber', 'user', 'laboratory', 'announcement'].includes(e.category)).length
    };
  }, [events]);

  const uniqueActorsCount = useMemo(() => new Set(events.map(e => e.actorName || e.actorId)).size, [events]);

  // 1. Hourly Histogram (00:00 to 23:00)
  const hourlyData = useMemo(() => {
    const buckets = [
      { label: '00:00', start: 0, end: 1 },
      { label: '02:00', start: 2, end: 3 },
      { label: '04:00', start: 4, end: 5 },
      { label: '06:00', start: 6, end: 7 },
      { label: '08:00', start: 8, end: 9 },
      { label: '10:00', start: 10, end: 11 },
      { label: '12:00', start: 12, end: 13 },
      { label: '14:00', start: 14, end: 15 },
      { label: '16:00', start: 16, end: 17 },
      { label: '18:00', start: 18, end: 19 },
      { label: '20:00', start: 20, end: 21 },
      { label: '22:00', start: 22, end: 23 }
    ];
    return buckets.map(b => {
      const count = events.filter(e => {
        const hour = new Date(e.timestamp).getHours();
        return hour >= b.start && hour <= b.end;
      }).length;
      return {
        label: b.label,
        value: count,
        formattedValue: `${count} event(s)`
      };
    });
  }, [events]);

  // 2. Category Distribution Donut
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach(e => {
      let group = 'System & Others';
      if (['security', 'authentication', 'authorization'].includes(e.category)) group = 'Security & Auth';
      else if (['payment', 'subscription', 'plan'].includes(e.category)) group = 'Financial & Billing';
      else if (['clinic', 'subscriber', 'user', 'laboratory'].includes(e.category)) group = 'Clinics & Users';
      else if (['audit', 'data_restore', 'data_quality'].includes(e.category)) group = 'Audit & Data';
      counts[group] = (counts[group] || 0) + 1;
    });

    const colors: Record<string, string> = {
      'Security & Auth': '#dc2626',
      'Financial & Billing': '#10b981',
      'Clinics & Users': '#2563eb',
      'Audit & Data': '#8b5cf6',
      'System & Others': '#64748b'
    };

    return Object.entries(counts).map(([label, value]) => ({
      label,
      value,
      color: colors[label] || '#3b82f6',
      formattedValue: `${value} event(s)`
    }));
  }, [events]);

  // 3. Top Active Actors Horizontal Bar
  const topActorsData = useMemo(() => {
    const counts: Record<string, { count: number; role: string }> = {};
    events.forEach(e => {
      const name = e.actorName || e.actorId || 'Anonymous';
      if (!counts[name]) counts[name] = { count: 0, role: e.actorRole };
      counts[name].count += 1;
    });

    return Object.entries(counts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([name, data]) => ({
        label: name,
        value: data.count,
        sublabel: labels(data.role),
        formattedValue: `${data.count} actions`,
        badge: `#${data.count}`
      }));
  }, [events]);

  return (
    <main className="main-content audit-page" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* PRINT REPORT HEADER */}
      <div className="print-report-header" aria-hidden="true" style={{ display: 'none' }}>
        <h1>Dental Cloud Platform — Security & Administrative Audit Report</h1>
        <p>Generated: {new Date().toLocaleString('en-PH')} (GMT+8 Manila)</p>
      </div>

      {/* 1. TOP HEADER & PRIMARY ACTIONS (Exact 2-Button Standard Matching Image 1) */}
      <PlatformPageHeader
        title="Activity History & Action Records"
        subtitle="Review complete history of user actions, login attempts, payments, clinic updates, and security events."
        breadcrumbs={['Platform', 'System & Tools', 'Activity History']}
        secondaryAction={{
          label: 'Check Security Status',
          icon: ShieldCheck,
          onClick: () => {
            mockAuditService.verifyAuditChain();
            setVersion(prev => prev + 1);
            navigate('/platform/audit-logs/integrity');
          }
        }}
        primaryAction={{
          label: 'Export CSV',
          icon: Download,
          onClick: () => exportCsv(filtered, 'platform-audit-logs')
        }}
      />

      {/* 2. TOP 4 HERO KPI CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1rem'
      }}>
        {/* Total Records */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '1.25rem 1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Recorded Actions
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0' }}>
              {summary.total}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>
              <CheckCircle2 size={13} /> 100% Permanently Logged
            </div>
          </div>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            backgroundColor: '#eff6ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#2563eb'
          }}>
            <FileText size={22} />
          </div>
        </div>

        {/* Critical & Security */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '1.25rem 1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Security & Warning Alerts
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: summary.critical > 0 ? '#dc2626' : '#0f172a', margin: '0.25rem 0' }}>
              {summary.critical + summary.high}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: summary.critical > 0 ? '#dc2626' : '#64748b', fontWeight: 600 }}>
              <AlertTriangle size={13} /> {summary.critical} Critical, {summary.high} Warnings
            </div>
          </div>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            backgroundColor: '#fee2e2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#dc2626'
          }}>
            <XCircle size={22} />
          </div>
        </div>

        {/* Unique Active Actors */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '1.25rem 1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Active Users
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0' }}>
              {uniqueActorsCount}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#2563eb', fontWeight: 600 }}>
              <Users size={13} /> Doctors, Staff & Admins
            </div>
          </div>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            backgroundColor: '#f0fdf4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#16a34a'
          }}>
            <Users size={22} />
          </div>
        </div>

        {/* Correlation Chains */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '1.25rem 1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Connected Action Chains
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0' }}>
              {summary.correlations}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#7c3aed', fontWeight: 600 }}>
              <GitBranch size={13} /> Multi-Step Activity Trails
            </div>
          </div>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            backgroundColor: '#f5f3ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#7c3aed'
          }}>
            <GitBranch size={22} />
          </div>
        </div>
      </div>

      {/* 3. INTERACTIVE VISUAL ANALYTICS SUITE (TOGGLEABLE) */}
      {showAnalytics && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1rem'
        }}>
          {/* Hourly Event Density Histogram */}
          <HistogramAreaChart
            title="Hourly Event Traffic & Density"
            subtitle="24-Hour chronological event volume distribution (00:00 – 23:00 GMT+8)"
            data={hourlyData}
            color="#2563eb"
            height={160}
          />

          {/* Event Category Distribution Donut */}
          <DonutPieChart
            title="Event Category Breakdown"
            subtitle="Percentage distribution of logged operations across system domains"
            data={categoryData}
            centerLabel="Events"
            centerValue={String(events.length)}
            size={180}
            donutThickness={24}
          />

          {/* Top Actors Leaderboard */}
          <HorizontalBarChart
            title="Most Active Actors & Roles"
            subtitle="Top users and system services performing platform operations"
            data={topActorsData}
            showRank={true}
            color="#7c3aed"
          />
        </div>
      )}

      {/* 4. SECONDARY METRICS DELIVERY RIBBON */}
      <div style={{
        backgroundColor: '#f8fafc',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '0.75rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        fontSize: '0.8rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <span style={{ color: '#475569', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Lock size={14} color="#0284c7" />
            <strong>Security Scope:</strong> Platform Admin, Clinic Owners, Associate Dentists
          </span>

          <span style={{ color: '#475569', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Activity size={14} color="#ea580c" />
            <strong>Access Denied:</strong> {summary.denied} operation(s)
          </span>

          <span style={{ color: '#475569', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <AlertTriangle size={14} color="#dc2626" />
            <strong>Failed Logins:</strong> {summary.failedLogins}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            padding: '0.2rem 0.6rem',
            borderRadius: '20px',
            backgroundColor: '#dcfce7',
            color: '#15803d',
            fontWeight: 700,
            fontSize: '0.725rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            <ShieldCheck size={12} /> SHA-256 Validated
          </span>
        </div>
      </div>

      {/* 5. MAIN DATA PANEL WITH 500PX TABLE */}
      <section className="dashboard-panel" style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '1.25rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        {/* SEGMENTED STATUS TABS */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e2e8f0',
          gap: '0.5rem',
          overflowX: 'auto',
          paddingBottom: '0.5rem',
          marginBottom: '1rem'
        }}>
          {tabs.map(tab => {
            const count = tabCounts[tab.key as keyof typeof tabCounts] ?? 0;
            const isActive = filters.tab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter('tab', tab.key)}
                style={{
                  padding: '0.5rem 0.85rem',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: isActive ? '#eff6ff' : 'transparent',
                  color: isActive ? '#2563eb' : '#64748b',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
                <span style={{
                  padding: '0.1rem 0.45rem',
                  borderRadius: '12px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  backgroundColor: isActive ? '#2563eb' : '#f1f5f9',
                  color: isActive ? '#ffffff' : '#64748b'
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* SEARCH, FILTERS & CONTROLS */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', flex: 1 }}>
            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: '240px', flex: 1, maxWidth: '360px' }}>
              <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search by Audit ID, action, actor, summary..."
                value={filters.search}
                onChange={e => setFilter('search', e.target.value)}
                style={{
                  width: '100%',
                  height: '38px',
                  paddingLeft: '2.25rem',
                  paddingRight: '0.75rem',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.85rem',
                  outline: 'none',
                  backgroundColor: '#f8fafc'
                }}
              />
              {filters.search && (
                <button
                  type="button"
                  onClick={() => setFilter('search', '')}
                  style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Severity Filter */}
            <select
              value={filters.severity}
              onChange={e => setFilter('severity', e.target.value)}
              style={{
                height: '38px',
                padding: '0 0.85rem',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                fontSize: '0.825rem',
                backgroundColor: '#f8fafc',
                color: '#334155',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="all">All Severity</option>
              {['critical', 'high', 'medium', 'low', 'informational'].map(item => (
                <option key={item} value={item}>{labels(item)}</option>
              ))}
            </select>

            {/* Result Filter */}
            <select
              value={filters.result}
              onChange={e => setFilter('result', e.target.value)}
              style={{
                height: '38px',
                padding: '0 0.85rem',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                fontSize: '0.825rem',
                backgroundColor: '#f8fafc',
                color: '#334155',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="all">All Results</option>
              {['success', 'denied', 'failure', 'warning', 'partial'].map(item => (
                <option key={item} value={item}>{labels(item)}</option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={filters.category}
              onChange={e => setFilter('category', e.target.value)}
              style={{
                height: '38px',
                padding: '0 0.85rem',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                fontSize: '0.825rem',
                backgroundColor: '#f8fafc',
                color: '#334155',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="all">All Categories</option>
              {categories.map(item => (
                <option key={item} value={item}>{labels(item)}</option>
              ))}
            </select>

            {/* More Filters Trigger */}
            <button
              type="button"
              onClick={() => setMoreFiltersOpen(true)}
              style={{
                height: '38px',
                width: 'auto',
                flexShrink: 0,
                whiteSpace: 'nowrap',
                padding: '0 0.85rem',
                fontSize: '0.825rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                color: '#334155',
                cursor: 'pointer'
              }}
            >
              <Filter size={14} /> More Filters
              {activeFilterCount > 0 && (
                <span style={{
                  padding: '0.1rem 0.35rem',
                  borderRadius: '10px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontSize: '0.675rem',
                  fontWeight: 700
                }}>
                  {activeFilterCount}
                </span>
              )}
            </button>

            {hasFilters && (
              <button
                type="button"
                onClick={() => setFilters({ search: '', actor: 'all', category: 'all', module: 'all', result: 'all', severity: 'all', dateFrom: '', dateTo: '', correlationId: 'all', tab: 'all' })}
                style={{
                  height: '38px',
                  width: 'auto',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                  padding: '0 0.75rem',
                  fontSize: '0.8rem',
                  color: '#dc2626',
                  borderRadius: '10px',
                  border: '1px solid #fecaca',
                  backgroundColor: '#fef2f2',
                  cursor: 'pointer'
                }}
              >
                Clear All
              </button>
            )}
          </div>

          {/* View Switcher & Quick Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-outline"
              style={{
                height: '34px',
                width: 'auto',
                flexShrink: 0,
                whiteSpace: 'nowrap',
                padding: '0 0.75rem',
                fontSize: '0.775rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                color: showAnalytics ? '#7c3aed' : '#64748b',
                borderColor: showAnalytics ? '#ddd6fe' : '#e2e8f0',
                backgroundColor: showAnalytics ? '#f5f3ff' : '#ffffff',
                fontWeight: 600,
                borderRadius: '8px'
              }}
              onClick={() => setShowAnalytics(!showAnalytics)}
            >
              <BarChart3 size={13} color="#7c3aed" /> {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
            </button>

            <button
              type="button"
              className="btn btn-outline"
              style={{
                height: '34px',
                width: 'auto',
                flexShrink: 0,
                whiteSpace: 'nowrap',
                padding: '0 0.75rem',
                fontSize: '0.775rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                borderRadius: '8px'
              }}
              onClick={() => window.print()}
            >
              <Printer size={13} /> Print
            </button>

            <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: '0.25rem', whiteSpace: 'nowrap' }}>
              Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>

            <div className="segmented-control" role="group" aria-label="View mode" style={{ flexShrink: 0 }}>
              <button className={viewMode === 'table' ? 'active' : ''} style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }} onClick={() => setViewMode('table')}>Table</button>
              <button className={viewMode === 'cards' ? 'active' : ''} style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }} onClick={() => setViewMode('cards')}>Cards</button>
            </div>
          </div>
        </div>

        {/* 500PX HIGH-DENSITY TABLE CONTAINER */}
        {viewMode === 'table' ? (
          <div style={{
            maxHeight: '520px',
            overflowY: 'auto',
            overflowX: 'auto',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            position: 'relative'
          }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
              <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 10, borderBottom: '2px solid #e2e8f0' }}>
                <tr>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: '#475569' }}>
                    <button 
                      type="button"
                      onClick={() => setSort({ field: 'auditNumber', direction: sort.direction === 'asc' ? 'desc' : 'asc' })}
                      style={{ background: 'none', border: 'none', fontWeight: 700, color: '#475569', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      Audit ID & Timestamp
                    </button>
                  </th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Action & Summary</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Category / Module</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Actor</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Target Entity</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Severity & Result</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Correlation ID</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: '#475569' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '3.5rem 1rem', backgroundColor: '#f8fafc' }}>
                      <FileText size={36} style={{ color: '#94a3b8', margin: '0 auto 0.75rem auto' }} />
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>No audit events found</h4>
                      <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>No audit records match your current filters or system activity.</p>
                    </td>
                  </tr>
                ) : (
                  paged.map(event => {
                    const sev = getSeverityBadge(event.severity);
                    const res = getResultBadge(event.result);
                    return (
                      <tr key={event.id} style={{ borderBottom: '1px solid #f1f5f9', verticalAlign: 'top' }}>
                      {/* Audit ID & Timestamp */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>
                            {event.auditNumber}
                          </span>
                          <button
                            type="button"
                            onClick={() => copy(event.auditNumber, 'Audit Number copied')}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0.1rem' }}
                            title="Copy Audit ID"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                        <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Calendar size={11} /> {new Date(event.timestamp).toLocaleString('en-PH')}
                        </div>
                      </td>

                      {/* Action & Summary */}
                      <td style={{ padding: '0.85rem 1rem', maxWidth: '260px' }}>
                        <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.825rem' }}>
                          {event.action}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem', lineHeight: 1.4 }}>
                          {event.summary}
                        </div>
                      </td>

                      {/* Category & Module */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        <span style={{
                          padding: '0.15rem 0.5rem',
                          borderRadius: '6px',
                          backgroundColor: '#f1f5f9',
                          color: '#334155',
                          fontWeight: 600,
                          fontSize: '0.725rem'
                        }}>
                          {labels(event.category)}
                        </span>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                          {labels(event.module)}
                        </div>
                      </td>

                      {/* Actor */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: '#e0e7ff',
                            color: '#4338ca',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.7rem',
                            fontWeight: 700
                          }}>
                            {event.actorName ? event.actorName.charAt(0).toUpperCase() : 'A'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.8rem' }}>
                              {event.actorName}
                            </div>
                            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                              {labels(event.actorRole)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Target Entity */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        {event.route ? (
                          <button
                            type="button"
                            onClick={() => navigate(event.route!)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#2563eb',
                              cursor: 'pointer',
                              fontWeight: 600,
                              fontSize: '0.775rem',
                              padding: 0,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            {event.targetLabel || event.targetId || event.targetType} <ExternalLink size={11} />
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.775rem', color: '#475569' }}>
                            {event.targetLabel || event.targetId || event.targetType || 'System'}
                          </span>
                        )}
                        <div style={{ fontSize: '0.675rem', color: '#94a3b8' }}>
                          {event.targetType}
                        </div>
                      </td>

                      {/* Severity & Result */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span style={{
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            backgroundColor: sev.bg,
                            color: sev.color,
                            border: `1px solid ${sev.border}`,
                            fontWeight: 700,
                            fontSize: '0.675rem',
                            textTransform: 'uppercase'
                          }}>
                            {sev.label}
                          </span>

                          <span style={{
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            backgroundColor: res.bg,
                            color: res.color,
                            border: `1px solid ${res.border}`,
                            fontWeight: 600,
                            fontSize: '0.675rem'
                          }}>
                            {res.label}
                          </span>
                        </div>
                      </td>

                      {/* Correlation ID */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <button
                            type="button"
                            onClick={() => navigate(`/platform/audit-logs/correlation/${event.correlationId}`)}
                            style={{
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px',
                              backgroundColor: '#f5f3ff',
                              color: '#7c3aed',
                              border: '1px solid #ddd6fe',
                              fontFamily: 'monospace',
                              fontSize: '0.7rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                            title="Trace Correlation Stream"
                          >
                            <GitBranch size={11} /> {event.correlationId}
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <AuditActionMenu
                          event={event}
                          onView={() => navigate(`/platform/audit-logs/${event.id}`)}
                          onRelated={event.route ? () => navigate(event.route!) : undefined}
                          onCorrelation={() => navigate(`/platform/audit-logs/correlation/${event.correlationId}`)}
                          onCopyAudit={() => copy(event.auditNumber, 'Audit ID copied')}
                          onCopyCorrelation={() => copy(event.correlationId, 'Correlation ID copied')}
                          onExportJson={() => setJsonModalEvent(event)}
                          onVerifyIntegrity={() => {
                            mockAuditService.verifyAuditChain();
                            navigate('/platform/audit-logs/integrity');
                          }}
                        />
                      </td>
                    </tr>
                  );
                }))}
              </tbody>
            </table>
          </div>
        ) : (
          /* CARDS GRID VIEW */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1rem',
            maxHeight: '520px',
            overflowY: 'auto'
          }}>
            {paged.map(event => {
                const sev = getSeverityBadge(event.severity);
                const res = getResultBadge(event.result);
                return (
                  <div
                    key={event.id}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '0.75rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>
                          {event.auditNumber}
                        </span>
                        <div style={{ fontSize: '0.725rem', color: '#64748b' }}>
                          {new Date(event.timestamp).toLocaleString('en-PH')}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ padding: '0.1rem 0.4rem', borderRadius: '4px', backgroundColor: sev.bg, color: sev.color, fontSize: '0.675rem', fontWeight: 700 }}>
                          {sev.label}
                        </span>
                        <span style={{ padding: '0.1rem 0.4rem', borderRadius: '4px', backgroundColor: res.bg, color: res.color, fontSize: '0.675rem', fontWeight: 600 }}>
                          {res.label}
                        </span>
                      </div>
                    </div>

                    <div>
                      <strong style={{ fontSize: '0.85rem', color: '#1e293b' }}>{event.action}</strong>
                      <p style={{ fontSize: '0.775rem', color: '#64748b', margin: '0.25rem 0' }}>{event.summary}</p>
                    </div>

                    <div style={{
                      paddingTop: '0.5rem',
                      borderTop: '1px solid #f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.75rem'
                    }}>
                      <span style={{ color: '#475569' }}>Actor: <strong>{event.actorName}</strong></span>
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                        onClick={() => navigate(`/platform/audit-logs/${event.id}`)}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
            <FileText size={36} color="#cbd5e1" style={{ margin: '0 auto 0.75rem auto' }} />
            <p style={{ fontWeight: 600, fontSize: '0.95rem', margin: 0 }}>No audit events found</p>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>Try adjusting your filters or search criteria.</p>
          </div>
        )}

        {/* BOTTOM PAGINATION CONTROLS */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginTop: '1rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid #f1f5f9',
          fontSize: '0.8rem',
          color: '#64748b'
        }}>
          <div>
            Page <strong>{page}</strong> of <strong>{pageCount}</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <button
              type="button"
              className="btn btn-outline"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.775rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <ChevronLeft size={14} /> Previous
            </button>

            {Array.from({ length: pageCount }, (_, i) => i + 1).slice(0, 5).map(num => (
              <button
                key={num}
                type="button"
                className={`btn ${page === num ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setPage(num)}
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.775rem', minWidth: '32px' }}
              >
                {num}
              </button>
            ))}

            <button
              type="button"
              className="btn btn-outline"
              disabled={page >= pageCount}
              onClick={() => setPage(p => Math.min(pageCount, p + 1))}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.775rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* 6. MORE FILTERS DRAWER */}
      <MoreFiltersDrawer
        isOpen={moreFiltersOpen}
        onClose={() => setMoreFiltersOpen(false)}
        onApply={() => setMoreFiltersOpen(false)}
        onClear={() => setFilters({ search: '', actor: 'all', category: 'all', module: 'all', result: 'all', severity: 'all', dateFrom: '', dateTo: '', correlationId: 'all', tab: 'all' })}
      >
        <div className="form-group">
          <label className="form-label">Filter by Actor</label>
          <select className="form-input" value={filters.actor} onChange={e => setFilter('actor', e.target.value)}>
            <option value="all">All Actors</option>
            {actors.map(item => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Filter by Module</label>
          <select className="form-input" value={filters.module} onChange={e => setFilter('module', e.target.value)}>
            <option value="all">All Modules</option>
            {modules.map(item => (
              <option key={item} value={item}>{labels(item)}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Date Range (From)</label>
          <input className="form-input" type="date" value={filters.dateFrom} onChange={e => setFilter('dateFrom', e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label">Date Range (To)</label>
          <input className="form-input" type="date" value={filters.dateTo} onChange={e => setFilter('dateTo', e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label">Correlation ID</label>
          <select className="form-input" value={filters.correlationId} onChange={e => setFilter('correlationId', e.target.value)}>
            <option value="all">All Correlations</option>
            {correlations.map(item => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>
      </MoreFiltersDrawer>

      {/* 7. RAW JSON INSPECTOR MODAL */}
      {jsonModalEvent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            maxWidth: '600px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '1rem 1.25rem',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#f8fafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Code size={16} color="#2563eb" />
                <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>
                  Raw Audit Payload — {jsonModalEvent.auditNumber}
                </strong>
              </div>
              <button
                type="button"
                onClick={() => setJsonModalEvent(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.25rem', maxHeight: '60vh', overflowY: 'auto' }}>
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
                {JSON.stringify(jsonModalEvent, null, 2)}
              </pre>
            </div>

            <div style={{
              padding: '0.85rem 1.25rem',
              borderTop: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                onClick={() => copy(JSON.stringify(jsonModalEvent, null, 2), 'JSON payload copied to clipboard')}
              >
                <Copy size={13} /> Copy JSON
              </button>

              <button
                type="button"
                className="btn btn-primary"
                style={{ fontSize: '0.8rem', width: 'auto' }}
                onClick={() => setJsonModalEvent(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
