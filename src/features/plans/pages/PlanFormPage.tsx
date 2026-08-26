import { useState } from 'react';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { PlanForm } from '../components/PlanForm';
import { mockPlanService } from '../services/mockPlanService';
import type { PlanFormData } from '../types';

interface PlanFormPageProps {
  mode: 'create' | 'edit';
  planId?: string;
  navigate: (route: string) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export function PlanFormPage({ mode, planId, navigate, showToast }: PlanFormPageProps) {
  const [saving, setSaving] = useState(false);
  const plan = planId ? mockPlanService.getPlanById(planId) || undefined : undefined;

  if (mode === 'edit' && !plan) {
    return (
      <main className="main-content">
        <button className="btn btn-outline" style={{ width: 'auto' }} onClick={() => navigate('/platform/plans')}><ArrowLeft size={16} /> Back to Plans</button>
        <div className="dashboard-panel" style={{ marginTop: '1rem' }}>
          <h1>Plan not found</h1>
          <p className="page-title-desc">This mock plan may have been deleted.</p>
        </div>
      </main>
    );
  }

  const save = (data: PlanFormData, draft = false) => {
    setSaving(true);
    const result = mode === 'create'
      ? mockPlanService.createPlan(data, draft)
      : mockPlanService.updatePlan(planId || '', data);
    setSaving(false);

    if (!result.ok || !result.data) {
      showToast(result.error || 'Could not save plan.', 'error');
      return;
    }
    showToast(`${result.data.name} was saved.`, 'success');
    navigate(`/platform/plans/${encodeURIComponent(result.data.id)}`);
  };

  return (
    <main className="main-content">
      <button className="btn btn-outline" style={{ width: 'auto', marginBottom: '1rem' }} onClick={() => navigate(mode === 'edit' && plan ? `/platform/plans/${encodeURIComponent(plan.id)}` : '/platform/plans')}><ArrowLeft size={16} /> Back</button>
      <div className="page-header-container">
        <div>
          <h1>{mode === 'create' ? 'New Subscription Plan' : `Edit ${plan?.name}`}</h1>
          <p className="page-title-desc">Manage prototype-only subscription structure, registration visibility, feature access, and usage limits.</p>
        </div>
      </div>

      {mode === 'edit' && plan && plan.status === 'active' && plan.subscriberCount > 0 && (
        <div className="banner-alert warning" style={{ marginBottom: '1.5rem' }}>
          <AlertTriangle size={16} />
          <span>This active plan is currently assigned to {plan.subscriberCount} subscriber{plan.subscriberCount === 1 ? '' : 's'}.</span>
        </div>
      )}

      <PlanForm
        initialPlan={plan}
        mode={mode}
        saving={saving}
        onCancel={() => navigate(mode === 'edit' && plan ? `/platform/plans/${encodeURIComponent(plan.id)}` : '/platform/plans')}
        onSave={save}
      />
    </main>
  );
}
