import { useMemo, useState } from 'react';
import type { Plan, PlanFormData, PlanLimit } from '../types';
import { mockPlanService } from '../services/mockPlanService';
import { validatePlanForm } from '../validation/planValidation';

interface PlanFormProps {
  initialPlan?: Plan;
  mode: 'create' | 'edit';
  onCancel: () => void;
  onSave: (data: PlanFormData, draft?: boolean) => void;
  saving?: boolean;
}

const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function PlanForm({ initialPlan, mode, onCancel, onSave, saving = false }: PlanFormProps) {
  const [data, setData] = useState<PlanFormData>(mockPlanService.toFormData(initialPlan));
  const [featureSearch, setFeatureSearch] = useState('');
  const validation = validatePlanForm(data, mockPlanService.listPlans(), initialPlan?.id);

  const setField = <K extends keyof PlanFormData>(key: K, value: PlanFormData[K]) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const filteredFeatures = useMemo(() => {
    const term = featureSearch.trim().toLowerCase();
    return data.features.filter(feature => !term || feature.label.toLowerCase().includes(term) || feature.key.includes(term));
  }, [data.features, featureSearch]);

  const updateFeature = (key: string, enabled: boolean) => {
    setData(prev => ({ ...prev, features: prev.features.map(feature => feature.key === key ? { ...feature, enabled } : feature) }));
  };

  const updateLimit = (key: string, patch: Partial<PlanLimit>) => {
    setData(prev => ({ ...prev, limits: prev.limits.map(limit => limit.key === key ? { ...limit, ...patch } : limit) }));
  };

  const toggleBillingCycle = (cycle: 'monthly' | 'annual') => {
    setData(prev => {
      const exists = prev.billingCycles.includes(cycle);
      return { ...prev, billingCycles: exists ? prev.billingCycles.filter(item => item !== cycle) : [...prev.billingCycles, cycle] };
    });
  };

  const submit = (draft = false) => {
    const statusData = draft ? { ...data, status: 'draft' as const } : data;
    const result = validatePlanForm(statusData, mockPlanService.listPlans(), initialPlan?.id);
    if (result.valid) onSave(statusData, draft);
  };

  return (
    <form className="plan-form" onSubmit={(event) => { event.preventDefault(); submit(false); }}>
      {!validation.valid && (
        <div className="banner-alert warning" role="status">
          {Object.values(validation.errors)[0]}
        </div>
      )}

      <section className="dashboard-panel">
        <h2>Basic Information</h2>
        <div className="filter-grid">
          <label className="filter-control">
            <span>Plan Name *</span>
            <input className="form-input" value={data.name} onChange={event => {
              const name = event.target.value;
              setData(prev => ({ ...prev, name, slug: prev.slug || slugify(name), planCode: prev.planCode || slugify(name) }));
            }} />
          </label>
          <label className="filter-control">
            <span>Plan Code *</span>
            <input className="form-input" value={data.planCode} onChange={event => setField('planCode', slugify(event.target.value))} />
          </label>
          <label className="filter-control">
            <span>Slug *</span>
            <input className="form-input" value={data.slug} onChange={event => setField('slug', slugify(event.target.value))} />
          </label>
          <label className="filter-control">
            <span>Badge Label</span>
            <input className="form-input" value={data.badgeLabel} onChange={event => setField('badgeLabel', event.target.value)} />
          </label>
        </div>
        <label className="filter-control">
          <span>Short Description</span>
          <input className="form-input" value={data.shortDescription} onChange={event => setField('shortDescription', event.target.value)} />
        </label>
        <label className="filter-control" style={{ marginTop: '1rem' }}>
          <span>Full Description</span>
          <textarea className="form-input" rows={4} value={data.fullDescription} onChange={event => setField('fullDescription', event.target.value)} />
        </label>
        <label className="checkbox-label" style={{ marginTop: '1rem' }}>
          <input type="checkbox" checked={data.isRecommended} onChange={event => setField('isRecommended', event.target.checked)} />
          Recommended plan
        </label>
      </section>

      <section className="dashboard-panel">
        <h2>Pricing</h2>
        <div className="filter-grid">
          <label className="filter-control">
            <span>Currency</span>
            <input className="form-input" readOnly value="PHP" />
          </label>
          <label className="filter-control">
            <span>Monthly Price</span>
            <input type="number" min={0} className="form-input" value={data.monthlyPrice} onChange={event => setField('monthlyPrice', Number(event.target.value))} />
          </label>
          <label className="filter-control">
            <span>Annual Price</span>
            <input type="number" min={0} className="form-input" value={data.annualPrice} onChange={event => setField('annualPrice', Number(event.target.value))} />
          </label>
          <div className="filter-control">
            <span>Billing Cycles</span>
            <label className="checkbox-label"><input type="checkbox" checked={data.billingCycles.includes('monthly')} onChange={() => toggleBillingCycle('monthly')} /> Monthly</label>
            <label className="checkbox-label"><input type="checkbox" checked={data.billingCycles.includes('annual')} onChange={() => toggleBillingCycle('annual')} /> Annual</label>
          </div>
        </div>
      </section>

      <section className="dashboard-panel">
        <h2>Status and Visibility</h2>
        <div className="filter-grid">
          <label className="filter-control">
            <span>Status</span>
            <select className="form-input" value={data.status} onChange={event => setField('status', event.target.value as PlanFormData['status'])}>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <label className="filter-control">
            <span>Visibility</span>
            <select className="form-input" value={data.visibility} onChange={event => setField('visibility', event.target.value as PlanFormData['visibility'])}>
              <option value="public">Public</option>
              <option value="internal">Internal</option>
              <option value="hidden">Hidden</option>
            </select>
          </label>
          <label className="filter-control">
            <span>Display Order</span>
            <input type="number" min={0} className="form-input" value={data.displayOrder} onChange={event => setField('displayOrder', Number(event.target.value))} />
          </label>
        </div>
      </section>

      <section className="dashboard-panel">
        <h2>Features</h2>
        <div className="toolbar-row">
          <input className="form-input" style={{ maxWidth: 320 }} placeholder="Search features" value={featureSearch} onChange={event => setFeatureSearch(event.target.value)} />
          <div className="page-actions">
            <button className="btn btn-outline compact-action" type="button" onClick={() => setData(prev => ({ ...prev, features: prev.features.map(feature => ({ ...feature, enabled: true })) }))}>Select All</button>
            <button className="btn btn-outline compact-action" type="button" onClick={() => setData(prev => ({ ...prev, features: prev.features.map(feature => ({ ...feature, enabled: false })) }))}>Clear Features</button>
          </div>
        </div>
        <div className="record-card-grid">
          {filteredFeatures.map(feature => (
            <label className="record-card" key={feature.key}>
              <span className="record-card-header"><strong>{feature.label}</strong><input type="checkbox" checked={feature.enabled} onChange={event => updateFeature(feature.key, event.target.checked)} /></span>
              <span>{feature.description}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="dashboard-panel">
        <h2>Limits</h2>
        <div className="record-card-grid">
          {data.limits.map(limit => (
            <div className="record-card" key={limit.key}>
              <strong>{limit.label}</strong>
              <select className="form-input" value={limit.type} onChange={event => updateLimit(limit.key, { type: event.target.value as PlanLimit['type'], value: event.target.value === 'number' ? limit.value || 0 : undefined })}>
                <option value="number">Number</option>
                <option value="unlimited">Unlimited</option>
                <option value="not_included">Not included</option>
                <option value="pending">Pending Product Decision</option>
              </select>
              {limit.type === 'number' && <input type="number" min={0} className="form-input" value={limit.value || 0} onChange={event => updateLimit(limit.key, { value: Number(event.target.value) })} />}
            </div>
          ))}
        </div>
      </section>

      <div className="toolbar-row" style={{ justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-outline" style={{ width: 'auto' }} onClick={onCancel} disabled={saving}>Cancel</button>
        {mode === 'create' && <button type="button" className="btn btn-outline" style={{ width: 'auto' }} onClick={() => submit(true)} disabled={saving}>Save as Draft</button>}
        <button type="submit" className="btn btn-primary" style={{ width: 'auto' }} disabled={saving}>{saving ? 'Saving...' : mode === 'create' ? 'Create Plan' : 'Save Changes'}</button>
      </div>
    </form>
  );
}
