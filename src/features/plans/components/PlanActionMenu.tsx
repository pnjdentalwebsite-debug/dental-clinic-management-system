import {
  Archive,
  Copy,
  Eye,
  PenLine,
  PlayCircle,
  RotateCcw,
  Trash2,
  XCircle
} from 'lucide-react';
import { RowActionMenu } from '../../../components/overlays/RowActionMenu';
import type { Plan } from '../types';

interface PlanActionMenuProps {
  plan: Plan;
  onView?: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onActivate?: () => void;
  onDeactivate?: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
  onDelete?: () => void;
}

export function PlanActionMenu({
  plan,
  onView,
  onEdit,
  onDuplicate,
  onActivate,
  onDeactivate,
  onArchive,
  onRestore,
  onDelete
}: PlanActionMenuProps) {
  return (
    <RowActionMenu
      ariaLabel={`Actions for ${plan.name}`}
      items={[
        { id: 'view', label: 'View Plan', icon: Eye, hidden: !onView, onSelect: onView || (() => {}) },
        { id: 'edit', label: 'Edit Plan', icon: PenLine, hidden: !onEdit, onSelect: onEdit || (() => {}) },
        { id: 'duplicate', label: 'Duplicate Plan', icon: Copy, hidden: !onDuplicate, onSelect: onDuplicate || (() => {}) },
        { id: 'divider-status', label: 'Status', separator: true },
        { id: 'activate', label: 'Activate', icon: PlayCircle, hidden: !onActivate || plan.status === 'active' || plan.status === 'archived', onSelect: onActivate || (() => {}) },
        { id: 'deactivate', label: 'Deactivate', icon: XCircle, hidden: !onDeactivate || plan.status !== 'active', onSelect: onDeactivate || (() => {}) },
        { id: 'archive', label: 'Archive', icon: Archive, hidden: !onArchive || plan.status === 'archived', onSelect: onArchive || (() => {}) },
        { id: 'restore', label: 'Restore', icon: RotateCcw, hidden: !onRestore || plan.status !== 'archived', onSelect: onRestore || (() => {}) },
        { id: 'divider-delete', label: 'Delete', separator: true },
        { id: 'delete', label: 'Delete Permanently', icon: Trash2, destructive: true, disabled: plan.subscriberCount > 0, hidden: !onDelete, description: plan.subscriberCount > 0 ? 'Plan is in use' : undefined, onSelect: onDelete || (() => {}) }
      ]}
    />
  );
}
