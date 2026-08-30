import { useState, useMemo } from 'react';
import {
  Users,
  CreditCard,
  GitPullRequest,
  Building2,
  TrendingUp,
  CheckCircle2,
  ShieldAlert,
  Activity,
  Clock,
  Megaphone,
  Settings,
  DollarSign,
  Search
} from 'lucide-react';
import { usePlatformAdminReadModel } from '../realData/PlatformAdminReadProvider';
import { platformAdminDirectoryService } from '../realData/platformAdminRealDataService';

export interface PlatformDashboardPageProps {
  navigate: (route: string) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  onReviewRegistration: (registration: any) => void;
  onApproveRegistration?: (registration: any) => void;
  registrations: any[];
  dashboardAnalytics: {
    totalSubscribers: number;
    totalClinics: number;
    totalLaboratories: number;
    mockMonthlyRevenue: number;
  };
  subscriptionSummary: {
    active: number;
    expiringSoon: number;
    pending: number;
    cancelled: number;
  };
  clinicSummary: {
    active: number;
    inactive: number;
    withoutDentists: number;
    withoutStaff: number;
  };
  laboratorySummary: {
    active: number;
    withoutClinicConnections: number;
    withoutActiveServices: number;
  };
  paymentSummary: {
    approved: number;
    refundedAmount: number;
    pendingCount?: number;
    approvedAmount?: number;
  };
  notificationSummary: {
    unread: number;
    urgent: number;
  };
  announcementSummary: {
    scheduled: number;
    published: number;
  };
  auditSummary: {
    critical: number;
    integrityWarnings: number;
    failedLogins: number;
  };
  platformSettings: {
    maintenance: {
      enabled: boolean;
      message?: string;
    };
  };
  backupSummary: {
    lastBackup?: string | null;
    lastRestore?: string | null;
  };
  computedPendingPayments: number;
  activityLogs: Array<{
    id: string;
    timestamp: string;
    event: string;
    details: string;
    role?: string;
  }>;
  refreshShell?: () => void;
  onShowProvisionModal?: (data: {
    clinicName: string;
    ownerName: string;
    ownerEmail: string;
    plan: string;
    tempPassword?: string;
    subscriberId?: string;
  }) => void;
}

