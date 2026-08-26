import { useEffect, useMemo, useState } from 'react';
import type { Subscriber } from '../../platformManagement/types';
import type { Plan } from '../../plans/types';
import { mockSubscriptionService } from '../services/mockSubscriptionService';
import { getBillingCycleEndDate, isOperationalSubscriptionStatus } from '../validation/subscriptionValidation';
import type { BillingCycle, Subscription, SubscriptionFormData } from '../types';

interface SubscriptionFormProps {
  mode: 'create' | 'edit';
  subscription?: Subscription;
  subscribers: Subscriber[];
  plans: Plan[];
  onCancel: () => void;
  onSave: (data: SubscriptionFormData, draft?: boolean) => void;
  saving?: boolean;
}

const billingCycles: BillingCycle[] = ['monthly', 'quarterly', 'semi_annual', 'annual', 'custom'];
const paymentStatuses = ['unpaid', 'pending_verification', 'partially_paid', 'paid', 'overdue', 'rejected', 'refunded'];

export function SubscriptionForm({ mode, subscription, subscribers, plans, onCancel, onSave, saving = false }: SubscriptionFormProps) {
  const [data, setData] = useState<SubscriptionFormData>(mockSubscriptionService.toFormData(subscription));
  const activePlans = plans.filter(plan => plan.status === 'active');
  const selectedPlan = activePlans.find(plan => plan.id === data.planId || plan.name === data.planId);
  const subscriptions = useMemo(() => mockSubscriptionService.listSubscriptions(), []);

  useEffect(() => {
    if (mode === 'edit' || data.billingCycle === 'custom' || !data.startDate) return;
    setData(prev => ({ ...prev, expirationDate: getBillingCycleEndDate(prev.startDate, prev.billingCycle) }));
  }, [data.billingCycle, data.startDate, mode]);

  const setField = <K extends keyof SubscriptionFormData>(key: K, value: SubscriptionFormData[K]) => setData(prev => ({ ...prev, [key]: value }));

  const submit = (draft = false) => onSave(draft ? { ...data, status: 'draft' } : data, draft);

  return (
    <form className="plan-form" onSubmit={event => { event.preventDefault(); submit(false); }}>
      <section className="dashboard-panel">
        <h2>{mode === 'create' ? 'Subscription Assignment' : 'Editable Fields'}</h2>
        <div className="filter-grid">
          <label className="filter-control">
            <span>Subscriber</span>
            <select className="form-input" value={data.subscriberId} onChange={event => setField('subscriberId', event.target.value)} disabled={mode === 'edit'}>
              <option value="">Choose subscriber</option>
              {subscribers.filter(item => item.accountStatus !== 'deactivated').map(subscriber => {
                const conflict = subscriptions.find((item: any) => item.subscriberId === subscriber.id && item.id !== subscription?.id && isOperationalSubscriptionStatus(item.status));
                return <option key={subscriber.id} value={subscriber.id}>{subscriber.businessName}{conflict ? ` - has ${conflict.status} subscription` : ''}</option>;
              })}
            </select>
          </label>
          <label className="filter-control">
            <span>Plan</span>
            <select className="form-input" value={data.planId} onChange={event => setField('planId', event.target.value)} disabled={mode === 'edit'}>
              <option value="">Choose active plan</option>
              {activePlans.map(plan => <option key={plan.id} value={plan.id}>{plan.name} - PHP {plan.monthlyPrice.toLocaleString()} monthly / PHP {plan.annualPrice.toLocaleString()} annual</option>)}
            </select>
          </label>
          <label className="filter-control">
            <span>Billing Cycle</span>
            <select className="form-input" value={data.billingCycle} onChange={event => setField('billingCycle', event.target.value as BillingCycle)}>
              {billingCycles.map(cycle => <option key={cycle} value={cycle}>{cycle.replace('_', ' ')}</option>)}
            </select>
          </label>
          <label className="filter-control">
            <span>Payment Status</span>
            <select className="form-input" value={data.paymentStatus} onChange={event => setField('paymentStatus', event.target.value as SubscriptionFormData['paymentStatus'])}>
              {paymentStatuses.map(status => <option key={status} value={status}>{status.replace('_', ' ')}</option>)}
            </select>
          </label>
          {mode === 'create' && (
            <>
              <label className="filter-control">
                <span>Start Date</span>
                <input className="form-input" type="date" value={data.startDate} onChange={event => setField('startDate', event.target.value)} />
              </label>
              <label className="filter-control">
                <span>Expiration Date</span>
                <input className="form-input" type="date" value={data.expirationDate} onChange={event => setField('expirationDate', event.target.value)} readOnly={data.billingCycle !== 'custom'} />
              </label>
            </>
          )}
        </div>
        <label className="checkbox-label" style={{ marginTop: '1rem' }}>
          <input type="checkbox" checked={data.autoRenew} onChange={event => setField('autoRenew', event.target.checked)} />
          Auto-renew
        </label>
        <label className="filter-control" style={{ marginTop: '1rem' }}>
          <span>Internal Notes</span>
          <textarea className="form-input" rows={4} value={data.notes} onChange={event => setField('notes', event.target.value)} />
        </label>
      </section>

      {selectedPlan && mode === 'create' && (
        <section className="dashboard-panel">
          <h2>Selected Plan Snapshot</h2>
          <div className="plan-detail-grid">
            <div className="info-tile"><span>Plan</span><strong>{selectedPlan.name}</strong></div>
            <div className="info-tile"><span>Monthly</span><strong>PHP {selectedPlan.monthlyPrice.toLocaleString()}</strong></div>
            <div className="info-tile"><span>Annual</span><strong>PHP {selectedPlan.annualPrice.toLocaleString()}</strong></div>
            <div className="info-tile"><span>Enabled Features</span><strong>{selectedPlan.features.filter(feature => feature.enabled).length}</strong></div>
          </div>
        </section>
      )}

      <div className="toolbar-row" style={{ justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-outline" style={{ width: 'auto' }} onClick={onCancel} disabled={saving}>Cancel</button>
        {mode === 'create' && <button type="button" className="btn btn-outline" style={{ width: 'auto' }} onClick={() => submit(true)} disabled={saving}>Save as Draft</button>}
        <button type="submit" className="btn btn-primary" style={{ width: 'auto' }} disabled={saving}>{mode === 'create' ? 'Create Subscription' : 'Save Changes'}</button>
      </div>
    </form>
  );
}
