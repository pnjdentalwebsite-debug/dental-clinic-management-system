import type { NotificationPriority } from '../types';

interface Props {
  priority: NotificationPriority;
}

export function NotificationPriorityBadge({ priority }: Props) {
  const label = priority.charAt(0).toUpperCase() + priority.slice(1);
  return (
    <span className={`notification-priority-badge ${priority}`}>
      <span aria-hidden="true" className="notification-priority-dot" />
      {label}
    </span>
  );
}
