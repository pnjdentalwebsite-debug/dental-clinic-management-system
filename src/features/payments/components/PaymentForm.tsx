import { useEffect, useState } from 'react';
import type { RegistrationLike, Subscriber } from '../../platformManagement/types';
import type { Plan } from '../../plans/types';
import type { Subscription } from '../../subscriptions/types';
import { mockPaymentService } from '../services/mockPaymentService';
import type { AllocationType, Payment, PaymentFormData, PaymentMethod } from '../types';

interface PaymentFormProps {
  mode: 'create' | 'edit';
  payment?: Payment;
  registrations: RegistrationLike[];
  subscribers: Subscriber[];
  subscriptions: Subscription[];
  plans: Plan[];
  onCancel: () => void;
  onSave: (data: PaymentFormData, draft?: boolean) => void;
  saving?: boolean;
}

const methods: PaymentMethod[] = ['gcash', 'maya', 'bank_transfer', 'over_the_counter', 'cash', 'card', 'demo_payment', 'other'];
const allocationModes: Array<'unallocated' | AllocationType> = ['unallocated', 'registration', 'subscription_initial', 'subscription_renewal', 'plan_change', 'subscription_extension', 'manual_adjustment'];

export function PaymentForm({ mode, payment, registrations, subscribers, subscriptions, plans, onCancel, onSave, saving = false }: PaymentFormProps) {
  const [data, setData] = useState<PaymentFormData>(mockPaymentService.toFormData(payment));
  const approved = payment && ['approved', 'partially_allocated', 'fully_allocated', 'partially_refunded', 'refunded'].includes(payment.status);
  const selectedRegistration = registrations.find(item => item.id === data.registrationId);
  const selectedSubscriber = subscribers.find(item => item.id === data.subscriberId || item.id === selectedRegistration?.subscriberId);
  const selectedSubscription = subscriptions.find(item => item.id === data.subscriptionId || item.id === selectedSubscriber?.subscriptionId);
  const selectedPlan = plans.find(item => item.id === data.planId || item.id === selectedSubscription?.priceSnapshot.planId || item.name === selectedRegistration?.plan);

  useEffect(() => {
    if (mode === 'edit') return;
    if (data.ownerType === 'registration' && selectedRegistration) {
      setData(prev => ({ ...prev, payerName: prev.payerName || selectedRegistration.ownerName, payerEmail: prev.payerEmail || selectedRegistration.ownerEmail, planId: selectedPlan?.id || prev.planId }));
    }
    if (data.ownerType === 'subscriber' && selectedSubscriber) {
      setData(prev => ({ ...prev, payerName: prev.payerName || selectedSubscriber.businessName, payerEmail: prev.payerEmail || selectedSubscriber.email, subscriptionId: selectedSubscription?.id || prev.subscriptionId, planId: selectedPlan?.id || prev.planId }));
    }
  }, [data.ownerType, mode, selectedRegistration, selectedSubscriber, selectedSubscription, selectedPlan]);

  const setField = <K extends keyof PaymentFormData>(key: K, value: PaymentFormData[K]) => setData(prev => ({ ...prev, [key]: value }));

  return (
    <form className="plan-form" onSubmit={event => { event.preventDefault(); onSave(data, false); }}>
      <section className="dashboard-panel">
        <h2>Payment Owner</h2>
        <div className="filter-grid">
          <label className="filter-control"><span>Owner Type</span><select className="form-input" value={data.ownerType} onChange={event => setField('ownerType', event.target.value as PaymentFormData['ownerType'])} disabled={mode === 'edit' || approved}><option value="registration">Registration</option><option value="subscriber">Subscriber</option></select></label>
          {data.ownerType === 'registration' ? (
            <label className="filter-control"><span>Registration</span><select className="form-input" value={data.registrationId} onChange={event => setField('registrationId', event.target.value)} disabled={mode === 'edit' || approved}><option value="">Choose registration</option>{registrations.map(item => <option key={item.id} value={item.id}>{item.id} - {item.clinicName}</option>)}</select></label>
          ) : (
            <label className="filter-control"><span>Subscriber</span><select className="form-input" value={data.subscriberId} onChange={event => setField('subscriberId', event.target.value)} disabled={mode === 'edit' || approved}><option value="">Choose subscriber</option>{subscribers.map(item => <option key={item.id} value={item.id}>{item.businessName}</option>)}</select></label>
          )}
          <label className="filter-control"><span>Subscription</span><select className="form-input" value={data.subscriptionId} onChange={event => setField('subscriptionId', event.target.value)} disabled={mode === 'edit' || approved}><option value="">None</option>{subscriptions.map(item => <option key={item.id} value={item.id}>{item.subscriptionNumber} - {item.priceSnapshot.planName}</option>)}</select></label>
          <label className="filter-control"><span>Plan</span><select className="form-input" value={data.planId} onChange={event => setField('planId', event.target.value)} disabled={mode === 'edit' || approved}><option value="">Resolve from owner</option>{plans.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="filter-control"><span>Payer Name</span><input className="form-input" value={data.payerName} onChange={event => setField('payerName', event.target.value)} disabled={approved} /></label>
          <label className="filter-control"><span>Payer Email</span><input className="form-input" value={data.payerEmail} onChange={event => setField('payerEmail', event.target.value)} disabled={approved} /></label>
        </div>
      </section>

      <section className="dashboard-panel">
        <h2>Payment Details</h2>
        <div className="filter-grid">
          <label className="filter-control"><span>Amount</span><input className="form-input" type="number" min={0} value={data.amount} onChange={event => setField('amount', Number(event.target.value))} disabled={approved} /></label>
          <label className="filter-control"><span>Currency</span><input className="form-input" readOnly value="PHP" /></label>
          <label className="filter-control"><span>Payment Method</span><select className="form-input" value={data.paymentMethod} onChange={event => setField('paymentMethod', event.target.value as PaymentMethod)} disabled={approved}>{methods.map(item => <option key={item} value={item}>{item.replace('_', ' ')}</option>)}</select></label>
          <label className="filter-control"><span>Reference Number</span><input className="form-input" value={data.referenceNumber} onChange={event => setField('referenceNumber', event.target.value)} disabled={approved} /></label>
          <label className="filter-control"><span>Payment Date</span><input className="form-input" type="date" value={data.paymentDate} onChange={event => setField('paymentDate', event.target.value)} disabled={approved} /></label>
        </div>
        <label className="filter-control" style={{ marginTop: '1rem' }}><span>Notes</span><textarea className="form-input" rows={3} value={data.notes} onChange={event => setField('notes', event.target.value)} /></label>
        <label className="filter-control" style={{ marginTop: '1rem' }}><span>Administrative Notes</span><textarea className="form-input" rows={3} value={data.administrativeNotes} onChange={event => setField('administrativeNotes', event.target.value)} /></label>
      </section>

      <section className="dashboard-panel">
        <h2>Proof of Payment</h2>
        <div className="filter-grid">
          <label className="filter-control"><span>Mock File Name</span><input className="form-input" value={data.proofFileName} onChange={event => setField('proofFileName', event.target.value)} /></label>
          <label className="filter-control"><span>Mock File Type</span><input className="form-input" value={data.proofFileType} onChange={event => setField('proofFileType', event.target.value)} /></label>
          <div className="info-tile"><span>Preview</span><strong>{data.proofFileName || 'No mock proof selected'}</strong></div>
        </div>
      </section>

      {mode === 'create' && (
        <section className="dashboard-panel">
          <h2>Allocation</h2>
          <div className="filter-grid">
            <label className="filter-control"><span>Allocation Mode</span><select className="form-input" value={data.allocationMode} onChange={event => setField('allocationMode', event.target.value as PaymentFormData['allocationMode'])}>{allocationModes.map(item => <option key={item} value={item}>{item.replace('_', ' ')}</option>)}</select></label>
            <label className="filter-control"><span>Allocation Amount</span><input className="form-input" type="number" min={0} value={data.allocationAmount} onChange={event => setField('allocationAmount', Number(event.target.value))} disabled={data.allocationMode === 'unallocated'} /></label>
          </div>
        </section>
      )}

      <div className="toolbar-row" style={{ justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-outline" style={{ width: 'auto' }} onClick={onCancel} disabled={saving}>Cancel</button>
        {mode === 'create' && <button type="button" className="btn btn-outline" style={{ width: 'auto' }} onClick={() => onSave(data, true)} disabled={saving}>Save as Draft</button>}
        <button type="submit" className="btn btn-primary" style={{ width: 'auto' }} disabled={saving}>{mode === 'create' ? 'Submit for Verification' : 'Save Changes'}</button>
      </div>
    </form>
  );
}
