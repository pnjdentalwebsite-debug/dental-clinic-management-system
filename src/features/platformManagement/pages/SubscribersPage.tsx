import { useMemo, useState } from 'react';
import {
  ShieldAlert,
  CreditCard,
  Eye,
  FileText,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  RotateCcw,
  SlidersHorizontal,
  XCircle,
  Users,
  CheckCircle2,
  KeyRound,
  DollarSign,
  TrendingUp,
  Search,
  Sparkles,
  Trash2,
  Check
} from 'lucide-react';
import { Modal } from '../../../components/overlays/Modal';
import { RowActionMenu } from '../../../components/overlays/RowActionMenu';
import {
  PlatformPageHeader,
  SectionTabs
} from '../../../components/PlatformShared';
import { mockPlanService } from '../../plans/services/mockPlanService';
import { mockSubscriptionService } from '../../subscriptions/services/mockSubscriptionService';
import { mockPaymentService } from '../../payments/services/mockPaymentService';
import { mockPlatformManagementService } from '../services/mockPlatformManagementService';
import type { SortState, Subscriber, SubscriberFilters } from '../types';

interface SubscribersPageProps {
  navigate: (route: string) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  refreshShell: () => void;
  onShowProvisionModal?: (data: {
    clinicName: string;
    ownerName: string;
    ownerEmail: string;
    plan: string;
    tempPassword?: string;
    subscriberId?: string;
  }) => void;
}

type SubscriberAction = 'suspend' | 'reactivate' | 'deactivate' | 'change_plan' | 'renew' | 'reset_password' | 'delete' | null;

const PAGE_SIZE = 8;

const defaultFilters: SubscriberFilters = {
  search: '',
  plan: 'all',
  paymentStatus: 'all',
  subscriptionStatus: 'all',
  accountStatus: 'all',
  registeredDate: '',
  tab: 'all'
};

const formatStatus = (value: string) => value.replaceAll('_', ' ');

const StatusBadge = ({ status }: { status: string }) => (
  <span className={`status-badge ${mockPlatformManagementService.getStatusBadgeClass(status)}`} style={{ textTransform: 'capitalize', fontWeight: 600, fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '9999px' }}>
    {formatStatus(status)}
  </span>
);

const getSubscriberOwner = (subscriber: Subscriber) => {
  const users = mockPlatformManagementService.getUsersBySubscriberId(subscriber.id);
  return users.find(user => user.role === 'clinic_owner')?.fullName || subscriber.businessName || 'Lead Dentist';
};

const tabOptions = [
  { key: 'all', label: 'All Clinic Accounts' },
  { key: 'active', label: 'Active Accounts' },
  { key: 'pending', label: 'Waiting for Approval' },
  { key: 'suspended', label: 'On Hold / Suspended' },
  { key: 'expired', label: 'Expired Accounts' }
];

