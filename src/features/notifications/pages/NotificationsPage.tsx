import { useEffect, useMemo, useState } from 'react';
import { 
  Bell, 
  CheckCheck, 
  RefreshCw, 
  AlertTriangle, 
  FileText, 
  List, 
  Grid,
  Download,
  Trash2,
  Sliders,
  CheckCircle2,
  ShieldAlert,
  Layers,
  Megaphone,
  Clock,
  Copy,
  Check,
  Printer,
  Search,
  AlertCircle,
  BarChart3,
  TrendingUp,
  X
} from 'lucide-react';
import { mockPlatformManagementService } from '../../platformManagement/services/mockPlatformManagementService';
import { NotificationActionMenu } from '../components/NotificationActionMenu';
import { NotificationPreferencesDialog } from '../components/NotificationPreferencesDialog';
import { NotificationPriorityBadge } from '../components/NotificationPriorityBadge';
import { mockNotificationService, NOTIFICATION_STATE_CHANGED_EVENT } from '../services/mockNotificationService';
import { PlatformPageHeader } from '../../../components/PlatformShared';
import { DonutPieChart, type PieChartDataPoint } from '../../analytics/components/charts/DonutPieChart';
import { HorizontalBarChart, type HorizontalBarDataPoint } from '../../analytics/components/charts/HorizontalBarChart';
import type { NotificationFilters, PlatformNotification } from '../types';

interface Props {
  route?: string;
  navigate: (route: string) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

const labels = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, char => char.toUpperCase());
const ownerId = () => mockPlatformManagementService.listUsers()[0]?.id || 'mock-owner';

const formatRelativeTime = (isoString: string) => {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return isoString;
  }
};

