import { Ban, CheckCircle2, Eye, FilePenLine, Link2, MessageSquareWarning, RotateCcw, Trash2, Undo2, XCircle } from 'lucide-react';
import { RowActionMenu } from '../../../components/overlays/RowActionMenu';
import type { Payment } from '../types';

interface PaymentActionMenuProps {
  payment: Payment;
  onView?: () => void;
  onEdit?: () => void;
  onViewRegistration?: () => void;
  onViewSubscriber?: () => void;
  onViewSubscription?: () => void;
  onViewPlan?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onRequestInfo?: () => void;
  onAllocate?: () => void;
  onReverseAllocation?: () => void;
  onReconcile?: () => void;
  onRefund?: () => void;
  onVoid?: () => void;
  onRestore?: () => void;
  onDelete?: () => void;
}

export function PaymentActionMenu({
  payment,
  onView,
  onEdit,
  onViewRegistration,
  onViewSubscriber,
  onViewSubscription,
  onViewPlan,
  onApprove,
  onReject,
  onRequestInfo,
  onAllocate,
  onReverseAllocation,
  onReconcile,
  onRefund,
  onVoid,
  onRestore,
  onDelete
}: PaymentActionMenuProps) {
  // Status is the authoritative fallback for legacy/imported payments whose
  // verificationStatus was not normalized to the newer pending values.
  const pending = ['pending_verification', 'submitted'].includes(payment.status)
    || payment.verificationStatus === 'pending'
    || payment.verificationStatus === 'additional_information_required';
  const approved = payment.verificationStatus === 'verified' && !['refunded', 'voided', 'rejected'].includes(payment.status);
  return (
    <RowActionMenu
      ariaLabel={`Actions for payment ${payment.paymentNumber}`}
      items={[
        { id: 'view', label: 'View Payment', icon: Eye, hidden: !onView, onSelect: onView || (() => {}) },
        { id: 'edit', label: 'Edit Payment', icon: FilePenLine, hidden: !onEdit, onSelect: onEdit || (() => {}) },
        { id: 'sep-related', separator: true },
        { id: 'registration', label: 'View Registration', icon: Link2, hidden: !onViewRegistration || !payment.registrationId, onSelect: onViewRegistration || (() => {}) },
        { id: 'subscriber', label: 'View Subscriber', icon: Link2, hidden: !onViewSubscriber || !payment.subscriberId, onSelect: onViewSubscriber || (() => {}) },
        { id: 'subscription', label: 'View Subscription', icon: Link2, hidden: !onViewSubscription || !payment.subscriptionId, onSelect: onViewSubscription || (() => {}) },
        { id: 'plan', label: 'View Plan', icon: Link2, hidden: !onViewPlan || !payment.planId, onSelect: onViewPlan || (() => {}) },
        { id: 'sep-verification', separator: true },
        { id: 'approve', label: 'Approve Payment', icon: CheckCircle2, hidden: !onApprove || !pending, onSelect: onApprove || (() => {}) },
        { id: 'reject', label: 'Reject Payment', icon: XCircle, destructive: true, hidden: !onReject || !pending, onSelect: onReject || (() => {}) },
        { id: 'info', label: 'Request Information', icon: MessageSquareWarning, hidden: !onRequestInfo || payment.verificationStatus === 'verified' || payment.status === 'voided', onSelect: onRequestInfo || (() => {}) },
        { id: 'sep-allocation', separator: true },
        { id: 'allocate', label: 'Allocate Payment', icon: Link2, hidden: !onAllocate || !approved || payment.unallocatedAmount <= 0, onSelect: onAllocate || (() => {}) },
        { id: 'reverse', label: 'Reverse Allocation', icon: Undo2, hidden: !onReverseAllocation || payment.allocatedAmount <= 0, onSelect: onReverseAllocation || (() => {}) },
        { id: 'reconcile', label: 'Reconcile Payment', icon: RotateCcw, hidden: !onReconcile, onSelect: onReconcile || (() => {}) },
        { id: 'sep-money', separator: true },
        { id: 'refund', label: 'Record Refund', icon: RotateCcw, hidden: !onRefund || !approved, onSelect: onRefund || (() => {}) },
        { id: 'sep-danger', separator: true },
        { id: 'void', label: 'Void Payment', icon: Ban, destructive: true, hidden: !onVoid || payment.status === 'voided' || payment.status === 'refunded', onSelect: onVoid || (() => {}) },
        { id: 'restore', label: 'Restore Payment', icon: RotateCcw, hidden: !onRestore || payment.status !== 'voided', onSelect: onRestore || (() => {}) },
        { id: 'delete', label: 'Delete Permanently', icon: Trash2, destructive: true, hidden: !onDelete, onSelect: onDelete || (() => {}) }
      ]}
    />
  );
}
