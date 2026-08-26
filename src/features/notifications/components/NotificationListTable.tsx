import type { ReactNode } from 'react';
import type { PlatformNotification } from '../types';
import { NotificationListRow } from './NotificationListRow';

interface Props {
  notifications: PlatformNotification[];
  selectedIds: string[];
  onSelect: (id: string) => void;
  onSelectVisible: (checked: boolean) => void;
  onOpen: (notification: PlatformNotification) => void;
  onOpenRelated: (notification: PlatformNotification) => void;
  renderActions: (notification: PlatformNotification) => ReactNode;
}

export function NotificationListTable({
  notifications,
  selectedIds,
  onSelect,
  onSelectVisible,
  onOpen,
  onOpenRelated,
  renderActions
}: Props) {
  const allVisibleSelected = notifications.length > 0 && notifications.every(n => selectedIds.includes(n.id));

  // We will group by date ranges: Today, Yesterday, Earlier This Week, Older
  const getGroup = (dateStr: string): string => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const date = new Date(dateStr);
    date.setHours(0,0,0,0);
    
    const diffTime = today.getTime() - date.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return 'Earlier This Week';
    return 'Older';
  };

  const groups = ['Today', 'Yesterday', 'Earlier This Week', 'Older'] as const;
  const grouped = notifications.reduce((acc, n) => {
    const grp = getGroup(n.createdAt);
    if (!acc[grp]) acc[grp] = [];
    acc[grp].push(n);
    return acc;
  }, {} as Record<string, PlatformNotification[]>);

  return (
    <div className="notification-table-wrapper">
      <table className="notification-table">
        <caption className="sr-only">Platform notifications</caption>
        <thead>
          <tr>
            <th className="notification-column-select" style={{ textAlign: 'center' }}>
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onChange={e => onSelectVisible(e.target.checked)}
                aria-label="Select all visible notifications"
              />
            </th>
            <th scope="col" className="notification-column-title" style={{ textAlign: 'left', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Notification</th>
            <th scope="col" className="notification-column-source" style={{ textAlign: 'left', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Source</th>
            <th scope="col" className="notification-column-priority" style={{ textAlign: 'left', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Priority</th>
            <th scope="col" className="notification-column-status" style={{ textAlign: 'left', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Status</th>
            <th scope="col" className="notification-column-created" style={{ textAlign: 'left', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Created</th>
            <th scope="col" className="notification-column-actions" style={{ textAlign: 'right' }}>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {groups.map(group => {
            const list = grouped[group];
            if (!list || list.length === 0) return null;
            return (
              <React.Fragment key={group}>
                <tr className="notification-date-group-row">
                  <th colSpan={7} style={{ textAlign: 'left', padding: '12px 10px 6px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', background: 'var(--background)' }}>
                    {group}
                  </th>
                </tr>
                {list.map(notification => (
                  <NotificationListRow
                    key={notification.id}
                    notification={notification}
                    selected={selectedIds.includes(notification.id)}
                    onToggleSelect={() => onSelect(notification.id)}
                    onOpenDetails={() => onOpen(notification)}
                    onOpenRelated={() => onOpenRelated(notification)}
                    actionMenu={renderActions(notification)}
                  />
                ))}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// We import React to support React.Fragment in raw TSX.
import React from 'react';
