import { useMemo, useState } from 'react';
import { 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Search,
  RefreshCw,
  Smartphone,
  FileText,
  Printer,
  X,
  Check
} from 'lucide-react';
import { mockPlatformManagementService } from '../../platformManagement/services/mockPlatformManagementService';
import { mockPlanService } from '../../plans/services/mockPlanService';
import { mockPaymentService } from '../services/mockPaymentService';
import { ConfirmationDialog } from '../../../components/overlays/ConfirmationDialog';
import { PlatformPageHeader } from '../../../components/PlatformShared';
import type { Payment, PaymentFilters, PaymentSort } from '../types';
import { PaymentActionMenu } from '../components/PaymentActionMenu';
import { PaymentActionDialog, type PaymentDialogAction } from '../components/PaymentActionDialog';

interface PaymentsPageProps {
  navigate: (route: string) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  onShowProvisionModal?: (data: {
    clinicName: string;
    ownerName: string;
    ownerEmail: string;
    plan: string;
    tempPassword?: string;
    subscriberId?: string;
  }) => void;
}

const PAGE_SIZE = 8;
const tabs = ['all', 'pending_verification', 'approved', 'fully_allocated', 'rejected', 'refunded', 'voided'] as const;
const methods = ['all', 'gcash', 'maya', 'bank_transfer', 'over_the_counter', 'cash', 'card', 'demo_payment', 'other'];
const format = (value: string) => value.replaceAll('_', ' ');
const formatMoney = (value: number) => `₱${value.toLocaleString()}`;

