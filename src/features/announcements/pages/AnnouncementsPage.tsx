import { useMemo, useState } from 'react';
import { 
  CalendarClock, 
  Plus, 
  RefreshCw, 
  Megaphone, 
  CheckCircle2, 
  AlertTriangle,
  Users,
  Eye,
  FileText,
  Clock,
  Sparkles,
  Search,
  SlidersHorizontal,
  X,
  Send,
  Bell
} from 'lucide-react';
import { ConfirmationDialog } from '../../../components/overlays/ConfirmationDialog';
import { Modal } from '../../../components/overlays/Modal';
import { AnnouncementActionMenu } from '../components/AnnouncementActionMenu';
import { mockAnnouncementService } from '../services/mockAnnouncementService';
import { PlatformPageHeader } from '../../../components/PlatformShared';
import type { Announcement, AnnouncementFilters, AnnouncementSort } from '../types';

interface Props {
  navigate: (route: string) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

const labels = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, char => char.toUpperCase());
const PAGE_SIZE = 10;

export function AnnouncementsPage({ navigate, showToast }: Props) {
  const [, setVersion] = useState(0);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [page, setPage] = useState(1);
  const [preview, setPreview] = useState<Announcement | null>(null);
  const [previewTab, setPreviewTab] = useState<'banner' | 'toast' | 'mobile'>('banner');
  const [confirmAction, setConfirmAction] = useState<'publish' | 'cancel' | 'unpublish' | 'archive' | 'restore' | 'delete' | null>(null);
  const [target, setTarget] = useState<Announcement | null>(null);
  const [filters, setFilters] = useState<AnnouncementFilters>({
    search: '',
    announcementType: 'all',
    priority: 'all',
    status: 'all',
    audienceType: 'all',
    publishDate: '',
    expirationDate: '',
    requiresAcknowledgement: 'all',
    tab: 'all'
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sort, setSort] = useState<AnnouncementSort>({ field: 'updatedAt', direction: 'desc' });

  const announcements = mockAnnouncementService.listAnnouncements();
  const summary = mockAnnouncementService.getAnnouncementSummary();

  const filtered = useMemo(() => {
    return mockAnnouncementService.sortAnnouncements(
      mockAnnouncementService.filterAnnouncements(announcements, filters),
      sort
    );
  }, [announcements, filters, sort]);

  const paged = mockAnnouncementService.paginateAnnouncements(filtered, page, PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const setFilter = (key: keyof AnnouncementFilters, value: string) => {
    setPage(1);
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const refresh = () => setVersion(prev => prev + 1);

  const ask = (announcement: Announcement, action: typeof confirmAction) => {
    setTarget(announcement);
    setConfirmAction(action);
  };

  const duplicate = (announcement: Announcement) => {
    const result = mockAnnouncementService.duplicateAnnouncement(announcement.id);
    if (!result.ok || !result.data) {
      showToast(result.error || 'Could not duplicate announcement.', 'error');
    } else {
      refresh();
      showToast('Announcement duplicated as a draft.', 'success');
      navigate(`/platform/announcements/${result.data.id}/edit`);
    }
  };

  const runConfirmed = () => {
    if (!target || !confirmAction) return;
    const result =
      confirmAction === 'publish' ? mockAnnouncementService.publishAnnouncement(target.id) :
      confirmAction === 'cancel' ? mockAnnouncementService.cancelScheduledAnnouncement(target.id) :
      confirmAction === 'unpublish' ? mockAnnouncementService.unpublishAnnouncement(target.id) :
      confirmAction === 'archive' ? mockAnnouncementService.archiveAnnouncement(target.id) :
      confirmAction === 'restore' ? mockAnnouncementService.restoreAnnouncement(target.id) :
      mockAnnouncementService.permanentlyDeleteUnusedDraft(target.id);

    if (!result.ok) {
      showToast(result.error || 'Announcement action failed.', 'error');
    } else {
      refresh();
      showToast(`Announcement ${confirmAction === 'delete' ? 'deleted permanently' : `${confirmAction}ed successfully`}.`, 'success');
    }
    setTarget(null);
    setConfirmAction(null);
  };

  const renderActions = (announcement: Announcement) => (
    <AnnouncementActionMenu
      announcement={announcement}
      onView={() => navigate(`/platform/announcements/${announcement.id}`)}
      onEdit={() => navigate(`/platform/announcements/${announcement.id}/edit`)}
      onPreview={() => { setPreview(announcement); setPreviewTab('banner'); }}
      onDuplicate={() => duplicate(announcement)}
      onPublish={() => ask(announcement, 'publish')}
      onSchedule={() => navigate(`/platform/announcements/${announcement.id}/edit`)}
      onCancelSchedule={() => ask(announcement, 'cancel')}
      onUnpublish={() => ask(announcement, 'unpublish')}
      onRecipients={() => navigate(`/platform/announcements/${announcement.id}`)}
      onAnalytics={() => navigate(`/platform/announcements/${announcement.id}`)}
      onArchive={() => ask(announcement, 'archive')}
      onRestore={() => ask(announcement, 'restore')}
      onDelete={() => ask(announcement, 'delete')}
    />
  );

  const tabCounts = useMemo(() => {
    return {
      all: announcements.length,
      draft: announcements.filter(a => a.status === 'draft').length,
      scheduled: announcements.filter(a => a.status === 'scheduled').length,
      published: announcements.filter(a => a.status === 'published').length,
      expired: announcements.filter(a => a.status === 'expired').length,
      cancelled: announcements.filter(a => a.status === 'cancelled').length,
      archived: announcements.filter(a => a.status === 'archived').length
    };
  }, [announcements]);

  const activeFilterCount = (filters.announcementType !== 'all' ? 1 : 0) +
    (filters.priority !== 'all' ? 1 : 0) +
    (filters.status !== 'all' ? 1 : 0) +
    (filters.audienceType !== 'all' ? 1 : 0) +
    (filters.publishDate ? 1 : 0) +
    (filters.expirationDate ? 1 : 0) +
    (filters.requiresAcknowledgement !== 'all' ? 1 : 0);

  const hasFilters = activeFilterCount > 0 || filters.search !== '';

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return { bg: '#fef2f2', color: '#dc2626', border: '#fca5a5', dot: '#ef4444' };
      case 'high':
        return { bg: '#fff7ed', color: '#ea580c', border: '#fdba74', dot: '#f97316' };
      case 'normal':
        return { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe', dot: '#3b82f6' };
      default:
        return { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0', dot: '#94a3b8' };
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'published':
        return { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' };
      case 'scheduled':
        return { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' };
      case 'draft':
        return { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' };
      case 'expired':
        return { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' };
      case 'cancelled':
        return { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' };
      case 'archived':
        return { bg: '#f3f4f6', color: '#6b7280', border: '#e5e7eb' };
      default:
        return { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' };
    }
  };

  return (
    <main className="main-content" style={{ paddingBottom: '3rem' }}>
      {/* HEADER */}
      <PlatformPageHeader
        title="Announcements & Notices"
        subtitle="Broadcast clinic notices, platform updates, reminders, and news to clinic owners and staff."
        breadcrumbs={['Platform', 'System & Tools', 'Announcements & Notices']}
        primaryAction={{
          label: 'Create Announcement',
          icon: Plus,
          onClick: () => navigate('/platform/announcements/new')
        }}
        secondaryAction={{
          label: 'Check Scheduled',
          icon: RefreshCw,
          onClick: () => {
            mockAnnouncementService.processScheduledAnnouncements();
            refresh();
            showToast('Scheduled announcements checked.', 'success');
          }
        }}
      />

      {/* TOP 4 HERO KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        {/* Total Announcements */}
        <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Broadcasts</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
              <Megaphone size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>{summary.total}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Across all categories & priority levels</div>
        </div>

        {/* Live Published */}
        <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active & Published</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981' }}>{summary.published} Live</div>
          <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.25rem', fontWeight: 600 }}>Visible to targeted recipients</div>
        </div>

        {/* Scheduled Pipeline */}
        <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Scheduled Queue</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#fdf4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333ea' }}>
              <CalendarClock size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#9333ea' }}>{summary.scheduled} Queued</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Auto-dispatches at scheduled time</div>
        </div>

        {/* Urgent & Critical Alerts */}
        <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Urgent Priority</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: summary.urgent > 0 ? '#ef4444' : '#64748b' }}>{summary.urgent} Urgent</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>High-visibility mandatory banners</div>
        </div>
      </div>

      {/* SECONDARY SUMMARY PILLS */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        flexWrap: 'wrap',
        marginBottom: '1.25rem',
        padding: '0.75rem 1.25rem',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        fontSize: '0.8rem',
        color: '#475569'
      }}>
        <span style={{ fontWeight: 600, color: '#0f172a' }}>Delivery Metrics:</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.2rem 0.6rem', backgroundColor: '#f1f5f9', borderRadius: '20px' }}>
          <Users size={13} color="#2563eb" /> {summary.totalRecipients} Total Recipients
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.2rem 0.6rem', backgroundColor: '#f1f5f9', borderRadius: '20px' }}>
          <Eye size={13} color="#10b981" /> {summary.unreadDeliveries} Unread Deliveries
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.2rem 0.6rem', backgroundColor: '#f1f5f9', borderRadius: '20px' }}>
          <FileText size={13} color="#64748b" /> {summary.draft} Drafts
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.2rem 0.6rem', backgroundColor: '#f1f5f9', borderRadius: '20px' }}>
          <Clock size={13} color="#ea580c" /> {summary.expired} Expired
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.2rem 0.6rem', backgroundColor: '#f1f5f9', borderRadius: '20px' }}>
          <Sparkles size={13} color="#8b5cf6" /> 100% In-App Notification Delivery
        </span>
      </div>

      {/* MAIN CONTAINER */}
      <section style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        {/* STATUS TABS WITH COUNT BADGES */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          flexWrap: 'wrap',
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: '0.85rem',
          marginBottom: '1rem'
        }}>
          {(['all', 'draft', 'scheduled', 'published', 'expired', 'cancelled', 'archived'] as const).map(tabKey => {
            const count = tabCounts[tabKey];
            const isActive = filters.tab === tabKey;
            return (
              <button
                key={tabKey}
                type="button"
                onClick={() => setFilter('tab', tabKey)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '10px',
                  border: isActive ? '1px solid #3b82f6' : '1px solid transparent',
                  backgroundColor: isActive ? '#eff6ff' : 'transparent',
                  color: isActive ? '#1d4ed8' : '#64748b',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{labels(tabKey)}</span>
                <span style={{
                  padding: '0.1rem 0.45rem',
                  borderRadius: '12px',
                  fontSize: '0.725rem',
                  fontWeight: 700,
                  backgroundColor: isActive ? '#dbeafe' : '#f1f5f9',
                  color: isActive ? '#1e40af' : '#64748b'
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* TOOLBAR: SEARCH, QUICK FILTERS, VIEW MODE */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
          {/* Left: Search & Filter Dropdowns */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', flex: 1 }}>
            <div style={{ position: 'relative', minWidth: '240px', flex: 1, maxWidth: '380px' }}>
              <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search by title, summary, or ID..."
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

            <select
              value={filters.announcementType}
              onChange={e => setFilter('announcementType', e.target.value)}
              style={{
                height: '38px',
                padding: '0 0.75rem',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                fontSize: '0.825rem',
                backgroundColor: '#f8fafc',
                color: '#334155'
              }}
            >
              <option value="all">All Announcement Types</option>
              {['general', 'maintenance', 'service_update', 'subscription', 'payment', 'security', 'policy', 'emergency', 'feature_release', 'other'].map(t => (
                <option key={t} value={t}>{labels(t)}</option>
              ))}
            </select>

            <select
              value={filters.priority}
              onChange={e => setFilter('priority', e.target.value)}
              style={{
                height: '38px',
                padding: '0 0.75rem',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                fontSize: '0.825rem',
                backgroundColor: '#f8fafc',
                color: '#334155'
              }}
            >
              <option value="all">All Priorities</option>
              {['low', 'normal', 'high', 'urgent'].map(p => (
                <option key={p} value={p}>{labels(p)}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setShowAdvancedFilters(prev => !prev)}
              style={{
                height: '38px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0 0.85rem',
                borderRadius: '10px',
                border: activeFilterCount > 0 ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                backgroundColor: activeFilterCount > 0 ? '#eff6ff' : '#ffffff',
                color: activeFilterCount > 0 ? '#1d4ed8' : '#475569',
                fontSize: '0.825rem',
                fontWeight: activeFilterCount > 0 ? 600 : 500,
                cursor: 'pointer'
              }}
            >
              <SlidersHorizontal size={14} />
              <span>More Filters</span>
              {activeFilterCount > 0 && (
                <span style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#2563eb', color: '#ffffff', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {activeFilterCount}
                </span>
              )}
            </button>

            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setFilters({
                    search: '',
                    announcementType: 'all',
                    priority: 'all',
                    status: 'all',
                    audienceType: 'all',
                    publishDate: '',
                    expirationDate: '',
                    requiresAcknowledgement: 'all',
                    tab: 'all'
                  });
                  setPage(1);
                }}
                style={{
                  height: '38px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0 0.75rem',
                  borderRadius: '10px',
                  border: '1px solid #fee2e2',
                  backgroundColor: '#fef2f2',
                  color: '#dc2626',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <X size={14} /> Reset
              </button>
            )}
          </div>

          {/* Right: View Mode Segmented Switcher */}
          <div style={{
            display: 'inline-flex',
            backgroundColor: '#f1f5f9',
            borderRadius: '10px',
            padding: '3px',
            border: '1px solid #e2e8f0'
          }}>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: viewMode === 'table' ? '#ffffff' : 'transparent',
                color: viewMode === 'table' ? '#0f172a' : '#64748b',
                fontWeight: viewMode === 'table' ? 700 : 500,
                fontSize: '0.8rem',
                cursor: 'pointer',
                boxShadow: viewMode === 'table' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Table View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: viewMode === 'cards' ? '#ffffff' : 'transparent',
                color: viewMode === 'cards' ? '#0f172a' : '#64748b',
                fontWeight: viewMode === 'cards' ? 700 : 500,
                fontSize: '0.8rem',
                cursor: 'pointer',
                boxShadow: viewMode === 'cards' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Cards Grid
            </button>
          </div>
        </div>

        {/* ADVANCED FILTER DRAWER / BANNER */}
        {showAdvancedFilters && (
          <div style={{
            padding: '1rem',
            backgroundColor: '#f8fafc',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            marginBottom: '1.25rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>Audience Mode</label>
              <select
                value={filters.audienceType}
                onChange={e => setFilter('audienceType', e.target.value)}
                style={{ width: '100%', height: '36px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem', padding: '0 0.5rem' }}
              >
                <option value="all">All Audiences</option>
                {['all_platform_users', 'all_subscribers', 'subscriber_status', 'subscription_plan', 'subscription_status', 'specific_subscribers', 'user_roles', 'specific_users', 'clinics', 'laboratories'].map(item => (
                  <option key={item} value={item}>{labels(item)}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>Publish Date</label>
              <input
                type="date"
                value={filters.publishDate}
                onChange={e => setFilter('publishDate', e.target.value)}
                style={{ width: '100%', height: '36px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem', padding: '0 0.5rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>Expiration Date</label>
              <input
                type="date"
                value={filters.expirationDate}
                onChange={e => setFilter('expirationDate', e.target.value)}
                style={{ width: '100%', height: '36px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem', padding: '0 0.5rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>Requires Acknowledgement</label>
              <select
                value={filters.requiresAcknowledgement}
                onChange={e => setFilter('requiresAcknowledgement', e.target.value)}
                style={{ width: '100%', height: '36px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem', padding: '0 0.5rem' }}
              >
                <option value="all">All</option>
                <option value="true">Yes (Mandatory)</option>
                <option value="false">No (Informational)</option>
              </select>
            </div>
          </div>
        )}

        {/* DATA CONTAINER */}
        {paged.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
            <Megaphone size={40} style={{ color: '#94a3b8', margin: '0 auto 0.75rem auto' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>No announcements found</h3>
            <p style={{ fontSize: '0.825rem', color: '#64748b', marginBottom: '1rem' }}>No records match your active search and status filters.</p>
            <button
              type="button"
              className="btn btn-outline"
              style={{ width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              onClick={() => {
                setFilters({
                  search: '',
                  announcementType: 'all',
                  priority: 'all',
                  status: 'all',
                  audienceType: 'all',
                  publishDate: '',
                  expirationDate: '',
                  requiresAcknowledgement: 'all',
                  tab: 'all'
                });
                setPage(1);
              }}
            >
              Clear All Filters
            </button>
          </div>
        ) : viewMode === 'table' ? (
          /* 500PX COMPACT TABLE CONTAINER */
          <div style={{
            maxHeight: '500px',
            overflowY: 'auto',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            position: 'relative'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.825rem' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <tr>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#475569', width: '130px' }}>
                    <button
                      type="button"
                      onClick={() => setSort({ field: 'announcementNumber', direction: sort.direction === 'asc' ? 'desc' : 'asc' })}
                      style={{ background: 'none', border: 'none', padding: 0, fontWeight: 700, color: '#475569', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      ID & Date
                    </button>
                  </th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#475569' }}>Announcement Title & Details</th>
                  <th style={{ padding: '0.75rem 0.75rem', fontWeight: 700, color: '#475569', width: '130px' }}>Type & Priority</th>
                  <th style={{ padding: '0.75rem 0.75rem', fontWeight: 700, color: '#475569', width: '160px' }}>Target Audience</th>
                  <th style={{ padding: '0.75rem 0.75rem', fontWeight: 700, color: '#475569', width: '130px' }}>Status</th>
                  <th style={{ padding: '0.75rem 0.75rem', fontWeight: 700, color: '#475569', width: '150px' }}>Engagement</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#475569', width: '60px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((announcement, idx) => {
                  const analytics = mockAnnouncementService.getAnnouncementAnalytics(announcement.id);
                  const pStyle = getPriorityStyle(announcement.priority);
                  const sStyle = getStatusStyle(announcement.status);

                  return (
                    <tr
                      key={announcement.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                        verticalAlign: 'top',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f0fdfa')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#ffffff' : '#fafafa')}
                    >
                      {/* ID & Date */}
                      <td style={{ padding: '0.75rem 1rem', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {announcement.announcementNumber}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem' }}>
                          {announcement.publishedAt ? new Date(announcement.publishedAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) :
                           announcement.publishAt ? `Sched: ${new Date(announcement.publishAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}` :
                           'Draft'}
                        </div>
                      </td>

                      {/* Title & Details */}
                      <td style={{ padding: '0.75rem 1rem', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                          <span
                            onClick={() => navigate(`/platform/announcements/${announcement.id}`)}
                            style={{ fontWeight: 700, color: '#1e293b', cursor: 'pointer', textDecoration: 'none' }}
                          >
                            {announcement.title}
                          </span>
                          {announcement.featured && (
                            <span style={{ fontSize: '0.675rem', padding: '0.1rem 0.4rem', borderRadius: '4px', backgroundColor: '#fef3c7', color: '#b45309', fontWeight: 700 }}>
                              FEATURED
                            </span>
                          )}
                          {announcement.requiresAcknowledgement && (
                            <span style={{ fontSize: '0.675rem', padding: '0.1rem 0.4rem', borderRadius: '4px', backgroundColor: '#fee2e2', color: '#dc2626', fontWeight: 700 }}>
                              ACK REQUIRED
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', lineHeight: 1.4 }}>
                          {announcement.summary}
                        </div>
                        {announcement.tags.length > 0 && (
                          <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                            {announcement.tags.slice(0, 3).map(tag => (
                              <span key={tag} style={{ fontSize: '0.675rem', padding: '0.05rem 0.35rem', borderRadius: '4px', backgroundColor: '#f1f5f9', color: '#475569' }}>
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Type & Priority */}
                      <td style={{ padding: '0.75rem 0.75rem', verticalAlign: 'top' }}>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          fontSize: '0.725rem',
                          fontWeight: 700,
                          backgroundColor: pStyle.bg,
                          color: pStyle.color,
                          border: `1px solid ${pStyle.border}`,
                          textTransform: 'uppercase'
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: pStyle.dot }} />
                          {announcement.priority}
                        </div>
                        <div style={{ fontSize: '0.725rem', color: '#475569', marginTop: '0.3rem', fontWeight: 500 }}>
                          {labels(announcement.announcementType)}
                        </div>
                      </td>

                      {/* Target Audience */}
                      <td style={{ padding: '0.75rem 0.75rem', verticalAlign: 'top' }}>
                        <div style={{ fontSize: '0.775rem', fontWeight: 600, color: '#334155' }}>
                          {mockAnnouncementService.getAudienceLabel(announcement.targetAudience)}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.15rem' }}>
                          {announcement.deliveryChannels.map(labels).join(', ')}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '0.75rem 0.75rem', verticalAlign: 'top' }}>
                        <div style={{
                          display: 'inline-block',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          fontSize: '0.725rem',
                          fontWeight: 700,
                          backgroundColor: sStyle.bg,
                          color: sStyle.color,
                          border: `1px solid ${sStyle.border}`,
                          textTransform: 'capitalize'
                        }}>
                          {announcement.status}
                        </div>
                      </td>

                      {/* Engagement */}
                      <td style={{ padding: '0.75rem 0.75rem', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.25rem' }}>
                          <span>{analytics.read} / {analytics.recipients} read</span>
                          <span style={{ color: analytics.readRate > 50 ? '#10b981' : '#64748b' }}>{analytics.readRate}%</span>
                        </div>
                        <div style={{ width: '100%', height: '5px', borderRadius: '3px', backgroundColor: '#e2e8f0', overflow: 'hidden' }}>
                          <div style={{ width: `${analytics.readRate}%`, height: '100%', backgroundColor: analytics.readRate > 50 ? '#10b981' : '#3b82f6', borderRadius: '3px' }} />
                        </div>
                      </td>

                      {/* Action Menu */}
                      <td style={{ padding: '0.75rem 1rem', verticalAlign: 'top', textAlign: 'center' }}>
                        {renderActions(announcement)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* MODERN CARDS VIEW GRID */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {paged.map(announcement => {
              const analytics = mockAnnouncementService.getAnnouncementAnalytics(announcement.id);
              const pStyle = getPriorityStyle(announcement.priority);
              const sStyle = getStatusStyle(announcement.status);

              return (
                <div
                  key={announcement.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    borderTop: `4px solid ${pStyle.dot}`,
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <span style={{
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          backgroundColor: pStyle.bg,
                          color: pStyle.color,
                          border: `1px solid ${pStyle.border}`
                        }}>
                          {announcement.priority.toUpperCase()}
                        </span>
                        <span style={{
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          backgroundColor: sStyle.bg,
                          color: sStyle.color,
                          border: `1px solid ${sStyle.border}`
                        }}>
                          {announcement.status.toUpperCase()}
                        </span>
                      </div>
                      {renderActions(announcement)}
                    </div>

                    <h4
                      onClick={() => navigate(`/platform/announcements/${announcement.id}`)}
                      style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem', cursor: 'pointer' }}
                    >
                      {announcement.title}
                    </h4>

                    <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.4, marginBottom: '0.75rem' }}>
                      {announcement.summary}
                    </p>
                  </div>

                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.35rem' }}>
                      <span>Target: <strong>{mockAnnouncementService.getAudienceLabel(announcement.targetAudience)}</strong></span>
                      <span><strong>{analytics.readRate}%</strong> Read</span>
                    </div>
                    <div style={{ width: '100%', height: '4px', borderRadius: '2px', backgroundColor: '#e2e8f0', overflow: 'hidden' }}>
                      <div style={{ width: `${analytics.readRate}%`, height: '100%', backgroundColor: '#3b82f6' }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* PAGINATION ROW */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.825rem', color: '#64748b' }}>
            Showing <strong>{paged.length}</strong> of <strong>{filtered.length}</strong> announcements
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              className="btn btn-outline compact-action"
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', width: 'auto' }}
            >
              Previous
            </button>
            <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>
              Page {page} of {pageCount}
            </span>
            <button
              type="button"
              disabled={page === pageCount}
              onClick={() => setPage(prev => Math.min(pageCount, prev + 1))}
              className="btn btn-outline compact-action"
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', width: 'auto' }}
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {/* RICH PREVIEW MODAL */}
      <Modal
        open={Boolean(preview)}
        title="Live Broadcast Preview"
        description="Visual mockup across platform header banner, notification tray, and mobile card."
        onClose={() => setPreview(null)}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', width: '100%' }}>
            <button
              type="button"
              className="btn btn-outline"
              style={{ width: 'auto' }}
              onClick={() => setPreview(null)}
            >
              Close
            </button>
            {preview && ['draft', 'scheduled', 'cancelled'].includes(preview.status) && (
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                onClick={() => {
                  const targetToPublish = preview;
                  setPreview(null);
                  ask(targetToPublish, 'publish');
                }}
              >
                <Send size={14} /> Publish Announcement
              </button>
            )}
          </div>
        }
      >
        {preview && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* View Mode Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setPreviewTab('banner')}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: previewTab === 'banner' ? '#eff6ff' : 'transparent',
                  color: previewTab === 'banner' ? '#1d4ed8' : '#64748b',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                Desktop Header Banner
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab('toast')}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: previewTab === 'toast' ? '#eff6ff' : 'transparent',
                  color: previewTab === 'toast' ? '#1d4ed8' : '#64748b',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                Notification Center Card
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab('mobile')}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: previewTab === 'mobile' ? '#eff6ff' : 'transparent',
                  color: previewTab === 'mobile' ? '#1d4ed8' : '#64748b',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                Mobile View
              </button>
            </div>

            {previewTab === 'banner' && (
              <div style={{
                padding: '1.25rem',
                backgroundColor: preview.priority === 'urgent' ? '#fef2f2' : '#eff6ff',
                borderRadius: '12px',
                border: preview.priority === 'urgent' ? '1px solid #fca5a5' : '1px solid #bfdbfe',
                color: preview.priority === 'urgent' ? '#991b1b' : '#1e40af'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Megaphone size={18} />
                  <strong style={{ fontSize: '0.95rem' }}>{preview.title}</strong>
                  <span style={{
                    fontSize: '0.675rem',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '4px',
                    backgroundColor: preview.priority === 'urgent' ? '#fee2e2' : '#dbeafe',
                    color: preview.priority === 'urgent' ? '#dc2626' : '#1d4ed8',
                    fontWeight: 700,
                    textTransform: 'uppercase'
                  }}>
                    {preview.priority}
                  </span>
                </div>
                <p style={{ fontSize: '0.85rem', marginBottom: '0.75rem', whiteSpace: 'pre-wrap' }}>{preview.content}</p>
                <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>
                  Target: {mockAnnouncementService.getAudienceLabel(preview.targetAudience)} • Delivery: {preview.deliveryChannels.map(labels).join(', ')}
                </div>
              </div>
            )}

            {previewTab === 'toast' && (
              <div style={{
                padding: '1rem',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-start'
              }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', flexShrink: 0 }}>
                  <Bell size={18} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
                    <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>{preview.title}</strong>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Just now</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>{preview.summary}</p>
                  {preview.requiresAcknowledgement && (
                    <button type="button" className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem', width: 'auto' }}>
                      Acknowledge Notice
                    </button>
                  )}
                </div>
              </div>
            )}

            {previewTab === 'mobile' && (
              <div style={{
                maxWidth: '360px',
                margin: '0 auto',
                backgroundColor: '#f8fafc',
                borderRadius: '16px',
                border: '2px solid #cbd5e1',
                padding: '1rem',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
              }}>
                <div style={{ textAlign: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid #e2e8f0', marginBottom: '0.75rem', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
                  MOBILE APP NOTIFICATION
                </div>
                <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '0.85rem', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.675rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>
                    {preview.announcementType}
                  </span>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', margin: '0.25rem 0' }}>{preview.title}</h4>
                  <p style={{ fontSize: '0.775rem', color: '#64748b', lineHeight: 1.4, margin: 0 }}>{preview.summary}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* CONFIRMATION MODAL */}
      <ConfirmationDialog
        open={Boolean(target && confirmAction)}
        title={`${labels(confirmAction || 'confirm')} "${target?.title || 'Announcement'}"?`}
        description={
          confirmAction === 'publish'
            ? `This will immediately broadcast to ${target ? mockAnnouncementService.estimateAudience(target.targetAudience).count : 0} resolved recipient(s) across all active channels.`
            : confirmAction === 'delete'
            ? 'This draft will be permanently removed from system storage. This action cannot be undone.'
            : `Are you sure you want to ${confirmAction} this announcement?`
        }
        confirmLabel={confirmAction === 'delete' ? 'Delete Permanently' : 'Confirm Action'}
        destructive={['archive', 'delete', 'cancel'].includes(confirmAction || '')}
        onCancel={() => { setTarget(null); setConfirmAction(null); }}
        onConfirm={runConfirmed}
      />
    </main>
  );
}
