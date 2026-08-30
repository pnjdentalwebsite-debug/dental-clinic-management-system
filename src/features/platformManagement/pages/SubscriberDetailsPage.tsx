import { useState } from 'react';
import {
  Building2,
  CreditCard,
  Users,
  Sparkles,
  RotateCcw,
  SlidersHorizontal,
  KeyRound,
  PauseCircle,
  PlayCircle,
  ArrowLeft,
  MapPin,
  Trash2,
  ShieldAlert,
  Copy,
  Check,
  Lock
} from 'lucide-react';
import { Modal } from '../../../components/overlays/Modal';
import { platformAdminClinicService as mockClinicService, platformAdminDirectoryService as mockPlatformManagementService, platformAdminLaboratoryService as mockLaboratoryService, platformAdminPaymentService as mockPaymentService, platformAdminPlanService as mockPlanService, platformAdminSubscriptionService as mockSubscriptionService } from '../realData/platformAdminRealDataService';
import { usePlatformAdminDetail } from '../realData/PlatformAdminReadProvider';
import { platformAdminApi } from '../../../infrastructure/supabase/platformAdminApi';

interface SubscriberDetailsPageProps {
  subscriberId: string;
  navigate: (route: string) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

const tabs = ['Overview', 'Clinics & Branches', 'Laboratories', 'Authorized Personnel', 'Subscription', 'Payment Ledger', 'Activity Logs'];
const formatStatus = (value: string) => value.replaceAll('_', ' ');

const StatusBadge = ({ status }: { status: string }) => (
  <span className={`status-badge ${mockPlatformManagementService.getStatusBadgeClass(status)}`} style={{ textTransform: 'capitalize', fontWeight: 600, fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '9999px' }}>
    {formatStatus(status)}
  </span>
);

export function SubscriberDetailsPage({ subscriberId, navigate, showToast }: SubscriberDetailsPageProps) {
  const { refresh: refreshRealData } = usePlatformAdminDetail('subscribers', subscriberId);
  const [activeTab, setActiveTab] = useState('Overview');
  const [activeModal, setActiveModal] = useState<'change_plan' | 'renew' | 'suspend' | 'reactivate' | 'reset_password' | 'delete' | null>(null);
  const [plan, setPlan] = useState('Max');
  const [renewalDays, setRenewalDays] = useState(365);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const subscriber = mockPlatformManagementService.getSubscriberById(subscriberId);

  if (!subscriber) {
    return (
      <main className="main-content">
        <div className="dashboard-panel empty-state" style={{ padding: '3rem', textAlign: 'center' }}>
          <h2>Subscriber Organization Not Found</h2>
          <p style={{ color: '#64748b', marginTop: '0.5rem', marginBottom: '1.5rem' }}>The requested subscriber record does not exist in the active directory.</p>
          <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => navigate('/platform/subscribers')}>Back to Subscribers</button>
        </div>
      </main>
    );
  }

  const users = mockPlatformManagementService.getUsersBySubscriberId(subscriber.id);
  const owner = users.find(user => user.role === 'clinic_owner');
  const clinics = mockClinicService.getClinicsBySubscriberId(subscriber.id);
  const laboratories = mockLaboratoryService.getLaboratoriesBySubscriberId(subscriber.id);
  const subscription = mockSubscriptionService.getCurrentSubscriptionBySubscriberId(subscriber.id);
  const registrations = mockPlatformManagementService.listRegistrations();
  const registration = registrations.find(item =>
    item.id === subscriber.registrationId ||
    item.subscriberId === subscriber.id ||
    (subscriber.email && item.ownerEmail?.toLowerCase() === subscriber.email?.toLowerCase()) ||
    (subscriber.email && item.clinicEmail?.toLowerCase() === subscriber.email?.toLowerCase())
  );
  const ownerFullName = owner?.fullName || registration?.ownerName || subscriber.businessName;
  const ownerEmail = owner?.email || registration?.ownerEmail || subscriber.email;
  const ownerMobile = owner?.mobileNumber || registration?.ownerMobile || subscriber.mobileNumber;
  const credentialDeliveryStatus = 'Delivered by secure email; plaintext credentials are not available in Platform Admin.';
  const activePlanObj = mockPlanService.getPlanByCode(subscriber.planId) || mockPlanService.getPlanById(subscriber.planId);
  const activePlanPrice = activePlanObj?.monthlyPrice ?? 0;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    showToast(`${label} copied to clipboard!`, 'success');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const payments = mockPaymentService.getPaymentsBySubscriberId(subscriber.id);
  const paymentSummary = mockPaymentService.calculateSubscriberPaymentSummary(subscriber.id);
  const activity = mockPlatformManagementService.listActivity().filter(log =>
    log.details.includes(subscriber.id) ||
    log.details.includes(subscriber.businessName) ||
    Boolean(registration && log.details.includes(registration.id)) ||
    Boolean(owner && log.details.includes(owner.email))
  );