export function PaymentsPage({ navigate, showToast, onShowProvisionModal }: PaymentsPageProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [action, setAction] = useState<PaymentDialogAction | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Payment | null>(null);
  const [sort, setSort] = useState<PaymentSort>({ field: 'paymentDate', direction: 'desc' });
  const [filters, setFilters] = useState<PaymentFilters>({
    search: '',
    subscriberId: 'all',
    registrationId: 'all',
    subscriptionId: 'all',
    planId: 'all',
    paymentMethod: 'all',
    status: 'all',
    verificationStatus: 'all',
    allocationStatus: 'all',
    paymentDate: '',
    submittedDate: '',
    minAmount: '',
    maxAmount: '',
    tab: 'all'
  });

  const payments = useMemo(() => mockPaymentService.listPayments(), [refreshKey]);
  const subscribers = useMemo(() => mockPlatformManagementService.listSubscribers(), [refreshKey]);
  const registrations = useMemo(() => mockPlatformManagementService.listRegistrations(), [refreshKey]);
  const plans = useMemo(() => mockPlanService.listPlans(), [refreshKey]);
  const summary = useMemo(() => mockPaymentService.getPaymentSummary(), [refreshKey]);
  const displayed = useMemo(() => mockPaymentService.sortPayments(mockPaymentService.filterPayments(payments, filters), sort), [payments, filters, sort]);
  const pageCount = Math.max(1, Math.ceil(displayed.length / PAGE_SIZE));
  const paged = mockPaymentService.paginatePayments(displayed, page, PAGE_SIZE);

  const refresh = () => {
    setRefreshKey(prev => prev + 1);
    showToast('Payment ledger refreshed.', 'info');
  };

  const setFilter = (key: keyof PaymentFilters, value: string) => {
    setPage(1);
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const changeSort = (field: PaymentSort['field']) => {
    setSort(prev => ({ field, direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc' }));
  };

  const getSubscriber = (id?: string) => subscribers.find(item => item.id === id || item.subscriberNumber === id) || null;
  const getRegistration = (id?: string) => registrations.find(item => item.id === id) || null;
  const getPlan = (id?: string) => plans.find((p: any) => p.id === id || p.name === id || p.planCode === id) || null;

  const getInitials = (name?: string) => {
    if (!name) return 'DC';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const openAction = (payment: Payment, nextAction: PaymentDialogAction) => {
    setSelectedPayment(payment);
    setAction(nextAction);
  };

  const submitAction = (payload: Record<string, string | number>) => {
    if (!selectedPayment || !action) return;
    const result =
      action === 'approve' ? mockPaymentService.approvePayment(selectedPayment.id) :
      action === 'reject' ? mockPaymentService.rejectPayment(selectedPayment.id, String(payload.reason || ''), String(payload.note || '')) :
      action === 'request_info' ? mockPaymentService.requestPaymentInformation(selectedPayment.id, String(payload.reason || ''), String(payload.dueDate || ''), String(payload.note || '')) :
      action === 'allocate' ? mockPaymentService.allocatePayment(selectedPayment.id, { allocationType: String(payload.allocationType || 'manual_adjustment') as never, amount: Number(payload.amount), registrationId: selectedPayment.registrationId, subscriberId: selectedPayment.subscriberId, subscriptionId: selectedPayment.subscriptionId, description: String(payload.description || 'Manual allocation') }) :
      action === 'reverse' ? mockPaymentService.reverseAllocation(String(payload.allocationId || ''), String(payload.reason || '')) :
      action === 'refund' ? mockPaymentService.refundPayment(selectedPayment.id, Number(payload.amount), String(payload.reason || ''), undefined, String(payload.note || '')) :
      action === 'void' ? mockPaymentService.voidPayment(selectedPayment.id, String(payload.reason || '')) :
      mockPaymentService.restoreVoidedPayment(selectedPayment.id);

    if (!result.ok) {
      showToast(result.error || 'Payment action failed.', 'error');
    } else {
      showToast(`Payment ${action.replace('_', ' ')} completed.`, 'success');
      refresh();
      if (action === 'approve' && onShowProvisionModal && selectedPayment) {
        const reg = mockPlatformManagementService.listRegistrations().find(r => r.id === selectedPayment.registrationId);
        const sub = mockPlatformManagementService.listSubscribers().find(s => s.registrationId === selectedPayment.registrationId || s.id === selectedPayment.subscriberId);
        onShowProvisionModal({
          clinicName: reg?.clinicName || selectedPayment.payerName,
          ownerName: reg?.ownerName || selectedPayment.payerName,
          ownerEmail: reg?.ownerEmail || selectedPayment.payerEmail,
          plan: reg?.plan || 'Plus',
          tempPassword: reg?.tempPassword || (mockPlatformManagementService.listUsers().find(u => u.email.toLowerCase() === (reg?.ownerEmail || selectedPayment.payerEmail).toLowerCase()) as any)?.tempPassword || '',
          subscriberId: sub?.id
        });
      }
    }
    setAction(null);
    setSelectedPayment(null);
  };

  const renderActions = (payment: Payment) => (
    <PaymentActionMenu
      payment={payment}
      onView={() => navigate(`/platform/payments/${encodeURIComponent(payment.id)}`)}
      onViewSubscriber={() => navigate(`/platform/subscribers/${encodeURIComponent(payment.subscriberId || '')}`)}
      onViewSubscription={() => navigate(`/platform/subscriptions`)}
      onViewPlan={() => navigate('/platform/plans')}
      onApprove={() => openAction(payment, 'approve')}
      onReject={() => openAction(payment, 'reject')}
      onRequestInfo={() => openAction(payment, 'request_info')}
      onAllocate={() => openAction(payment, 'allocate')}
      onRefund={() => openAction(payment, 'refund')}
      onVoid={() => openAction(payment, 'void')}
      onRestore={() => openAction(payment, 'restore')}
      onDelete={() => setDeleteTarget(payment)}
    />
  );

  const runDeletePayment = () => {
    if (!deleteTarget) return;
    const result = mockPaymentService.permanentlyDeletePayment(deleteTarget.id);
    if (!result.ok) {
      showToast(result.error || 'Failed to delete payment.', 'error');
    } else {
      showToast(`Payment ${deleteTarget.paymentNumber} was permanently deleted.`, 'success');
      refresh();
    }
    setDeleteTarget(null);
  };

  return (
    <main className="main-content">
      {/* HEADER */}
      <PlatformPageHeader
        title="Payments & Receipts"
        subtitle="Verify incoming clinic payments, view official GCash receipts, and track payment status."
        breadcrumbs={['Platform', 'Plans & Billing', 'Payments & Receipts']}
        secondaryAction={{
          label: 'Refresh Payments',
          icon: RefreshCw,
          onClick: refresh
        }}
      />

      {/* 4 HERO KPI STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Collected</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#16a34a' }}>{formatMoney(summary.collectedAmount)}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Verified cleared remittances</div>
        </div>

        <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verified & Cleared</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#2563eb' }}>{summary.approved}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Completed remittances</div>
        </div>

        <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Review</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ea580c' }}>{summary.pendingVerification}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Awaiting verification</div>
        </div>

        <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Primary Channel</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
              <Smartphone size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0284c7' }}>GCash</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Electronic verified wallet</div>
        </div>
      </div>

      {/* FILTER TABS & CONTROLS */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.25rem', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {tabs.map(t => {
              const count = t === 'all'
                ? payments.length
                : t === 'pending_verification'
                  ? payments.filter(p => p.status === 'pending_verification' || p.status === 'submitted' || p.verificationStatus === 'pending').length
                  : payments.filter(p => p.status === t).length;
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
              placeholder="Search by transaction code, reference number, payer, clinic, method..."
              value={filters.search}
              onChange={e => setFilter('search', e.target.value)}
            />
          </div>

          <select
            className="form-input"
            style={{ width: 'auto', minWidth: '160px', height: '40px', fontSize: '0.85rem' }}
            value={filters.paymentMethod}
            onChange={e => setFilter('paymentMethod', e.target.value)}
          >
            {methods.map(m => (
              <option key={m} value={m}>{m === 'all' ? 'All Payment Channels' : format(m).toUpperCase()}</option>
            ))}
          </select>

          <select
            className="form-input"
            style={{ width: 'auto', minWidth: '160px', height: '40px', fontSize: '0.85rem' }}
            value={filters.status}
            onChange={e => setFilter('status', e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved & Verified</option>
            <option value="pending_verification">Pending Verification</option>
            <option value="fully_allocated">Fully Allocated</option>
            <option value="rejected">Rejected</option>
            <option value="refunded">Refunded</option>
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
                  <button className="table-sort" onClick={() => changeSort('paymentNumber')}>Transaction & Organization</button>
                </th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Channel & Reference</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                  <button className="table-sort" onClick={() => changeSort('amount')}>Amount Paid</button>
                </th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                  <button className="table-sort" onClick={() => changeSort('paymentDate')}>Date Cleared</button>
                </th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Verification & Allocation</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Status</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(pay => {
                const subscriber = getSubscriber(pay.subscriberId);
                const registration = getRegistration(pay.registrationId);
                const plan = getPlan(pay.planId || subscriber?.planId || registration?.plan);
                const clinicName = subscriber?.businessName || registration?.clinicName || pay.payerName || 'Dental Clinic';
                const payerName = pay.payerName || registration?.ownerName || subscriber?.email || 'Lead Dentist';
                const initials = getInitials(clinicName);

                return (
                  <tr key={pay.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    {/* TRANSACTION & SUBSCRIBER */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
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
                          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>
                            {clinicName}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.1rem' }}>
                            Payer: <strong style={{ color: '#1e293b' }}>{payerName}</strong> ({pay.payerEmail})
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace', marginTop: '0.15rem' }}>
                            {pay.paymentNumber}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* CHANNEL & REFERENCE */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '6px',
                            backgroundColor: '#e0f2fe',
                            color: '#0369a1',
                            fontWeight: 700,
                            fontSize: '0.75rem'
                          }}>
                            <Smartphone size={12} /> {format(pay.paymentMethod).toUpperCase()}
                          </span>
                          <button
                            onClick={() => setReceiptPayment(pay)}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: '#2563eb',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              fontSize: '0.75rem',
                              fontWeight: 600
                            }}
                          >
                            <FileText size={12} /> e-Receipt
                          </button>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#475569', fontFamily: 'monospace' }}>
                          Ref: {pay.referenceNumber}
                        </div>
                      </div>
                    </td>

                    {/* AMOUNT */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>
                          {formatMoney(pay.amount)}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 600 }}>
                          {pay.currency} Cleared
                        </div>
                      </div>
                    </td>

                    {/* DATE */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontSize: '0.825rem', color: '#334155', fontWeight: 600 }}>
                        {pay.paymentDate}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                        Verified via official ledger
                      </div>
                    </td>

                    {/* VERIFICATION & ALLOCATION */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: pay.verificationStatus === 'verified' ? '#ecfdf5' : '#fffbeb',
                          color: pay.verificationStatus === 'verified' ? '#166534' : '#b45309',
                          width: 'fit-content'
                        }}>
                          <Check size={11} /> {pay.verificationStatus === 'verified' ? 'Verified' : format(pay.verificationStatus)}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#6d28d9', fontWeight: 600 }}>
                          ● {format(pay.allocationStatus)} to {plan?.name || 'Selected Plan'}
                        </span>
                      </div>
                    </td>

                    {/* STATUS */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: pay.status === 'approved' || pay.status === 'fully_allocated' ? '#ecfdf5' : '#fef2f2',
                        color: pay.status === 'approved' || pay.status === 'fully_allocated' ? '#166534' : '#991b1b',
                        border: pay.status === 'approved' || pay.status === 'fully_allocated' ? '1px solid #bbf7d0' : '1px solid #e2e8f0'
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: pay.status === 'approved' || pay.status === 'fully_allocated' ? '#16a34a' : '#ef4444' }} />
                        {pay.status.toUpperCase()}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      {renderActions(pay)}
                    </td>
                  </tr>
                );
              })}

              {paged.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                    <DollarSign size={36} style={{ margin: '0 auto 0.75rem auto', opacity: 0.4 }} />
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#475569' }}>No payments match the current criteria</div>
                    <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Try clearing filters or search keywords.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* PAGINATION */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderTop: '1px solid #f1f5f9', backgroundColor: '#f8fafc', fontSize: '0.85rem', color: '#64748b' }}>
            <div>Showing <strong>{paged.length}</strong> of <strong>{displayed.length}</strong> transactions</div>
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
          {paged.map(pay => {
            const subscriber = getSubscriber(pay.subscriberId);
            const registration = getRegistration(pay.registrationId);
            const plan = getPlan(pay.planId || subscriber?.planId || registration?.plan);
            const clinicName = subscriber?.businessName || registration?.clinicName || pay.payerName || 'Dental Clinic';
            const payerName = pay.payerName || registration?.ownerName || subscriber?.email || 'Lead Dentist';
            const initials = getInitials(clinicName);

            return (
              <div
                key={pay.id}
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
                        background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '1rem',
                        flexShrink: 0
                      }}>
                        {initials}
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                          {clinicName}
                        </h3>
                        <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700 }}>
                          {format(pay.paymentMethod).toUpperCase()} Remittance
                        </span>
                      </div>
                    </div>
                    <span style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: '12px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      backgroundColor: '#ecfdf5',
                      color: '#166534'
                    }}>
                      {format(pay.status)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem', color: '#475569', backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '10px' }}>
                    <div>
                      <strong style={{ color: '#0f172a' }}>Amount:</strong> {formatMoney(pay.amount)} ({pay.currency})
                    </div>
                    <div>
                      <strong style={{ color: '#0f172a' }}>Reference:</strong> <span style={{ fontFamily: 'monospace' }}>{pay.referenceNumber}</span>
                    </div>
                    <div>
                      <strong style={{ color: '#0f172a' }}>Payer:</strong> {payerName} ({pay.payerEmail})
                    </div>
                    <div>
                      <strong style={{ color: '#0f172a' }}>Plan:</strong> {plan?.name || 'Selected Plan'}
                    </div>
                    <div>
                      <strong style={{ color: '#0f172a' }}>Date:</strong> {pay.paymentDate}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                  <button
                    className="btn btn-outline"
                    style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                    onClick={() => setReceiptPayment(pay)}
                  >
                    <FileText size={13} /> View e-Receipt
                  </button>
                  {renderActions(pay)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* OFFICIAL RECEIPT MODAL */}
      {receiptPayment && (() => {
        const receiptSub = getSubscriber(receiptPayment.subscriberId);
        const receiptReg = getRegistration(receiptPayment.registrationId);
        const receiptPlan = getPlan(receiptPayment.planId || receiptSub?.planId || receiptReg?.plan);
        const receiptClinic = receiptSub?.businessName || receiptReg?.clinicName || receiptPayment.payerName || 'Dental Clinic';
        const receiptPayer = receiptPayment.payerName || receiptReg?.ownerName || receiptSub?.email || 'Lead Dentist';

        return (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '1rem'
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              maxWidth: '520px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              animation: 'modalSlideUp 0.2s ease-out'
            }}>
              {/* MODAL HEADER */}
              <div style={{ padding: '1.25rem 1.5rem', backgroundColor: '#0f172a', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <FileText size={20} color="#38bdf8" />
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Official Payment Receipt</h3>
                </div>
                <button
                  onClick={() => setReceiptPayment(null)}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* RECEIPT CONTENT */}
              <div style={{ padding: '1.5rem', fontSize: '0.85rem' }}>
                <div style={{ textAlign: 'center', paddingBottom: '1.25rem', borderBottom: '2px dashed #e2e8f0', marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Platform Billing & Subscription Ledger
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
                    {receiptClinic}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.1rem' }}>
                    Electronic Remittance Proof
                  </div>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginTop: '0.6rem',
                    padding: '0.2rem 0.6rem',
                    backgroundColor: '#ecfdf5',
                    color: '#15803d',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}>
                    <Check size={12} /> VERIFIED OFFICIAL PAYMENT
                  </div>
                </div>

                {/* RECEIPT FIELDS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Receipt Reference:</span>
                    <strong style={{ fontFamily: 'monospace', color: '#0f172a' }}>{receiptPayment.referenceNumber}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Payment Invoice:</span>
                    <strong style={{ fontFamily: 'monospace', color: '#0f172a' }}>{receiptPayment.paymentNumber}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Date & Timestamp:</span>
                    <strong>{receiptPayment.paymentDate} • 10:00 AM PHT</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Payment Channel:</span>
                    <strong style={{ textTransform: 'uppercase', color: '#0284c7' }}>{format(receiptPayment.paymentMethod)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Payer Name:</span>
                    <strong>{receiptPayer}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Payer Email:</span>
                    <span>{receiptPayment.payerEmail}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Applied Plan:</span>
                    <strong style={{ color: '#7c3aed' }}>{receiptPlan?.name || 'Selected Plan'}</strong>
                  </div>
                </div>

                {/* TOTAL BOX */}
                <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: '#334155' }}>Total Amount Paid:</span>
                  <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#16a34a' }}>{formatMoney(receiptPayment.amount)}</span>
                </div>
              </div>

              {/* MODAL FOOTER */}
              <div style={{ padding: '1rem 1.5rem', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  className="btn btn-outline"
                  style={{ width: 'auto', padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}
                  onClick={() => {
                    window.print();
                  }}
                >
                  <Printer size={15} /> Print Receipt
                </button>
                <button
                  className="btn btn-primary"
                  style={{ width: 'auto', padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                  onClick={() => setReceiptPayment(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ACTION MODALS */}
      <PaymentActionDialog
        open={Boolean(action && selectedPayment)}
        action={action}
        payment={selectedPayment}
        onClose={() => { setAction(null); setSelectedPayment(null); }}
        onSubmit={submitAction}
      />

      {/* DELETE CONFIRMATION DIALOG */}
      {deleteTarget && (
        <ConfirmationDialog
          open={Boolean(deleteTarget)}
          title={`Delete ${deleteTarget.paymentNumber} Permanently?`}
          description={`Are you sure you want to permanently delete payment transaction ${deleteTarget.paymentNumber} (Ref: ${deleteTarget.referenceNumber})? This will permanently purge the payment record and its allocations from the platform ledger.`}
          confirmLabel="Delete Permanently"
          destructive={true}
          onConfirm={runDeletePayment}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </main>
  );
}
