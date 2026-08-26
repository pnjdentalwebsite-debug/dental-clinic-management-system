import { Trash2, MailOpen, X } from 'lucide-react';

interface Props {
  selectedCount: number;
  onMarkRead: () => void;
  onArchive: () => void;
  onClear: () => void;
}

export function NotificationBulkActionBar({ selectedCount, onMarkRead, onArchive, onClear }: Props) {
  if (selectedCount === 0) return null;

  return (
    <div className="bulk-action-bar" role="toolbar" aria-label="Bulk actions for selected notifications">
      <span className="bulk-action-bar__label">{selectedCount} selected</span>
      <div className="bulk-action-row" style={{ margin: 0 }}>
        <button
          className="btn btn-outline compact-action"
          onClick={onMarkRead}
          style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', height: '32px' }}
        >
          <MailOpen size={14} /> Mark Read
        </button>
        <button
          className="btn btn-outline compact-action"
          onClick={onArchive}
          style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', height: '32px' }}
        >
          <Trash2 size={14} /> Archive
        </button>
        <button
          className="btn btn-ghost compact-action"
          onClick={onClear}
          style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', height: '32px', color: 'var(--text-secondary)' }}
        >
          <X size={14} /> Clear Selection
        </button>
      </div>
    </div>
  );
}