  const activePlans = mockPlanService.getSelectableSubscriberPlans();

  const initials = subscriber.businessName
    ? subscriber.businessName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
    : 'AD';

  const handleModalSubmit = async () => {
    setIsSubmitting(true);
    if (activeModal === 'reset_password') {
      if (!subscriber.registrationId) {
        showToast('Credential rotation is unavailable because this subscriber has no provisioning registration.', 'error');
        setIsSubmitting(false);
        return;
      }
      try {
        await platformAdminApi.resendInitialCredential(subscriber.registrationId);
        await refreshRealData();
        showToast(`A rotated initial credential was securely emailed to ${subscriber.email}.`, 'success');
        setActiveModal(null);
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Credential rotation failed.', 'error');
      }
      setIsSubmitting(false);
      return;
    }

    if (activeModal === 'delete') {
      const result = mockPlatformManagementService.deleteSubscriber(subscriber.id);
      if (result.ok) {
        showToast('Subscriber permanently deleted.', 'success');
        navigate('/platform/subscribers');
      } else {
        showToast(result.error || 'Operation failed.', 'error');
      }
      setIsSubmitting(false);
      return;
    }

    const result =
      activeModal === 'change_plan' ? mockPlatformManagementService.changeSubscriberPlanMock(subscriber.id, plan) :
      activeModal === 'renew' ? mockPlatformManagementService.renewSubscriberMock(subscriber.id, renewalDays) :
      activeModal === 'suspend' ? mockPlatformManagementService.suspendSubscriber(subscriber.id, reason) :
      activeModal === 'reactivate' ? mockPlatformManagementService.reactivateSubscriber(subscriber.id) :
      { ok: false, error: 'Unsupported action.' };

    if (result.ok) {
      showToast('Subscriber updated successfully.', 'success');
      setActiveModal(null);
    } else {
      showToast(result.error || 'Operation failed.', 'error');
    }
    setIsSubmitting(false);
  };

  return (
    <main className="main-content">
      {/* NAVIGATION BREADCRUMB / BACK */}
      <button
        className="forgot-password-link"
        style={{ border: 'none', background: 'none', cursor: 'pointer', marginBottom: '1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: '#2563eb' }}
        onClick={() => navigate('/platform/subscribers')}
      >
        <ArrowLeft size={16} /> Back to Subscribers Directory
      </button>

      {/* HERO HEADER */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '1.75rem',
        marginBottom: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
          }}>
            {initials}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>{subscriber.businessName}</h1>
              <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', backgroundColor: '#f1f5f9', borderRadius: '6px', fontFamily: 'monospace', color: '#475569', fontWeight: 600 }}>
                {subscriber.subscriberNumber}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Owner: <strong>{owner?.fullName || 'Angelo Mhyr Lagsac'}</strong></span>
              <span>•</span>
              <span>Registered on {subscriber.registeredAt}</span>
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem' }}>
              <StatusBadge status={subscriber.accountStatus} />
              <StatusBadge status={subscriber.subscriptionStatus} />
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
                backgroundColor: subscriber.planId === 'Max' ? '#f5f3ff' : '#eff6ff',
                color: subscriber.planId === 'Max' ? '#6d28d9' : '#1d4ed8',
                fontWeight: 700,
                fontSize: '0.75rem',
                border: subscriber.planId === 'Max' ? '1px solid #ddd6fe' : '1px solid #bfdbfe'
              }}>
                <Sparkles size={12} /> {subscriber.planId} Plan
              </span>
            </div>
          </div>
        </div>

