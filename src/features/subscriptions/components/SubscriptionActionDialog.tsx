import { useMemo, useState } from 'react';
import { Modal } from '../../../components/overlays/Modal';
import { ConfirmationDialog } from '../../../components/overlays/ConfirmationDialog';
import { mockPlanService } from '../../plans/services/mockPlanService';
import { getBillingCycleEndDate } from '../validation/subscriptionValidation';
import type { BillingCycle, Subscription, SubscriptionPaymentStatus } from '../types';

export type SubscriptionDialogAction = 'renew' | 'change_plan' | 'extend' | 'suspend' | 'reactivate' | 'cancel' | 'restore';

interface SubscriptionActionDialogProps {
  action: SubscriptionDialogAction | null;
  subscription: Subscription | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: Record<string, string | boolean>) => void;
}

const billingCycles: BillingCycle[] = ['monthly', 'quarterly', 'semi_annual', 'annual', 'custom'];
const paymentStatuses: SubscriptionPaymentStatus[] = ['unpaid', 'pending_verification', 'partially_paid', 'paid', 'overdue', 'rejected', 'refunded'];

export function SubscriptionActionDialog({ action, subscription, open, onClose, onSubmit }: SubscriptionActionDialogProps) {
  const activePlans = mockPlanService.getSelectableSubscriberPlans();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(subscription?.billingCycle || 'annual');
  const [planId, setPlanId] = useState(subscription?.priceSnapshot.planId || '');
  const [paymentStatus, setPaymentStatus] = useState<SubscriptionPaymentStatus>('paid');
  const [newExpirationDate, setNewExpirationDate] = useState(subscription ? getBillingCycleEndDate(subscription.expirationDate, subscription.billingCycle) : '');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [extensionAmount, setExtensionAmount] = useState('30');
  const [extensionType, setExtensionType] = useState<'days' | 'months'>('days');

  const comparisonPlans = useMemo(() => activePlans.slice(0, 4), [activePlans]);
  if (!subscription || !action) return null;

  const title =
    action === 'renew' ? `Renew ${subscription.subscriptionNumber}` :
    action === 'change_plan' ? `Change Plan for ${subscription.subscriptionNumber}` :
    action === 'extend' ? `Extend ${subscription.subscriptionNumber}` :
    action === 'suspend' ? `Suspend ${subscription.subscriptionNumber}` :
    action === 'reactivate' ? `Reactivate ${subscription.subscriptionNumber}` :
    action === 'restore' ? `Restore ${subscription.subscriptionNumber}` :
    `Cancel ${subscription.subscriptionNumber}`;

  const applyExtensionPreview = () => {
    const date = new Date(subscription.expirationDate);
    const amount = Math.max(1, Number(extensionAmount) || 1);
    if (extensionType === 'months') date.setMonth(date.getMonth() + amount);
    else date.setDate(date.getDate() + amount);
    return date.toISOString().split('T')[0];
  };

  if (action === 'reactivate' || action === 'restore') {
    return (
      <ConfirmationDialog
        open={open}
        title={title}
        description={action === 'restore' ? 'Restore is allowed only when the subscriber has no other operational subscription and the plan is still active.' : 'Reactivation validates that the subscription has not already expired.'}
        confirmLabel={action === 'restore' ? 'Restore Subscription' : 'Reactivate Subscription'}
        onCancel={onClose}
        onConfirm={() => onSubmit({ planId })}
      >
        {action === 'restore' && (
          <label className="filter-control">
            <span>Replacement Plan</span>
            <select className="form-input" value={planId} onChange={event => setPlanId(event.target.value)}>
              <option value="">Use existing plan when valid</option>
              {activePlans.map(plan => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
            </select>
          </label>
        )}
      </ConfirmationDialog>
    );
  }

  return (
    <Modal
      open={open}
      title={title}
      description="Prototype-only subscription lifecycle action. History and activity records are preserved."
      onClose={onClose}
      width="lg"
      role={action === 'cancel' ? 'alertdialog' : 'dialog'}
      footer={(
        <>
          <button className="btn btn-outline" style={{ width: 'auto' }} type="button" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            style={{ width: 'auto', backgroundColor: action === 'cancel' || action === 'suspend' ? 'var(--danger)' : undefined }}
            type="button"
            onClick={() => onSubmit({ billingCycle, planId, paymentStatus, newExpirationDate: action === 'extend' ? applyExtensionPreview() : newExpirationDate, reason, note })}
          >
            {action === 'cancel' ? 'Cancel Subscription' : action === 'suspend' ? 'Suspend Subscription' : 'Confirm'}
          </button>
        </>
      )}
    >
      {action === 'renew' && (
        <div className="filter-grid">
          <div className="info-tile"><span>Current Expiration</span><strong>{subscription.expirationDate}</strong></div>
          <label className="filter-control">
            <span>Renewal Billing Cycle</span>
            <select className="form-input" value={billingCycle} onChange={event => {
              const cycle = event.target.value as BillingCycle;
              setBillingCycle(cycle);
              if (cycle !== 'custom') setNewExpirationDate(getBillingCycleEndDate(subscription.expirationDate, cycle));
            }}>
              {billingCycles.map(cycle => <option key={cycle} value={cycle}>{cycle.replace('_', ' ')}</option>)}
            </select>
          </label>
          <label className="filter-control">
            <span>Selected Plan</span>
            <select className="form-input" value={planId} onChange={event => setPlanId(event.target.value)}>
              <option value="">Keep current plan</option>
              {activePlans.map(plan => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
            </select>
          </label>
          <label className="filter-control">
            <span>New Expiration Date</span>
            <input className="form-input" type="date" value={newExpirationDate} onChange={event => setNewExpirationDate(event.target.value)} />
          </label>
          <label className="filter-control">
            <span>Payment Status</span>
            <select className="form-input" value={paymentStatus} onChange={event => setPaymentStatus(event.target.value as SubscriptionPaymentStatus)}>
              {paymentStatuses.map(status => <option key={status} value={status}>{status.replace('_', ' ')}</option>)}
            </select>
          </label>
          <label className="filter-control">
            <span>Renewal Notes</span>
            <textarea className="form-input" rows={3} value={note} onChange={event => setNote(event.target.value)} />
          </label>
        </div>
      )}

      {action === 'change_plan' && (
        <>
          <div className="banner-alert info" style={{ marginBottom: '1rem' }}>Current plan: <strong>{subscription.priceSnapshot.planName}</strong>. Previous plan data remains in history.</div>
          <div className="filter-grid">
            <label className="filter-control">
              <span>Available Active Plans</span>
              <select className="form-input" value={planId} onChange={event => setPlanId(event.target.value)}>
                <option value="">Choose active plan</option>
                {activePlans.map(plan => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
              </select>
            </label>
            <label className="filter-control">
              <span>Effective Date</span>
              <input className="form-input" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
            </label>
            <label className="filter-control">
              <span>Internal Notes</span>
              <textarea className="form-input" rows={3} value={note} onChange={event => setNote(event.target.value)} />
            </label>
          </div>
          <div className="plan-comparison-grid" style={{ marginTop: '1rem' }}>
            {comparisonPlans.map(plan => (
              <div className="plan-comparison-column" key={plan.id}>
                <strong>{plan.name}</strong>
                <span>PHP {plan.monthlyPrice.toLocaleString()} / month</span>
                <small>{plan.features.filter(feature => feature.enabled).length} enabled features</small>
                <small>{plan.limits.slice(0, 3).map(limit => `${limit.label}: ${limit.type === 'number' ? limit.value : limit.type.replace('_', ' ')}`).join(' | ')}</small>
              </div>
            ))}
          </div>
        </>
      )}

      {action === 'extend' && (
        <div className="filter-grid">
          <div className="info-tile"><span>Current Expiration</span><strong>{subscription.expirationDate}</strong></div>
          <label className="filter-control">
            <span>Extension Type</span>
            <select className="form-input" value={extensionType} onChange={event => setExtensionType(event.target.value as 'days' | 'months')}>
              <option value="days">Days</option>
              <option value="months">Months</option>
            </select>
          </label>
          <label className="filter-control">
            <span>Amount</span>
            <input className="form-input" type="number" min={1} value={extensionAmount} onChange={event => setExtensionAmount(event.target.value)} />
          </label>
          <div className="info-tile"><span>New Expiration</span><strong>{applyExtensionPreview()}</strong></div>
          <label className="filter-control">
            <span>Reason</span>
            <input className="form-input" value={reason} onChange={event => setReason(event.target.value)} />
          </label>
          <label className="filter-control">
            <span>Internal Note</span>
            <textarea className="form-input" rows={3} value={note} onChange={event => setNote(event.target.value)} />
          </label>
        </div>
      )}

      {(action === 'suspend' || action === 'cancel') && (
        <div className="filter-grid">
          {action === 'cancel' && <div className="banner-alert warning">The subscription record and history will be preserved.</div>}
          <label className="filter-control">
            <span>{action === 'suspend' ? 'Suspension Reason' : 'Cancellation Reason'}</span>
            <input className="form-input" value={reason} onChange={event => setReason(event.target.value)} />
          </label>
          <label className="filter-control">
            <span>Internal Note</span>
            <textarea className="form-input" rows={3} value={note} onChange={event => setNote(event.target.value)} />
          </label>
        </div>
      )}
    </Modal>
  );
}
