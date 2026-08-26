import { Archive, Building2, Eye, FilePenLine, PlayCircle, RotateCcw, Star, Trash2, UserCog, Users, XCircle } from 'lucide-react';
import { RowActionMenu } from '../../../components/overlays/RowActionMenu';
import type { Clinic } from '../types';

interface Props {
  clinic: Clinic;
  onView?: () => void;
  onEdit?: () => void;
  onViewSubscriber?: () => void;
  onManageUsers?: () => void;
  onViewLabs?: () => void;
  onActivate?: () => void;
  onDeactivate?: () => void;
  onSetPrimary?: () => void;
  onRestore?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
}

export function ClinicActionMenu({ clinic, onView, onEdit, onViewSubscriber, onManageUsers, onViewLabs, onActivate, onDeactivate, onSetPrimary, onRestore, onArchive, onDelete }: Props) {
  return (
    <RowActionMenu
      ariaLabel={`Actions for clinic ${clinic.clinicNumber}`}
      items={[
        { id: 'view', label: 'View Clinic', icon: Eye, hidden: !onView, onSelect: onView || (() => {}) },
        { id: 'edit', label: 'Edit Clinic', icon: FilePenLine, hidden: !onEdit || clinic.status === 'archived', onSelect: onEdit || (() => {}) },
        { id: 'sep-rel', separator: true },
        { id: 'subscriber', label: 'View Subscriber', icon: Users, hidden: !onViewSubscriber, onSelect: onViewSubscriber || (() => {}) },
        { id: 'users', label: 'Manage Users', icon: UserCog, hidden: !onManageUsers, onSelect: onManageUsers || (() => {}) },
        { id: 'labs', label: 'View Laboratories', icon: Building2, hidden: !onViewLabs, onSelect: onViewLabs || (() => {}) },
        { id: 'sep-status', separator: true },
        { id: 'activate', label: 'Activate Clinic', icon: PlayCircle, hidden: !onActivate || !['draft', 'pending', 'inactive'].includes(clinic.status), onSelect: onActivate || (() => {}) },
        { id: 'deactivate', label: 'Deactivate Clinic', icon: XCircle, destructive: true, hidden: !onDeactivate || clinic.status !== 'active', onSelect: onDeactivate || (() => {}) },
        { id: 'primary', label: 'Set as Primary Clinic', icon: Star, hidden: !onSetPrimary || clinic.isPrimaryClinic || clinic.status === 'archived', onSelect: onSetPrimary || (() => {}) },
        { id: 'restore', label: 'Restore Clinic', icon: RotateCcw, hidden: !onRestore || clinic.status !== 'archived', onSelect: onRestore || (() => {}) },
        { id: 'sep-danger', separator: true, hidden: !onArchive && !onDelete },
        { id: 'archive', label: 'Archive Clinic', icon: Archive, destructive: true, hidden: !onArchive || clinic.status === 'archived', onSelect: onArchive || (() => {}) },
        { id: 'delete', label: 'Delete Clinic Permanently', icon: Trash2, destructive: true, hidden: !onDelete || (clinic.status !== 'archived' && clinic.status !== 'inactive'), onSelect: onDelete || (() => {}) }
      ]}
    />
  );
}
