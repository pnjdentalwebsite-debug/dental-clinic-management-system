import { useState } from 'react';
import { ConfirmationDialog } from '../../../components/overlays/ConfirmationDialog';
import { Modal } from '../../../components/overlays/Modal';
import { mockPaymentService } from '../services/mockPaymentService';
import type { AllocationType, Payment } from '../types';

export type PaymentDialogAction = 'approve' | 'reject' | 'request_info' | 'allocate' | 'reverse' | 'refund' | 'void' | 'restore';

interface PaymentActionDialogProps {
  action: PaymentDialogAction | null;
  payment: Payment | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: Record<string, string | number>) => void;
}

const allocationTypes: AllocationType[] = ['registration', 'subscription_initial', 'subscription_renewal', 'plan_change', 'subscription_extension', 'manual_adjustment'];

export function PaymentActionDialog({ action, payment, open, onClose, onSubmit }: PaymentActionDialogProps) {
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [amount, setAmount] = useState(payment?.unallocatedAmount || 0);
  const [allocationType, setAllocationType] = useState<AllocationType>('subscription_initial');
  const [description, setDescription] = useState('');
  const [allocationId, setAllocationId] = useState('');

  if (!payment || !action) return null;
  const allocations = mockPaymentService.getPaymentAllocations(payment.id).filter(item => !item.reversedAt);
  const totals = mockPaymentService.calculatePaymentTotals(payment.id);

  if (action === 'approve' || action === 'restore') {
    return (
      <ConfirmationDialog
        open={open}
        title={action === 'approve' ? `Approve ${payment.paymentNumber}?` : `Restore ${payment.paymentNumber}?`}
        description={action === 'approve' ? `${payment.payerName} paid PHP ${payment.amount.toLocaleString()} via ${payment.paymentMethod}.` : 'Restored voided payments return to pending verification.'}
        confirmLabel={action === 'approve' ? 'Approve Payment' : 'Restore Payment'}
        onCancel={onClose}
        onConfirm={() => onSubmit({})}
      />
    );
  }

  const title =
    action === 'reject' ? `Reject ${payment.paymentNumber}` :
    action === 'request_info' ? `Request Information for ${payment.paymentNumber}` :
    action === 'allocate' ? `Allocate ${payment.paymentNumber}` :
    action === 'reverse' ? `Reverse Allocation for ${payment.paymentNumber}` :
    action === 'refund' ? `Refund ${payment.paymentNumber}` :
    `Void ${payment.paymentNumber}`;

  return (
    <Modal
      open={open}
      title={title}
      description="Mock payment accounting only. No real funds are transferred."
      onClose={onClose}
      role={['reject', 'void'].includes(action) ? 'alertdialog' : 'dialog'}
      footer={(
        <>
          <button className="btn btn-outline" style={{ width: 'auto' }} onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" style={{ width: 'auto', backgroundColor: ['reject', 'void'].includes(action) ? 'var(--danger)' : undefined }} onClick={() => onSubmit({ reason, note, dueDate, amount, allocationType, description, allocationId })}>
            {action === 'reject' ? 'Reject Payment' : action === 'void' ? 'Void Payment' : 'Confirm'}
          </button>
        </>
      )}
    >
      {action === 'allocate' && (
        <div className="filter-grid">
          <div className="info-tile"><span>Total</span><strong>PHP {payment.amount.toLocaleString()}</strong></div>
          <div className="info-tile"><span>Allocated</span><strong>PHP {payment.allocatedAmount.toLocaleString()}</strong></div>
          <div className="info-tile"><span>Available</span><strong>PHP {payment.unallocatedAmount.toLocaleString()}</strong></div>
          <label className="filter-control"><span>Allocation Type</span><select className="form-input" value={allocationType} onChange={event => setAllocationType(event.target.value as AllocationType)}>{allocationTypes.map(item => <option key={item} value={item}>{item.replace('_', ' ')}</option>)}</select></label>
          <label className="filter-control"><span>Amount</span><input className="form-input" type="number" min={0} value={amount} onChange={event => setAmount(Number(event.target.value))} /></label>
          <label className="filter-control"><span>Description</span><input className="form-input" value={description} onChange={event => setDescription(event.target.value)} /></label>
        </div>
      )}

      {action === 'reverse' && (
        <div className="filter-grid">
          <label className="filter-control"><span>Allocation</span><select className="form-input" value={allocationId} onChange={event => setAllocationId(event.target.value)}><option value="">Choose allocation</option>{allocations.map(item => <option key={item.id} value={item.id}>{item.id} - PHP {item.amount.toLocaleString()}</option>)}</select></label>
          <label className="filter-control"><span>Reversal Reason</span><input className="form-input" value={reason} onChange={event => setReason(event.target.value)} /></label>
        </div>
      )}

      {action === 'refund' && (
        <div className="filter-grid">
          <div className="info-tile"><span>Refundable</span><strong>PHP {totals.refundableAmount.toLocaleString()}</strong></div>
          <label className="filter-control"><span>Refund Amount</span><input className="form-input" type="number" min={0} value={amount} onChange={event => setAmount(Number(event.target.value))} /></label>
          <label className="filter-control"><span>Refund Reason</span><input className="form-input" value={reason} onChange={event => setReason(event.target.value)} /></label>
          <label className="filter-control"><span>Administrative Note</span><textarea className="form-input" rows={3} value={note} onChange={event => setNote(event.target.value)} /></label>
        </div>
      )}

      {action === 'request_info' && (
        <div className="filter-grid">
          <label className="filter-control"><span>Information Request</span><input className="form-input" value={reason} onChange={event => setReason(event.target.value)} /></label>
          <label className="filter-control"><span>Due Date</span><input className="form-input" type="date" value={dueDate} onChange={event => setDueDate(event.target.value)} /></label>
          <label className="filter-control"><span>Administrative Note</span><textarea className="form-input" rows={3} value={note} onChange={event => setNote(event.target.value)} /></label>
        </div>
      )}

      {(action === 'reject' || action === 'void') && (
        <div className="filter-grid">
          <label className="filter-control"><span>{action === 'reject' ? 'Rejection Reason' : 'Void Reason'}</span><input className="form-input" value={reason} onChange={event => setReason(event.target.value)} /></label>
          <label className="filter-control"><span>Administrative Note</span><textarea className="form-input" rows={3} value={note} onChange={event => setNote(event.target.value)} /></label>
        </div>
      )}
    </Modal>
  );
}
