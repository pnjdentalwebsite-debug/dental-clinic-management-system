import { useState } from 'react';
import { 
  ArrowLeft, 
  CheckCircle2, 
  CreditCard, 
  Clock, 
  Sparkles, 
  DollarSign
} from 'lucide-react';
import { platformAdminSubscriptionService as mockSubscriptionService } from '../../platformManagement/realData/platformAdminRealDataService';
import { usePlatformAdminDetail } from '../../platformManagement/realData/PlatformAdminReadProvider';
import type { Subscription } from '../types';
import { SubscriptionActionMenu } from '../components/SubscriptionActionMenu';
import { SubscriptionActionDialog, type SubscriptionDialogAction } from '../components/SubscriptionActionDialog';

interface SubscriptionDetailsPageProps {
  subscriptionId: string;
  navigate: (route: string) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

const format = (value: string) => value.replaceAll('_', ' ');
const formatMoney = (value: number) => value > 0 ? `₱${value.toLocaleString()}` : 'Free';

export function SubscriptionDetailsPage({ subscriptionId, navigate, showToast }: SubscriptionDetailsPageProps) {
  usePlatformAdminDetail('subscriptions', subscriptionId);
  const [, setVersion] = useState(0);
  const [tab, setTab] = useState<'overview' | 'financial' | 'payments' | 'history'>('overview');
  const [action, setAction] = useState<SubscriptionDialogAction | null>(null);
  const subscription = mockSubscriptionService.getSubscriptionById(subscriptionId);

  if (!subscription) {
    return (
      <main className="main-content">
        <button className="btn btn-outline" style={{ width: 'auto' }} onClick={() => navigate('/platform/subscriptions')}><ArrowLeft size={16} /> Back to Subscriptions</button>
        <div className="dashboard-panel" style={{ marginTop: '1rem' }}>
          <h1>Subscription not found</h1>
          <p className="page-title-desc">This subscription record could not be located.</p>
        </div>
      </main>
    );
  }

  const subscriberName = subscription.subscriberName || 'Not available';
  const payments = subscription.sourcePayment ? [subscription.sourcePayment] : [];
  const history = mockSubscriptionService.getSubscriptionHistory(subscription.id);
  const daysRemaining = mockSubscriptionService.getDaysRemaining(subscription);

  const refresh = () => setVersion(prev => prev + 1);

  const submitAction = (payload: Record<string, string | boolean>) => {
    const result =
      action === 'renew' ? mockSubscriptionService.renewSubscription(subscription.id, String(payload.billingCycle) as Subscription['billingCycle'], String(payload.newExpirationDate), String(payload.planId || ''), String(payload.paymentStatus) as Subscription['paymentStatus'], String(payload.note || '')) :
      action === 'change_plan' ? mockSubscriptionService.changeSubscriptionPlan(subscription.id, String(payload.planId || ''), String(payload.note || '')) :
      action === 'extend' ? mockSubscriptionService.extendExpiration(subscription.id, String(payload.newExpirationDate), String(payload.reason || ''), String(payload.note || '')) :
      action === 'suspend' ? mockSubscriptionService.suspendSubscription(subscription.id, String(payload.reason || ''), String(payload.note || '')) :
      action === 'reactivate' ? mockSubscriptionService.reactivateSubscription(subscription.id) :
      action === 'restore' ? mockSubscriptionService.restoreSubscription(subscription.id, String(payload.planId || '')) :
      mockSubscriptionService.cancelSubscription(subscription.id, String(payload.reason || ''), String(payload.note || ''));

    if (!result.ok) showToast(result.error || 'Subscription action failed.', 'error');
    else {
      showToast(`Subscription ${String(action).replace('_', ' ')} completed.`, 'success');
      refresh();
    }
    setAction(null);
  };

  const isMax = subscription.priceSnapshot?.planName?.toLowerCase().includes('max') || subscription.planId.toLowerCase().includes('max');

  return (
    <main className="main-content">
      {/* BREADCRUMBS */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <button
          className="btn btn-outline"
          style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
          onClick={() => navigate('/platform/subscriptions')}
        >
          <ArrowLeft size={15} /> Back to Subscriptions
        </button>
        <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>/</span>
        <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Contract Dossier</span>
        <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>/</span>
        <span style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 700 }}>{subscription.subscriptionNumber}</span>
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
            background: isMax ? 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)' : 'linear-gradient(135deg, #2563eb 0%, #0284c7 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '1.25rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            AD
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
                {subscriberName}
              </h1>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '0.2rem 0.55rem',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 700,
                backgroundColor: subscription.status === 'active' ? '#ecfdf5' : '#fef2f2',
                color: subscription.status === 'active' ? '#166534' : '#991b1b',
                border: subscription.status === 'active' ? '1px solid #bbf7d0' : '1px solid #e2e8f0'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: subscription.status === 'active' ? '#16a34a' : '#ef4444' }} />
                {subscription.status.toUpperCase()}
              </span>
            </div>
            <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              Contract ID: <strong style={{ fontFamily: 'monospace', color: '#0f172a' }}>{subscription.subscriptionNumber}</strong> • Primary Owner: <strong style={{ color: '#0f172a' }}>{subscription.ownerDisplayName || 'Owner identity unavailable'}</strong> ({subscription.ownerEmail || subscription.subscriberEmail || 'Email unavailable'})
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button
            className="btn btn-outline"
            style={{ width: 'auto', padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}
            onClick={() => setAction('change_plan')}
          >
            Change Plan
          </button>
          <button
            className="btn btn-primary"
            style={{ width: 'auto', padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}
            onClick={() => setAction('renew')}
          >
            Renew Contract
          </button>
          <SubscriptionActionMenu
            subscription={subscription}
            onViewSubscriber={() => navigate(`/platform/subscribers/${encodeURIComponent(subscription.subscriberId)}`)}
            onViewPlan={() => navigate('/platform/plans')}
            onViewPayments={() => navigate('/platform/payments')}
            onRenew={() => setAction('renew')}
            onChangePlan={() => setAction('change_plan')}
            onExtend={() => setAction('extend')}
            onSuspend={() => setAction('suspend')}
            onReactivate={() => setAction('reactivate')}
            onRestore={() => setAction('restore')}
            onCancel={() => setAction('cancel')}
          />
        </div>
      </div>

      {/* 4 HERO METRIC CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Plan Tier</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}>
              <Sparkles size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#7c3aed' }}>{subscription.priceSnapshot.planName || subscription.planId}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Enterprise multi-branch plan</div>
        </div>

        <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Billing Rate</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981' }}>
            {formatMoney(subscription.priceSnapshot.monthlyPrice)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Per month ({format(subscription.billingCycle)})</div>
        </div>

        <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Days Remaining</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#2563eb' }}>{daysRemaining} Days</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Expires {subscription.expirationDate}</div>
        </div>

        <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Status</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#16a34a' }}>
            {subscription.paymentStatus === 'paid' ? 'Paid' : format(subscription.paymentStatus)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>GCash Official Reference Verified</div>
        </div>
      </div>

      {/* TABS CONTAINER */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          {(['overview', 'financial', 'payments', 'history'] as const).map(item => (
            <button
              key={item}
              className={`tab-btn ${tab === item ? 'active' : ''}`}
              onClick={() => setTab(item)}
              style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem', borderRadius: '8px' }}
            >
              {item === 'overview' ? 'Contract Overview' :
               item === 'financial' ? 'Billing Terms' :
               item === 'payments' ? `Invoices & Payments (${payments.length})` : 'Audit History'}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Subscription Code</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginTop: '0.25rem', fontFamily: 'monospace' }}>{subscription.subscriptionNumber}</div>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Billing Period</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', marginTop: '0.25rem' }}>{subscription.startDate} to {subscription.expirationDate}</div>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Auto-Renewal</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#16a34a', marginTop: '0.25rem' }}>
                {subscription.autoRenew ? 'Enabled (Automatic Extension)' : 'Disabled'}
              </div>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Created Date</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', marginTop: '0.25rem' }}>{subscription.createdAt}</div>
            </div>
          </div>
        )}

        {tab === 'financial' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Monthly Billing Base</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>{formatMoney(subscription.priceSnapshot.monthlyPrice)}</div>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Applied Contract Amount</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#16a34a', marginTop: '0.25rem' }}>{formatMoney(subscription.priceSnapshot.appliedAmount)}</div>
            </div>
          </div>
        )}

        {tab === 'payments' && (
          <div>
            {payments.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {payments.map(p => (
                  <div
                    key={p.id}
                    style={{
                      padding: '1rem 1.25rem',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#ffffff',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.75rem'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>Invoice {p.id}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>
                        Method: <strong style={{ color: '#1e293b' }}>{format(p.paymentMethod)}</strong> • Ref: <span style={{ fontFamily: 'monospace' }}>{p.referenceNumber}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>{formatMoney(p.amount)}</div>
                        <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700 }}>● {p.status.toUpperCase()}</span>
                      </div>
                      <button
                        className="btn btn-outline"
                        style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                        onClick={() => navigate(`/platform/payments/${p.id}`)}
                      >
                        View Receipt
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
                <CreditCard size={32} style={{ margin: '0 auto 0.5rem auto', opacity: 0.4 }} />
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#475569' }}>No payment records linked</div>
              </div>
            )}
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
                No subscription audit history recorded.
              </div>
            )}
          </div>
        )}
      </div>

      {/* ACTION MODAL */}
      <SubscriptionActionDialog
        open={Boolean(action)}
        action={action}
        subscription={subscription}
        onClose={() => setAction(null)}
        onSubmit={submitAction}
      />
    </main>
  );
}
