import { CalendarPlus, Eye, FilePenLine, PauseCircle, PlayCircle, RefreshCw, Repeat2, RotateCcw, Trash2, UserRound, XCircle } from 'lucide-react';
import { RowActionMenu } from '../../../components/overlays/RowActionMenu';
import type { Subscription } from '../types';

interface SubscriptionActionMenuProps {
  subscription: Subscription;
  onView?: () => void;
  onEdit?: () => void;
  onViewSubscriber?: () => void;
  onViewPlan?: () => void;
  onViewPayments?: () => void;
  onRenew?: () => void;
  onChangePlan?: () => void;
  onExtend?: () => void;
  onSuspend?: () => void;
  onReactivate?: () => void;
  onRestore?: () => void;
  onCancel?: () => void;
  onDelete?: () => void;
}

export function SubscriptionActionMenu({
  subscription,
  onView,
  onEdit,
  onViewSubscriber,
  onViewPlan,
  onViewPayments,
  onRenew,
  onChangePlan,
  onExtend,
  onSuspend,
  onReactivate,
  onRestore,
  onCancel,
  onDelete
}: SubscriptionActionMenuProps) {
  const status = subscription.status;
  const canRenew = ['active', 'expiring_soon', 'expired', 'suspended'].includes(status);
  const canChangePlan = ['pending', 'active', 'expiring_soon', 'expired', 'suspended'].includes(status);
  const canExtend = ['active', 'expiring_soon', 'expired'].includes(status);
  const canSuspend = ['pending', 'active', 'expiring_soon', 'expired'].includes(status);
  const canReactivate = status === 'suspended';
  const canRestore = status === 'cancelled';
  const canCancel = status !== 'cancelled';

  return (
    <RowActionMenu
      ariaLabel={`Actions for subscription ${subscription.subscriptionNumber}`}
      items={[
        { id: 'view', label: 'View Subscription', icon: Eye, hidden: !onView, onSelect: onView || (() => {}) },
        { id: 'edit', label: 'Edit Subscription', icon: FilePenLine, hidden: !onEdit, onSelect: onEdit || (() => {}) },
        { id: 'sep-related', separator: true },
        { id: 'subscriber', label: 'View Subscriber', icon: UserRound, hidden: !onViewSubscriber, onSelect: onViewSubscriber || (() => {}) },
        { id: 'plan', label: 'View Plan', icon: Repeat2, hidden: !onViewPlan, onSelect: onViewPlan || (() => {}) },
        { id: 'payments', label: 'View Payments', icon: RefreshCw, hidden: !onViewPayments, onSelect: onViewPayments || (() => {}) },
        { id: 'sep-life', separator: true },
        { id: 'renew', label: 'Renew', icon: RefreshCw, hidden: !onRenew || !canRenew, onSelect: onRenew || (() => {}) },
        { id: 'change-plan', label: 'Change Plan', icon: Repeat2, hidden: !onChangePlan || !canChangePlan, onSelect: onChangePlan || (() => {}) },
        { id: 'extend', label: 'Extend Expiration', icon: CalendarPlus, hidden: !onExtend || !canExtend, onSelect: onExtend || (() => {}) },
        { id: 'suspend', label: 'Suspend', icon: PauseCircle, hidden: !onSuspend || !canSuspend, onSelect: onSuspend || (() => {}) },
        { id: 'reactivate', label: 'Reactivate', icon: PlayCircle, hidden: !onReactivate || !canReactivate, onSelect: onReactivate || (() => {}) },
        { id: 'restore', label: 'Restore', icon: RotateCcw, hidden: !onRestore || !canRestore, onSelect: onRestore || (() => {}) },
        { id: 'sep-danger', separator: true },
        { id: 'cancel', label: 'Cancel Subscription', icon: XCircle, destructive: true, hidden: !onCancel || !canCancel, onSelect: onCancel || (() => {}) },
        { id: 'delete', label: 'Delete Permanently', icon: Trash2, destructive: true, hidden: !onDelete, onSelect: onDelete || (() => {}) }
      ]}
    />
  );
}
