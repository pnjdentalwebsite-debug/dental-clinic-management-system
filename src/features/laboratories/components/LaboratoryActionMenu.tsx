import { Archive, Building2, Eye, FilePenLine, FlaskConical, PlayCircle, RotateCcw, Star, Trash2, Unlink, XCircle } from 'lucide-react';
import { RowActionMenu } from '../../../components/overlays/RowActionMenu';
import type { Laboratory } from '../types';

interface Props {
  laboratory: Laboratory;
  onView?: () => void;
  onEdit?: () => void;
  onViewSubscriber?: () => void;
  onManageClinics?: () => void;
  onManageServices?: () => void;
  onActivate?: () => void;
  onDeactivate?: () => void;
  onRestore?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
}

export function LaboratoryActionMenu({ laboratory, onView, onEdit, onViewSubscriber, onManageClinics, onManageServices, onActivate, onDeactivate, onRestore, onArchive, onDelete }: Props) {
  return (
    <RowActionMenu
      ariaLabel={`Actions for laboratory ${laboratory.laboratoryNumber}`}
      items={[
        { id: 'view', label: 'View Laboratory', icon: Eye, hidden: !onView, onSelect: onView || (() => {}) },
        { id: 'edit', label: 'Edit Laboratory', icon: FilePenLine, hidden: !onEdit || laboratory.status === 'archived', onSelect: onEdit || (() => {}) },
        { id: 'sep-rel', separator: true },
        { id: 'subscriber', label: 'View Subscriber', icon: Building2, hidden: !onViewSubscriber, onSelect: onViewSubscriber || (() => {}) },
        { id: 'clinics', label: 'Manage Clinic Connections', icon: Unlink, hidden: !onManageClinics, onSelect: onManageClinics || (() => {}) },
        { id: 'services', label: 'Manage Services', icon: FlaskConical, hidden: !onManageServices, onSelect: onManageServices || (() => {}) },
        { id: 'sep-status', separator: true },
        { id: 'activate', label: 'Activate Laboratory', icon: PlayCircle, hidden: !onActivate || !['draft', 'pending', 'inactive'].includes(laboratory.status), onSelect: onActivate || (() => {}) },
        { id: 'deactivate', label: 'Deactivate Laboratory', icon: XCircle, destructive: true, hidden: !onDeactivate || laboratory.status !== 'active', onSelect: onDeactivate || (() => {}) },
        { id: 'restore', label: 'Restore Laboratory', icon: RotateCcw, hidden: !onRestore || laboratory.status !== 'archived', onSelect: onRestore || (() => {}) },
        { id: 'sep-danger', separator: true, hidden: !onArchive && !onDelete },
        { id: 'archive', label: 'Archive Laboratory', icon: Archive, destructive: true, hidden: !onArchive || laboratory.status === 'archived', onSelect: onArchive || (() => {}) },
        { id: 'delete', label: 'Delete Laboratory Permanently', icon: Trash2, destructive: true, hidden: !onDelete || (laboratory.status !== 'archived' && laboratory.status !== 'inactive'), onSelect: onDelete || (() => {}) },
        { id: 'preferred-note', label: 'Preferred status is managed per clinic', icon: Star, disabled: true, hidden: !onManageClinics, onSelect: () => {} }
      ]}
    />
  );
}
