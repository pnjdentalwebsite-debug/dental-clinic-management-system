import { useMemo, useState } from 'react';
import { 
  Plus, 
  Layers, 
  CheckCircle2, 
  Users, 
  Sparkles,
  Search,
  RefreshCw,
  Check,
  Building2,
  Stethoscope,
  FlaskConical
} from 'lucide-react';
import { ConfirmationDialog } from '../../../components/overlays/ConfirmationDialog';
import { PlatformPageHeader } from '../../../components/PlatformShared';
import { PlanActionMenu } from '../components/PlanActionMenu';
import { mockPlanService } from '../services/mockPlanService';
import type { Plan, PlanFilters, PlanSort } from '../types';

interface PlansPageProps {
  navigate: (route: string) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

const tabs = [
  ['all', 'All Plans'],
  ['active', 'Active'],
  ['draft', 'Draft'],
  ['inactive', 'Inactive'],
  ['archived', 'Archived']
] as const;

const formatMoney = (value: number) => value > 0 ? `₱${value.toLocaleString()}` : 'Free';

export function PlansPage({ navigate, showToast }: PlansPageProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [confirmPlan, setConfirmPlan] = useState<Plan | null>(null);
  const [confirmAction, setConfirmAction] = useState<'activate' | 'deactivate' | 'archive' | 'restore' | 'delete' | null>(null);
  const [filters, setFilters] = useState<PlanFilters>({ search: '', status: 'all', visibility: 'all', tab: 'all' });
  const [sort, setSort] = useState<PlanSort>({ field: 'displayOrder', direction: 'asc' });

  const plans = useMemo(() => mockPlanService.listPlans(), [refreshKey]);
  const summary = useMemo(() => mockPlanService.getPlanSummary(), [refreshKey]);
  const filteredPlans = useMemo(() => mockPlanService.sortPlans(mockPlanService.filterPlans(plans, filters), sort), [plans, filters, sort]);

  const setFilter = (key: keyof PlanFilters, value: string) => setFilters(prev => ({ ...prev, [key]: value }));
  const refresh = () => {
    setRefreshKey(prev => prev + 1);
    showToast('Plan tiers refreshed.', 'info');
  };
  const changeSort = (field: PlanSort['field']) => setSort(prev => ({ field, direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc' }));

  const duplicate = (plan: Plan) => {
    const result = mockPlanService.duplicatePlan(plan.id);
    if (!result.ok || !result.data) {
      showToast(result.error || 'Could not duplicate plan.', 'error');
      return;
    }
    refresh();
    showToast(`${result.data.name} was saved as a draft.`, 'success');
    navigate(`/platform/plans/${encodeURIComponent(result.data.id)}/edit`);
  };

  const requestAction = (plan: Plan, action: typeof confirmAction) => {
    setConfirmPlan(plan);
    setConfirmAction(action);
  };

  const runConfirmedAction = () => {
    if (!confirmPlan || !confirmAction) return;
    const result =
      confirmAction === 'activate' ? mockPlanService.activatePlan(confirmPlan.id) :
      confirmAction === 'deactivate' ? mockPlanService.deactivatePlan(confirmPlan.id) :
      confirmAction === 'archive' ? mockPlanService.archivePlan(confirmPlan.id) :
      confirmAction === 'restore' ? mockPlanService.restorePlan(confirmPlan.id) :
      mockPlanService.permanentlyDeleteUnusedPlan(confirmPlan.id);

    if (!result.ok) {
      showToast(result.error || 'Plan action failed.', 'error');
    } else {
      showToast(`Plan ${confirmAction === 'delete' ? 'deleted permanently' : `${confirmAction}d`}.`, 'success');
      refresh();
    }
    setConfirmPlan(null);
    setConfirmAction(null);
  };

  const getTierInitials = (plan: Plan) => {
    if (plan.planCode.includes('max') || plan.name.toLowerCase().includes('max')) return 'MX';
    if (plan.planCode.includes('plus') || plan.name.toLowerCase().includes('plus')) return 'PL';
    return 'BA';
  };

  const getTierColor = (plan: Plan) => {
    if (plan.planCode.includes('max') || plan.name.toLowerCase().includes('max')) {
      return { bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe', grad: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)' };
    }
    if (plan.planCode.includes('plus') || plan.name.toLowerCase().includes('plus')) {
      return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', grad: 'linear-gradient(135deg, #2563eb 0%, #0284c7 100%)' };
    }
    return { bg: '#f1f5f9', color: '#334155', border: '#cbd5e1', grad: 'linear-gradient(135deg, #475569 0%, #64748b 100%)' };
  };

  const getQuotaSummary = (plan: Plan) => {
    const clinicsLimit = plan.limits.find(l => l.key === 'clinics');
    const associatesLimit = plan.limits.find(l => l.key === 'associates');
    const labsLimit = plan.limits.find(l => l.key === 'laboratories');

    const clinicsText = clinicsLimit?.type === 'unlimited' ? 'Unlimited Clinics' : `${clinicsLimit?.value ?? 1} Clinic`;
    const associatesText = associatesLimit?.type === 'unlimited' ? 'Unlimited Dentists' : `${associatesLimit?.value ?? 1} Dentist${associatesLimit?.value === 1 ? '' : 's'}`;
    const labsText = labsLimit?.type === 'unlimited' ? 'Unlimited Labs' : labsLimit?.type === 'not_included' ? 'No Labs' : `${labsLimit?.value ?? 0} Labs`;

    return { clinicsText, associatesText, labsText };
  };

  const renderActions = (plan: Plan) => (
    <PlanActionMenu
      plan={plan}
      onView={() => navigate(`/platform/plans/${encodeURIComponent(plan.id)}`)}
      onEdit={() => navigate(`/platform/plans/${encodeURIComponent(plan.id)}/edit`)}
      onDuplicate={() => duplicate(plan)}
      onActivate={() => requestAction(plan, 'activate')}
      onDeactivate={() => requestAction(plan, 'deactivate')}
      onArchive={() => requestAction(plan, 'archive')}
      onRestore={() => requestAction(plan, 'restore')}
      onDelete={() => requestAction(plan, 'delete')}
    />
  );

  return (
    <main className="main-content">
      {/* HEADER */}
      <PlatformPageHeader
        title="Clinic Subscription Plans"
        subtitle="Manage clinic subscription plans, monthly/yearly pricing, branch & staff limits, and included features."
        breadcrumbs={['Platform', 'Plans & Billing', 'Subscription Plans']}
        primaryAction={{
          label: 'Add Subscription Plan',
          icon: Plus,
          onClick: () => navigate('/platform/plans/new')
        }}
        secondaryAction={{
          label: 'Refresh Plans',
          icon: RefreshCw,
          onClick: refresh
        }}
      />

      {/* 4 HERO KPI STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Plan Tiers</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
              <Layers size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>{summary.total}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Configured system tiers</div>
        </div>

        <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Public Plans</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981' }}>{summary.active}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Available in registration</div>
        </div>

        <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subscribers Enrolled</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#7c3aed' }}>{summary.subscriberUsage}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Active clinic accounts</div>
        </div>

        <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#c026d3', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Entry Base Tier</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#fdf4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c026d3' }}>
              <Sparkles size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#c026d3' }}>Free Starter</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>₱0.00 / starting clinics</div>
        </div>
      </div>

      {/* FILTER TABS & CONTROLS */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.25rem', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {tabs.map(([value, label]) => {
              const count = value === 'all' ? plans.length : plans.filter(p => p.status === value).length;
              const isActive = filters.tab === value;
              return (
                <button
                  key={value}
                  className={`tab-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setFilter('tab', value)}
                  style={{
                    padding: '0.4rem 0.85rem',
                    fontSize: '0.85rem',
                    borderRadius: '8px'
                  }}
                >
                  {label} ({count})
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className={`btn ${viewMode === 'table' ? 'btn-primary' : 'btn-outline'}`}
              style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
              onClick={() => setViewMode('table')}
            >
              Table View
            </button>
            <button
              className={`btn ${viewMode === 'cards' ? 'btn-primary' : 'btn-outline'}`}
              style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
              onClick={() => setViewMode('cards')}
            >
              Card Grid
            </button>
          </div>
        </div>

        {/* SEARCH AND FILTERS */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 300px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '36px', height: '40px', fontSize: '0.875rem' }}
              placeholder="Search by plan name, code, features, description..."
              value={filters.search}
              onChange={e => setFilter('search', e.target.value)}
            />
          </div>

          <select
            className="form-input"
            style={{ width: 'auto', minWidth: '160px', height: '40px', fontSize: '0.85rem' }}
            value={filters.visibility}
            onChange={e => setFilter('visibility', e.target.value)}
          >
            <option value="all">All Visibilities</option>
            <option value="public">Public (Registration)</option>
            <option value="hidden">Hidden</option>
            <option value="internal">Internal Only</option>
          </select>

          <select
            className="form-input"
            style={{ width: 'auto', minWidth: '140px', height: '40px', fontSize: '0.85rem' }}
            value={filters.status}
            onChange={e => setFilter('status', e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* TABLE VIEW */}
      {viewMode === 'table' ? (
        <div className="table-container" style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                  <button className="table-sort" onClick={() => changeSort('name')}>Plan Tier & Badge</button>
                </th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                  <button className="table-sort" onClick={() => changeSort('monthlyPrice')}>Billing Rates</button>
                </th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Resource Quotas</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Features Enabled</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                  <button className="table-sort" onClick={() => changeSort('subscriberCount')}>Subscribers</button>
                </th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Status</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlans.map(plan => {
                const colors = getTierColor(plan);
                const initials = getTierInitials(plan);
                const enabledFeatures = plan.features.filter(f => f.enabled);
                const quotas = getQuotaSummary(plan);

                return (
                  <tr key={plan.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    {/* PLAN & BADGE */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '10px',
                          background: colors.grad,
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          flexShrink: 0
                        }}>
                          {initials}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>{plan.name}</span>
                            {plan.badgeLabel && (
                              <span style={{
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                padding: '0.1rem 0.4rem',
                                borderRadius: '4px',
                                backgroundColor: colors.bg,
                                color: colors.color,
                                border: `1px solid ${colors.border}`
                              }}>
                                {plan.badgeLabel}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                            {plan.shortDescription}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* BILLING RATES */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>
                          {formatMoney(plan.monthlyPrice)} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b' }}>/ mo</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: plan.annualPrice > 0 ? '#16a34a' : '#64748b', fontWeight: 600, marginTop: '0.1rem' }}>
                          {plan.annualPrice > 0 ? `${formatMoney(plan.annualPrice)} / year` : 'No recurring charge'}
                        </div>
                      </div>
                    </td>

                    {/* RESOURCE QUOTAS */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.75rem',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '6px',
                          backgroundColor: '#eff6ff',
                          color: '#1e40af',
                          fontWeight: 600
                        }}>
                          <Building2 size={11} /> {quotas.clinicsText}
                        </span>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.75rem',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '6px',
                          backgroundColor: '#f5f3ff',
                          color: '#7e22ce',
                          fontWeight: 600
                        }}>
                          <Stethoscope size={11} /> {quotas.associatesText}
                        </span>
                        {quotas.labsText !== 'No Labs' && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.75rem',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '6px',
                            backgroundColor: '#ecfdf5',
                            color: '#15803d',
                            fontWeight: 600
                          }}>
                            <FlaskConical size={11} /> {quotas.labsText}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* FEATURES */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: '#0f172a'
                      }}>
                        <Check size={14} color="#16a34a" /> {enabledFeatures.length} of {plan.features.length} Features
                      </span>
                    </td>

                    {/* SUBSCRIBERS */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <button
                        onClick={() => navigate(`/platform/subscribers`)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '8px',
                          backgroundColor: plan.subscriberCount > 0 ? '#f0fdf4' : '#f8fafc',
                          color: plan.subscriberCount > 0 ? '#166534' : '#64748b',
                          border: plan.subscriberCount > 0 ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        <Users size={12} />
                        <span>{plan.subscriberCount} Subscriber{plan.subscriberCount === 1 ? '' : 's'}</span>
                      </button>
                    </td>

                    {/* STATUS */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: plan.status === 'active' ? '#ecfdf5' : '#fef2f2',
                          color: plan.status === 'active' ? '#166534' : '#991b1b',
                          border: plan.status === 'active' ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                          width: 'fit-content'
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: plan.status === 'active' ? '#16a34a' : '#ef4444' }} />
                          {plan.status.toUpperCase()}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                          {plan.visibility === 'public' ? 'Public' : 'Internal'}
                        </span>
                      </div>
                    </td>

                    {/* ACTIONS */}
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      {renderActions(plan)}
                    </td>
                  </tr>
                );
              })}

              {filteredPlans.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                    <Layers size={36} style={{ margin: '0 auto 0.75rem auto', opacity: 0.4 }} />
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#475569' }}>No plans match the current criteria</div>
                    <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Try clearing filters or search keywords.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* CARDS GRID VIEW */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {filteredPlans.map(plan => {
            const colors = getTierColor(plan);
            const enabledFeatures = plan.features.filter(f => f.enabled);
            const quotas = getQuotaSummary(plan);

            return (
              <div
                key={plan.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  border: plan.isRecommended ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                  padding: '1.5rem',
                  boxShadow: plan.isRecommended ? '0 10px 25px -5px rgba(59,130,246,0.1)' : '0 1px 3px rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1.25rem',
                  position: 'relative'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{plan.name}</h3>
                        {plan.badgeLabel && (
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                            backgroundColor: colors.bg,
                            color: colors.color,
                            border: `1px solid ${colors.border}`
                          }}>
                            {plan.badgeLabel}
                          </span>
                        )}
                      </div>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>{plan.shortDescription}</p>
                    </div>
                    {renderActions(plan)}
                  </div>

                  <div style={{ margin: '1rem 0', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
                      {formatMoney(plan.monthlyPrice)}
                      <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748b' }}> / month</span>
                    </div>
                    {plan.annualPrice > 0 && (
                      <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600, marginTop: '0.2rem' }}>
                        {formatMoney(plan.annualPrice)} / year billed annually
                      </div>
                    )}
                  </div>

                  {/* QUOTAS */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem', fontSize: '0.825rem', color: '#334155' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Building2 size={14} color="#3b82f6" />
                      <strong>Facilities:</strong> {quotas.clinicsText}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Stethoscope size={14} color="#8b5cf6" />
                      <strong>Clinical Staff:</strong> {quotas.associatesText}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FlaskConical size={14} color="#10b981" />
                      <strong>Laboratories:</strong> {quotas.labsText}
                    </div>
                  </div>

                  {/* FEATURES PREVIEW */}
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                      Included Features ({enabledFeatures.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {enabledFeatures.slice(0, 5).map(f => (
                        <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#1e293b' }}>
                          <Check size={13} color="#16a34a" />
                          <span>{f.label}</span>
                        </div>
                      ))}
                      {enabledFeatures.length > 5 && (
                        <div style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600, marginTop: '0.2rem' }}>
                          +{enabledFeatures.length - 5} more capabilities included
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
                    {plan.subscriberCount} Enrolled Subscriber{plan.subscriberCount === 1 ? '' : 's'}
                  </span>
                  <button
                    className="btn btn-outline"
                    style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                    onClick={() => navigate(`/platform/plans/${encodeURIComponent(plan.id)}`)}
                  >
                    View Dossier
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CONFIRMATION DIALOG */}
      {confirmPlan && confirmAction && (
        <ConfirmationDialog
          open={Boolean(confirmPlan && confirmAction)}
          title={`${confirmAction.charAt(0).toUpperCase() + confirmAction.slice(1)} ${confirmPlan.name} Plan?`}
          description={
            confirmAction === 'delete'
              ? `Are you sure you want to permanently delete the ${confirmPlan.name} tier? This action cannot be undone.`
              : confirmAction === 'deactivate'
                ? `Deactivating ${confirmPlan.name} will hide it from new clinic registrations while keeping existing subscriber contracts active.`
                : `Are you sure you want to ${confirmAction} the ${confirmPlan.name} tier?`
          }
          confirmLabel={confirmAction === 'delete' ? 'Delete Permanently' : confirmAction.charAt(0).toUpperCase() + confirmAction.slice(1)}
          destructive={confirmAction === 'delete' || confirmAction === 'deactivate' || confirmAction === 'archive'}
          onConfirm={runConfirmedAction}
          onCancel={() => { setConfirmPlan(null); setConfirmAction(null); }}
        />
      )}
    </main>
  );
}
