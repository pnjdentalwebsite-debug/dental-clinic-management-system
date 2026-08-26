import type { ReactNode } from 'react';
import type { PlatformNotification } from '../types';
import { NotificationCompactCard } from './NotificationCompactCard';

interface Props {
  notifications: PlatformNotification[];
  selectedIds: string[];
  onSelect: (id: string) => void;
  onOpen: (notification: PlatformNotification) => void;
  onOpenRelated: (notification: PlatformNotification) => void;
  renderActions: (notification: PlatformNotification) => ReactNode;
}

export function NotificationCompactGrid({
  notifications,
  selectedIds,
  onSelect,
  onOpen,
  onOpenRelated,
  renderActions
}: Props) {
  // Group by date ranges: Today, Yesterday, Earlier This Week, Older
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
    <div className="notification-compact-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {groups.map(group => {
        const list = grouped[group];
        if (!list || list.length === 0) return null;
        return (
          <div key={group} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 className="notification-grid-group-title" style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              margin: '10px 0 4px',
              borderBottom: '1px solid var(--border)',
              paddingBottom: '4px'
            }}>
              {group}
            </h3>
            <div className="notification-compact-grid" style={{
              display: 'grid',
              gap: '16px'
            }}>
              {list.map(notification => (
                <NotificationCompactCard
                  key={notification.id}
                  notification={notification}
                  selected={selectedIds.includes(notification.id)}
                  onToggleSelect={() => onSelect(notification.id)}
                  onOpenDetails={() => onOpen(notification)}
                  onOpenRelated={() => onOpenRelated(notification)}
                  actionMenu={renderActions(notification)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
