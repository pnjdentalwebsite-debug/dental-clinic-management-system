import { Archive, BarChart3, Bell, CalendarClock, Copy, Eye, FileText, PenLine, RotateCcw, Send, Trash2, Undo2, XCircle } from 'lucide-react';
import { RowActionMenu } from '../../../components/overlays/RowActionMenu';
import type { Announcement } from '../types';

interface Props {
  announcement: Announcement;
  onView?: () => void;
  onEdit?: () => void;
  onPreview?: () => void;
  onDuplicate?: () => void;
  onPublish?: () => void;
  onSchedule?: () => void;
  onCancelSchedule?: () => void;
  onUnpublish?: () => void;
  onRecipients?: () => void;
  onAnalytics?: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
  onDelete?: () => void;
}

export function AnnouncementActionMenu({ announcement, onView, onEdit, onPreview, onDuplicate, onPublish, onSchedule, onCancelSchedule, onUnpublish, onRecipients, onAnalytics, onArchive, onRestore, onDelete }: Props) {
  return (
    <RowActionMenu
      ariaLabel={`Actions for ${announcement.title}`}
      items={[
        { id: 'view', label: 'View Announcement', icon: Eye, hidden: !onView, onSelect: onView },
        { id: 'edit', label: 'Edit Announcement', icon: PenLine, hidden: !onEdit || !['draft', 'scheduled', 'cancelled'].includes(announcement.status), onSelect: onEdit },
        { id: 'preview', label: 'Preview', icon: FileText, hidden: !onPreview, onSelect: onPreview },
        { id: 'duplicate', label: 'Duplicate', icon: Copy, hidden: !onDuplicate, onSelect: onDuplicate },
        { id: 'publishing', separator: true },
        { id: 'publish', label: 'Publish Now', icon: Send, hidden: !onPublish || !['draft', 'scheduled', 'cancelled'].includes(announcement.status), onSelect: onPublish },
        { id: 'schedule', label: 'Schedule', icon: CalendarClock, hidden: !onSchedule || !['draft', 'cancelled'].includes(announcement.status), onSelect: onSchedule },
        { id: 'cancel-schedule', label: 'Cancel Schedule', icon: XCircle, hidden: !onCancelSchedule || announcement.status !== 'scheduled', onSelect: onCancelSchedule },
        { id: 'unpublish', label: 'Unpublish', icon: Undo2, hidden: !onUnpublish || announcement.status !== 'published', onSelect: onUnpublish },
        { id: 'reporting', separator: true },
        { id: 'recipients', label: 'View Recipients', icon: Bell, hidden: !onRecipients, onSelect: onRecipients },
        { id: 'analytics', label: 'View Read Analytics', icon: BarChart3, hidden: !onAnalytics, onSelect: onAnalytics },
        { id: 'status', separator: true },
        { id: 'restore', label: 'Restore', icon: RotateCcw, hidden: !onRestore || announcement.status !== 'archived', onSelect: onRestore },
        { id: 'archive', label: 'Archive Announcement', icon: Archive, destructive: true, hidden: !onArchive || announcement.status === 'archived', onSelect: onArchive },
        { id: 'danger', separator: true },
        { id: 'delete', label: 'Delete Unused Draft Permanently', icon: Trash2, destructive: true, hidden: !onDelete, disabled: announcement.status !== 'draft' || announcement.deliveryCount > 0, description: announcement.status !== 'draft' ? 'Only drafts can be deleted' : announcement.deliveryCount > 0 ? 'Announcement has delivery records' : undefined, onSelect: onDelete }
      ]}
    />
  );
}
