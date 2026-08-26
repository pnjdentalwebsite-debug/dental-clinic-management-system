import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, BellOff, CheckCheck, ExternalLink, MoreHorizontal, Eye, Mail, MailOpen, Archive } from 'lucide-react';
import { Portal } from '../../../components/overlays/Portal';
import { mockNotificationService, NOTIFICATION_STATE_CHANGED_EVENT } from '../services/mockNotificationService';
import type { PlatformNotification } from '../types';

interface Props {
  navigate: (route: string) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

const timeAgo = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
};

const priorityColor = (priority: string): string => {
  switch (priority) {
    case 'urgent': return 'var(--danger)';
    case 'high': return 'var(--warning)';
    case 'normal': return 'var(--info)';
    default: return 'var(--text-muted)';
  }
};

const formatLabel = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase());

export function NotificationBell({ navigate, showToast }: Props) {
  const [open, setOpen] = useState(false);
  const [, setVersion] = useState(0);
  const [position, setPosition] = useState<{ top: number; right: number } | null>(null);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const unread = mockNotificationService.getUnreadCount();
  const allNotifications = mockNotificationService.listNotifications();
  const recent = allNotifications
    .filter(n => n.status !== 'archived')
    .sort((a, b) => {
      if (a.status === 'unread' && b.status !== 'unread') return -1;
      if (a.status !== 'unread' && b.status === 'unread') return 1;
      if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
      if (a.priority !== 'urgent' && b.priority === 'urgent') return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, 5);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const panelWidth = Math.min(400, window.innerWidth - 24);
    let rightEdge = window.innerWidth - rect.right;
    if (rightEdge < 12) rightEdge = 12;
    if (rightEdge + panelWidth > window.innerWidth - 12) {
      rightEdge = window.innerWidth - panelWidth - 12;
    }
    setPosition({
      top: rect.bottom + 10,
      right: Math.max(12, rightEdge)
    });
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  useEffect(() => {
    if (!open) {
      setActionMenuId(null);
      return;
    }
    calculatePosition();

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        window.setTimeout(() => triggerRef.current?.focus(), 0);
      }
    };
    const handleScroll = () => setOpen(false);
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
      calculatePosition();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [open, calculatePosition]);

  const refresh = () => setVersion(prev => prev + 1);

  const markAll = () => {
    mockNotificationService.markAllAsRead();
    refresh();
    showToast('All notifications marked as read.', 'success');
  };

  const viewAll = () => {
    setOpen(false);
    navigate('/platform/notifications');
  };

  const handleItemClick = (notification: PlatformNotification) => {
    mockNotificationService.markAsRead(notification.id);
    setOpen(false);
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    } else {
      navigate(`/platform/notifications/${notification.id}`);
    }
  };

  const handleItemAction = (notification: PlatformNotification, action: string) => {
    setActionMenuId(null);
    switch (action) {
      case 'view':
        setOpen(false);
        navigate(`/platform/notifications/${notification.id}`);
        break;
      case 'related':
        if (notification.actionUrl) {
          setOpen(false);
          navigate(notification.actionUrl);
        }
        break;
      case 'read':
        mockNotificationService.markAsRead(notification.id);
        refresh();
        showToast('Marked as read.', 'success');
        break;
      case 'unread':
        mockNotificationService.markAsUnread(notification.id);
        refresh();
        showToast('Marked as unread.', 'success');
        break;
      case 'archive':
        mockNotificationService.archiveNotification(notification.id);
        refresh();
        showToast('Notification archived.', 'success');
        break;
    }
  };

  const badgeText = unread > 99 ? '99+' : String(unread);

  const panelContent = (
    <div
      ref={panelRef}
      className={`notification-popover ${isMobile ? 'notification-popover--mobile' : ''}`}
      role="dialog"
      aria-label={`Recent notifications, ${unread} unread`}
      style={!isMobile && position ? {
        position: 'fixed',
        top: `${position.top}px`,
        right: `${position.right}px`,
      } : undefined}
    >
      {/* Header */}
      <div className="notification-popover__header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <strong style={{ fontSize: '1rem' }}>Notifications</strong>
          {unread > 0 && (
            <span className="notification-popover__count">{unread}</span>
          )}
        </div>
        <button
          className="notification-popover__mark-all"
          onClick={markAll}
          disabled={unread === 0}
          aria-label="Mark all notifications as read"
        >
          <CheckCheck size={14} />
          Mark All Read
        </button>
      </div>

      {/* List */}
      <div className="notification-popover__list">
        {recent.length === 0 ? (
          <div className="notification-popover__empty">
            <BellOff size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
            <p style={{ fontWeight: 600, margin: 0 }}>You're all caught up.</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>No recent notifications to display.</p>
          </div>
        ) : (
          recent.map(notification => (
            <div
              key={notification.id}
              className={`notification-popover__item ${notification.status === 'unread' ? 'notification-popover__item--unread' : ''}`}
            >
              <button
                className="notification-popover__item-body"
                onClick={() => handleItemClick(notification)}
                aria-label={`${notification.status === 'unread' ? 'Unread: ' : ''}${notification.title}`}
              >
                <span
                  className="notification-popover__dot"
                  style={{ backgroundColor: notification.status === 'unread' ? priorityColor(notification.priority) : 'transparent' }}
                  aria-hidden="true"
                />
                <div className="notification-popover__content">
                  <span className="notification-popover__title">{notification.title}</span>
                  <span className="notification-popover__message">{notification.message}</span>
                  <span className="notification-popover__meta">
                    {formatLabel(notification.category)}
                    {notification.priority !== 'normal' && notification.priority !== 'low' && (
                      <span className={`notification-popover__priority notification-popover__priority--${notification.priority}`}>
                        {formatLabel(notification.priority)}
                      </span>
                    )}
                    <span style={{ marginLeft: 'auto' }}>{timeAgo(notification.createdAt)}</span>
                  </span>
                </div>
              </button>

              <div className="notification-popover__item-action" style={{ position: 'relative' }}>
                <button
                  className="notification-popover__action-btn"
                  onClick={(e) => { e.stopPropagation(); setActionMenuId(prev => prev === notification.id ? null : notification.id); }}
                  aria-label={`Actions for ${notification.title}`}
                >
                  <MoreHorizontal size={16} />
                </button>
                {actionMenuId === notification.id && (
                  <div className="notification-popover__action-menu" onClick={e => e.stopPropagation()}>
                    <button className="notification-popover__menu-item" onClick={() => handleItemAction(notification, 'view')}>
                      <Eye size={14} /> Open Notification
                    </button>
                    {notification.actionUrl && (
                      <button className="notification-popover__menu-item" onClick={() => handleItemAction(notification, 'related')}>
                        <ExternalLink size={14} /> Open Related Record
                      </button>
                    )}
                    <div className="notification-popover__menu-sep" />
                    {notification.status === 'unread' ? (
                      <button className="notification-popover__menu-item" onClick={() => handleItemAction(notification, 'read')}>
                        <MailOpen size={14} /> Mark as Read
                      </button>
                    ) : (
                      <button className="notification-popover__menu-item" onClick={() => handleItemAction(notification, 'unread')}>
                        <Mail size={14} /> Mark as Unread
                      </button>
                    )}
                    <button className="notification-popover__menu-item" onClick={() => handleItemAction(notification, 'archive')}>
                      <Archive size={14} /> Archive
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="notification-popover__footer">
        <button className="notification-popover__view-all" onClick={viewAll}>
          View All Notifications
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        ref={triggerRef}
        className="top-nav-btn notification-bell-btn"
        type="button"
        aria-label={`Notifications, ${unread} unread`}
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Notifications"
        onClick={() => setOpen(prev => !prev)}
      >
        <Bell size={18} />
        {unread > 0 && <span className="notification-badge">{badgeText}</span>}
      </button>
      {open && (
        <Portal>
          {isMobile && <div className="notification-popover__backdrop" onClick={() => setOpen(false)} />}
          {panelContent}
        </Portal>
      )}
    </>
  );
}
