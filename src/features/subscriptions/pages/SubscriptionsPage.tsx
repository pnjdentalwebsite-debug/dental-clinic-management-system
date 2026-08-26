import { useMemo, useState } from 'react';
import { 
  CreditCard, 
  CheckCircle2, 
  Search,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { mockPlatformManagementService } from '../../platformManagement/services/mockPlatformManagementService';
import { mockPlanService } from '../../plans/services/mockPlanService';
import { mockSubscriptionService } from '../services/mockSubscriptionService';
import { ConfirmationDialog } from '../../../components/overlays/ConfirmationDialog';
import { PlatformPageHeader } from '../../../components/PlatformShared';
import type { Subscription, SubscriptionFilters, SubscriptionSort } from '../types';
import { SubscriptionActionMenu } from '../components/SubscriptionActionMenu';
import { SubscriptionActionDialog, type SubscriptionDialogAction } from '../components/SubscriptionActionDialog';

interface SubscriptionsPageProps {
  navigate: (route: string) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  refreshShell?: () => void;
}

const PAGE_SIZE = 8;
const tabs = ['all', 'active', 'pending', 'expiring_soon', 'suspended', 'cancelled', 'expired'] as const;
const paymentStatuses = ['all', 'paid', 'pending_verification', 'partially_paid', 'unpaid', 'overdue', 'rejected', 'refunded'];
const format = (value: string) => value.replaceAll('_', ' ');
const formatMoney = (value: number) => value > 0 ? `₱${value.toLocaleString()}` : 'Free';

export function SubscriptionsPage({ navigate, showToast, refreshShell }: SubscriptionsPageProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [action, setAction] = useState<SubscriptionDialogAction | null>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Subscription | null>(null);
  const [sort, setSort] = useState<SubscriptionSort>({ field: 'expirationDate', direction: 'asc' });
  const [filters, setFilters] = useState<SubscriptionFilters>({
    search: '',
    subscriberId: 'all',
    planId: 'all',
    status: 'all',
    billingCycle: 'all',
    paymentStatus: 'all',
    startDate: '',
    expirationDate: '',
    autoRenew: 'all',
    tab: 'all'
  });

  const subscribers = useMemo(() => mockPlatformManagementService.listSubscribers(), [refreshKey]);
  const plans = useMemo(() => mockPlanService.listPlans(), [refreshKey]);
  const subscriptions = useMemo(() => mockSubscriptionService.listSubscriptions(), [refreshKey]);
  const summary = useMemo(() => mockSubscriptionService.getSubscriptionSummary(), [refreshKey]);
  const displayed = useMemo(() => mockSubscriptionService.sortSubscriptions(mockSubscriptionService.filterSubscriptions(subscriptions, filters), sort), [subscriptions, filters, sort]);
  const pageCount = Math.max(1, Math.ceil(displayed.length / PAGE_SIZE));
  const paged = mockSubscriptionService.paginateSubscriptions(displayed, page, PAGE_SIZE);

  const refresh = () => {
    setRefreshKey(prev => prev + 1);
    if (refreshShell) refreshShell();
    showToast('Subscriptions ledger refreshed.', 'info');
  };

  const setFilter = (key: keyof SubscriptionFilters, value: string) => {
    setPage(1);
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const changeSort = (field: SubscriptionSort['field']) => {
    setSort(prev => ({ field, direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc' }));
  };

  const registrations = useMemo(() => mockPlatformManagementService.listRegistrations(), [refreshKey]);
  const isPendingRegistrationSubscription = (subscription: Subscription) => subscription.id.startsWith('SCP-PENDING-');
  const getRegistrationForSubscription = (subscription: Subscription) =>
    subscription.registrationId ? registrations.find(item => item.id === subscription.registrationId) : undefined;
  const getSubscriber = (subscription: Subscription) => {
    const linked = subscribers.find(item => item.id === subscription.subscriberId || item.subscriberNumber === subscription.subscriberId);
    if (linked) return linked;
    const registration = getRegistrationForSubscription(subscription);
    if (!registration) return null;
    return {
      id: subscription.subscriberId,
      subscriberNumber: subscription.subscriberId,
      businessName: registration.clinicName,
      primaryClinicName: registration.ownerName,
      email: registration.ownerEmail
    };
  };

  const getPlanInfo = (subscription: Subscription) => {
    const planName = subscription.priceSnapshot?.planName || subscription.planId;
    return plans.find(p => p.name.toLowerCase() === planName.toLowerCase() || p.planCode.toLowerCase() === planName.toLowerCase()) || plans[plans.length - 1];
  };

  const openAction = (subscription: Subscription, nextAction: SubscriptionDialogAction) => {
    setSelectedSubscription(subscription);
    setAction(nextAction);
  };

  const submitAction = (payload: Record<string, string | boolean>) => {
    if (!selectedSubscription || !action) return;
    const result =
      action === 'renew' ? mockSubscriptionService.renewSubscription(selectedSubscription.id, String(payload.billingCycle) as Subscription['billingCycle'], String(payload.newExpirationDate), String(payload.planId || ''), String(payload.paymentStatus) as Subscription['paymentStatus'], String(payload.note || '')) :
      action === 'change_plan' ? mockSubscriptionService.changeSubscriptionPlan(selectedSubscription.id, String(payload.planId || ''), String(payload.note || '')) :
      action === 'extend' ? mockSubscriptionService.extendExpiration(selectedSubscription.id, String(payload.newExpirationDate), String(payload.reason || ''), String(payload.note || '')) :
      action === 'suspend' ? mockSubscriptionService.suspendSubscription(selectedSubscription.id, String(payload.reason || ''), String(payload.note || '')) :
      action === 'reactivate' ? mockSubscriptionService.reactivateSubscription(selectedSubscription.id) :
      action === 'restore' ? mockSubscriptionService.restoreSubscription(selectedSubscription.id, String(payload.planId || '')) :
      mockSubscriptionService.cancelSubscription(selectedSubscription.id, String(payload.reason || ''), String(payload.note || ''));

    if (!result.ok) {
      showToast(result.error || 'Subscription action failed.', 'error');
    } else {
      showToast(`Subscription ${action.replace('_', ' ')} completed.`, 'success');
      refresh();
    }
    setAction(null);
    setSelectedSubscription(null);
  };

  const renderActions = (subscription: Subscription) => (
    isPendingRegistrationSubscription(subscription) ? (
      <button
        className="btn btn-outline"
        style={{ width: 'auto', height: '32px', padding: '0 0.75rem', fontSize: '0.78rem' }}
        onClick={() => navigate('/platform/payments')}
      >
        Review Payment
      </button>
    ) : (
    <SubscriptionActionMenu
      subscription={subscription}
      onView={() => navigate(`/platform/subscriptions/${encodeURIComponent(subscription.id)}`)}
      onEdit={() => navigate(`/platform/subscriptions/${encodeURIComponent(subscription.id)}/edit`)}
      onViewSubscriber={() => navigate(`/platform/subscribers/${encodeURIComponent(subscription.subscriberId)}`)}
      onViewPlan={() => navigate(`/platform/plans`)}
      onViewPayments={() => navigate('/platform/payments')}
      onRenew={() => openAction(subscription, 'renew')}
      onChangePlan={() => openAction(subscription, 'change_plan')}
      onExtend={() => openAction(subscription, 'extend')}
      onSuspend={() => openAction(subscription, 'suspend')}
      onReactivate={() => openAction(subscription, 'reactivate')}
      onRestore={() => openAction(subscription, 'restore')}
      onCancel={() => openAction(subscription, 'cancel')}
      onDelete={() => setDeleteTarget(subscription)}
    />
    )
  );

  const runDeleteSubscription = () => {
    if (!deleteTarget) return;
    const result = mockSubscriptionService.permanentlyDeleteSubscription(deleteTarget.id);
    if (!result.ok) {
      showToast(result.error || 'Failed to delete subscription.', 'error');
    } else {
      showToast(`Subscription ${deleteTarget.subscriptionNumber} was permanently deleted.`, 'success');
      refresh();
    }
    setDeleteTarget(null);
  };

  const totalMRR = useMemo(() => {
    return subscriptions.reduce((sum, s) => {
      if (s.status !== 'active') return sum;
      return sum + (s.priceSnapshot?.monthlyPrice || 10000);
    }, 0);
  }, [subscriptions]);

  return (
    <main className="main-content">
      {/* HEADER */}
      <PlatformPageHeader
        title="Active Clinic Subscriptions"
        subtitle="Monitor clinic plan details, validity dates, renewal schedules, and subscription status."
        breadcrumbs={['Platform', 'Plans & Billing', 'Active Subscriptions']}
        secondaryAction={{
          label: 'Refresh Subscriptions',
          icon: RefreshCw,
          onClick: refresh
        }}
      />

      {/* 4 HERO KPI STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Subscriptions</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
              <CreditCard size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>{summary.total}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Registered accounts</div>
        </div>

        <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Licenses</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981' }}>{summary.active}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>In good standing</div>
        </div>

        <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Monthly Recurring Rev.</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}>
              <Sparkles size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#7c3aed' }}>{formatMoney(totalMRR)}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Active billing base</div>
        </div>

        <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Expiring / Attention</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ea580c' }}>
            {summary.expiringSoon + summary.suspended}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Expiring within 30 days or hold</div>
        </div>
      </div>

      {/* FILTER TABS & CONTROLS */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.25rem', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {tabs.map(t => {
              const count = t === 'all' ? subscriptions.length : subscriptions.filter((s: any) => s.status === t).length;
              const isActive = filters.tab === t;
              return (
                <button
                  key={t}
                  className={`tab-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setFilter('tab', t)}
                  style={{
                    padding: '0.4rem 0.85rem',
                    fontSize: '0.85rem',
                    borderRadius: '8px'
                  }}
                >
                  {format(t)} ({count})
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
              placeholder="Search by subscriber, clinic name, owner, subscription code, plan..."
              value={filters.search}
              onChange={e => setFilter('search', e.target.value)}
            />
          </div>

          <select
            className="form-input"
            style={{ width: 'auto', minWidth: '160px', height: '40px', fontSize: '0.85rem' }}
            value={filters.planId}
            onChange={e => setFilter('planId', e.target.value)}
          >
            <option value="all">All Plans</option>
            {plans.map(p => (
              <option key={p.id} value={p.name}>{p.name} Plan</option>
            ))}
          </select>

          <select
            className="form-input"
            style={{ width: 'auto', minWidth: '160px', height: '40px', fontSize: '0.85rem' }}
            value={filters.paymentStatus}
            onChange={e => setFilter('paymentStatus', e.target.value)}
          >
            {paymentStatuses.map(p => (
              <option key={p} value={p}>{p === 'all' ? 'All Payment Statuses' : format(p)}</option>
            ))}
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
                  <button className="table-sort" onClick={() => changeSort('subscriptionNumber')}>Subscription & Organization</button>
                </th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Plan Tier</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Billing Cycle & Rate</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                  <button className="table-sort" onClick={() => changeSort('expirationDate')}>Contract Validity</button>
                </th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Payment Status</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Status</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(sub => {
                const subscriber = getSubscriber(sub);
                const plan = getPlanInfo(sub);
                const daysRemaining = mockSubscriptionService.getDaysRemaining(sub);
                const isMax = sub.priceSnapshot?.planName?.toLowerCase().includes('max') || sub.planId.toLowerCase().includes('max');
                const isPlus = sub.priceSnapshot?.planName?.toLowerCase().includes('plus') || sub.planId.toLowerCase().includes('plus');

                return (
                  <tr key={sub.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    {/* SUBSCRIPTION & SUBSCRIBER */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '10px',
                          background: isMax ? 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)' : isPlus ? 'linear-gradient(135deg, #2563eb 0%, #0284c7 100%)' : '#475569',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          flexShrink: 0
                        }}>
                          AD
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>
                            {subscriber?.businessName || 'Subscribed Clinic'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.1rem' }}>
                            Owner: <strong style={{ color: '#1e293b' }}>{subscriber?.primaryClinicName || subscriber?.businessName || 'N/A'}</strong> ({subscriber?.email || 'N/A'})
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace', marginTop: '0.15rem' }}>
                            {sub.subscriptionNumber}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* PLAN TIER */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '0.25rem 0.65rem',
                        borderRadius: '6px',
                        backgroundColor: isMax ? '#f5f3ff' : isPlus ? '#eff6ff' : '#f1f5f9',
                        color: isMax ? '#6d28d9' : isPlus ? '#1d4ed8' : '#334155',
                        border: isMax ? '1px solid #ddd6fe' : isPlus ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                        fontWeight: 700,
                        fontSize: '0.8rem'
                      }}>
                        {isMax && <Sparkles size={13} />}
                        {plan?.name || sub.planId} Plan
                      </span>
                    </td>

                    {/* BILLING CYCLE & RATE */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>
                          {formatMoney(sub.priceSnapshot.monthlyPrice || 7990)} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b' }}>/ mo</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                          {format(sub.billingCycle)} cycle ({formatMoney(sub.priceSnapshot.appliedAmount || 86292)})
                        </div>
                      </div>
                    </td>

                    {/* VALIDITY & COUNTDOWN */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ fontSize: '0.8rem', color: '#334155', fontWeight: 600 }}>
                          {sub.startDate} → {sub.expirationDate}
                        </div>
                        <div>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.7rem',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '6px',
                            backgroundColor: daysRemaining > 30 ? '#ecfdf5' : daysRemaining > 0 ? '#fffbeb' : '#fef2f2',
                            color: daysRemaining > 30 ? '#15803d' : daysRemaining > 0 ? '#b45309' : '#b91c1c',
                            fontWeight: 700
                          }}>
                            <Clock size={11} /> {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Expired'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* PAYMENT STATUS */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: sub.paymentStatus === 'paid' ? '#ecfdf5' : '#fffbeb',
                        color: sub.paymentStatus === 'paid' ? '#166534' : '#b45309',
                        border: sub.paymentStatus === 'paid' ? '1px solid #bbf7d0' : '1px solid #fde68a'
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: sub.paymentStatus === 'paid' ? '#16a34a' : '#f59e0b' }} />
                        {sub.paymentStatus === 'paid' ? 'Paid (GCash)' : format(sub.paymentStatus)}
                      </span>
                    </td>

                    {/* LIFECYCLE STATUS */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: sub.status === 'active' ? '#ecfdf5' : '#fef2f2',
                        color: sub.status === 'active' ? '#166534' : '#991b1b',
                        border: sub.status === 'active' ? '1px solid #bbf7d0' : '1px solid #e2e8f0'
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: sub.status === 'active' ? '#16a34a' : '#ef4444' }} />
                        {sub.status.toUpperCase()}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      {renderActions(sub)}
                    </td>
                  </tr>
                );
              })}

              {paged.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                    <CreditCard size={36} style={{ margin: '0 auto 0.75rem auto', opacity: 0.4 }} />
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#475569' }}>No subscriptions match the current criteria</div>
                    <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Try clearing filters or search keywords.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* PAGINATION */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderTop: '1px solid #f1f5f9', backgroundColor: '#f8fafc', fontSize: '0.85rem', color: '#64748b' }}>
            <div>Showing <strong>{paged.length}</strong> of <strong>{displayed.length}</strong> subscriptions</div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                disabled={page === 1}
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: page === 1 ? '#f8fafc' : '#ffffff',
                  color: page === 1 ? '#cbd5e1' : '#334155',
                  cursor: page === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                Previous
              </button>
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Page {page} of {pageCount}</span>
              <button
                disabled={page === pageCount}
                onClick={() => setPage(prev => Math.min(pageCount, prev + 1))}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: page === pageCount ? '#f8fafc' : '#ffffff',
                  color: page === pageCount ? '#cbd5e1' : '#334155',
                  cursor: page === pageCount ? 'not-allowed' : 'pointer'
                }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* CARDS GRID VIEW */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {paged.map(sub => {
            const subscriber = getSubscriber(sub);
            const plan = getPlanInfo(sub);
            const daysRemaining = mockSubscriptionService.getDaysRemaining(sub);

            return (
              <div
                key={sub.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  padding: '1.25rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '1rem',
                        flexShrink: 0
                      }}>
                        AD
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                          {subscriber?.businessName || 'Subscribed Clinic'}
                        </h3>
                        <span style={{ fontSize: '0.75rem', color: '#6d28d9', fontWeight: 700 }}>
                          {plan?.name || sub.planId} Enterprise Plan
                        </span>
                      </div>
                    </div>
                    <span style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: '12px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      backgroundColor: sub.status === 'active' ? '#ecfdf5' : '#f8fafc',
                      color: sub.status === 'active' ? '#166534' : '#475569'
                    }}>
                      {format(sub.status)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem', color: '#475569', backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '10px' }}>
                    <div>
                      <strong style={{ color: '#0f172a' }}>Owner:</strong> {subscriber?.primaryClinicName || subscriber?.businessName || 'N/A'} ({subscriber?.email || 'N/A'})
                    </div>
                    <div>
                      <strong style={{ color: '#0f172a' }}>Rate:</strong> {formatMoney(sub.priceSnapshot.monthlyPrice || 7990)} / mo ({format(sub.billingCycle)})
                    </div>
                    <div>
                      <strong style={{ color: '#0f172a' }}>Validity:</strong> {sub.startDate} to {sub.expirationDate} ({daysRemaining} days left)
                    </div>
                    <div>
                      <strong style={{ color: '#0f172a' }}>Payment:</strong> {sub.paymentStatus === 'paid' ? 'Paid (GCash Verified)' : format(sub.paymentStatus)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace' }}>{sub.subscriptionNumber}</span>
                  {renderActions(sub)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ACTION MODALS */}
      <SubscriptionActionDialog
        open={Boolean(action && selectedSubscription)}
        action={action}
        subscription={selectedSubscription}
        onClose={() => { setAction(null); setSelectedSubscription(null); }}
        onSubmit={submitAction}
      />

      {/* DELETE CONFIRMATION DIALOG */}
      {deleteTarget && (
        <ConfirmationDialog
          open={Boolean(deleteTarget)}
          title={`Delete ${deleteTarget.subscriptionNumber} Permanently?`}
          description={`Are you sure you want to permanently delete subscription contract ${deleteTarget.subscriptionNumber}? This action will permanently remove it from the platform ledger.`}
          confirmLabel="Delete Permanently"
          destructive={true}
          onConfirm={runDeleteSubscription}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </main>
  );
}
