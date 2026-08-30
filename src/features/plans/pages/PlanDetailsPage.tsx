import { useState } from 'react';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Users, 
  Sparkles,
  DollarSign
} from 'lucide-react';
import { ConfirmationDialog } from '../../../components/overlays/ConfirmationDialog';
import { platformAdminPlanService as mockPlanService } from '../../platformManagement/realData/platformAdminRealDataService';
import { usePlatformAdminDetail } from '../../platformManagement/realData/PlatformAdminReadProvider';
import { PlanActionMenu } from '../components/PlanActionMenu';

interface PlanDetailsPageProps {
  planId: string;
  navigate: (route: string) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

const formatMoney = (value: number) => value > 0 ? `₱${value.toLocaleString()}` : 'Free';
const limitText = (type: string, value?: number) => type === 'number' ? String(value ?? 0) : type.replace('_', ' ');

export function PlanDetailsPage({ planId, navigate, showToast }: PlanDetailsPageProps) {
  usePlatformAdminDetail('plans', planId);
  const [, setVersion] = useState(0);
  const [tab, setTab] = useState<'overview' | 'features' | 'limits' | 'subscribers' | 'history'>('overview');
  const [confirmAction, setConfirmAction] = useState<'activate' | 'deactivate' | 'archive' | 'restore' | 'delete' | null>(null);
  const plan = mockPlanService.getPlanById(planId);
  const showReadOnlyNotice = () => showToast('Plan configuration is read-only until an approved secure plan mutation contract is deployed.', 'info');

  if (!plan) {
    return (
      <main className="main-content">
        <button className="btn btn-outline" style={{ width: 'auto' }} onClick={() => navigate('/platform/plans')}><ArrowLeft size={16} /> Back to Plans</button>
        <div className="dashboard-panel" style={{ marginTop: '1rem' }}>
          <h1>Plan not found</h1>
          <p className="page-title-desc">This subscription plan could not be located.</p>
        </div>
      </main>
    );
  }

  const history = mockPlanService.getPlanHistory(plan.id);

  const duplicate = () => {
    const result = mockPlanService.duplicatePlan(plan.id);
    if (!result.ok || !result.data) {
      showToast(result.error || 'Could not duplicate plan.', 'error');
      return;
    }
    showToast(`${result.data.name} was saved as a draft.`, 'success');
    navigate(`/platform/plans/${encodeURIComponent(result.data.id)}/edit`);
  };

  const runConfirmedAction = () => {
    const result =
      confirmAction === 'activate' ? mockPlanService.activatePlan(plan.id) :
      confirmAction === 'deactivate' ? mockPlanService.deactivatePlan(plan.id) :
      confirmAction === 'archive' ? mockPlanService.archivePlan(plan.id) :
      confirmAction === 'restore' ? mockPlanService.restorePlan(plan.id) :
      mockPlanService.permanentlyDeleteUnusedPlan(plan.id);

    if (!result.ok) {
      showToast(result.error || 'Plan action failed.', 'error');
    } else {
      showToast(`Plan ${confirmAction === 'delete' ? 'deleted permanently' : `${confirmAction}d`}.`, 'success');
      if (confirmAction === 'delete') {
        navigate('/platform/plans');
        return;
      }
      setVersion(prev => prev + 1);
    }
    setConfirmAction(null);
  };

  const getTierInitials = () => {
    if (plan.planCode.includes('max') || plan.name.toLowerCase().includes('max')) return 'MX';
    if (plan.planCode.includes('plus') || plan.name.toLowerCase().includes('plus')) return 'PL';
    return 'BA';
  };

  const getTierGradient = () => {
    if (plan.planCode.includes('max') || plan.name.toLowerCase().includes('max')) {
      return 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)';
    }
    if (plan.planCode.includes('plus') || plan.name.toLowerCase().includes('plus')) {
      return 'linear-gradient(135deg, #2563eb 0%, #0284c7 100%)';
    }
    return 'linear-gradient(135deg, #475569 0%, #64748b 100%)';
  };

  return (
    <main className="main-content">
      {/* BACK & BREADCRUMB */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <button
          className="btn btn-outline"
          style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
          onClick={() => navigate('/platform/plans')}
        >
          <ArrowLeft size={15} /> Back to Plans
        </button>
        <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>/</span>
        <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Plan Dossier</span>
        <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>/</span>
        <span style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 700 }}>{plan.name}</span>
      </div>

