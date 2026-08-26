import { Archive, Eye, ExternalLink, Mail, MailOpen, RotateCcw } from 'lucide-react';
import { RowActionMenu } from '../../../components/overlays/RowActionMenu';
import type { PlatformNotification } from '../types';

interface Props {
  notification: PlatformNotification;
  onView?: () => void;
  onOpenRelated?: () => void;
  onRead?: () => void;
  onUnread?: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
}

export function NotificationActionMenu({ notification, onView, onOpenRelated, onRead, onUnread, onArchive, onRestore }: Props) {
  return (
    <RowActionMenu
      ariaLabel={`Actions for ${notification.title}`}
      items={[
        { id: 'view', label: 'View Notification', icon: Eye, hidden: !onView, onSelect: onView },
        { id: 'open-related', label: 'Open Related Record', icon: ExternalLink, hidden: !onOpenRelated || !notification.actionUrl, onSelect: onOpenRelated },
        { id: 'state', separator: true },
        { id: 'read', label: 'Mark as Read', icon: MailOpen, hidden: !onRead || notification.status !== 'unread', onSelect: onRead },
        { id: 'unread', label: 'Mark as Unread', icon: Mail, hidden: !onUnread || notification.status !== 'read', onSelect: onUnread },
        { id: 'archive', label: 'Archive', icon: Archive, hidden: !onArchive || notification.status === 'archived', onSelect: onArchive },
        { id: 'restore', label: 'Restore', icon: RotateCcw, hidden: !onRestore || notification.status !== 'archived', onSelect: onRestore }
      ]}
    />
  );
}