export function PlatformDashboardPage(props: PlatformDashboardPageProps) {
  const { revision, summary } = usePlatformAdminReadModel();
  const {
    navigate,
    onReviewRegistration,
    onApproveRegistration,
  } = props;

  const registrations = useMemo(() => platformAdminDirectoryService.listRegistrations(), [revision]);
  const dashboardAnalytics = useMemo(() => ({
    totalSubscribers: summary.activeSubscribers,
    totalClinics: summary.activeClinics,
    totalLaboratories: 0,
    mockMonthlyRevenue: summary.activeSubscriptionMrrCentavos / 100,
  }), [summary]);
  const subscriptionSummary = useMemo(() => ({ ...summary.subscriptionStatuses, total: Object.values(summary.subscriptionStatuses).reduce((total, value) => total + value, 0), draft: 0 }), [summary]);
  const clinicSummary = summary.clinicSummary;
  const paymentSummary = { ...summary.paymentSummary, collectedAmount: summary.paymentSummary.approvedAmountCentavos / 100, refundedAmount: summary.paymentSummary.refundedAmountCentavos / 100 };
  const laboratorySummary = { active: 0, withoutClinicConnections: 0, withoutActiveServices: 0 };
  const notificationSummary = { unread: 0, urgent: 0 };
  const auditSummary = { critical: 0, integrityWarnings: 0, failedLogins: 0 };
  const platformSettings = { maintenance: { enabled: false } };
  const backupSummary: PlatformDashboardPageProps['backupSummary'] = {};
  const computedPendingPayments = summary.pendingPaymentReviews;
  const activityLogs: PlatformDashboardPageProps['activityLogs'] = [];

  const [activeMetricTab, setActiveMetricTab] = useState<'financial' | 'facilities' | 'security'>('financial');
  const [activityCategoryFilter, setActivityCategoryFilter] = useState<'all' | 'auth' | 'payment' | 'system'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Compute Action Items
  const actionRequiredItems = useMemo(() => {
    const items: Array<{
      key: string;
      type: 'danger' | 'warning' | 'info' | 'success';
      title: string;
      message: string;
      link: string | null;
      actionLabel?: string;
    }> = [];

    if (computedPendingPayments > 0) {
      items.push({
        key: 'pending_payments',
        type: 'warning',
        title: 'Pending Payment Audits',
        message: `${computedPendingPayments} subscriber payment verifications require immediate audit.`,
        link: '/platform/payments',
        actionLabel: 'Audit Payments'
      });
    }

    if (auditSummary.integrityWarnings > 0) {
      items.push({
        key: 'audit_integrity',
        type: 'danger',
        title: 'Audit Integrity Warning',
        message: `Audit log verification reported ${auditSummary.integrityWarnings} integrity block discrepancies.`,
        link: '/platform/audit-logs',
        actionLabel: 'Verify Logs'
      });
    }

    if (notificationSummary.urgent > 0) {
      items.push({
        key: 'urgent_notifications',
        type: 'danger',
        title: 'Urgent System Alerts',
        message: `${notificationSummary.urgent} high-severity administrative alerts need action in Notification Center.`,
        link: '/platform/notifications',
        actionLabel: 'Open Alerts'
      });
    }

    if (clinicSummary.withoutDentists > 0) {
      items.push({
        key: 'clinics_no_dentist',
        type: 'warning',
        title: 'Clinics Needing Dentists',
        message: `${clinicSummary.withoutDentists} active clinics do not have any registered dentists assigned.`,
        link: '/platform/clinics',
        actionLabel: 'Assign Staff'
      });
    }

    if (subscriptionSummary.expiringSoon > 0) {
      items.push({
        key: 'subs_expiring',
        type: 'info',
        title: 'Subscriptions Expiring Soon',
        message: `${subscriptionSummary.expiringSoon} clinic subscriptions are expiring within the next 30 days.`,
        link: '/platform/subscriptions',
        actionLabel: 'View Subscriptions'
      });
    }

    if (items.length === 0) {
      items.push({
        key: 'all_clear',
        type: 'success',
        title: 'No supported alerts',
        message: 'The live Platform Admin read model reports no pending payment, clinic-assignment, or subscription-expiry alerts.',
        link: null
      });
    }

    return items;
  }, [computedPendingPayments, auditSummary.integrityWarnings, notificationSummary.urgent, clinicSummary.withoutDentists, subscriptionSummary.expiringSoon]);

  // Plan Distribution Breakdown
  const planDistribution = useMemo(() => {
    const basic = summary.activePlanDistribution.basic ?? 0;
    const plus = summary.activePlanDistribution.plus ?? 0;
    const max = summary.activePlanDistribution.max ?? 0;
    const total = Math.max(1, basic + plus + max);

    return {
      basic,
      plus,
      max,
      total,
      basicPct: Math.round((basic / total) * 100),
      plusPct: Math.round((plus / total) * 100),
      maxPct: Math.round((max / total) * 100)
    };
  }, [summary]);

  // Filtered Pending Registrations for Table
  const pendingRegistrations = useMemo(() => {
    const source = registrations || [];
    const list = source.filter((r: any) => 
      r.paymentStatus === 'pending_verification' || 
      r.registrationStatus === 'payment_under_review'
    );
    if (!searchTerm.trim()) return list;
    const q = searchTerm.toLowerCase();
    return list.filter(r =>
      r.clinicName?.toLowerCase().includes(q) ||
      r.ownerName?.toLowerCase().includes(q) ||
      r.id?.toLowerCase().includes(q) ||
      r.plan?.toLowerCase().includes(q)
    );
  }, [registrations, searchTerm]);

  // Filtered Activity Logs
  const filteredActivityLogs = useMemo(() => {
    if (activityCategoryFilter === 'all') return activityLogs.slice(0, 8);
    return activityLogs.filter(log => {
      const ev = (log.event + ' ' + log.details).toLowerCase();
      if (activityCategoryFilter === 'auth') return ev.includes('login') || ev.includes('auth') || ev.includes('signed');
      if (activityCategoryFilter === 'payment') return ev.includes('payment') || ev.includes('subscribed') || ev.includes('plan');
      if (activityCategoryFilter === 'system') return ev.includes('setting') || ev.includes('backup') || ev.includes('sync');
      return true;
    }).slice(0, 8);
  }, [activityLogs, activityCategoryFilter]);

  const getInitials = (name?: string) => {
    if (!name) return 'CL';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <main className="main-content" style={{ paddingBottom: '3rem' }}>
      {/* EXECUTIVE HERO HEADER */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '1.25rem',
        marginBottom: '1.75rem',
        paddingBottom: '1.25rem',
        borderBottom: '1px solid var(--border)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Platform Overview
            </span>
            <span style={{ color: 'var(--border)' }}>•</span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              backgroundColor: platformSettings.maintenance.enabled ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
              color: platformSettings.maintenance.enabled ? 'var(--danger)' : 'var(--success)',
              fontSize: '0.75rem',
              fontWeight: 600
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: platformSettings.maintenance.enabled ? 'var(--danger)' : 'var(--success)'
              }}></span>
              {platformSettings.maintenance.enabled ? 'Maintenance Active' : 'All Systems Operational'}
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
            Platform Control Center
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
            Executive oversight of subscribers, multi-branch operations, subscription revenue, and platform health.
          </p>
        </div>

        {/* Quick Platform Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-outline"
            style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem' }}
            onClick={() => navigate('/platform/announcements/new')}
          >
            <Megaphone size={14} /> Broadcast Alert
          </button>
          <button
            type="button"
            className="btn btn-outline"
            style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem' }}
            onClick={() => navigate('/platform/payments')}
          >
            <CreditCard size={14} /> Review Payments
            {computedPendingPayments > 0 && (
              <span style={{
                backgroundColor: 'var(--warning)',
                color: '#fff',
                borderRadius: '9999px',
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.1rem 0.4rem',
                marginLeft: '0.2rem'
              }}>
                {computedPendingPayments}
              </span>
            )}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem' }}
            onClick={() => navigate('/platform/settings')}
          >
            <Settings size={14} /> Platform Settings
          </button>
        </div>
      </div>

      {/* TOP 4 CORE HERO METRIC CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.25rem',
        marginBottom: '1.75rem'
      }}>
        {/* MRR Card */}
        <div style={{
          backgroundColor: 'var(--card-bg, #fff)',
          borderRadius: 'var(--radius-lg, 12px)',
          border: '1px solid var(--border)',
          padding: '1.25rem 1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', backgroundColor: '#3b82f6' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Monthly Plan Revenue
            </span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              color: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              ₱{dashboardAnalytics.mockMonthlyRevenue.toLocaleString()}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem', fontSize: '0.775rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: 'var(--success)', fontWeight: 600 }}>
                <TrendingUp size={13} /> +12.4%
              </span>
              <span style={{ color: 'var(--text-muted)' }}>vs prior 30 days</span>
            </div>
          </div>
        </div>

        {/* Active Subscribers Card */}
        <div style={{
          backgroundColor: 'var(--card-bg, #fff)',
          borderRadius: 'var(--radius-lg, 12px)',
          border: '1px solid var(--border)',
          padding: '1.25rem 1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', backgroundColor: '#10b981' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Active Clinic Accounts
            </span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Users size={18} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {subscriptionSummary.active || dashboardAnalytics.totalSubscribers}
            </div>
            <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px', backgroundColor: '#f1f5f9', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {planDistribution.max} Max
              </span>
              <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px', backgroundColor: '#f1f5f9', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {planDistribution.plus} Plus
              </span>
              <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px', backgroundColor: '#f1f5f9', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {planDistribution.basic} Basic
              </span>
            </div>
          </div>
        </div>

        {/* Pending Verification Card */}
        <div style={{
          backgroundColor: 'var(--card-bg, #fff)',
          borderRadius: 'var(--radius-lg, 12px)',
          border: '1px solid var(--border)',
          padding: '1.25rem 1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', backgroundColor: computedPendingPayments > 0 ? '#f59e0b' : '#64748b' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Payments Waiting for Review
            </span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: computedPendingPayments > 0 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(100, 116, 139, 0.1)',
              color: computedPendingPayments > 0 ? '#f59e0b' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <GitPullRequest size={18} />
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                {computedPendingPayments}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>items pending</span>
            </div>
            <div style={{ marginTop: '0.4rem' }}>
              <span style={{
                fontSize: '0.725rem',
                fontWeight: 600,
                color: computedPendingPayments > 0 ? 'var(--warning)' : 'var(--success)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                {computedPendingPayments > 0 ? 'Action required in payment queue' : 'All payment queues cleared'}
              </span>
            </div>
          </div>
        </div>

        {/* Registered Facilities Card */}
        <div style={{
          backgroundColor: 'var(--card-bg, #fff)',
          borderRadius: 'var(--radius-lg, 12px)',
          border: '1px solid var(--border)',
          padding: '1.25rem 1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', backgroundColor: '#8b5cf6' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Clinics & Partner Labs
            </span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              color: '#8b5cf6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Building2 size={18} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {dashboardAnalytics.totalClinics + dashboardAnalytics.totalLaboratories}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem', fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
              <span><strong>{dashboardAnalytics.totalClinics}</strong> Clinics</span>
              <span>•</span>
              <span><strong>{dashboardAnalytics.totalLaboratories}</strong> Partner Labs</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECONDARY METRICS STRUCTURED PILLS */}
      <div style={{
        backgroundColor: 'var(--card-bg, #fff)',
        borderRadius: 'var(--radius-lg, 12px)',
        border: '1px solid var(--border)',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.75rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1rem',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={16} color="var(--primary)" />
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              System & Operations Summary
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.35rem', backgroundColor: 'var(--background)', padding: '0.2rem', borderRadius: 'var(--radius-md)' }}>
            {(['financial', 'facilities', 'security'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                style={{
                  border: 'none',
                  background: activeMetricTab === tab ? 'white' : 'transparent',
                  color: activeMetricTab === tab ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: activeMetricTab === tab ? 600 : 500,
                  fontSize: '0.775rem',
                  padding: '0.3rem 0.8rem',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  boxShadow: activeMetricTab === tab ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                  textTransform: 'capitalize'
                }}
                onClick={() => setActiveMetricTab(tab)}
              >
                {tab === 'financial' && 'Financial Summary'}
                {tab === 'facilities' && 'Clinics & Laboratories'}
                {tab === 'security' && 'Activity & Safety'}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeMetricTab === 'financial' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Approved Payments</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{paymentSummary.approved}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--success)', display: 'block', marginTop: '0.2rem' }}>Verified receipts</span>
            </div>
            <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Refunded Amount</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>₱{paymentSummary.refundedAmount.toLocaleString()}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>Processed client refunds</span>
            </div>
            <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Active Subscriptions</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{subscriptionSummary.active}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>Monthly & annual billing</span>
            </div>
            <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Expiring Subscriptions</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: subscriptionSummary.expiringSoon > 0 ? 'var(--warning)' : 'var(--text-primary)' }}>
                {subscriptionSummary.expiringSoon}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>Within 30 calendar days</span>
            </div>
          </div>
        )}

        {activeMetricTab === 'facilities' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Active Clinic Branches</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{clinicSummary.active}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>Operating clinic locations</span>
            </div>
            <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Clinics Needing Dentists</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: clinicSummary.withoutDentists > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
                {clinicSummary.withoutDentists}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>No associate assigned</span>
            </div>
            <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Active Partner Laboratories</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{laboratorySummary.active}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>Fulfilling lab orders</span>
            </div>
            <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Labs Without Connections</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: laboratorySummary.withoutClinicConnections > 0 ? 'var(--warning)' : 'var(--text-primary)' }}>
                {laboratorySummary.withoutClinicConnections}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>Unlinked lab centers</span>
            </div>
          </div>
        )}

        {activeMetricTab === 'security' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Failed Login Attempts</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: auditSummary.failedLogins > 0 ? 'var(--warning)' : 'var(--text-primary)' }}>
                {auditSummary.failedLogins}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>Blocked or incorrect sign-ins</span>
            </div>
            <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>System Data Integrity</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: auditSummary.integrityWarnings > 0 ? 'var(--danger)' : 'var(--success)' }}>
                {auditSummary.integrityWarnings === 0 ? '100% Secure' : `${auditSummary.integrityWarnings} Warnings`}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>Security and record verification</span>
            </div>
            <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Last Saved Backup</span>
              <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {backupSummary.lastBackup ? new Date(backupSummary.lastBackup).toLocaleDateString('en-PH') : 'Not created'}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>Saved system copy</span>
            </div>
            <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Maintenance Mode</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: platformSettings.maintenance.enabled ? 'var(--danger)' : 'var(--success)' }}>
                {platformSettings.maintenance.enabled ? 'Active (Locked)' : 'Normal (Open)'}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>Public portal accessibility</span>
            </div>
          </div>
        )}
      </div>

      {/* 2-COLUMN MAIN CONTENT GRID */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.15fr)',
        gap: '1.75rem',
        alignItems: 'start'
      }}>
        {/* LEFT COLUMN: ACTION REQUIRED & SNAPSHOT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* ACTION REQUIRED COMMAND CENTER */}
          <div style={{
            backgroundColor: 'var(--card-bg, #fff)',
            borderRadius: 'var(--radius-lg, 12px)',
            border: '1px solid var(--border)',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldAlert size={18} color="var(--primary)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Action Center
                </h3>
              </div>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
                backgroundColor: 'var(--background)',
                color: 'var(--text-secondary)'
              }}>
                {actionRequiredItems.filter(i => i.type !== 'success').length} Priority Items
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {actionRequiredItems.map(item => (
                <div
                  key={item.key}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.85rem 1rem',
                    backgroundColor:
                      item.type === 'danger' ? 'rgba(239, 68, 68, 0.06)' :
                      item.type === 'warning' ? 'rgba(245, 158, 11, 0.08)' :
                      item.type === 'success' ? 'rgba(16, 185, 129, 0.06)' :
                      'rgba(59, 130, 246, 0.06)',
                    borderLeft: `4px solid ${
                      item.type === 'danger' ? 'var(--danger, #ef4444)' :
                      item.type === 'warning' ? 'var(--warning, #f59e0b)' :
                      item.type === 'success' ? 'var(--success, #10b981)' :
                      'var(--info, #3b82f6)'
                    }`,
                    borderRadius: 'var(--radius-sm, 6px)',
                    gap: '1rem'
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>
                      {item.title}
                    </span>
                    <span style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.15rem' }}>
                      {item.message}
                    </span>
                  </div>
                  {item.link && (
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{
                        width: 'auto',
                        padding: '0.3rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        backgroundColor: 'white'
                      }}
                      onClick={() => navigate(item.link!)}
                    >
                      {item.actionLabel || 'Resolve'} →
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* PLATFORM SNAPSHOT & TIER DISTRIBUTION */}
          <div style={{
            backgroundColor: 'var(--card-bg, #fff)',
            borderRadius: 'var(--radius-lg, 12px)',
            border: '1px solid var(--border)',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
              Subscription Tier Distribution
            </h3>

            {/* Plan Progress Bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Max Tier */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6' }}></span>
                    Max Tier (Enterprise)
                  </span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                    {planDistribution.max} ({planDistribution.maxPct}%)
                  </span>
                </div>
                <div style={{ height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${planDistribution.maxPct}%`, height: '100%', backgroundColor: '#3b82f6', borderRadius: '4px', transition: 'width 0.4s ease' }}></div>
                </div>
              </div>

              {/* Plus Tier */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
                    Plus Tier (Multi-Branch)
                  </span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                    {planDistribution.plus} ({planDistribution.plusPct}%)
                  </span>
                </div>
                <div style={{ height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${planDistribution.plusPct}%`, height: '100%', backgroundColor: '#10b981', borderRadius: '4px', transition: 'width 0.4s ease' }}></div>
                </div>
              </div>

              {/* Basic Tier */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#64748b' }}></span>
                    Basic Tier (Solo Clinic)
                  </span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                    {planDistribution.basic} ({planDistribution.basicPct}%)
                  </span>
                </div>
                <div style={{ height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${planDistribution.basicPct}%`, height: '100%', backgroundColor: '#64748b', borderRadius: '4px', transition: 'width 0.4s ease' }}></div>
                </div>
              </div>
            </div>

            {/* Facilities Allocation Mini Widgets */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', marginTop: '1.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '0.75rem', letterSpacing: '0.04em' }}>
                Facility Infrastructure
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ padding: '0.85rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Clinic Nodes</span>
                  <span style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)' }}>{dashboardAnalytics.totalClinics}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--success)', display: 'block', marginTop: '0.2rem' }}>{clinicSummary.active} Active</span>
                </div>
                <div style={{ padding: '0.85rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Partner Labs</span>
                  <span style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)' }}>{dashboardAnalytics.totalLaboratories}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--success)', display: 'block', marginTop: '0.2rem' }}>{laboratorySummary.active} Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PENDING ONBOARDING REVIEWS & ACTIVITY FEED */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* PENDING ONBOARDING REVIEW TABLE */}
          <div style={{
            backgroundColor: 'var(--card-bg, #fff)',
            borderRadius: 'var(--radius-lg, 12px)',
            border: '1px solid var(--border)',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Pending Onboarding Reviews
                </h3>
                <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', margin: '0.15rem 0 0 0' }}>
                  Verifications awaiting payment approval & account provisioning
                </p>
              </div>

              {pendingRegistrations.length > 3 && (
                <div style={{ position: 'relative', width: '160px' }}>
                  <Search size={13} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.25rem 0.5rem 0.25rem 1.8rem',
                      fontSize: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)'
                    }}
                  />
                </div>
              )}
            </div>

            <div className="table-container" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <table className="data-table" style={{ margin: 0 }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--background)' }}>
                    <th style={{ fontSize: '0.75rem', padding: '0.6rem 0.85rem' }}>Clinic & Owner</th>
                    <th style={{ fontSize: '0.75rem', padding: '0.6rem 0.85rem' }}>Plan</th>
                    <th style={{ fontSize: '0.75rem', padding: '0.6rem 0.85rem' }}>Payment Method</th>
                    <th style={{ fontSize: '0.75rem', padding: '0.6rem 0.85rem', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRegistrations.map(reg => (
                    <tr key={reg.id}>
                      <td style={{ padding: '0.75rem 0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(59, 130, 246, 0.12)',
                            color: '#3b82f6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 700
                          }}>
                            {getInitials(reg.clinicName)}
                          </div>
                          <div>
                            <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>
                              {reg.clinicName}
                            </span>
                            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'block' }}>
                              {reg.ownerName} • {reg.id}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem' }}>
                        <span style={{
                          fontSize: '0.725rem',
                          fontWeight: 600,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          backgroundColor:
                            reg.plan?.toLowerCase() === 'max' ? 'rgba(59, 130, 246, 0.1)' :
                            reg.plan?.toLowerCase() === 'plus' ? 'rgba(16, 185, 129, 0.1)' :
                            'rgba(100, 116, 139, 0.1)',
                          color:
                            reg.plan?.toLowerCase() === 'max' ? '#2563eb' :
                            reg.plan?.toLowerCase() === 'plus' ? '#059669' :
                            '#475569'
                        }}>
                          {reg.plan || 'Not available'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem' }}>
                        <span style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', display: 'block' }}>
                          {reg.paymentMethod || 'Not available'}
                        </span>
                        {reg.referenceNumber && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            Ref: {reg.referenceNumber}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="btn btn-outline"
                            style={{ width: 'auto', padding: '0.3rem 0.65rem', fontSize: '0.75rem', height: 'auto' }}
                            onClick={() => onReviewRegistration(reg)}
                          >
                            Review
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ width: 'auto', padding: '0.3rem 0.75rem', fontSize: '0.75rem', height: 'auto' }}
                            onClick={() => onApproveRegistration?.(reg)}
                          >
                            Approve & Activate
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {pendingRegistrations.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 1rem' }}>
                        <CheckCircle2 size={24} color="var(--success)" style={{ margin: '0 auto 0.5rem auto', display: 'block' }} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', color: 'var(--text-primary)' }}>
                          No Pending Onboarding Reviews
                        </span>
                        <span style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                          All submitted registrations have been verified and processed.
                        </span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* SYSTEM ACTIVITY TIMELINE */}
          <div style={{
            backgroundColor: 'var(--card-bg, #fff)',
            borderRadius: 'var(--radius-lg, 12px)',
            border: '1px solid var(--border)',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={16} color="var(--primary)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Platform Audit & Activity Feed
                </h3>
              </div>

              {/* Activity Filter Pills */}
              <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: 'var(--background)', padding: '0.15rem', borderRadius: 'var(--radius-md)' }}>
                {(['all', 'auth', 'payment', 'system'] as const).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    style={{
                      border: 'none',
                      background: activityCategoryFilter === cat ? 'white' : 'transparent',
                      color: activityCategoryFilter === cat ? 'var(--primary)' : 'var(--text-secondary)',
                      fontWeight: activityCategoryFilter === cat ? 600 : 500,
                      fontSize: '0.725rem',
                      padding: '0.2rem 0.55rem',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      boxShadow: activityCategoryFilter === cat ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                      textTransform: 'capitalize'
                    }}
                    onClick={() => setActivityCategoryFilter(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Timeline Item List */}
            <div className="timeline-feed" style={{ marginTop: '0.5rem' }}>
              {filteredActivityLogs.map(log => (
                <div key={log.id} className="timeline-item" style={{ paddingBottom: '0.85rem' }}>
                  <div className="timeline-marker" style={{ backgroundColor: 'var(--primary)' }}></div>
                  <div className="timeline-item-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <strong style={{ fontSize: '0.825rem', color: 'var(--text-primary)' }}>{log.event}</strong>
                      {log.role && (
                        <span style={{
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          padding: '0.1rem 0.35rem',
                          borderRadius: '4px',
                          backgroundColor: log.role === 'platform_owner' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                          color: log.role === 'platform_owner' ? '#2563eb' : '#475569'
                        }}>
                          {log.role === 'platform_owner' ? '👑 Platform Admin' : '🏥 Subscriber'}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{log.timestamp}</span>
                  </div>
                  <div className="timeline-item-content" style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    {log.details}
                  </div>
                </div>
              ))}

              {filteredActivityLogs.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>
                  <span style={{ fontSize: '0.8rem' }}>No activity records found in this category.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
