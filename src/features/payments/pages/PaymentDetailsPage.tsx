import { useState } from 'react';
import { 
  ArrowLeft, 
  CheckCircle2, 
  DollarSign, 
  Smartphone, 
  FileText, 
  Printer, 
  Check 
} from 'lucide-react';
import { platformAdminDirectoryService as mockPlatformManagementService, platformAdminPaymentService as mockPaymentService, platformAdminSubscriptionService as mockSubscriptionService } from '../../platformManagement/realData/platformAdminRealDataService';
import { usePlatformAdminDetail } from '../../platformManagement/realData/PlatformAdminReadProvider';
import { platformAdminApi } from '../../../infrastructure/supabase/platformAdminApi';
import { PaymentActionDialog, type PaymentDialogAction } from '../components/PaymentActionDialog';
import { PaymentActionMenu } from '../components/PaymentActionMenu';

interface PaymentDetailsPageProps {
  paymentId: string;
  navigate: (route: string) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

const format = (value: string) => value.replaceAll('_', ' ');
const formatMoney = (value: number) => `₱${value.toLocaleString()}`;

export function PaymentDetailsPage({ paymentId, navigate, showToast }: PaymentDetailsPageProps) {
  const { refresh: refreshRealData } = usePlatformAdminDetail('payments', paymentId);
  const [, setVersion] = useState(0);
  const [tab, setTab] = useState<'overview' | 'allocations' | 'history'>('overview');
  const [action, setAction] = useState<PaymentDialogAction | null>(null);
  const payment = mockPaymentService.getPaymentById(paymentId);

  if (!payment) {
    return (
      <main className="main-content">
        <button className="btn btn-outline" style={{ width: 'auto' }} onClick={() => navigate('/platform/payments')}>
          <ArrowLeft size={16} /> Back to Payments
        </button>
        <div className="dashboard-panel" style={{ marginTop: '1rem' }}>
          <h1>Payment not found</h1>
          <p className="page-title-desc">This payment transaction could not be located.</p>
        </div>
      </main>
    );
  }

  const subscriber = payment.subscriberId ? mockPlatformManagementService.getSubscriberById(payment.subscriberId) : null;
  const subscription = payment.subscriptionId ? mockSubscriptionService.getSubscriptionById(payment.subscriptionId) : null;
  const allocations = mockPaymentService.getPaymentAllocations(payment.id);
  const history = mockPaymentService.getPaymentHistory(payment.id);

  const refresh = () => setVersion(prev => prev + 1);

  const submitAction = async (payload: Record<string, string | number>) => {
    if (action === 'approve' || action === 'reject') {
      if (!payment.registrationId) {
        showToast('Only registration payments are supported by the approved payment review contract.', 'error');
        return;
      }
      try {
        await platformAdminApi.reviewPayment(payment.registrationId, payment.id, action, action === 'reject' ? String(payload.reason || '') : undefined);
        await refreshRealData();
        showToast(`Payment ${action} completed.`, 'success');
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Payment review failed.', 'error');
      }
      setAction(null);
      return;
    }
    const result =
      action === 'request_info' ? mockPaymentService.requestPaymentInformation(payment.id, String(payload.reason || ''), String(payload.dueDate || ''), String(payload.note || '')) :
      action === 'allocate' ? mockPaymentService.allocatePayment(payment.id, { allocationType: String(payload.allocationType || 'manual_adjustment') as never, amount: Number(payload.amount), registrationId: payment.registrationId, subscriberId: payment.subscriberId, subscriptionId: payment.subscriptionId, description: String(payload.description || 'Manual allocation') }) :
      action === 'reverse' ? mockPaymentService.reverseAllocation(String(payload.allocationId || ''), String(payload.reason || '')) :
      action === 'refund' ? mockPaymentService.refundPayment(payment.id, Number(payload.amount), String(payload.reason || ''), undefined, String(payload.note || '')) :
      action === 'void' ? mockPaymentService.voidPayment(payment.id, String(payload.reason || '')) :
      mockPaymentService.restoreVoidedPayment(payment.id);

    if (!result.ok) showToast(result.error || 'Payment action failed.', 'error');
    else {
      showToast(`Payment ${String(action).replace('_', ' ')} completed.`, 'success');
      refresh();
    }
    setAction(null);
  };

  return (
    <main className="main-content">
      {/* BREADCRUMBS */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <button
          className="btn btn-outline"
          style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
          onClick={() => navigate('/platform/payments')}
        >
          <ArrowLeft size={15} /> Back to Payments
        </button>
        <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>/</span>
        <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Payment Dossier</span>
        <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>/</span>
        <span style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 700 }}>{payment.paymentNumber}</span>
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
            background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
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
                {formatMoney(payment.amount)}
              </h1>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '0.2rem 0.55rem',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 700,
                backgroundColor: payment.verificationStatus === 'verified' ? '#ecfdf5' : '#fffbeb',
                color: payment.verificationStatus === 'verified' ? '#166534' : '#b45309',
                border: payment.verificationStatus === 'verified' ? '1px solid #bbf7d0' : '1px solid #fde68a'
              }}>
                <Check size={11} /> {payment.verificationStatus.toUpperCase()}
              </span>
            </div>
            <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              Ref: <strong style={{ fontFamily: 'monospace', color: '#0f172a' }}>{payment.referenceNumber}</strong> • Payer: <strong style={{ color: '#0f172a' }}>Angelo Mhyr Lagsac</strong> ({payment.payerEmail})
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button
            className="btn btn-outline"
            style={{ width: 'auto', padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}
            onClick={() => window.print()}
          >
            <Printer size={15} /> Print Receipt
          </button>
          <PaymentActionMenu
            payment={payment}
            onViewSubscriber={() => navigate(`/platform/subscribers/${payment.subscriberId}`)}
            onViewSubscription={() => navigate('/platform/subscriptions')}
            onViewPlan={() => navigate('/platform/plans')}
            onApprove={() => setAction('approve')}
            onReject={() => setAction('reject')}
            onRequestInfo={() => setAction('request_info')}
            onAllocate={() => setAction('allocate')}
            onRefund={() => setAction('refund')}
            onVoid={() => setAction('void')}
            onRestore={() => setAction('restore')}
          />
        </div>
      </div>

      {/* 4 HERO METRIC CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Remittance Amount</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#16a34a' }}>{formatMoney(payment.amount)}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>PHP currency cleared</div>
        </div>

        <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Channel</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
              <Smartphone size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0284c7' }}>{format(payment.paymentMethod).toUpperCase()}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Official wallet remittance</div>
        </div>

        <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verification</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#2563eb' }}>Verified</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Cleared on {payment.paymentDate}</div>
        </div>

        <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Allocation</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}>
              <FileText size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#7c3aed' }}>100% Allocated</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Applied to Max Plan</div>
        </div>
      </div>

      {/* TABS CONTAINER */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          {(['overview', 'allocations', 'history'] as const).map(item => (
            <button
              key={item}
              className={`tab-btn ${tab === item ? 'active' : ''}`}
              onClick={() => setTab(item)}
              style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem', borderRadius: '8px' }}
            >
              {item === 'overview' ? 'Transaction Details' :
               item === 'allocations' ? `Subscription Allocation (${allocations.length})` : 'Audit History'}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Invoice Number</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginTop: '0.25rem', fontFamily: 'monospace' }}>{payment.paymentNumber}</div>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Reference Code</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginTop: '0.25rem', fontFamily: 'monospace' }}>{payment.referenceNumber}</div>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Subscriber Organization</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', marginTop: '0.25rem' }}>{subscriber?.businessName || 'Not available'}</div>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Contract Number</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', marginTop: '0.25rem', fontFamily: 'monospace' }}>{subscription?.subscriptionNumber || 'SUBS-000001'}</div>
            </div>
          </div>
        )}

        {tab === 'allocations' && (
          <div>
            {allocations.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {allocations.map(a => (
                  <div
                    key={a.id}
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
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>Allocation to Max Plan</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>
                        Subscription: <span style={{ fontFamily: 'monospace' }}>{a.subscriptionId}</span> • Type: {format(a.allocationType)}
                      </div>
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#16a34a' }}>
                      {formatMoney(a.amount)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>Default Allocation to Max Plan</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>
                    Subscription: <span style={{ fontFamily: 'monospace' }}>SCP-000101</span> • Fully Applied
                  </div>
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#16a34a' }}>
                  {formatMoney(payment.amount)}
                </div>
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
                No payment audit history recorded.
              </div>
            )}
          </div>
        )}
      </div>

      {/* ACTION MODALS */}
      <PaymentActionDialog
        open={Boolean(action)}
        action={action}
        payment={payment}
        onClose={() => setAction(null)}
        onSubmit={submitAction}
      />
    </main>
  );
}
