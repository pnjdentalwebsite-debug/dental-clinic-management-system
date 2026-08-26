import { useState } from 'react';
import { 
  ArrowLeft, 
  ExternalLink, 
  CheckCheck, 
  Trash2, 
  Copy, 
  Check, 
  Clock, 
  Layers, 
  ShieldAlert, 
  Printer, 
  Code
} from 'lucide-react';
import { NotificationPriorityBadge } from '../components/NotificationPriorityBadge';
import { mockNotificationService } from '../services/mockNotificationService';
import { PlatformPageHeader } from '../../../components/PlatformShared';

interface Props {
  notificationId: string;
  navigate: (route: string) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

const labels = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, char => char.toUpperCase());

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

export function NotificationDetailsPage({ notificationId, navigate, showToast }: Props) {
  const [, setVersion] = useState(0);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  const notification = mockNotificationService.getNotificationById(notificationId);
  const refresh = () => setVersion(prev => prev + 1);

  const run = (message: string, action: () => unknown) => {
    action();
    refresh();
    showToast(message, 'success');
  };

  const copy = (text: string, isJson = false) => {
    navigator.clipboard.writeText(text);
    if (isJson) {
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
      showToast('Alert details copied to clipboard.', 'info');
    } else {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
      showToast('Notification ID copied.', 'info');
    }
  };

  if (!notification) {
    return (
      <main className="main-content" style={{ padding: '1.5rem' }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '3rem',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
            Notification Not Found
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1.5rem 0' }}>
            The requested notification record (<code style={{ fontFamily: 'monospace' }}>{notificationId}</code>) could not be located in local persistence.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            style={{ width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            onClick={() => navigate('/platform/notifications')}
          >
            <ArrowLeft size={15} /> Back to Alerts & Notifications
          </button>
        </div>
      </main>
    );
  }

  const isUnread = notification.status === 'unread';
  const hasRelatedAction = !!(notification.actionUrl || notification.sourceRecordId);

  return (
    <main className="main-content" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 1. TOP HEADER (2-Button Standard) */}
      <PlatformPageHeader
        title={notification.title}
        subtitle={`Alert Number: ${notification.notificationNumber} • Generated ${formatRelativeTime(notification.createdAt)}`}
        breadcrumbs={['Platform', 'System & Tools', 'Alerts & Notifications', notification.notificationNumber]}
        secondaryAction={{
          label: 'Back to Alerts & Notifications',
          icon: ArrowLeft,
          onClick: () => navigate('/platform/notifications')
        }}
        primaryAction={hasRelatedAction ? {
          label: notification.actionLabel || 'Open Related Record',
          icon: ExternalLink,
          onClick: () => navigate(mockNotificationService.handleNotificationAction(notification.id))
        } : undefined}
        overflowActions={[
          {
            id: 'toggle-read',
            label: isUnread ? 'Mark as Read' : 'Mark as Unread',
            icon: CheckCheck,
            onSelect: () => run(isUnread ? 'Notification marked as read.' : 'Notification marked as unread.', () => {
              if (isUnread) mockNotificationService.markAsRead(notification.id);
              else mockNotificationService.markAsUnread(notification.id);
            })
          },
          {
            id: 'archive',
            label: notification.status === 'archived' ? 'Restore Alert' : 'Archive Alert',
            icon: Trash2,
            onSelect: () => run(notification.status === 'archived' ? 'Alert restored.' : 'Alert archived.', () => {
              if (notification.status === 'archived') mockNotificationService.restoreNotification(notification.id);
              else mockNotificationService.archiveNotification(notification.id);
            })
          },
          {
            id: 'copy-id',
            label: 'Copy Alert ID',
            icon: Copy,
            onSelect: () => copy(notification.notificationNumber)
          },
          {
            id: 'print',
            label: 'Print Alert Record',
            icon: Printer,
            onSelect: () => window.print()
          }
        ]}
      />

      {/* 2. ALERT SUMMARY HERO CARD */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '1.25rem 1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>
                {notification.notificationNumber}
              </span>
              <button
                type="button"
                onClick={() => copy(notification.notificationNumber)}
                style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer', color: copiedId ? '#16a34a' : '#94a3b8' }}
                title="Copy Alert ID"
              >
                {copiedId ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem 0' }}>
              {notification.title}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8rem', color: '#64748b' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <Clock size={13} /> {new Date(notification.createdAt).toLocaleString('en-PH')} ({formatRelativeTime(notification.createdAt)})
              </span>
              {notification.readAt && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#16a34a' }}>
                  <CheckCheck size={13} /> Read at {new Date(notification.readAt).toLocaleString('en-PH')}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <NotificationPriorityBadge priority={notification.priority} />
            <span style={{
              padding: '0.25rem 0.65rem',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 700,
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              border: '1px solid #bfdbfe'
            }}>
              {labels(notification.category)}
            </span>
            <span style={{
              padding: '0.25rem 0.65rem',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 700,
              backgroundColor: isUnread ? '#fef2f2' : '#f0fdf4',
              color: isUnread ? '#dc2626' : '#16a34a',
              border: `1px solid ${isUnread ? '#fecaca' : '#bbf7d0'}`
            }}>
              {labels(notification.status)}
            </span>
          </div>
        </div>

        {/* Message Box */}
        <div style={{
          backgroundColor: '#f8fafc',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '1rem 1.25rem',
          fontSize: '0.9rem',
          color: '#334155',
          lineHeight: '1.5'
        }}>
          <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
            {notification.message}
          </p>
        </div>
      </div>

      {/* 3. METADATA & CORRELATION ATTRIBUTES */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.25rem'
      }}>
        {/* Domain Attributes */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '1.25rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={16} color="#2563eb" />
            Alert Context & Routing Attributes
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.825rem' }}>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.725rem', fontWeight: 600, textTransform: 'uppercase' }}>Source Module</span>
              <strong style={{ color: '#0f172a' }}>{labels(notification.sourceModule)}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.725rem', fontWeight: 600, textTransform: 'uppercase' }}>System Domain</span>
              <strong style={{ color: '#0f172a' }}>{labels(notification.category)}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.725rem', fontWeight: 600, textTransform: 'uppercase' }}>Related Subscriber</span>
              <strong style={{ color: '#0f172a' }}>{notification.subscriberId || 'Global / Platform'}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.725rem', fontWeight: 600, textTransform: 'uppercase' }}>Source Record ID</span>
              <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{notification.sourceRecordId || 'N/A'}</strong>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.725rem', fontWeight: 600, textTransform: 'uppercase' }}>Action Target URL</span>
              <strong style={{ color: '#2563eb', fontFamily: 'monospace' }}>{notification.actionUrl || 'None'}</strong>
            </div>
          </div>
        </div>

        {/* Security & Delivery Status */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '1.25rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={16} color="#7c3aed" />
            Dispatch & Delivery Verification
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.825rem' }}>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.725rem', fontWeight: 600, textTransform: 'uppercase' }}>In-App Bell Dispatch</span>
              <span style={{ color: '#16a34a', fontWeight: 700 }}>Active (Delivered)</span>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.725rem', fontWeight: 600, textTransform: 'uppercase' }}>Delivery Priority</span>
              <strong style={{ color: '#0f172a' }}>{labels(notification.priority)}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.725rem', fontWeight: 600, textTransform: 'uppercase' }}>Deduplication Status</span>
              <span style={{ color: '#2563eb', fontWeight: 600 }}>Auto-Reconciled</span>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.725rem', fontWeight: 600, textTransform: 'uppercase' }}>Archival State</span>
              <strong style={{ color: '#0f172a' }}>{labels(notification.status)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 4. SOURCE EVENT JSON PAYLOAD VIEWER */}
      {notification.metadata && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '1.25rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Code size={16} color="#0f172a" />
              Alert Details & Properties
            </h3>
            <button
              type="button"
              className="btn btn-outline"
              style={{
                height: '30px',
                padding: '0 0.65rem',
                fontSize: '0.75rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                borderRadius: '6px'
              }}
              onClick={() => copy(JSON.stringify(notification.metadata, null, 2), true)}
            >
              {copiedJson ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
              <span>{copiedJson ? 'Copied!' : 'Copy Details'}</span>
            </button>
          </div>
          <div style={{
            backgroundColor: '#0f172a',
            color: '#38bdf8',
            borderRadius: '10px',
            padding: '1rem',
            fontFamily: 'monospace',
            fontSize: '0.8rem',
            overflowX: 'auto',
            maxHeight: '300px',
            lineHeight: '1.4'
          }}>
            <pre style={{ margin: 0 }}>
              {JSON.stringify(notification.metadata, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </main>
  );
}
