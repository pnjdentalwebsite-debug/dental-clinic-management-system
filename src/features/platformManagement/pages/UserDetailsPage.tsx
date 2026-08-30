import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Clock,
  KeyRound,
  MapPin,
  PauseCircle,
  PlayCircle,
  ShieldAlert,
  Stethoscope,
  Trash2,
  Users
} from 'lucide-react';
import { Modal } from '../../../components/overlays/Modal';
import { platformAdminDirectoryService as mockPlatformManagementService } from '../realData/platformAdminRealDataService';
import { usePlatformAdminDetail } from '../realData/PlatformAdminReadProvider';

interface UserDetailsPageProps {
  userId: string;
  navigate: (route: string) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

const tabs = ['Overview', 'Designated Branches', 'Work Schedule & Shift', 'Audit Activity'];
const formatStatus = (value: string) => value.replaceAll('_', ' ');

const StatusBadge = ({ status }: { status: string }) => (
  <span
    className={`status-badge ${mockPlatformManagementService.getStatusBadgeClass(status)}`}
    style={{ textTransform: 'capitalize', fontWeight: 600, fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '9999px' }}
  >
    {formatStatus(status)}
  </span>
);

export function UserDetailsPage({ userId, navigate, showToast }: UserDetailsPageProps) {
  usePlatformAdminDetail('users', userId);
  const [activeTab, setActiveTab] = useState('Overview');
  const [activeModal, setActiveModal] = useState<'reassign' | 'reset_password' | 'suspend' | 'reactivate' | 'delete' | null>(null);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedClinicIds, setSelectedClinicIds] = useState<string[]>([]);

  const user = mockPlatformManagementService.getUserById(userId);

  useEffect(() => {
    setSelectedClinicIds(user?.clinicIds ? [...user.clinicIds] : []);
  }, [user?.id, user?.clinicIds]);

