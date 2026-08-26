import { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Users, 
  CheckCircle2, 
  Eye, 
  ShieldCheck, 
  Send, 
  FileSpreadsheet, 
  Search, 
  Check, 
  Copy, 
  AlertCircle,
  Edit,
  Copy as CopyIcon,
  Archive,
  RefreshCw,
  XCircle
} from 'lucide-react';
import { mockAnnouncementService } from '../services/mockAnnouncementService';
import { mockPlatformManagementService } from '../../platformManagement/services/mockPlatformManagementService';
import { PlatformPageHeader } from '../../../components/PlatformShared';
import { DonutPieChart, type PieChartDataPoint } from '../../analytics/components/charts/DonutPieChart';
import { HorizontalBarChart, type HorizontalBarDataPoint } from '../../analytics/components/charts/HorizontalBarChart';

interface Props {
  announcementId: string;
  navigate: (route: string) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

const labels = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, char => char.toUpperCase());

export function AnnouncementDetailsPage({ announcementId, navigate, showToast }: Props) {
  const [, setVersion] = useState(0);
  const [tab, setTab] = useState<'overview' | 'content' | 'audience' | 'recipients' | 'analytics' | 'history'>('overview');
  const [recipientSearch, setRecipientSearch] = useState('');
  const [recipientStatusFilter, setRecipientStatusFilter] = useState<'all' | 'delivered' | 'read' | 'acknowledged'>('all');
  const [copied, setCopied] = useState(false);

  const announcement = mockAnnouncementService.getAnnouncementById(announcementId);
  const refresh = () => setVersion(prev => prev + 1);

  const run = (message: string, action: () => { ok?: boolean; error?: string } | unknown) => {
    const result = action() as { ok?: boolean; error?: string } | undefined;
    if (result && result.ok === false) showToast(result.error || 'Announcement action failed.', 'error');
    else {
      refresh();
      showToast(message, 'success');
    }
  };

  const allUsers = useMemo(() => mockPlatformManagementService.listUsers(), []);
  const allSubscribers = useMemo(() => mockPlatformManagementService.listSubscribers(), []);

  if (!announcement) {
    return (
      <main className="main-content">
        <div className="dashboard-panel empty-state">
          <h1>Announcement not found</h1>
          <p>This announcement record is not available in local system storage.</p>
          <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => navigate('/platform/announcements')}>
            Back to Announcements
          </button>
        </div>
      </main>
    );
  }

  const analytics = mockAnnouncementService.getAnnouncementAnalytics(announcement.id);
  const recipients = mockAnnouncementService.getAnnouncementRecipients(announcement.id);
  const history = mockAnnouncementService.getAnnouncementHistory(announcement.id);

  // Filtered Recipients
  const filteredRecipients = recipients.filter(rec => {
    const user = allUsers.find(u => u.id === rec.userId);
    const sub = allSubscribers.find(s => s.id === rec.subscriberId);
    const matchesSearch = 
      !recipientSearch ||
      rec.userId.toLowerCase().includes(recipientSearch.toLowerCase()) ||
      (user?.fullName || '').toLowerCase().includes(recipientSearch.toLowerCase()) ||
      (user?.email || '').toLowerCase().includes(recipientSearch.toLowerCase()) ||
      (sub?.businessName || '').toLowerCase().includes(recipientSearch.toLowerCase());

    const matchesStatus = 
      recipientStatusFilter === 'all' ||
      (recipientStatusFilter === 'acknowledged' && Boolean(rec.acknowledgedAt)) ||
      (recipientStatusFilter === 'read' && Boolean(rec.readAt)) ||
      (recipientStatusFilter === 'delivered' && (rec.deliveryStatus === 'delivered_in_app' || rec.deliveryStatus === 'generated'));

    return matchesSearch && matchesStatus;
  });

  // Analytics Chart Data
  const engagementDonutData: PieChartDataPoint[] = [
    { label: 'Acknowledged', value: analytics.acknowledged, color: '#10b981', formattedValue: `${analytics.acknowledged} users` },
    { label: 'Read (No Ack)', value: Math.max(0, analytics.read - analytics.acknowledged), color: '#3b82f6', formattedValue: `${Math.max(0, analytics.read - analytics.acknowledged)} users` },
    { label: 'Unread Deliveries', value: analytics.unread, color: '#f59e0b', formattedValue: `${analytics.unread} users` },
    { label: 'Pending Delivery', value: Math.max(0, analytics.recipients - analytics.delivered), color: '#94a3b8', formattedValue: `${Math.max(0, analytics.recipients - analytics.delivered)} users` }
  ].filter(item => item.value > 0);

  // Role Breakdown Bar Data
  const roleCounts: Record<string, { total: number; read: number }> = {};
  recipients.forEach(r => {
    const user = allUsers.find(u => u.id === r.userId);
    const roleKey = user ? user.role : 'Platform User';
    if (!roleCounts[roleKey]) roleCounts[roleKey] = { total: 0, read: 0 };
    roleCounts[roleKey].total += 1;
    if (r.readAt) roleCounts[roleKey].read += 1;
  });

  const roleBarData: HorizontalBarDataPoint[] = Object.entries(roleCounts).map(([role, stats]) => ({
    label: labels(role),
    value: stats.total,
    formattedValue: `${stats.read}/${stats.total} Read (${stats.total ? Math.round((stats.read / stats.total) * 100) : 0}%)`,
    sublabel: `${stats.total} targeted accounts`,
    color: '#8b5cf6'
  }));

  const exportRecipientsCSV = () => {
    const headers = ['Recipient ID', 'User Name', 'Email', 'Role', 'Clinic / Subscriber', 'Delivery Status', 'Channel', 'Generated At', 'Read At', 'Acknowledged At'];
    const rows = filteredRecipients.map(r => {
      const user = allUsers.find(u => u.id === r.userId);
      const sub = allSubscribers.find(s => s.id === r.subscriberId);
      return [
        r.id,
        user?.fullName || r.userId,
        user?.email || '',
        user?.role || 'user',
        sub?.businessName || 'Platform',
        r.deliveryStatus,
        r.deliveryChannel,
        r.generatedAt,
        r.readAt || 'Unread',
        r.acknowledgedAt || 'Pending'
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Announcement_Recipients_${announcement.announcementNumber}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Recipients CSV exported successfully.', 'success');
  };

  const copyContent = () => {
    navigator.clipboard.writeText(announcement.content);
    setCopied(true);
    showToast('Announcement content copied to clipboard.', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="main-content" style={{ paddingBottom: '3rem' }}>
      <PlatformPageHeader
        title={announcement.title}
        subtitle={`${announcement.announcementNumber} • ${announcement.summary}`}
        breadcrumbs={['Platform', 'System', 'Announcements', announcement.announcementNumber]}
        secondaryAction={{
          label: 'Back to Announcements',
          icon: ArrowLeft,
          onClick: () => navigate('/platform/announcements')
        }}
        primaryAction={announcement.status === 'draft' || announcement.status === 'scheduled' ? {
          label: 'Publish Broadcast Now',
          icon: Send,
          onClick: () => run('Announcement published and notifications sent.', () => mockAnnouncementService.publishAnnouncement(announcement.id))
        } : undefined}
        overflowActions={[
          { id: 'edit', label: 'Edit Announcement', icon: Edit, onSelect: () => navigate(`/platform/announcements/${announcement.id}/edit`) },
          { id: 'duplicate', label: 'Duplicate Broadcast', icon: CopyIcon, onSelect: () => run('Announcement duplicated.', () => mockAnnouncementService.duplicateAnnouncement(announcement.id)) },
          ...(announcement.status === 'scheduled' ? [{ id: 'cancel', label: 'Cancel Schedule', icon: XCircle, onSelect: () => run('Schedule cancelled.', () => mockAnnouncementService.cancelScheduledAnnouncement(announcement.id)) }] : []),
          ...(announcement.status === 'published' ? [{ id: 'unpublish', label: 'Unpublish Broadcast', icon: XCircle, onSelect: () => run('Announcement unpublished.', () => mockAnnouncementService.unpublishAnnouncement(announcement.id)) }] : []),
          ...(announcement.status === 'archived' ? [{ id: 'restore', label: 'Restore Announcement', icon: RefreshCw, onSelect: () => run('Announcement restored.', () => mockAnnouncementService.restoreAnnouncement(announcement.id)) }] : [{ id: 'archive', label: 'Archive Announcement', icon: Archive, onSelect: () => run('Announcement archived.', () => mockAnnouncementService.archiveAnnouncement(announcement.id)) }])
        ]}
      />

      {/* TOP 5 HERO KPI CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '0.85rem',
        marginBottom: '1.25rem'
      }}>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
            <Users size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Target Audience</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{analytics.recipients}</div>
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
            <Send size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Delivered</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#047857' }}>{analytics.delivered}</div>
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
            <Eye size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Read Rate</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1d4ed8' }}>{analytics.readRate}%</div>
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Acknowledged</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#6d28d9' }}>{analytics.acknowledged} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#8b5cf6' }}>({analytics.acknowledgementRate}%)</span></div>
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Unread Backlog</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#b45309' }}>{analytics.unread}</div>
          </div>
        </div>
      </div>

      {/* SEGMENTED NAVIGATION TABS */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.35rem',
        backgroundColor: '#f1f5f9',
        borderRadius: '12px',
        marginBottom: '1.25rem',
        overflowX: 'auto'
      }}>
        {[
          { id: 'overview', label: '📌 Overview & Metadata' },
          { id: 'content', label: '📝 Content & Message' },
          { id: 'audience', label: '👥 Target Audience & Channels' },
          { id: 'analytics', label: '📊 Visual Engagement Analytics' },
          { id: 'recipients', label: `📋 Recipients Ledger (${recipients.length})` },
          { id: 'history', label: `📜 Audit History (${history.length})` }
        ].map(item => {
          const isActive = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id as typeof tab)}
              style={{
                padding: '0.55rem 1rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: isActive ? '#ffffff' : 'transparent',
                color: isActive ? '#0f172a' : '#64748b',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.825rem',
                boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & METADATA */}
      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>General Information</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <MetaRow label="Announcement ID" value={<span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{announcement.announcementNumber}</span>} />
              <MetaRow label="Status" value={<span className={`status-badge ${announcement.status}`}>{labels(announcement.status)}</span>} />
              <MetaRow label="Category Type" value={<span style={{ fontWeight: 600, color: '#2563eb' }}>{labels(announcement.announcementType)}</span>} />
              <MetaRow label="Priority" value={<span className={`status-badge ${announcement.priority}`}>{labels(announcement.priority)}</span>} />
              <MetaRow label="Featured Pin" value={announcement.featured ? '⭐️ Yes, Pinned' : 'No'} />
              <MetaRow label="Acknowledgement" value={announcement.requiresAcknowledgement ? '⚠️ Mandatory Required' : 'Optional / Dismissible'} />
              <MetaRow label="Dismissible" value={announcement.allowDismiss ? 'Yes' : 'No'} />
            </div>
          </div>

          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>Timeline & Schedule</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <MetaRow label="Created Date" value={new Date(announcement.createdAt).toLocaleString()} />
              <MetaRow label="Scheduled Dispatch" value={announcement.publishAt ? new Date(announcement.publishAt).toLocaleString() : 'Not scheduled'} />
              <MetaRow label="Published Date" value={announcement.publishedAt ? new Date(announcement.publishedAt).toLocaleString() : 'Draft / Unpublished'} />
              <MetaRow label="Expiration Date" value={announcement.expiresAt ? new Date(announcement.expiresAt).toLocaleString() : 'No expiration set'} />
              <MetaRow label="Author / Sender" value={announcement.createdBy} />
              <MetaRow label="Internal Notes" value={announcement.internalNotes || 'No internal notes provided.'} />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CONTENT & MESSAGE */}
      {tab === 'content' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{announcement.title}</h2>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>{announcement.summary}</p>
            </div>
            <button
              type="button"
              className="btn btn-outline"
              style={{ width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              onClick={copyContent}
            >
              {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy Content'}
            </button>
          </div>

          <div style={{
            padding: '1.25rem',
            borderRadius: '12px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            whiteSpace: 'pre-wrap',
            fontFamily: 'inherit',
            fontSize: '0.875rem',
            lineHeight: 1.6,
            color: '#1e293b'
          }}>
            {announcement.content}
          </div>

          {announcement.tags.length > 0 && (
            <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Tags:</span>
              {announcement.tags.map(tag => (
                <span
                  key={tag}
                  style={{
                    fontSize: '0.725rem',
                    padding: '0.2rem 0.55rem',
                    borderRadius: '6px',
                    backgroundColor: '#eff6ff',
                    color: '#2563eb',
                    fontWeight: 600
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AUDIENCE & CHANNELS */}
      {tab === 'audience' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>Audience Targeting Specification</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <MetaRow label="Target Mode" value={<span style={{ fontWeight: 700, color: '#047857' }}>{labels(announcement.targetAudience.mode)}</span>} />
              <MetaRow label="Resolved Count" value={<strong>{analytics.recipients} Accounts</strong>} />
              <MetaRow label="Audience Scope" value={mockAnnouncementService.getAudienceLabel(announcement.targetAudience)} />
              <MetaRow label="Visibility Level" value={labels(announcement.visibility)} />
            </div>
          </div>

          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>Delivery Channels Enabled</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {announcement.deliveryChannels.map(channel => (
                <div
                  key={channel}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '10px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span style={{ fontSize: '0.825rem', fontWeight: 600, color: '#1e293b' }}>{labels(channel)}</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#047857', backgroundColor: '#ecfdf5', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>ACTIVE</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: VISUAL ENGAGEMENT ANALYTICS */}
      {tab === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.25rem' }}>
            {/* SVG DONUT CHART: ENGAGEMENT */}
            <DonutPieChart
              title="Broadcast Delivery & Engagement Breakdown"
              subtitle="Distribution of read receipts, pending unread notices, and mandatory acknowledgements"
              data={engagementDonutData}
              centerLabel="Total Deliveries"
              centerValue={String(analytics.delivered)}
            />

            {/* SVG HORIZONTAL BAR: ROLE DELIVERIES */}
            <HorizontalBarChart
              title="Recipient Reach by User Role"
              subtitle="Delivery counts and read engagement rates partitioned across system roles"
              data={roleBarData}
              color="#8b5cf6"
            />
          </div>

          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>Real-time Delivery Synchronizer</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>In-app deliveries are delivered with idempotency guards and instantaneous store persistence.</div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ width: 'auto', fontSize: '0.8rem' }}
                onClick={exportRecipientsCSV}
              >
                <FileSpreadsheet size={14} /> Export CSV Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: 500PX COMPACT RECIPIENTS LEDGER */}
      {tab === 'recipients' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.25rem' }}>
          {/* Filter Ribbon */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '240px', maxWidth: '400px' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '12px', color: '#94a3b8' }} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search recipient by name, email, clinic..."
                  value={recipientSearch}
                  onChange={e => setRecipientSearch(e.target.value)}
                  style={{ paddingLeft: '32px', height: '36px', fontSize: '0.8rem', width: '100%', borderRadius: '8px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: '#f1f5f9', padding: '0.2rem', borderRadius: '8px' }}>
                {(['all', 'acknowledged', 'read', 'delivered'] as const).map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setRecipientStatusFilter(f)}
                    style={{
                      padding: '0.25rem 0.65rem',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: recipientStatusFilter === f ? '#ffffff' : 'transparent',
                      color: recipientStatusFilter === f ? '#0f172a' : '#64748b',
                      fontSize: '0.75rem',
                      fontWeight: recipientStatusFilter === f ? 700 : 500,
                      cursor: 'pointer'
                    }}
                  >
                    {labels(f)}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="btn btn-outline"
                style={{ width: 'auto', fontSize: '0.775rem', height: '34px' }}
                onClick={exportRecipientsCSV}
              >
                <FileSpreadsheet size={14} /> Export CSV
              </button>
            </div>
          </div>

          {/* 500px Compact Table */}
          <div style={{ maxHeight: '500px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 2, borderBottom: '2px solid #e2e8f0' }}>
                <tr>
                  <th style={{ padding: '0.65rem 0.75rem', fontSize: '0.75rem', fontWeight: 700, textAlign: 'left', color: '#475569' }}>User & Contact</th>
                  <th style={{ padding: '0.65rem 0.75rem', fontSize: '0.75rem', fontWeight: 700, textAlign: 'left', color: '#475569' }}>Role / Clinic</th>
                  <th style={{ padding: '0.65rem 0.75rem', fontSize: '0.75rem', fontWeight: 700, textAlign: 'left', color: '#475569' }}>Channel</th>
                  <th style={{ padding: '0.65rem 0.75rem', fontSize: '0.75rem', fontWeight: 700, textAlign: 'left', color: '#475569' }}>Delivery Status</th>
                  <th style={{ padding: '0.65rem 0.75rem', fontSize: '0.75rem', fontWeight: 700, textAlign: 'left', color: '#475569' }}>Read Timestamp</th>
                  <th style={{ padding: '0.65rem 0.75rem', fontSize: '0.75rem', fontWeight: 700, textAlign: 'left', color: '#475569' }}>Acknowledgement</th>
                  <th style={{ padding: '0.65rem 0.75rem', fontSize: '0.75rem', fontWeight: 700, textAlign: 'right', color: '#475569' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecipients.map(recipient => {
                  const user = allUsers.find(u => u.id === recipient.userId);
                  const sub = allSubscribers.find(s => s.id === recipient.subscriberId);

                  return (
                    <tr key={recipient.id} style={{ borderBottom: '1px solid #f1f5f9', verticalAlign: 'top' }}>
                      <td style={{ padding: '0.65rem 0.75rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#0f172a' }}>
                          {user?.fullName || recipient.userId}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                          {user?.email || 'No email registered'}
                        </div>
                      </td>

                      <td style={{ padding: '0.65rem 0.75rem' }}>
                        <span style={{
                          fontSize: '0.7rem',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          backgroundColor: '#f1f5f9',
                          color: '#475569',
                          fontWeight: 600
                        }}>
                          {labels(user?.role || 'user')}
                        </span>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem' }}>
                          {sub?.businessName || 'Platform'}
                        </div>
                      </td>

                      <td style={{ padding: '0.65rem 0.75rem', fontSize: '0.75rem', color: '#334155' }}>
                        {labels(recipient.deliveryChannel)}
                      </td>

                      <td style={{ padding: '0.65rem 0.75rem' }}>
                        <span className={`status-badge ${recipient.deliveryStatus}`}>
                          {labels(recipient.deliveryStatus)}
                        </span>
                      </td>

                      <td style={{ padding: '0.65rem 0.75rem', fontSize: '0.75rem', color: recipient.readAt ? '#047857' : '#94a3b8' }}>
                        {recipient.readAt ? new Date(recipient.readAt).toLocaleString() : 'Unread'}
                      </td>

                      <td style={{ padding: '0.65rem 0.75rem', fontSize: '0.75rem' }}>
                        {recipient.acknowledgedAt ? (
                          <span style={{ color: '#047857', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <CheckCircle2 size={12} color="#10b981" /> {new Date(recipient.acknowledgedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>Pending</span>
                        )}
                      </td>

                      <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>
                        {!recipient.acknowledgedAt && (
                          <button
                            type="button"
                            className="btn btn-outline compact-action"
                            style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                            onClick={() => run('Recipient manually acknowledged.', () => mockAnnouncementService.acknowledgeAnnouncement(announcement.id, recipient.userId))}
                          >
                            Simulate Ack
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredRecipients.length === 0 && (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                <AlertCircle size={24} style={{ margin: '0 auto 0.5rem auto', opacity: 0.5 }} />
                No matching recipient records found for this filter.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: AUDIT HISTORY TIMELINE */}
      {tab === 'history' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>Chronological Audit Trail</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {history.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                No history events recorded yet.
              </div>
            ) : (
              history.map(item => (
                <div
                  key={item.id}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '10px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '1rem'
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '0.825rem', color: '#1e293b' }}>{item.action}</strong>
                    <p style={{ fontSize: '0.775rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>{item.details}</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '0.725rem', fontWeight: 600, color: '#334155' }}>{item.actor}</div>
                    <div style={{ fontSize: '0.675rem', color: '#94a3b8' }}>{new Date(item.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.45rem 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.8rem' }}>
      <span style={{ color: '#64748b', fontWeight: 500 }}>{label}</span>
      <div style={{ color: '#0f172a' }}>{value}</div>
    </div>
  );
}