export function NotificationsPage({ navigate, showToast }: Props) {
  const [, setVersion] = useState(0);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'high' | 'system' | 'announcements' | 'archived'>('all');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const PAGE_SIZE = 12;

  const refresh = () => setVersion(prev => prev + 1);

  useEffect(() => {
    const handleStateChange = () => {
      refresh();
    };

    window.addEventListener(NOTIFICATION_STATE_CHANGED_EVENT, handleStateChange);
    window.addEventListener('storage', handleStateChange);
    return () => {
      window.removeEventListener(NOTIFICATION_STATE_CHANGED_EVENT, handleStateChange);
      window.removeEventListener('storage', handleStateChange);
    };
  }, []);

  const summary = mockNotificationService.getNotificationSummary();
  const rawNotifications = mockNotificationService.listNotifications();

  // Phase 2: Real-Data SVG Visual Analytics Computations
  const alertCategoryDonutData: PieChartDataPoint[] = useMemo(() => {
    const counts: Record<string, number> = {};
    rawNotifications.forEach(n => {
      counts[n.category] = (counts[n.category] || 0) + 1;
    });

    const entries = Object.entries(counts);
    entries.sort((a, b) => b[1] - a[1]);

    const palette = ['#3b82f6', '#10b981', '#f59e0b', '#dc2626', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];
    const top = entries.slice(0, 5);
    const others = entries.slice(5);
    const otherCount = others.reduce((sum, [, count]) => sum + count, 0);

    const points: PieChartDataPoint[] = top.map(([cat, count], idx) => ({
      label: labels(cat),
      value: count,
      color: palette[idx % palette.length],
      formattedValue: `${count} alerts`
    }));

    if (otherCount > 0) {
      points.push({
        label: 'Other Domains',
        value: otherCount,
        color: '#94a3b8',
        formattedValue: `${otherCount} alerts`
      });
    }

    return points;
  }, [rawNotifications]);

  const alertModuleLeaderboardData: HorizontalBarDataPoint[] = useMemo(() => {
    const modules: Record<string, { total: number; unread: number }> = {};
    rawNotifications.forEach(n => {
      const mod = n.sourceModule || 'system';
      if (!modules[mod]) modules[mod] = { total: 0, unread: 0 };
      modules[mod].total += 1;
      if (n.status === 'unread') modules[mod].unread += 1;
    });

    const entries = Object.entries(modules);
    entries.sort((a, b) => b[1].total - a[1].total);

    return entries.slice(0, 6).map(([mod, data]) => ({
      label: labels(mod),
      value: data.total,
      formattedValue: `${data.total} alerts`,
      sublabel: data.unread > 0 ? `${data.unread} unread` : '0 unread'
    }));
  }, [rawNotifications]);

  // Tab Filtering & Search
  const filteredNotifications = useMemo(() => {
    const filters: NotificationFilters = {
      search,
      category: categoryFilter,
      priority: priorityFilter,
      readStatus: 'all',
      sourceModule: 'all',
      createdDate: '',
      subscriberId: 'all',
      tab: activeTab
    };
    return mockNotificationService.filterNotifications(rawNotifications, filters);
  }, [rawNotifications, search, categoryFilter, priorityFilter, activeTab]);

  const pageCount = Math.max(1, Math.ceil(filteredNotifications.length / PAGE_SIZE));
  const paginatedNotifications = useMemo(() => {
    return filteredNotifications.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  }, [filteredNotifications, currentPage]);

  useEffect(() => {
    if (currentPage > pageCount) setCurrentPage(pageCount);
  }, [pageCount, currentPage]);

  const copy = (text: string, msg: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    showToast(msg, 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const run = (message: string, action: () => unknown) => {
    action();
    refresh();
    showToast(message, 'success');
  };

  const openRelated = (notification: PlatformNotification) => {
    navigate(mockNotificationService.handleNotificationAction(notification.id));
  };

  const toggleSelected = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const selectVisible = (checked: boolean) => {
    setSelected(checked ? paginatedNotifications.map(item => item.id) : []);
  };

  const exportCsv = () => {
    const csv = mockNotificationService.exportNotificationsCsv();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `platform-notifications-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    showToast('Notifications CSV exported successfully.', 'success');
  };

  const clearRead = () => {
    mockNotificationService.clearReadNotifications();
    refresh();
    showToast('Read notifications cleared.', 'success');
  };

  const allVisibleSelected = paginatedNotifications.length > 0 && paginatedNotifications.every(n => selected.includes(n.id));
  const systemAlertsCount = rawNotifications.filter(n => ['system', 'security', 'data_quality'].includes(n.category)).length;

  return (
    <main className="main-content" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 1. TOP HEADER (Exact 2-Button Standard) */}
      <PlatformPageHeader
        title="Alerts & Notifications"
        subtitle="Review clinic alerts, payment notices, system updates, and messages."
        breadcrumbs={['Platform', 'System & Tools', 'Alerts & Notifications']}
        secondaryAction={{
          label: 'Mark All as Read',
          icon: CheckCheck,
          onClick: () => run('All notifications marked as read.', () => mockNotificationService.markAllAsRead())
        }}
        primaryAction={{
          label: 'Notification Settings',
          icon: Sliders,
          onClick: () => setPreferencesOpen(true)
        }}
        overflowActions={[
          {
            id: 'reconcile',
            label: 'Reconcile Notifications',
            icon: RefreshCw,
            onSelect: () => run('Notifications reconciled across modules.', () => mockNotificationService.reconcileNotifications())
          },
          {
            id: 'export-csv',
            label: 'Export Alerts CSV',
            icon: Download,
            onSelect: exportCsv
          },
          {
            id: 'clear-read',
            label: 'Clear Read Notifications',
            icon: Trash2,
            destructive: true,
            onSelect: clearRead
          }
        ]}
      />

      {/* 2. TOP 4 HERO KPI CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1rem'
      }}>
        {/* Unread Alerts */}
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
              Unread Alerts
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0' }}>
              {summary.unread}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: summary.unread > 0 ? '#b45309' : '#16a34a', fontWeight: 600 }}>
              {summary.unread > 0 ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />}
              <span>{summary.unread > 0 ? 'Requires Platform Attention' : 'All Caught Up'}</span>
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
            <Bell size={22} />
          </div>
        </div>

        {/* High & Urgent Severity */}
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
              High & Urgent Severity
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#dc2626', margin: '0.25rem 0' }}>
              {summary.highPriority + summary.urgent}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#dc2626', fontWeight: 600 }}>
              <ShieldAlert size={13} />
              <span>{summary.urgent} Critical Priority</span>
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
            <AlertCircle size={22} />
          </div>
        </div>

        {/* Active System Domains */}
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
              Total Alert Volume
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0' }}>
              {summary.total}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#2563eb', fontWeight: 600 }}>
              <Layers size={13} />
              <span>12 System Categories</span>
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
            <FileText size={22} />
          </div>
        </div>

        {/* Broadcast Announcements */}
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
              Announcements
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0' }}>
              {summary.announcements}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>
              <Megaphone size={13} />
              <span>Platform Broadcasts</span>
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
            <Megaphone size={22} />
          </div>
        </div>
      </div>

      {/* 3. SECONDARY NOTIFICATION ENGINE RIBBON */}
      <div style={{
        backgroundColor: '#f8fafc',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '0.75rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        fontSize: '0.8rem',
        color: '#475569'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <Layers size={14} color="#2563eb" />
            <span><strong>Scope:</strong> 12 Active Event Domains</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <CheckCircle2 size={14} color="#16a34a" />
            <span><strong>Delivery Engine:</strong> Real-Time In-App Bell Synchronization</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <ShieldAlert size={14} color="#7c3aed" />
            <span><strong>Security Alerts:</strong> Mandatory Delivery Enforced</span>
          </span>
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#2563eb', fontWeight: 600 }}>
          <RefreshCw size={14} />
          <span>Cross-Tier Reactivity Active</span>
        </div>
      </div>

      {/* 3.5 REAL-DATA SVG VISUAL ALERT ANALYTICS SUITE */}
      {showAnalytics && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1rem'
        }}>
          {/* Donut Chart: Alert Distribution by Category */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '1.25rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <TrendingUp size={16} color="#2563eb" />
                  Alert Distribution by Category
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
                  100% computed distribution across active platform domains
                </p>
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '6px', backgroundColor: '#eff6ff', color: '#2563eb' }}>
                {rawNotifications.length} Total Alerts
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '0.5rem 0' }}>
              <DonutPieChart
                data={alertCategoryDonutData}
                centerLabel="ALERTS"
                centerValue={rawNotifications.length.toString()}
                size={210}
                donutThickness={26}
              />
            </div>
          </div>

          {/* Horizontal Bar Chart: Top Alerting Modules Leaderboard */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '1.25rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BarChart3 size={16} color="#7c3aed" />
                  Top Alerting Modules Leaderboard
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
                  Ranked by alert volume with unread sub-metrics
                </p>
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '6px', backgroundColor: '#f5f3ff', color: '#7c3aed' }}>
                Ranked #1-#6
              </span>
            </div>

            <div style={{ padding: '0.5rem 0' }}>
              <HorizontalBarChart
                data={alertModuleLeaderboardData}
                showRank={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. MAIN NOTIFICATION INBOX PANEL */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '1.25rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        {/* SEGMENTED FILTER TABS */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: '0.75rem',
          marginBottom: '1rem',
          overflowX: 'auto'
        }}>
          {[
            { id: 'all', label: 'All Alerts', count: rawNotifications.length },
            { id: 'unread', label: 'Unread', count: summary.unread },
            { id: 'high', label: 'High & Urgent', count: summary.highPriority + summary.urgent },
            { id: 'system', label: 'System & Security', count: systemAlertsCount },
            { id: 'announcements', label: 'Announcements', count: summary.announcements },
            { id: 'archived', label: 'Archived', count: summary.archived }
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => { setActiveTab(tab.id as typeof activeTab); setCurrentPage(1); }}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: isActive ? '#eff6ff' : 'transparent',
                  color: isActive ? '#2563eb' : '#64748b',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.85rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{tab.label}</span>
                <span style={{
                  padding: '0.1rem 0.45rem',
                  borderRadius: '12px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  backgroundColor: isActive ? '#2563eb' : '#f1f5f9',
                  color: isActive ? '#ffffff' : '#64748b'
                }}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', flex: 1 }}>
            {/* Search */}
            <div style={{ position: 'relative', minWidth: '240px', flex: 1, maxWidth: '380px' }}>
              <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search alert number, title, message, source..."
                value={search}
                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
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
              {search && (
                <button
                  type="button"
                  onClick={() => { setSearch(''); setCurrentPage(1); }}
                  style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
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
              {['registration', 'subscriber', 'user', 'plan', 'subscription', 'payment', 'clinic', 'laboratory', 'announcement', 'system', 'security', 'data_quality'].map(item => (
                <option key={item} value={item}>{labels(item)}</option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={e => { setPriorityFilter(e.target.value); setCurrentPage(1); }}
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
              <option value="all">All Priorities</option>
              {['low', 'normal', 'high', 'urgent'].map(item => (
                <option key={item} value={item}>{labels(item)}</option>
              ))}
            </select>

            {/* Clear Filters */}
            {(search || categoryFilter !== 'all' || priorityFilter !== 'all') && (
              <button
                type="button"
                onClick={() => { setSearch(''); setCategoryFilter('all'); setPriorityFilter('all'); setCurrentPage(1); }}
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
                Clear Filters
              </button>
            )}
          </div>

          {/* Quick Toolbar */}
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
                borderRadius: '8px'
              }}
              onClick={() => setShowAnalytics(prev => !prev)}
            >
              <BarChart3 size={13} color="#7c3aed" />
              <span>{showAnalytics ? 'Hide Alert Analytics' : 'Show Alert Analytics'}</span>
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
              Showing {filteredNotifications.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredNotifications.length)} of {filteredNotifications.length} alerts
            </span>

            <div className="segmented-control" role="group" aria-label="View mode" style={{ flexShrink: 0 }}>
              <button
                className={viewMode === 'table' ? 'active' : ''}
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                onClick={() => setViewMode('table')}
              >
                <List size={13} /> Table
              </button>
              <button
                className={viewMode === 'cards' ? 'active' : ''}
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                onClick={() => setViewMode('cards')}
              >
                <Grid size={13} /> Cards
              </button>
            </div>
          </div>
        </div>

        {/* BULK ACTION BAR */}
        {selected.length > 0 && (
          <div style={{
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '10px',
            padding: '0.65rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
            fontSize: '0.825rem',
            color: '#1e40af'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <strong>{selected.length} alerts selected</strong>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ height: '30px', padding: '0 0.65rem', fontSize: '0.75rem', backgroundColor: '#ffffff' }}
                onClick={() => {
                  mockNotificationService.markSelectedAsRead(selected);
                  setSelected([]);
                  refresh();
                  showToast('Selected alerts marked as read.', 'success');
                }}
              >
                <CheckCheck size={13} /> Mark Read
              </button>
              <button
                type="button"
                className="btn btn-outline"
                style={{ height: '30px', padding: '0 0.65rem', fontSize: '0.75rem', backgroundColor: '#ffffff' }}
                onClick={() => {
                  mockNotificationService.archiveSelected(selected);
                  setSelected([]);
                  refresh();
                  showToast('Selected alerts archived.', 'success');
                }}
              >
                <Trash2 size={13} /> Archive Selected
              </button>
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.75rem', cursor: 'pointer', padding: '0 0.4rem' }}
                onClick={() => setSelected([])}
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* 500PX HIGH-DENSITY TABLE OR CARDS GRID */}
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
                  <th style={{ padding: '0.75rem 0.5rem 0.75rem 1rem', width: '36px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={e => selectVisible(e.target.checked)}
                      aria-label="Select all visible notifications"
                    />
                  </th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Alert ID</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Priority</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Category / Source</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: '#475569', minWidth: '220px' }}>Notification Details</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Timestamp</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: '#475569', width: '80px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedNotifications.map(notification => {
                  const isUnread = notification.status === 'unread';
                  return (
                    <tr
                      key={notification.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: isUnread ? '#fafcff' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease'
                      }}
                      onClick={() => navigate(`/platform/notifications/${notification.id}`)}
                    >
                      {/* Selection Checkbox */}
                      <td style={{ padding: '0.85rem 0.5rem 0.85rem 1rem', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.includes(notification.id)}
                          onChange={() => toggleSelected(notification.id)}
                          aria-label={`Select notification: ${notification.title}`}
                        />
                      </td>

                      {/* Monospace Notification ID with 1-click copy */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>
                            {notification.notificationNumber}
                          </span>
                          <button
                            type="button"
                            onClick={() => copy(notification.notificationNumber, 'Alert ID copied')}
                            style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer', color: copiedId === notification.notificationNumber ? '#16a34a' : '#94a3b8' }}
                            title="Copy Alert ID"
                          >
                            {copiedId === notification.notificationNumber ? <Check size={12} /> : <Copy size={12} />}
                          </button>
                        </div>
                      </td>

                      {/* Priority Badge */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        <NotificationPriorityBadge priority={notification.priority} />
                      </td>

                      {/* Category & Source Module */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.8rem' }}>
                          {labels(notification.category)}
                        </div>
                        <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '0.15rem' }}>
                          {labels(notification.sourceModule)}
                        </div>
                      </td>

                      {/* Title & Preview Message */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: isUnread ? 700 : 600, color: isUnread ? '#0f172a' : '#334155', fontSize: '0.85rem' }}>
                          {notification.title}
                        </div>
                        <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.775rem', color: '#64748b', lineHeight: '1.3', maxWidth: '420px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {notification.message}
                        </p>
                      </td>

                      {/* Timestamp with relative time */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 600, color: '#334155', fontSize: '0.8rem' }}>
                          {new Date(notification.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div style={{ fontSize: '0.725rem', color: '#94a3b8', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={11} /> {formatRelativeTime(notification.createdAt)}
                        </div>
                      </td>

                      {/* Read / Unread Status Badge */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        <span style={{
                          padding: '0.2rem 0.55rem',
                          borderRadius: '20px',
                          fontSize: '0.725rem',
                          fontWeight: 700,
                          backgroundColor: notification.status === 'unread' ? '#eff6ff' : notification.status === 'archived' ? '#f1f5f9' : '#f0fdf4',
                          color: notification.status === 'unread' ? '#2563eb' : notification.status === 'archived' ? '#64748b' : '#16a34a',
                          border: `1px solid ${notification.status === 'unread' ? '#bfdbfe' : notification.status === 'archived' ? '#e2e8f0' : '#bbf7d0'}`
                        }}>
                          {labels(notification.status)}
                        </span>
                      </td>

                      {/* Left-Anchored 3-Dots Action Menu */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.35rem' }}>
                          <NotificationActionMenu
                            notification={notification}
                            onView={() => navigate(`/platform/notifications/${notification.id}`)}
                            onOpenRelated={() => openRelated(notification)}
                            onRead={() => run('Alert marked as read.', () => mockNotificationService.markAsRead(notification.id))}
                            onUnread={() => run('Alert marked as unread.', () => mockNotificationService.markAsUnread(notification.id))}
                            onArchive={() => run('Alert archived.', () => mockNotificationService.archiveNotification(notification.id))}
                            onRestore={() => run('Alert restored.', () => mockNotificationService.restoreNotification(notification.id))}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredNotifications.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                      No notifications found matching your filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* RESPONSIVE CARDS GRID */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1rem'
          }}>
            {paginatedNotifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 1rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', gridColumn: '1 / -1' }}>
                <Bell size={36} style={{ color: '#94a3b8', margin: '0 auto 0.75rem auto' }} />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>No notifications found</h4>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>No notifications match your current filters or system alerts.</p>
              </div>
            ) : (
              paginatedNotifications.map(notification => {
                const isUnread = notification.status === 'unread';
                return (
                  <div
                    key={notification.id}
                    style={{
                      backgroundColor: isUnread ? '#fafcff' : '#ffffff',
                      border: isUnread ? '1.5px solid #93c5fd' : '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '1rem',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      transition: 'all 0.15s ease'
                    }}
                    onClick={() => navigate(`/platform/notifications/${notification.id}`)}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.75rem', color: '#0f172a' }}>
                          {notification.notificationNumber}
                        </span>
                        <NotificationPriorityBadge priority={notification.priority} />
                      </div>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.35rem 0' }}>
                        {notification.title}
                      </h4>
                      <p style={{ fontSize: '0.775rem', color: '#64748b', margin: 0, lineHeight: '1.4' }}>
                        {notification.message}
                      </p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem', fontSize: '0.725rem', color: '#94a3b8' }}>
                      <span>{formatRelativeTime(notification.createdAt)}</span>
                      <div onClick={e => e.stopPropagation()}>
                        <NotificationActionMenu
                          notification={notification}
                          onView={() => navigate(`/platform/notifications/${notification.id}`)}
                          onOpenRelated={() => openRelated(notification)}
                          onRead={() => run('Alert marked as read.', () => mockNotificationService.markAsRead(notification.id))}
                          onUnread={() => run('Alert marked as unread.', () => mockNotificationService.markAsUnread(notification.id))}
                          onArchive={() => run('Alert archived.', () => mockNotificationService.archiveNotification(notification.id))}
                          onRestore={() => run('Alert restored.', () => mockNotificationService.restoreNotification(notification.id))}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* PAGINATION ROW */}
        {pageCount > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, filteredNotifications.length)}–{Math.min(currentPage * PAGE_SIZE, filteredNotifications.length)} of {filteredNotifications.length} alerts
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                style={{ height: '32px', width: 'auto', flexShrink: 0, padding: '0 0.75rem', fontSize: '0.775rem', borderRadius: '6px' }}
              >
                Previous
              </button>
              {(() => {
                const total = pageCount;
                const current = currentPage;
                const pages: Array<number | string> = [];
                if (total <= 7) {
                  for (let i = 1; i <= total; i++) pages.push(i);
                } else if (current <= 3) {
                  pages.push(1, 2, 3, 4, '...', total);
                } else if (current >= total - 2) {
                  pages.push(1, '...', total - 3, total - 2, total - 1, total);
                } else {
                  pages.push(1, '...', current - 1, current, current + 1, '...', total);
                }

                return pages.map((p, idx) => {
                  if (typeof p === 'string') {
                    return (
                      <span key={`ellipsis-${idx}`} style={{ padding: '0 0.35rem', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>
                        …
                      </span>
                    );
                  }
                  const isActive = currentPage === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      className={`btn ${isActive ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setCurrentPage(p)}
                      style={{
                        width: '32px',
                        height: '32px',
                        padding: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.775rem',
                        borderRadius: '6px',
                        fontWeight: isActive ? 700 : 500,
                        backgroundColor: isActive ? '#2563eb' : '#ffffff',
                        borderColor: isActive ? '#2563eb' : '#e2e8f0',
                        color: isActive ? '#ffffff' : '#334155'
                      }}
                    >
                      {p}
                    </button>
                  );
                });
              })()}
              <button
                type="button"
                className="btn btn-outline"
                disabled={currentPage === pageCount}
                onClick={() => setCurrentPage(prev => Math.min(pageCount, prev + 1))}
                style={{ height: '32px', width: 'auto', flexShrink: 0, padding: '0 0.75rem', fontSize: '0.775rem', borderRadius: '6px' }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. PREFERENCES MODAL */}
      <NotificationPreferencesDialog
        open={preferencesOpen}
        userId={ownerId()}
        onClose={() => setPreferencesOpen(false)}
        onUpdated={refresh}
      />
    </main>
  );
}
