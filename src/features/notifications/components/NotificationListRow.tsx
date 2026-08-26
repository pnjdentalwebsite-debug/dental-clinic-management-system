import { useState, useRef } from 'react';
import type { ReactNode } from 'react';
import type { PlatformNotification } from '../types';
import { NotificationPriorityBadge } from './NotificationPriorityBadge';
import { Portal } from '../../../components/overlays/Portal';

interface Props {
  notification: PlatformNotification;
  selected: boolean;
  onToggleSelect: () => void;
  onOpenDetails: () => void;
  onOpenRelated: () => void;
  actionMenu: ReactNode;
}

const labels = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, char => char.toUpperCase());

export function NotificationListRow({
  notification,
  selected,
  onToggleSelect,
  onOpenDetails,
  onOpenRelated,
  actionMenu
}: Props) {
  const isUnread = notification.status === 'unread';
  const isArchived = notification.status === 'archived';

  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const cellRef = useRef<HTMLTableCellElement | null>(null);
  const titleRef = useRef<HTMLButtonElement | null>(null);
  const descRef = useRef<HTMLParagraphElement | null>(null);

  const handleMouseEnter = () => {
    const titleTruncated = titleRef.current ? titleRef.current.scrollWidth > titleRef.current.clientWidth : false;
    const descTruncated = descRef.current ? descRef.current.scrollHeight > descRef.current.clientHeight : false;

    if (titleTruncated || descTruncated) {
      if (cellRef.current) {
        const rect = cellRef.current.getBoundingClientRect();
        setTooltipPos({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX
        });
        setShowTooltip(true);
      }
    }
  };

  return (
    <tr className={`notification-inbox-row ${isUnread ? 'unread' : 'read'}`}>
      <td className="notification-column-select" style={{ textAlign: 'center', verticalAlign: 'middle' }}>
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          aria-label={`Select notification: ${notification.title}`}
        />
      </td>

      <td
        ref={cellRef}
        className="notification-cell"
        style={{ textAlign: 'left', verticalAlign: 'middle', padding: '12px 10px' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', width: '100%' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--surface-sunken)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px', color: 'var(--primary)', border: '1px solid var(--border)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <button
                ref={titleRef}
                type="button"
                className="notification-inbox-row__title notification-title"
                onClick={onOpenDetails}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  textAlign: 'left',
                  fontSize: '0.9rem',
                  display: 'block'
                }}
              >
                {notification.title}
              </button>
            </div>
            <p
              ref={descRef}
              className="notification-inbox-row__message notification-description"
              style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}
            >
              {notification.message}
            </p>
          </div>
        </div>

        {showTooltip && (
          <Portal>
            <div
              className="notification-preview-popover"
              style={{
                top: tooltipPos.top,
                left: tooltipPos.left,
                width: '320px'
              }}
            >
              <h4>{notification.title}</h4>
              <p>{notification.message}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '8px' }}>
                <span>{labels(notification.sourceModule)} / {labels(notification.category)}</span>
                <span>{new Date(notification.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>
          </Portal>
        )}
      </td>

      <td className="notification-column-source" style={{ textAlign: 'left', verticalAlign: 'middle', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <strong>{labels(notification.sourceModule)}</strong>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{labels(notification.category)}</span>
        </div>
      </td>

      <td className="notification-column-priority" style={{ textAlign: 'left', verticalAlign: 'middle' }}>
        <NotificationPriorityBadge priority={notification.priority} />
      </td>

      <td className="notification-column-status" style={{ textAlign: 'left', verticalAlign: 'middle', fontSize: '0.85rem', fontWeight: isUnread ? 600 : 'normal' }}>
        {isArchived ? (
          <span className="badge-prototype" style={{ background: 'var(--border)', color: 'var(--text-secondary)' }}>Archived</span>
        ) : isUnread ? (
          <span style={{ color: 'var(--danger)' }}>Unread</span>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>Read</span>
        )}
      </td>

      <td className="notification-column-created" style={{ textAlign: 'left', verticalAlign: 'middle', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span>{new Date(notification.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          <span>{new Date(notification.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </td>

      <td className="notification-column-actions" style={{ textAlign: 'right', verticalAlign: 'middle', padding: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
          {notification.actionLabel && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onOpenRelated}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
            >
              {notification.actionLabel}
            </button>
          )}
          {actionMenu}
        </div>
      </td>
    </tr>
  );
}
