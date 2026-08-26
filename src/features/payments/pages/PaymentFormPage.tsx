import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { mockPlatformManagementService } from '../../platformManagement/services/mockPlatformManagementService';
import { mockPlanService } from '../../plans/services/mockPlanService';
import { mockSubscriptionService } from '../../subscriptions/services/mockSubscriptionService';
import { PaymentForm } from '../components/PaymentForm';
import { mockPaymentService } from '../services/mockPaymentService';
import type { PaymentFormData } from '../types';

interface PaymentFormPageProps {
  mode: 'create' | 'edit';
  paymentId?: string;
  navigate: (route: string) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export function PaymentFormPage({ mode, paymentId, navigate, showToast }: PaymentFormPageProps) {
  const [saving, setSaving] = useState(false);
  const payment = paymentId ? mockPaymentService.getPaymentById(paymentId) || undefined : undefined;
  if (mode === 'edit' && !payment) return <MissingPayment navigate={navigate} />;
  const save = (data: PaymentFormData, draft = false) => {
    setSaving(true);
    const result = mode === 'create' ? mockPaymentService.createPayment(data, draft) : mockPaymentService.updatePayment(paymentId || '', data);
    setSaving(false);
    if (!result.ok || !result.data) {
      showToast(result.error || 'Could not save payment.', 'error');
      return;
    }
    showToast(`${result.data.paymentNumber} was saved.`, 'success');
    navigate(`/platform/payments/${encodeURIComponent(result.data.id)}`);
  };
  return (
    <main className="main-content">
      <button className="btn btn-outline" style={{ width: 'auto', marginBottom: '1rem' }} onClick={() => navigate(payment ? `/platform/payments/${payment.id}` : '/platform/payments')}><ArrowLeft size={16} /> Back</button>
      <div className="page-header-container"><div><h1>{mode === 'create' ? 'Record Payment' : `Edit ${payment?.paymentNumber}`}</h1><p className="page-title-desc">{mode === 'create' ? 'Record a mock payment and optionally allocate it after verification.' : 'Edit safe payment fields only; allocation and refunds use dedicated actions.'}</p></div></div>
      <PaymentForm mode={mode} payment={payment} registrations={mockPlatformManagementService.listRegistrations()} subscribers={mockPlatformManagementService.listSubscribers()} subscriptions={mockSubscriptionService.listSubscriptions()} plans={mockPlanService.listPlans()} saving={saving} onCancel={() => navigate('/platform/payments')} onSave={save} />
    </main>
  );
}

function MissingPayment({ navigate }: { navigate: (route: string) => void }) {
  return <main className="main-content"><button className="btn btn-outline" style={{ width: 'auto' }} onClick={() => navigate('/platform/payments')}><ArrowLeft size={16} /> Back to Payments</button><div className="dashboard-panel" style={{ marginTop: '1rem' }}><h1>Payment not found</h1><p className="page-title-desc">This mock payment may have been removed or the link is invalid.</p></div></main>;
}