export function SubscribersPage({ navigate, showToast, refreshShell, onShowProvisionModal }: SubscribersPageProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [filters, setFilters] = useState<SubscriberFilters>(defaultFilters);
  const [sort, setSort] = useState<SortState>({ field: 'registeredAt', direction: 'desc' });
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedAction, setSelectedAction] = useState<SubscriberAction>(null);
  const [selectedSubscriber, setSelectedSubscriber] = useState<Subscriber | null>(null);
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [plan, setPlan] = useState('Max');
  const [renewalDays, setRenewalDays] = useState(365);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subscribers = useMemo(() => {
    return mockPlatformManagementService.listSubscribers();
  }, [refreshKey]);

  const summary = useMemo(() => {
    return mockPlatformManagementService.getSubscriberSummary();
  }, [refreshKey, subscribers]);

  const registrations = useMemo(() => {
    return mockPlatformManagementService.listRegistrations();
  }, [refreshKey]);

  const displayedSubscribers = useMemo(() => {
    const filtered = mockPlatformManagementService.filterSubscribers(subscribers, filters, registrations);
    return mockPlatformManagementService.sortSubscribers(filtered, sort);
  }, [subscribers, registrations, filters, sort]);

  const pageCount = Math.max(1, Math.ceil(displayedSubscribers.length / PAGE_SIZE));
  const pagedSubscribers = mockPlatformManagementService.paginateSubscribers(displayedSubscribers, page, PAGE_SIZE);

  const pendingRegistrations = registrations.filter(reg => reg.paymentStatus === 'pending_verification' || reg.paymentStatus === 'unpaid');
  const showingRegistrations = filters.tab === 'pending';

  // Calculate MRR from subscribers
  const totalSubscriberMRR = useMemo(() => {
    const plans = mockPlanService.listPlans();
    return subscribers.reduce((sum, s) => {
      if (s.accountStatus !== 'active') return sum;
      const matchedPlan = plans.find(p => p.name.toLowerCase() === s.planId?.toLowerCase() || p.planCode.toLowerCase() === s.planId?.toLowerCase());
      return sum + (matchedPlan?.monthlyPrice ?? 10000);
    }, 0);
  }, [subscribers]);

  const maxPlanCount = useMemo(() => {
    return subscribers.filter(s => s.planId?.toLowerCase() === 'max').length;
  }, [subscribers]);

  const setFilter = (key: keyof SubscriberFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const changeSort = (field: string) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const openAction = (subscriber: Subscriber, action: SubscriberAction) => {
    setSelectedSubscriber(subscriber);
    setSelectedAction(action);
    setReason('');
    setNote('');
    setPlan(subscriber.planId || 'Max');
    setRenewalDays(365);
  };

  const closeAction = () => {
    setSelectedSubscriber(null);
    setSelectedAction(null);
    setReason('');
    setNote('');
    setIsSubmitting(false);
  };

  const completeAction = () => {
    if (!selectedSubscriber || !selectedAction) return;
    if ((selectedAction === 'suspend' || selectedAction === 'deactivate') && !reason.trim()) {
      showToast('Please provide a valid reason before confirming.', 'error');
      return;
    }
    setIsSubmitting(true);

    if (selectedAction === 'reset_password') {
      showToast(`Temporary password generated and dispatched to ${selectedSubscriber.email}.`, 'success');
      refreshShell();
      closeAction();
      return;
    }

    const result =
      selectedAction === 'suspend' ? mockPlatformManagementService.suspendSubscriber(selectedSubscriber.id, reason, note) :
      selectedAction === 'reactivate' ? mockPlatformManagementService.reactivateSubscriber(selectedSubscriber.id) :
      selectedAction === 'deactivate' ? mockPlatformManagementService.deactivateSubscriber(selectedSubscriber.id, reason) :
      selectedAction === 'change_plan' ? mockPlatformManagementService.changeSubscriberPlanMock(selectedSubscriber.id, plan) :
      selectedAction === 'renew' ? mockPlatformManagementService.renewSubscriberMock(selectedSubscriber.id, renewalDays) :
      selectedAction === 'delete' ? mockPlatformManagementService.deleteSubscriber(selectedSubscriber.id) :
      { ok: false, error: 'Unsupported action.' };

    if (result.ok) {
      showToast(selectedAction === 'delete' ? 'Clinic account permanently deleted.' : 'Clinic account updated successfully.', 'success');
      setRefreshKey(k => k + 1);
      refreshShell();
      closeAction();
    } else {
      setIsSubmitting(false);
      showToast(result.error || 'Failed to update subscriber.', 'error');
    }
  };

  const allPlans = mockPlanService.listPlans();
  const activePlans = mockPlanService.getSelectableSubscriberPlans();

  const getDaysRemaining = (expiresAt?: string) => {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const renderActions = (subscriber: Subscriber) => {
    const subscription = mockSubscriptionService.getCurrentSubscriptionBySubscriberId(subscriber.id);
    return (
      <RowActionMenu
        ariaLabel={`Actions for subscriber ${subscriber.subscriberNumber}`}
        items={[
          { id: 'view', label: 'View Clinic Profile', icon: Eye, onSelect: () => navigate(`/platform/subscribers/${subscriber.id}`) },
          { id: 'change-plan', label: 'Change Subscription Plan', icon: SlidersHorizontal, hidden: subscriber.accountStatus === 'deactivated', onSelect: () => openAction(subscriber, 'change_plan') },
          { id: 'renew', label: 'Renew / Extend Validity', icon: RotateCcw, hidden: subscriber.accountStatus === 'deactivated', onSelect: () => openAction(subscriber, 'renew') },
          { id: 'reset-pwd', label: 'Reset Owner Password', icon: KeyRound, onSelect: () => openAction(subscriber, 'reset_password') },
          { id: 'sep-related', separator: true },
          { id: 'subscription', label: 'View Active Plan Details', icon: RefreshCw, onSelect: () => navigate(subscription ? `/platform/subscriptions/${subscription.id}` : '/platform/subscriptions') },
          { id: 'payments', label: 'Payment History & Receipts', icon: CreditCard, onSelect: () => navigate('/platform/payments') },
          { id: 'sep-account', separator: true },
          { id: 'suspend', label: 'Place Account on Hold', icon: PauseCircle, hidden: subscriber.accountStatus !== 'active', destructive: true, onSelect: () => openAction(subscriber, 'suspend') },
          { id: 'reactivate', label: 'Reactivate Account', icon: PlayCircle, hidden: subscriber.accountStatus !== 'suspended', onSelect: () => openAction(subscriber, 'reactivate') },
          { id: 'deactivate', label: 'Deactivate Account', icon: XCircle, hidden: subscriber.accountStatus === 'deactivated', destructive: true, onSelect: () => openAction(subscriber, 'deactivate') },
          { id: 'sep-danger', separator: true },
          { id: 'delete', label: 'Delete Account Permanently', icon: Trash2, destructive: true, onSelect: () => openAction(subscriber, 'delete') }
        ]}
      />
    );
  };

  return (
    <main className="main-content">
      <PlatformPageHeader
        title="Clinic Owners & Accounts"
        subtitle="Manage clinic owners, active plans, registered branches, and account status."
        breadcrumbs={['Platform', 'Clinic Accounts', 'Clinic Owners']}
        secondaryAction={{
          label: 'Refresh Accounts',
          icon: RefreshCw,
          onClick: () => {
            setRefreshKey(k => k + 1);
            refreshShell();
            showToast('Accounts refreshed.', 'info');
          }
        }}
      />

      {/* HERO METRICS BANNER */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Clinic Accounts</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a' }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>{summary.total}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Registered clinic organizations</div>
        </div>

        <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Accounts</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981' }}>{summary.active}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>In good standing & operational</div>
        </div>

        <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Max Plan Tier</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
              <Sparkles size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#2563eb' }}>{maxPlanCount}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Multi-branch enterprise accounts</div>
        </div>

        <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Monthly Plan Revenue</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#fdf4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333ea' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#9333ea' }}>₱{totalSubscriberMRR.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
          <div style={{ fontSize: '0.75rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem', fontWeight: 600 }}>
            <TrendingUp size={12} /> Active clinic billing base
          </div>
        </div>
      </div>

      {/* SUBSCRIBERS DIRECTORY PANEL */}
      <div className="dashboard-panel" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        
        {/* TABS HEADER */}
        <SectionTabs
          tabs={tabOptions.map(t => ({
            key: t.key,
            label: t.label,
            count: t.key === 'pending' ? pendingRegistrations.length :
                   t.key === 'active' ? summary.active : undefined
          }))}
          activeTab={filters.tab}
          onTabChange={key => setFilter('tab', key)}
        />

        {/* SEARCH & FILTERS BAR */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.25rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', flex: 1, minWidth: '280px' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '220px', maxWidth: '400px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '36px', height: '40px', fontSize: '0.875rem', borderRadius: '8px' }}
                placeholder="Search by clinic, owner, email, ID..."
                value={filters.search}
                onChange={e => setFilter('search', e.target.value)}
              />
            </div>

            <select
              className="form-input"
              value={filters.plan}
              onChange={e => setFilter('plan', e.target.value)}
              style={{ height: '40px', fontSize: '0.875rem', width: '140px', borderRadius: '8px' }}
            >
              <option value="all">All Plans</option>
              {allPlans.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>

            <select
              className="form-input"
              value={filters.accountStatus}
              onChange={e => setFilter('accountStatus', e.target.value)}
              style={{ height: '40px', fontSize: '0.875rem', width: '140px', borderRadius: '8px' }}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="deactivated">Deactivated</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="segmented-control" role="group" aria-label="View mode">
              <button className={viewMode === 'table' ? 'active' : ''} style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem' }} onClick={() => setViewMode('table')}>Table View</button>
              <button className={viewMode === 'cards' ? 'active' : ''} style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem' }} onClick={() => setViewMode('cards')}>Card Grid</button>
            </div>
          </div>
        </div>

        {/* CONTENT VIEW */}
        {showingRegistrations ? (
          <div className="table-container" style={{ minHeight: '360px' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Reg ID</th>
                  <th>Clinic Name</th>
                  <th>Applicant Name</th>
                  <th>Email</th>
                  <th>Plan Tier</th>
                  <th>Payment Status</th>
                  <th>Date Submitted</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingRegistrations.map(reg => (
                  <tr key={reg.id}>
                    <td><span style={{ fontWeight: 600, color: '#2563eb' }}>{reg.id}</span></td>
                    <td><strong style={{ color: '#0f172a' }}>{reg.clinicName}</strong></td>
                    <td>{reg.ownerName}</td>
                    <td>{reg.ownerEmail}</td>
                    <td><span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: '#eff6ff', color: '#1d4ed8', fontWeight: 600, fontSize: '0.75rem' }}>{reg.plan}</span></td>
                    <td><StatusBadge status={reg.paymentStatus} /></td>
                    <td>{reg.submittedDate}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-outline"
                          style={{ width: 'auto', padding: '0.25rem 0.65rem', fontSize: '0.75rem', height: 'auto' }}
                          onClick={() => navigate(`/platform/registrations/${reg.id}`)}
                        >
                          <FileText size={14} style={{ marginRight: '4px', display: 'inline-block', verticalAlign: '-2px' }} /> Review
                        </button>
                        <button
                          className="btn btn-primary"
                          style={{ width: 'auto', padding: '0.25rem 0.65rem', fontSize: '0.75rem', height: 'auto' }}
                          onClick={() => {
                            const res = mockPaymentService.approveRegistrationPayment(reg.id);
                            if (res.ok) {
                              showToast(`Approved registration for ${reg.clinicName}. Account provisioned!`, 'success');
                              setRefreshKey(k => k + 1);
                              refreshShell();
                              const approvedReg = mockPlatformManagementService.listRegistrations().find(r => r.id === reg.id) || reg;
                              const sub = mockPlatformManagementService.listSubscribers().find(s => s.registrationId === reg.id || s.email?.toLowerCase() === reg.ownerEmail?.toLowerCase());
                              if (onShowProvisionModal) {
                                onShowProvisionModal({
                                  clinicName: approvedReg.clinicName,
                                  ownerName: approvedReg.ownerName,
                                  ownerEmail: approvedReg.ownerEmail,
                                  plan: approvedReg.plan,
                                  tempPassword: approvedReg.tempPassword || (mockPlatformManagementService.listUsers().find(u => u.email.toLowerCase() === approvedReg.ownerEmail.toLowerCase()) as any)?.tempPassword || '',
                                  subscriberId: sub?.id
                                });
                              }
                            } else {
                              showToast(res.error || 'Failed to approve registration.', 'error');
                            }
                          }}
                        >
                          <Check size={14} style={{ marginRight: '4px', display: 'inline-block', verticalAlign: '-2px' }} /> Approve & Activate
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {pendingRegistrations.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                      <CheckCircle2 size={36} style={{ color: '#10b981', margin: '0 auto 0.5rem', display: 'block' }} />
                      No pending onboarding registrations awaiting verification.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : viewMode === 'table' ? (
          <div className="table-container" style={{ minHeight: '360px' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th><button className="table-sort" onClick={() => changeSort('businessName')}>Subscriber & Clinic</button></th>
                  <th>Primary Owner</th>
                  <th>Contact Info</th>
                  <th><button className="table-sort" onClick={() => changeSort('planId')}>Plan Tier</button></th>
                  <th>Status</th>
                  <th>Facilities</th>
                  <th><button className="table-sort" onClick={() => changeSort('expiresAt')}>Subscription Validity</button></th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedSubscribers.map(subscriber => {
                  const daysLeft = getDaysRemaining(subscriber.expiresAt);
                  const initials = subscriber.businessName
                    ? subscriber.businessName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
                    : 'AD';
                  return (
                    <tr key={subscriber.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            flexShrink: 0
                          }}>
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.875rem' }}>{subscriber.businessName}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>{subscriber.subscriberNumber}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>{getSubscriberOwner(subscriber)}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Clinic Owner</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.825rem', color: '#0f172a' }}>{subscriber.email}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{subscriber.mobileNumber}</div>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '6px',
                          backgroundColor: subscriber.planId === 'Max' ? '#f5f3ff' : subscriber.planId === 'Plus' ? '#eff6ff' : '#f1f5f9',
                          color: subscriber.planId === 'Max' ? '#6d28d9' : subscriber.planId === 'Plus' ? '#1d4ed8' : '#334155',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          border: subscriber.planId === 'Max' ? '1px solid #ddd6fe' : subscriber.planId === 'Plus' ? '1px solid #bfdbfe' : '1px solid #e2e8f0'
                        }}>
                          {subscriber.planId === 'Max' && <Sparkles size={12} />}
                          {subscriber.planId} Plan
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <StatusBadge status={subscriber.accountStatus} />
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                          <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.45rem', backgroundColor: '#f1f5f9', color: '#334155', borderRadius: '4px', fontWeight: 600 }}>
                            {subscriber.clinicCount} {subscriber.clinicCount === 1 ? 'Clinic' : 'Clinics'}
                          </span>
                          <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.45rem', backgroundColor: '#f1f5f9', color: '#334155', borderRadius: '4px', fontWeight: 600 }}>
                            {subscriber.associateCount} {subscriber.associateCount === 1 ? 'Dentist' : 'Dentists'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.825rem', fontWeight: 600, color: '#0f172a' }}>
                          {subscriber.expiresAt || 'Ongoing'}
                        </div>
                        {daysLeft !== null && (
                          <div style={{ fontSize: '0.75rem', color: daysLeft <= 30 ? '#ef4444' : '#16a34a', fontWeight: 600 }}>
                            {daysLeft} days remaining
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {renderActions(subscriber)}
                      </td>
                    </tr>
                  );
                })}
                {pagedSubscribers.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                      No subscriber organizations match the current filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {pagedSubscribers.map(subscriber => {
              const daysLeft = getDaysRemaining(subscriber.expiresAt);
              const initials = subscriber.businessName
                ? subscriber.businessName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
                : 'AD';
              return (
                <article
                  key={subscriber.id}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.9rem'
                        }}>
                          {initials}
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>{subscriber.businessName}</h4>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>{subscriber.subscriberNumber}</span>
                        </div>
                      </div>
                      <StatusBadge status={subscriber.accountStatus} />
                    </div>

                    <div style={{ fontSize: '0.825rem', color: '#475569', marginBottom: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <span style={{ color: '#64748b' }}>Primary Owner:</span>
                        <strong style={{ color: '#0f172a' }}>{getSubscriberOwner(subscriber)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <span style={{ color: '#64748b' }}>Email:</span>
                        <span>{subscriber.email}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <span style={{ color: '#64748b' }}>Entitlement Plan:</span>
                        <strong style={{ color: subscriber.planId === 'Max' ? '#6d28d9' : '#1d4ed8' }}>{subscriber.planId} Plan</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Facilities:</span>
                        <span>{subscriber.clinicCount} Clinics • {subscriber.associateCount} Dentists</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {daysLeft !== null ? `${daysLeft}d validity left` : 'Ongoing'}
                    </span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-outline"
                        style={{ width: 'auto', padding: '0.25rem 0.65rem', fontSize: '0.75rem', height: 'auto' }}
                        onClick={() => navigate(`/platform/subscribers/${subscriber.id}`)}
                      >
                        View Profile
                      </button>
                      {renderActions(subscriber)}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* PAGINATION ROW */}
        {!showingRegistrations && (
          <div className="pagination-row" style={{ marginTop: '1.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Showing {pagedSubscribers.length} of {displayedSubscribers.length} subscribers</span>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button className="btn btn-outline compact-action" disabled={page === 1} onClick={() => setPage(prev => Math.max(1, prev - 1))}>Previous</button>
              <span style={{ margin: '0 0.75rem', fontSize: '0.85rem', fontWeight: 600 }}>Page {page} of {pageCount}</span>
              <button className="btn btn-outline compact-action" disabled={page === pageCount} onClick={() => setPage(prev => Math.min(pageCount, prev + 1))}>Next</button>
            </div>
          </div>
        )}
      </div>

      {/* ACTION MODAL */}
      <Modal
        open={Boolean(selectedAction && selectedSubscriber)}
        title={
          selectedAction === 'delete' ? 'Delete Subscriber Organization' :
          selectedAction === 'suspend' ? 'Suspend Subscriber Organization' :
          selectedAction === 'reactivate' ? 'Reactivate Subscriber Organization' :
          selectedAction === 'deactivate' ? 'Deactivate Subscriber Account' :
          selectedAction === 'change_plan' ? 'Upgrade or Modify Subscription Plan' :
          selectedAction === 'renew' ? 'Renew / Extend Subscription Entitlement' :
          selectedAction === 'reset_password' ? 'Reset Primary Owner Password' :
          'Subscriber Action'
        }
        description={selectedSubscriber?.businessName}
        onClose={isSubmitting ? () => undefined : closeAction}
        closeOnBackdrop={!isSubmitting}
        closeOnEscape={!isSubmitting}
        role={selectedAction === 'suspend' || selectedAction === 'deactivate' || selectedAction === 'delete' ? 'alertdialog' : 'dialog'}
        footer={(
          <>
            <button className="btn btn-outline" style={{ width: 'auto' }} onClick={closeAction} disabled={isSubmitting}>Cancel</button>
            <button
              className="btn btn-primary"
              style={{ width: 'auto', backgroundColor: selectedAction === 'suspend' || selectedAction === 'deactivate' || selectedAction === 'delete' ? '#dc2626' : undefined }}
              onClick={completeAction}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : selectedAction === 'delete' ? 'Delete Permanently' : 'Confirm'}
            </button>
          </>
        )}
      >
        {selectedSubscriber && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {(selectedAction === 'suspend' || selectedAction === 'deactivate') && (
              <>
                <div>
                  <label className="form-label" style={{ fontWeight: 600 }}>Reason for Action *</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    placeholder="e.g. Billing non-compliance, tenant security hold, administrative review..."
                    value={reason}
                    onChange={event => setReason(event.target.value)}
                  />
                </div>
                {selectedAction === 'suspend' && (
                  <div>
                    <label className="form-label" style={{ fontWeight: 600 }}>Internal Operational Note (Optional)</label>
                    <input
                      className="form-input"
                      placeholder="e.g. Client requested temporary pause until end of month."
                      value={note}
                      onChange={event => setNote(event.target.value)}
                    />
                  </div>
                )}
                {selectedAction === 'deactivate' && (
                  <div className="banner-alert warning" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldAlert size={16} /> This will soft-deactivate all associated branch access.
                  </div>
                )}
              </>
            )}

            {selectedAction === 'change_plan' && (
              <>
                <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Current Active Tier:</span>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>{selectedSubscriber.planId} Plan</div>
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 600 }}>Select New Plan Entitlement</label>
                  <select className="form-input" value={plan} onChange={event => setPlan(event.target.value)}>
                    {activePlans.map(item => <option key={item.id} value={item.name}>{item.name} Plan (₱{item.monthlyPrice.toLocaleString()}/mo)</option>)}
                  </select>
                </div>
              </>
            )}

            {selectedAction === 'renew' && (
              <>
                <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Current Expiration Date:</span>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>{selectedSubscriber.expiresAt || 'Pending'}</div>
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 600 }}>Extension Duration</label>
                  <select className="form-input" value={renewalDays} onChange={event => setRenewalDays(Number(event.target.value))}>
                    <option value={30}>+30 Days (1 Month Extension)</option>
                    <option value={90}>+90 Days (Quarterly Extension)</option>
                    <option value={365}>+365 Days (1 Year Annual Extension)</option>
                    <option value={730}>+730 Days (2 Years Enterprise Extension)</option>
                  </select>
                </div>
              </>
            )}

            {selectedAction === 'reset_password' && (
              <div>
                <p style={{ fontSize: '0.875rem', color: '#334155', lineHeight: 1.5 }}>
                  This will generate a secure one-time temporary password for <strong>{selectedSubscriber.email}</strong> and flag the account to require a password reset upon next login.
                </p>
              </div>
            )}

            {selectedAction === 'reactivate' && (
              <div>
                <p style={{ fontSize: '0.875rem', color: '#334155', lineHeight: 1.5 }}>
                  Are you sure you want to restore and reactivate <strong>{selectedSubscriber.businessName}</strong>? All branch clinics will immediately regain active operational access.
                </p>
              </div>
            )}

            {selectedAction === 'delete' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '0.75rem', borderRadius: '8px' }}>
                  <ShieldAlert size={18} />
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Permanent Cascade Deletion Warning</span>
                </div>
                <p style={{ fontSize: '0.875rem', color: '#334155', lineHeight: 1.5 }}>
                  Are you sure you want to permanently delete <strong>{selectedSubscriber.businessName}</strong> ({selectedSubscriber.subscriberNumber})?
                </p>
                <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#64748b' }}>
                  <p style={{ margin: '0 0 0.35rem 0', fontWeight: 600, color: '#0f172a' }}>This action will permanently purge:</p>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <li>All linked clinic branches ({selectedSubscriber.clinicCount} facilities)</li>
                    <li>Owner account and all associated personnel accounts ({selectedSubscriber.associateCount} dentists, {selectedSubscriber.staffCount} staff)</li>
                    <li>Active subscription ledger and payment invoices</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </main>
  );
}
