import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { mockPlatformManagementService } from '../../platformManagement/services/mockPlatformManagementService';
import { mockPlanService } from '../../plans/services/mockPlanService';
import { SubscriptionForm } from '../components/SubscriptionForm';
import { mockSubscriptionService } from '../services/mockSubscriptionService';
import type { SubscriptionFormData } from '../types';

interface SubscriptionFormPageProps {
  mode: 'create' | 'edit';
  subscriptionId?: string;
  navigate: (route: string) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export function SubscriptionFormPage({ mode, subscriptionId, navigate, showToast }: SubscriptionFormPageProps) {
  const [saving, setSaving] = useState(false);
  const subscription = subscriptionId ? mockSubscriptionService.getSubscriptionById(subscriptionId) || undefined : undefined;
  const subscribers = mockPlatformManagementService.listSubscribers();
  const plans = mockPlanService.listPlans();

  if (mode === 'edit' && !subscription) {
    return <MissingSubscription navigate={navigate} />;
  }

  const save = (data: SubscriptionFormData, draft = false) => {
    setSaving(true);
    const result = mode === 'create'
      ? mockSubscriptionService.createSubscription(data, draft)
      : mockSubscriptionService.updateSubscription(subscriptionId || '', data);
    setSaving(false);
    if (!result.ok || !result.data) {
      showToast(result.error || 'Could not save subscription.', 'error');
      return;
    }
    showToast(`${result.data.subscriptionNumber} was saved.`, 'success');
    navigate(`/platform/subscriptions/${encodeURIComponent(result.data.id)}`);
  };

  return (
    <main className="main-content">
      <button className="btn btn-outline" style={{ width: 'auto', marginBottom: '1rem' }} onClick={() => navigate(subscription ? `/platform/subscriptions/${encodeURIComponent(subscription.id)}` : '/platform/subscriptions')}><ArrowLeft size={16} /> Back</button>
      <div className="page-header-container">
        <div>
          <h1>{mode === 'create' ? 'Add Subscription' : `Edit ${subscription?.subscriptionNumber}`}</h1>
          <p className="page-title-desc">{mode === 'create' ? 'Create a mock subscriber subscription with a preserved plan price snapshot.' : 'Edit allowed fields only; lifecycle changes use dedicated actions.'}</p>
        </div>
      </div>
      <SubscriptionForm mode={mode} subscription={subscription} subscribers={subscribers} plans={plans} saving={saving} onCancel={() => navigate('/platform/subscriptions')} onSave={save} />
    </main>
  );
}

function MissingSubscription({ navigate }: { navigate: (route: string) => void }) {
  return (
    <main className="main-content">
      <button className="btn btn-outline" style={{ width: 'auto' }} onClick={() => navigate('/platform/subscriptions')}><ArrowLeft size={16} /> Back to Subscriptions</button>
      <div className="dashboard-panel" style={{ marginTop: '1rem' }}>
        <h1>Subscription not found</h1>
        <p className="page-title-desc">This mock subscription may have been removed or the link is invalid.</p>
      </div>
    </main>
  );
}