  if (!user) {
    return (
      <main className="main-content">
        <div className="dashboard-panel empty-state" style={{ padding: '3rem', textAlign: 'center' }}>
          <h2>Personnel Record Not Found</h2>
          <p style={{ color: '#64748b', marginTop: '0.5rem', marginBottom: '1.5rem' }}>The requested personnel user does not exist in the active directory.</p>
          <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => navigate('/platform/users')}>Back to Users</button>
        </div>
      </main>
    );
  }

  const subscriber = user.subscriberId ? { id: user.subscriberId, businessName: user.subscriberName || 'Subscriber unavailable', primaryClinicName: user.subscriberName || 'Subscriber unavailable', email: '' } : null;
  const clinics = user.clinicSummaries ?? [];
  const allSubscriberClinics = clinics;

  const activity = mockPlatformManagementService.listActivity().filter(log =>
    log.details.includes(user.fullName) ||
    log.details.includes(user.email) ||
    log.details.includes(user.id)
  );

  const isDentist = user.role === 'associate';
  const initials = user.fullName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const handleModalSubmit = () => {
    setIsSubmitting(true);

    if (activeModal === 'reset_password') {
      showToast('Personnel credential reset is unavailable until an approved secure mutation contract is deployed.', 'warning');
      setActiveModal(null);
      setIsSubmitting(false);
      return;
    }

    if (activeModal === 'reassign') {
      const result = mockPlatformManagementService.updateUser(user.id, { clinicIds: selectedClinicIds });
      showToast(result.error || 'Branch reassignment is unavailable until an approved secure mutation contract is deployed.', 'warning');
      setIsSubmitting(false);
      return;
    }

    if (activeModal === 'delete') {
      const result = mockPlatformManagementService.deleteUser(user.id);
      if (result.ok) {
        showToast('Personnel permanently removed from platform.', 'success');
        navigate('/platform/users');
      } else {
        showToast(result.error || 'Operation failed.', 'error');
      }
      setIsSubmitting(false);
      return;
    }

    const result =
      activeModal === 'suspend' ? mockPlatformManagementService.suspendUser(user.id, reason) :
      activeModal === 'reactivate' ? mockPlatformManagementService.reactivateUser(user.id) :
      { ok: false, error: 'Unsupported action.' };

    if (result.ok) {
      showToast('User status updated successfully.', 'success');
      setActiveModal(null);
    } else {
      showToast(result.error || 'Operation failed.', 'error');
    }
    setIsSubmitting(false);
  };

  return (
    <main className="main-content">
      {/* NAVIGATION BREADCRUMB */}
      <button
        className="forgot-password-link"
        style={{ border: 'none', background: 'none', cursor: 'pointer', marginBottom: '1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: '#2563eb' }}
        onClick={() => navigate('/platform/users')}
      >
        <ArrowLeft size={16} /> Back to Users Directory
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
            backgroundColor: isDentist ? '#e0f2fe' : '#f3e8ff',
            color: isDentist ? '#0369a1' : '#7e22ce',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
          }}>
            {initials}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>{user.fullName}</h1>
              <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', backgroundColor: '#f1f5f9', borderRadius: '6px', fontFamily: 'monospace', color: '#475569', fontWeight: 600 }}>
                {user.userNumber}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Subscriber: <strong>{subscriber?.businessName || 'Unassigned'}</strong></span>
              <span>•</span>
              <span>Registered on {user.registeredAt}</span>
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem' }}>
              <StatusBadge status={user.accountStatus} />
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
                backgroundColor: isDentist ? '#f0f9ff' : '#faf5ff',
                color: isDentist ? '#0284c7' : '#9333ea',
                fontWeight: 700,
                fontSize: '0.75rem',
                border: isDentist ? '1px solid #bae6fd' : '1px solid #e9d5ff'
              }}>
                {isDentist ? <Stethoscope size={12} /> : <Users size={12} />}
                {user.position || (isDentist ? 'Associate Dentist' : 'Clinic Staff')}
              </span>
              {user.mustChangePassword && <span className="status-badge warning" style={{ fontSize: '0.75rem' }}>Password Reset Flagged</span>}
            </div>
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <button className="btn btn-outline" style={{ width: 'auto', fontSize: '0.85rem' }} onClick={() => { setSelectedClinicIds([...user.clinicIds]); setActiveModal('reassign'); }}>
            <Building2 size={14} style={{ marginRight: '6px', display: 'inline-block' }} /> Reassign Branch
          </button>
          <button className="btn btn-outline" style={{ width: 'auto', fontSize: '0.85rem' }} onClick={() => setActiveModal('reset_password')}>
            <KeyRound size={14} style={{ marginRight: '6px', display: 'inline-block' }} /> Reset Password
          </button>
          {user.accountStatus === 'active' ? (
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
        <div className="module-tabs" role="tablist" aria-label="User detail tabs" style={{ marginBottom: '1.5rem' }}>
          {tabs.map(tab => (
            <button key={tab} role="tab" aria-selected={activeTab === tab} className={`tab-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>{tab}</button>
          ))}
        </div>

        {/* TAB: OVERVIEW */}
        {activeTab === 'Overview' && (
          <div className="sections-grid" style={{ gap: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            <section style={{ padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={18} color="#2563eb" /> Personnel Credentials
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
                <div><span style={{ color: '#64748b' }}>Full Name:</span> <strong style={{ color: '#0f172a', marginLeft: '6px' }}>{user.fullName}</strong></div>
                <div><span style={{ color: '#64748b' }}>Email Address:</span> <strong style={{ color: '#0f172a', marginLeft: '6px' }}>{user.email}</strong></div>
                <div><span style={{ color: '#64748b' }}>Mobile Number:</span> <span style={{ color: '#0f172a', marginLeft: '6px' }}>{user.mobileNumber}</span></div>
                <div><span style={{ color: '#64748b' }}>Role Category:</span> <strong style={{ color: '#0284c7', marginLeft: '6px', textTransform: 'capitalize' }}>{formatStatus(user.role)}</strong></div>
                <div><span style={{ color: '#64748b' }}>Position:</span> <span style={{ color: '#0f172a', marginLeft: '6px' }}>{user.position}</span></div>
              </div>
            </section>

            <section style={{ padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building2 size={18} color="#10b981" /> Subscriber Organization
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
                <div><span style={{ color: '#64748b' }}>Employer Org:</span> <strong style={{ color: '#0f172a', marginLeft: '6px' }}>{subscriber?.businessName || 'Unassigned'}</strong></div>
                <div><span style={{ color: '#64748b' }}>Subscriber Plan:</span> <span style={{ color: '#2563eb', fontWeight: 600, marginLeft: '6px' }}>Available from Subscriber Details</span></div>
                <div><span style={{ color: '#64748b' }}>Subscriber Owner:</span> <span style={{ color: '#0f172a', marginLeft: '6px' }}>{subscriber?.email}</span></div>
                {subscriber && (
                  <button className="btn btn-outline" style={{ width: 'auto', marginTop: '0.5rem', fontSize: '0.75rem', padding: '0.2rem 0.5rem' }} onClick={() => navigate(`/platform/subscribers/${subscriber.id}`)}>
                    Open Subscriber Profile
                  </button>
                )}
              </div>
            </section>

            <section style={{ padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={18} color="#9333ea" /> Account Context & Security
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
                <div><span style={{ color: '#64748b' }}>Account Status:</span> <StatusBadge status={user.accountStatus} /></div>
                <div><span style={{ color: '#64748b' }}>Registered Date:</span> <span style={{ color: '#0f172a', marginLeft: '6px' }}>{user.registeredAt}</span></div>
                <div><span style={{ color: '#64748b' }}>Last Login Timestamp:</span> <strong style={{ color: '#0f172a', marginLeft: '6px' }}>{user.lastLoginAt || 'Not available'}</strong></div>
                <div><span style={{ color: '#64748b' }}>Assigned Branches:</span> <strong style={{ color: '#0f172a', marginLeft: '6px' }}>{clinics.length} Facilities</strong></div>
              </div>
            </section>
          </div>
        )}

        {/* TAB: DESIGNATED BRANCHES */}
        {activeTab === 'Designated Branches' && (
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>Designated Clinic Facilities</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {clinics.map(clinic => (
                <div key={clinic.id} style={{ padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>{clinic.name}</h4>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>{clinic.id}</span>
                    </div>
                    <StatusBadge status={clinic.status || 'unknown'} />
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.75rem' }}>
                    <MapPin size={12} style={{ marginRight: '4px', verticalAlign: '-1px' }} />
                    {clinic.addressLine1 || clinic.city}, {clinic.province}
                  </p>
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {clinic.isPrimaryClinic ? '👑 Main Branch Station' : '🏢 Satellite Branch Station'}
                    </span>
                    <button className="btn btn-outline" style={{ width: 'auto', padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => navigate(`/platform/clinics/${clinic.id}`)}>
                      Branch Console
                    </button>
                  </div>
                </div>
              ))}
              {clinics.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  No clinic branch assignment is available for this membership.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: WORK SCHEDULE & SHIFT */}
        {activeTab === 'Work Schedule & Shift' && (
          <div style={{ maxWidth: '700px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} color="#0284c7" /> Weekly Working Hours Schedule
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {Object.keys(user.workSchedule ?? {}).length === 0 ? (
                <div className="banner-alert info">
                  <strong>Schedule not configured</strong>
                  <p>No authoritative work schedule is stored for this membership.</p>
                </div>
              ) : Object.entries(user.workSchedule ?? {}).map(([day, schedule]) => (
                <div key={day} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderRadius: '8px', backgroundColor: schedule.enabled ? '#f8fafc' : '#f1f5f9', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.875rem' }}>{day}</span>
                  <span style={{ fontSize: '0.85rem', color: schedule.enabled ? '#0284c7' : '#94a3b8', fontWeight: schedule.enabled ? 600 : 400 }}>
                    {schedule.enabled ? `${schedule.startTime || '—'} - ${schedule.endTime || '—'}` : 'Off duty'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: AUDIT ACTIVITY */}
        {activeTab === 'Audit Activity' && (
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
                No recent activity logs for this user.
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL WORKFLOW */}
      <Modal
        open={Boolean(activeModal)}
        title={
          activeModal === 'delete' ? 'Delete Personnel Permanently' :
          activeModal === 'reassign' ? 'Manage Clinic Branch Destination' :
          activeModal === 'reset_password' ? 'Reset User Password' :
          activeModal === 'suspend' ? 'Suspend Personnel Access' :
          activeModal === 'reactivate' ? 'Reactivate Personnel Access' :
          'Personnel Action'
        }
        description={user.fullName}
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
          {activeModal === 'reassign' && (
            <div>
              <label className="form-label" style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>
                Select Designated Clinic Branches
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {allSubscriberClinics.map(clinic => {
                  const isChecked = selectedClinicIds.includes(clinic.id);
                  return (
                    <label
                      key={clinic.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: isChecked ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                        backgroundColor: isChecked ? '#eff6ff' : '#ffffff',
                        cursor: 'pointer'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedClinicIds([...selectedClinicIds, clinic.id]);
                          } else {
                            setSelectedClinicIds(selectedClinicIds.filter(id => id !== clinic.id));
                          }
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>{clinic.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{clinic.addressLine1 || clinic.city} • {clinic.id}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {activeModal === 'reset_password' && (
            <div>
              <p style={{ fontSize: '0.875rem', color: '#334155', lineHeight: 1.5 }}>
                A temporary password will be generated and dispatched to <strong>{user.email}</strong>.
              </p>
            </div>
          )}

          {activeModal === 'suspend' && (
            <div>
              <label className="form-label" style={{ fontWeight: 600 }}>Reason for Suspension *</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="e.g. Schedule pause, administrative hold..."
                value={reason}
                onChange={e => setReason(e.target.value)}
              />
            </div>
          )}

          {activeModal === 'reactivate' && (
            <p style={{ fontSize: '0.875rem', color: '#334155' }}>
              Confirm reactivation of <strong>{user.fullName}</strong>. They will immediately regain operational access to their branch terminals.
            </p>
          )}

          {activeModal === 'delete' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '0.75rem', borderRadius: '8px' }}>
                <ShieldAlert size={18} />
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Permanent Personnel Deletion Warning</span>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#334155', lineHeight: 1.5 }}>
                Are you sure you want to permanently delete <strong>{user.fullName}</strong>?
              </p>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                This will permanently delete their account, credentials, and clinic branch assignment across the platform.
              </p>
            </div>
          )}
        </div>
      </Modal>
    </main>
  );
}
