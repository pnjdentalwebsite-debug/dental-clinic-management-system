import type { ReactNode } from 'react';
import type { PlatformNotification } from '../types';
import { NotificationPriorityBadge } from './NotificationPriorityBadge';

interface Props {
  notification: PlatformNotification;
  selected: boolean;
  onToggleSelect: () => void;
  onOpenDetails: () => void;
  onOpenRelated: () => void;
  actionMenu: ReactNode;
}

const labels = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, char => char.toUpperCase());

export function NotificationCompactCard({
  notification,
  selected,
  onToggleSelect,
  onOpenDetails,
  onOpenRelated,
  actionMenu
}: Props) {
  const isUnread = notification.status === 'unread';



  return (
    <article className={`notification-compact-card ${isUnread ? 'is-unread' : 'is-read'}`} style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
      minWidth: '0',
      minHeight: '260px',
      padding: '16px',
      textAlign: 'left',
      background: isUnread ? 'var(--primary-light)' : 'var(--card-bg)',
      border: isUnread ? '1px solid hsl(213, 80%, 85%)' : '1px solid var(--border)',
      borderRadius: '12px',
      boxShadow: 'var(--shadow-sm)'
    }}>
      {/* Top Section */}
      <header className="notification-card-header" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        marginBottom: '12px'
      }}>
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          aria-label={`Select notification: ${notification.title}`}
        />
        <div>
          {actionMenu}
        </div>
      </header>

      {/* Center Section */}
      <div className="notification-card-body" style={{
        minWidth: '0',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div>
          <NotificationPriorityBadge priority={notification.priority} />
        </div>
        <button
          type="button"
          onClick={onOpenDetails}
          style={{
            display: '-webkit-box',
            overflow: 'hidden',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 2,
            margin: '0',
            fontWeight: 650,
            fontSize: '0.95rem',
            lineHeight: '1.4',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            color: 'var(--text-primary)',
            textAlign: 'left',
            width: '100%'
          }}
        >
          {notification.title}
        </button>
        <p style={{
          display: '-webkit-box',
          overflow: 'hidden',
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: 3,
          margin: '0',
          color: 'var(--text-secondary)',
          fontSize: '0.85rem',
          lineHeight: '1.5'
        }}>
          {notification.message}
        </p>

        <div className="notification-card-meta" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
          marginTop: 'auto',
          paddingTop: '8px',
          fontSize: '0.75rem',
          color: 'var(--text-muted)'
        }}>
          <span className="badge-prototype" style={{ background: 'var(--background)' }}>{labels(notification.sourceModule)}</span>
          <span title={new Date(notification.createdAt).toLocaleString()}>
            {new Date(notification.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Bottom Section */}
      <footer className="notification-card-footer" style={{
        marginTop: '12px',
        paddingTop: '12px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'stretch'
      }}>
        {notification.actionLabel ? (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onOpenRelated}
            style={{ fontSize: '0.8rem', width: '100%', padding: '0.35rem 0.75rem', whiteSpace: 'nowrap' }}
          >
            {notification.actionLabel}
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onOpenDetails}
            style={{ fontSize: '0.8rem', width: '100%', padding: '0.35rem 0.75rem', whiteSpace: 'nowrap' }}
          >
            View Details
          </button>
        )}
      </footer>
    </article>
  );
}