        {/* QUICK COMMANDS */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <button className="btn btn-outline" style={{ width: 'auto', fontSize: '0.85rem' }} onClick={() => { setPlan(subscriber.planId || 'Max'); setActiveModal('change_plan'); }}>
            <SlidersHorizontal size={14} style={{ marginRight: '6px', display: 'inline-block' }} /> Change Plan
          </button>
          <button className="btn btn-outline" style={{ width: 'auto', fontSize: '0.85rem' }} onClick={() => { setRenewalDays(365); setActiveModal('renew'); }}>
            <RotateCcw size={14} style={{ marginRight: '6px', display: 'inline-block' }} /> Renew Plan
          </button>
          <button className="btn btn-outline" style={{ width: 'auto', fontSize: '0.85rem' }} onClick={() => setActiveModal('reset_password')}>
            <KeyRound size={14} style={{ marginRight: '6px', display: 'inline-block' }} /> Reset Password
          </button>
          {subscriber.accountStatus === 'active' ? (
            <button className="btn btn-outline" style={{ width: 'auto', fontSize: '0.85rem', color: '#dc2626', borderColor: '#fca5a5' }} onClick={() => setActiveModal('suspend')}>
              <PauseCircle size={14} style={{ marginRight: '6px', display: 'inline-block' }} /> Suspend
            </button>
          ) : (
            <button className="btn btn-outline" style={{ width: 'auto', fontSize: '0.85rem', color: '#16a34a', borderColor: '#86efac' }} onClick={() => setActiveModal('reactivate')}>
              <PlayCircle size={14} style={{ marginRight: '6px', display: 'inline-block' }} /> Reactivate
            </button>
          )}
          <button className="btn btn-outline" style={{ width: 'auto', fontSize: '0.85rem', color: '#dc2626', borderColor: '#fca5a5' }} onClick={() => setActiveModal('delete')}>
            <Trash2 size={14} style={{ marginRight: '6px', display: 'inline-block' }} /> Delete
          </button>
        </div>
      </div>

      {/* TABBED SECTIONS */}
      <div className="dashboard-panel" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div className="module-tabs" role="tablist" aria-label="Subscriber detail tabs" style={{ marginBottom: '1.5rem' }}>
          {tabs.map(tab => (
            <button key={tab} role="tab" aria-selected={activeTab === tab} className={`tab-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>{tab}</button>
          ))}
        </div>

        {/* TAB: OVERVIEW */}
        {activeTab === 'Overview' && (
          <div className="sections-grid" style={{ gap: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            <section style={{ padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={18} color="#2563eb" /> Primary Owner Details
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
                <div><span style={{ color: '#64748b' }}>Full Name:</span> <strong style={{ color: '#0f172a', marginLeft: '6px' }}>{ownerFullName}</strong></div>
                <div><span style={{ color: '#64748b' }}>Email:</span> <strong style={{ color: '#0f172a', marginLeft: '6px' }}>{ownerEmail}</strong></div>
                <div><span style={{ color: '#64748b' }}>Contact Phone:</span> <strong style={{ color: '#0f172a', marginLeft: '6px' }}>{ownerMobile}</strong></div>
                <div><span style={{ color: '#64748b' }}>Role & Designation:</span> <span style={{ color: '#0f172a', marginLeft: '6px' }}>{owner?.position || 'Clinic Owner & Lead Dentist'}</span></div>
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.6rem', marginTop: '0.35rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#166534', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Lock size={13} /> Temp Password:
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <code style={{ backgroundColor: '#ffffff', padding: '0.2rem 0.5rem', borderRadius: '6px', border: '1px solid #86efac', color: '#15803d', fontWeight: 700, fontSize: '0.82rem', fontFamily: 'monospace' }}>
                      {credentialDeliveryStatus}
                    </code>
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ width: 'auto', padding: '0.2rem 0.5rem', fontSize: '0.72rem', height: 'auto', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                      onClick={() => handleCopy(credentialDeliveryStatus, 'Credential Delivery Status')}
                    >
                      {copiedField === 'Temporary Password' ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                      {copiedField === 'Temporary Password' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section style={{ padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building2 size={18} color="#10b981" /> Tenant Facility Entitlements
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
                <div><span style={{ color: '#64748b' }}>Registered Branches:</span> <strong style={{ color: '#0f172a', marginLeft: '6px' }}>{clinics.length} Active Facilities</strong></div>
                <div><span style={{ color: '#64748b' }}>Partner Laboratories:</span> <strong style={{ color: '#0f172a', marginLeft: '6px' }}>{laboratories.length} Linked Centers</strong></div>
                <div><span style={{ color: '#64748b' }}>Associate Dentists:</span> <strong style={{ color: '#0f172a', marginLeft: '6px' }}>{subscriber.associateCount} Licensed Clinicians</strong></div>
                <div><span style={{ color: '#64748b' }}>Auxiliary Staff:</span> <strong style={{ color: '#0f172a', marginLeft: '6px' }}>{subscriber.staffCount} Registered Accounts</strong></div>
              </div>
            </section>

            <section style={{ padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CreditCard size={18} color="#9333ea" /> Subscription & Financials
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
                <div><span style={{ color: '#64748b' }}>Tier Rate:</span> <strong style={{ color: '#9333ea', marginLeft: '6px' }}>₱{activePlanPrice.toLocaleString()}.00 / month</strong></div>
                <div><span style={{ color: '#64748b' }}>Registered Date:</span> <span style={{ color: '#0f172a', marginLeft: '6px' }}>{subscriber.registeredAt}</span></div>
                <div><span style={{ color: '#64748b' }}>Validity Expires:</span> <strong style={{ color: '#16a34a', marginLeft: '6px' }}>{subscriber.expiresAt || 'Active'}</strong></div>
                <div><span style={{ color: '#64748b' }}>Total Paid Revenue:</span> <strong style={{ color: '#0f172a', marginLeft: '6px' }}>₱{paymentSummary.totalPaid > 0 ? paymentSummary.totalPaid.toLocaleString() : activePlanPrice.toLocaleString()}</strong></div>
              </div>
            </section>
          </div>
        )}

        {/* TAB: CLINICS & BRANCHES */}
        {activeTab === 'Clinics & Branches' && (
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>Registered Clinic Branches</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {clinics.map(clinic => (
                <div key={clinic.id} style={{ padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>{clinic.name}</h4>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>{clinic.id}</span>
                    </div>
                    <StatusBadge status={clinic.status} />
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.75rem' }}>
                    <MapPin size={12} style={{ marginRight: '4px', verticalAlign: '-1px' }} />
                    {clinic.addressLine1}, {clinic.city}, {clinic.province}
                  </p>
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {clinic.isPrimaryClinic ? '👑 Main Branch' : '🏢 Satellite Branch'}
                    </span>
                    <button className="btn btn-outline" style={{ width: 'auto', padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => navigate(`/platform/clinics/${clinic.id}`)}>
                      Branch Console
                    </button>
                  </div>
                </div>
              ))}
              {clinics.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  No clinic facilities registered under this subscriber.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: LABORATORIES */}
        {activeTab === 'Laboratories' && (
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>Linked Dental Laboratories</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {laboratories.map(lab => (
                <div key={lab.id} style={{ padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>{lab.name}</h4>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{lab.laboratoryNumber}</span>
                    </div>
                    <StatusBadge status={lab.status} />
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#64748b' }}>{lab.city}, {lab.province}</p>
                </div>
              ))}
              {laboratories.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  No partner laboratories linked yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: AUTHORIZED PERSONNEL */}
        {activeTab === 'Authorized Personnel' && (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Personnel Name</th>
                  <th>Role / Position</th>
                  <th>Email</th>
                  <th>Mobile Number</th>
                  <th>Status</th>
                  <th>Last Login</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td><strong style={{ color: '#0f172a' }}>{u.fullName}</strong></td>
                    <td>{formatStatus(u.role)} • {u.position}</td>
                    <td>{u.email}</td>
                    <td>{u.mobileNumber}</td>
                    <td><StatusBadge status={u.accountStatus} /></td>
                    <td>{u.lastLoginAt || 'Not available'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB: SUBSCRIPTION */}
        {activeTab === 'Subscription' && (
          <div style={{ maxWidth: '640px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>Active Plan Terms</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ color: '#64748b' }}>Subscription Code:</span>
                <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{subscription?.subscriptionNumber || subscriber.subscriptionId}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ color: '#64748b' }}>Plan Tier:</span>
                <strong style={{ color: '#2563eb' }}>{subscriber.planId || 'Not available'} Plan</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ color: '#64748b' }}>Billing Cycle:</span>
                <span style={{ textTransform: 'capitalize' }}>{subscription?.billingCycle || 'annual'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ color: '#64748b' }}>Start Date:</span>
                <span>{subscriber.activatedAt || subscriber.registeredAt}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ color: '#64748b' }}>Expiration Date:</span>
                <strong style={{ color: '#16a34a' }}>{subscriber.expiresAt || 'Ongoing'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ color: '#64748b' }}>Auto-Renewal:</span>
                <span style={{ fontWeight: 600, color: '#10b981' }}>{subscription?.autoRenew !== false ? 'Enabled' : 'Disabled'}</span>
              </div>
            </div>

            {/* ACCESS CREDENTIALS & TEMPORARY PASSWORD SECTION */}
            <div style={{
              marginTop: '1.5rem',
              padding: '1.25rem',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#166534', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <KeyRound size={18} color="#16a34a" /> Access Credentials & Temporary Password
                </h4>
                <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '9999px', backgroundColor: '#dcfce7', color: '#15803d', fontWeight: 700 }}>
                  Secure credential delivery
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.85rem', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #dcfce7' }}>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Registered Login Email:</span>
                    <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>{ownerEmail}</strong>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ width: 'auto', padding: '0.25rem 0.6rem', fontSize: '0.75rem', height: 'auto', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                    onClick={() => handleCopy(ownerEmail, 'Login Email')}
                  >
                    {copiedField === 'Login Email' ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                    {copiedField === 'Login Email' ? 'Copied' : 'Copy'}
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.85rem', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #dcfce7' }}>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Temporary Access Password:</span>
                    <code style={{
                      backgroundColor: '#f8fafc',
                      padding: '0.25rem 0.6rem',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      color: '#15803d',
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      fontSize: '1rem',
                      letterSpacing: '0.04em',
                      display: 'inline-block',
                      marginTop: '0.2rem'
                    }}>
                      {credentialDeliveryStatus}
                    </code>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ width: 'auto', backgroundColor: '#16a34a', borderColor: '#16a34a', padding: '0.35rem 0.85rem', fontSize: '0.78rem', height: 'auto', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    onClick={() => handleCopy(credentialDeliveryStatus, 'Credential Delivery Status')}
                  >
                    {copiedField === 'Temporary Password' ? <Check size={13} /> : <Copy size={13} />}
                    {copiedField === 'Credential Delivery Status' ? 'Copied Status' : 'Copy Status'}
                  </button>
                </div>
              </div>

              <div style={{ marginTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', borderTop: '1px solid #dcfce7', paddingTop: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#166534' }}>
                  🔒 Use these credentials at <strong>/login</strong> to access the clinic owner portal.
                </span>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ width: 'auto', padding: '0.3rem 0.75rem', fontSize: '0.75rem', height: 'auto', borderColor: '#16a34a', color: '#166534' }}
                  onClick={() => {
                    const text = `Clinic: ${subscriber.businessName}\nLogin Email: ${ownerEmail}\nCredential Status: ${credentialDeliveryStatus}\nSign-in URL: ${window.location.origin}/login`;
                    handleCopy(text, 'Full Sign-In Details');
                  }}
                >
                  {copiedField === 'Full Sign-In Details' ? 'Copied Full Details!' : 'Copy Full Sign-In Details'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB: PAYMENT LEDGER */}
        {activeTab === 'Payment Ledger' && (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Payment Method</th>
                  <th>Reference Number</th>
                  <th>Amount</th>
                  <th>Date Paid</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id}>
                    <td><span style={{ fontWeight: 600, color: '#2563eb' }}>{p.paymentNumber}</span></td>
                    <td>{p.paymentMethod.replaceAll('_', ' ')}</td>
                    <td><span style={{ fontFamily: 'monospace' }}>{p.referenceNumber}</span></td>
                    <td><strong>₱{p.amount.toLocaleString()}</strong></td>
                    <td>{p.paymentDate}</td>
                    <td><StatusBadge status={p.status} /></td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                      No payment invoices on record.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB: ACTIVITY LOGS */}
        {activeTab === 'Activity Logs' && (
          <div className="timeline-feed" style={{ marginTop: '0.5rem' }}>
            {activity.map(log => (
              <div key={log.id} className="timeline-item">
                <div className="timeline-marker"></div>
                <div className="timeline-item-header">
                  <strong>{log.event}</strong>
                  <span>{log.timestamp}</span>
                </div>
                <div className="timeline-item-content">{log.details}</div>
              </div>
            ))}
            {activity.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                No recent activity logs for this subscriber.
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL WORKFLOW */}
      <Modal
        open={Boolean(activeModal)}
        title={
          activeModal === 'delete' ? 'Delete Subscriber Organization' :
          activeModal === 'change_plan' ? 'Upgrade or Modify Subscription Plan' :
          activeModal === 'renew' ? 'Renew / Extend Subscription Entitlement' :
          activeModal === 'suspend' ? 'Suspend Subscriber Organization' :
          activeModal === 'reactivate' ? 'Reactivate Subscriber Organization' :
          activeModal === 'reset_password' ? 'Reset Primary Owner Password' :
          'Subscriber Action'
        }
        description={subscriber.businessName}
        onClose={() => setActiveModal(null)}
        closeOnBackdrop={!isSubmitting}
        closeOnEscape={!isSubmitting}
        role={activeModal === 'suspend' || activeModal === 'delete' ? 'alertdialog' : 'dialog'}
        footer={(
          <>
            <button className="btn btn-outline" style={{ width: 'auto' }} onClick={() => setActiveModal(null)} disabled={isSubmitting}>Cancel</button>
            <button
              className="btn btn-primary"
              style={{ width: 'auto', backgroundColor: activeModal === 'suspend' || activeModal === 'delete' ? '#dc2626' : undefined }}
              onClick={handleModalSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : activeModal === 'delete' ? 'Delete Permanently' : 'Confirm'}
            </button>
          </>
        )}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {activeModal === 'change_plan' && (
            <div>
              <label className="form-label" style={{ fontWeight: 600 }}>Select New Plan Entitlement</label>
              <select className="form-input" value={plan} onChange={e => setPlan(e.target.value)}>
                {activePlans.map(item => <option key={item.id} value={item.name}>{item.name} Plan (₱{item.monthlyPrice.toLocaleString()}/mo)</option>)}
              </select>
            </div>
          )}

          {activeModal === 'renew' && (
            <div>
              <label className="form-label" style={{ fontWeight: 600 }}>Extension Duration</label>
              <select className="form-input" value={renewalDays} onChange={e => setRenewalDays(Number(e.target.value))}>
                <option value={30}>+30 Days (1 Month Extension)</option>
                <option value={90}>+90 Days (Quarterly Extension)</option>
                <option value={365}>+365 Days (1 Year Annual Extension)</option>
                <option value={730}>+730 Days (2 Years Enterprise Extension)</option>
              </select>
            </div>
          )}

          {activeModal === 'suspend' && (
            <div>
              <label className="form-label" style={{ fontWeight: 600 }}>Reason for Suspension *</label>
              <textarea className="form-input" rows={3} placeholder="Please provide reason..." value={reason} onChange={e => setReason(e.target.value)} />
            </div>
          )}

          {activeModal === 'reactivate' && (
            <p style={{ fontSize: '0.875rem', color: '#334155' }}>
              Confirm reactivation of <strong>{subscriber.businessName}</strong>. All branch clinics will immediately regain active operational access.
            </p>
          )}

          {activeModal === 'reset_password' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <p style={{ fontSize: '0.875rem', color: '#334155', margin: 0 }}>
                Manage or re-issue access credentials for clinic owner <strong>{ownerFullName}</strong> ({ownerEmail}).
              </p>
              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1rem', borderRadius: '10px' }}>
                <span style={{ color: '#166534', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
                  Current Temporary Master Password:
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <code style={{
                    flex: 1,
                    backgroundColor: '#ffffff',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid #86efac',
                    color: '#15803d',
                    fontWeight: 800,
                    fontSize: '1rem',
                    fontFamily: 'monospace'
                  }}>
                    {credentialDeliveryStatus}
                  </code>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ width: 'auto', backgroundColor: '#16a34a', borderColor: '#16a34a', padding: '0.5rem 0.85rem', fontSize: '0.75rem', height: 'auto', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    onClick={() => handleCopy(credentialDeliveryStatus, 'Credential Delivery Status')}
                  >
                    {copiedField === 'Temporary Password' ? <Check size={13} /> : <Copy size={13} />}
                    {copiedField === 'Temporary Password' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                ℹ️ Clicking "Confirm" below will re-generate and dispatch this temporary password to <strong>{ownerEmail}</strong>.
              </span>
            </div>
          )}

          {activeModal === 'delete' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '0.75rem', borderRadius: '8px' }}>
                <ShieldAlert size={18} />
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Permanent Cascade Deletion Warning</span>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#334155', lineHeight: 1.5 }}>
                Are you sure you want to permanently delete <strong>{subscriber.businessName}</strong> ({subscriber.subscriberNumber})?
              </p>
              <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#64748b' }}>
                <p style={{ margin: '0 0 0.35rem 0', fontWeight: 600, color: '#0f172a' }}>This action will permanently purge:</p>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <li>All linked clinic branches ({clinics.length} facilities)</li>
                  <li>Owner account and all associated personnel accounts ({users.length} users)</li>
                  <li>Active subscription ledger and payment invoices</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </main>
  );
}