      {/* HERO HEADER CARD */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            background: getTierGradient(),
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '1.25rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            {getTierInitials()}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>{plan.name} Plan</h1>
              {plan.badgeLabel && (
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '6px',
                  backgroundColor: '#f1f5f9',
                  color: '#334155',
                  border: '1px solid #e2e8f0'
                }}>
                  {plan.badgeLabel}
                </span>
              )}
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '0.2rem 0.55rem',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 700,
                backgroundColor: plan.status === 'active' ? '#ecfdf5' : '#fef2f2',
                color: plan.status === 'active' ? '#166534' : '#991b1b',
                border: plan.status === 'active' ? '1px solid #bbf7d0' : '1px solid #e2e8f0'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: plan.status === 'active' ? '#16a34a' : '#ef4444' }} />
                {plan.status.toUpperCase()}
              </span>
            </div>
            <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              {plan.fullDescription || plan.shortDescription}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button
            className="btn btn-primary"
            style={{ width: 'auto', padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}
            onClick={showReadOnlyNotice}
          >
            Edit Configuration
          </button>
          <PlanActionMenu
            plan={plan}
            onEdit={showReadOnlyNotice}
            onDuplicate={duplicate}
            onActivate={() => setConfirmAction('activate')}
            onDeactivate={() => setConfirmAction('deactivate')}
            onArchive={() => setConfirmAction('archive')}
            onRestore={() => setConfirmAction('restore')}
            onDelete={() => setConfirmAction('delete')}
          />
        </div>
      </div>

      {/* 4 HERO METRIC CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Monthly Rate</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>{formatMoney(plan.monthlyPrice)}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Per active clinic tenant</div>
        </div>

        <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Annual Rate</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981' }}>
            {plan.annualPrice > 0 ? formatMoney(plan.annualPrice) : 'Free'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Yearly billed contract</div>
        </div>

        <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Enrolled Subscribers</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#7c3aed' }}>{plan.subscriberCount}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Active clinic organizations</div>
        </div>

        <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Features Active</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c' }}>
              <Sparkles size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ea580c' }}>
            {plan.features.filter(f => f.enabled).length} / {plan.features.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>System capabilities unlocked</div>
        </div>
      </div>

      {/* TABS CONTAINER */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          {(['overview', 'features', 'limits', 'subscribers', 'history'] as const).map(item => (
            <button
              key={item}
              className={`tab-btn ${tab === item ? 'active' : ''}`}
              onClick={() => setTab(item)}
              style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem', borderRadius: '8px' }}
            >
              {item === 'overview' ? 'Overview & Pricing' :
               item === 'features' ? `Features (${plan.features.filter(f => f.enabled).length})` :
               item === 'limits' ? `Usage Quotas (${plan.limits.length})` :
               item === 'subscribers' ? `Enrolled Subscribers (${plan.subscriberCount})` : 'Audit History'}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Plan Code</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginTop: '0.25rem', fontFamily: 'monospace' }}>{plan.planCode}</div>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>URL Slug</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginTop: '0.25rem' }}>{plan.slug}</div>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Supported Billing Cycles</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', marginTop: '0.25rem' }}>
                {plan.billingCycles.map(c => c.toUpperCase()).join(', ')}
              </div>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Display Order / Priority</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginTop: '0.25rem' }}>Position #{plan.displayOrder}</div>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Created Date</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', marginTop: '0.25rem' }}>{plan.createdAt}</div>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Last Configuration Update</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', marginTop: '0.25rem' }}>{plan.updatedAt}</div>
            </div>
          </div>
        )}

        {tab === 'features' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.85rem' }}>
            {plan.features.map(f => (
              <div
                key={f.key}
                style={{
                  padding: '0.9rem',
                  borderRadius: '12px',
                  border: f.enabled ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                  backgroundColor: f.enabled ? '#f0fdf4' : '#f8fafc',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.875rem', color: f.enabled ? '#14532d' : '#64748b' }}>{f.label}</strong>
                  {f.enabled ? (
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#16a34a', backgroundColor: '#dcfce7', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                      ENABLED
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8' }}>OFF</span>
                  )}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{f.description}</span>
              </div>
            ))}
          </div>
        )}

        {tab === 'limits' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.85rem' }}>
            {plan.limits.map(limit => (
              <div
                key={limit.key}
                style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{limit.label}</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: limit.type === 'unlimited' ? '#16a34a' : '#0f172a', marginTop: '0.25rem', textTransform: 'capitalize' }}>
                  {limitText(limit.type, limit.value)}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'subscribers' && (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
            <Users size={32} style={{ margin: '0 auto 0.5rem auto', opacity: 0.4 }} />
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#475569' }}>Subscriber identities are not included in the approved plan detail contract. Aggregate enrollment: {plan.subscriberCount}.</div>
          </div>
        )}

        {tab === 'history' && (
          <div>
            {history.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {history.map(h => (
                  <div key={h.id} style={{ padding: '0.85rem 1rem', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #f1f5f9', fontSize: '0.825rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ color: '#0f172a' }}>{h.action}</strong>
                      <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{h.createdAt}</span>
                    </div>
                    <div style={{ color: '#475569', marginTop: '0.2rem' }}>{h.details}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                No configuration audit history recorded.
              </div>
            )}
          </div>
        )}
      </div>

      {/* CONFIRMATION DIALOG */}
      {confirmAction && (
        <ConfirmationDialog
          open={Boolean(confirmAction)}
          title={`${confirmAction.charAt(0).toUpperCase() + confirmAction.slice(1)} ${plan.name} Plan?`}
          description={
            confirmAction === 'delete'
              ? `Are you sure you want to permanently delete the ${plan.name} tier? This action cannot be undone.`
              : confirmAction === 'deactivate'
                ? `Deactivating ${plan.name} will hide it from new registrations while keeping existing subscribers active.`
                : `Are you sure you want to ${confirmAction} this tier?`
          }
          confirmLabel={confirmAction === 'delete' ? 'Delete Permanently' : confirmAction.charAt(0).toUpperCase() + confirmAction.slice(1)}
          destructive={confirmAction === 'delete' || confirmAction === 'deactivate' || confirmAction === 'archive'}
          onConfirm={runConfirmedAction}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </main>
  );
}
