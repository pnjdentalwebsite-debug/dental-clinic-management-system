import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { StaffStepper } from '../components/StaffStepper';
import { mockStaffService } from '../services/mockStaffService';
import { mockPlatformManagementService } from '../../platformManagement/services/mockPlatformManagementService';
import { mockAuditService } from '../../audit/services/mockAuditService';
import { subscriberIdMatches } from '../services/tenantScope';
import { roleAccountProvisioningService } from '../services/roleAccountProvisioningService';
import type { StaffMemberFormData, StaffMemberRecord } from '../types/staffManagement';


interface Props {
  mode?: 'create' | 'edit' | 'view';
  staffId?: string;
  loggedClinicName?: string;
  loggedUserEmail?: string;
  showToast?: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  onBack: () => void;
}

export function StaffFormPage({
  mode = 'create',
  staffId,
  loggedClinicName,
  loggedUserEmail: _loggedUserEmail,
  showToast,
  onBack
}: Props) {
  const [record, setRecord] = useState<StaffMemberRecord | null>(null);
  const [loading, setLoading] = useState(mode !== 'create');
  const [saving, setSaving] = useState(false);

  const users = useMemo(() => mockPlatformManagementService.listUsers(), []);
  const matchedUser = users.find((user: any) => user.email?.toLowerCase() === _loggedUserEmail?.toLowerCase());
  const subscriberId = matchedUser?.subscriberId || matchedUser?.id || '';

  const subscriber = useMemo(() => {
    if (!subscriberId && !_loggedUserEmail) return null;
    const subs = mockPlatformManagementService.listSubscribers();
    return subs.find((s) => s.id === subscriberId || s.email?.toLowerCase() === _loggedUserEmail?.toLowerCase()) || null;
  }, [subscriberId, _loggedUserEmail]);

  const planCode = useMemo(() => {
    const raw = subscriber?.planId || 'Max';
    if (/max/i.test(raw)) return 'max';
    if (/plus/i.test(raw)) return 'plus';
    return 'basic';
  }, [subscriber]);

  const maxAllowedStaff = planCode === 'max' ? Infinity : planCode === 'plus' ? 20 : 3;
  const currentStaffCount = useMemo(() => {
    return mockStaffService
      .getStaffBySubscriberId(subscriberId)
      .filter((s) => s.status === 'active' || !s.status).length;
  }, [subscriberId]);
  const isStaffQuotaReached = mode === 'create' && currentStaffCount >= maxAllowedStaff;

  useEffect(() => {
    if (mode === 'create') {
      setRecord(null);
      setLoading(false);
      return;
    }

    if (!staffId) {
      showToast?.('Staff ID is missing.', 'error');
      onBack();
      return;
    }

    const found = mockStaffService.getStaffById(staffId);
    if (!found || !subscriberIdMatches(found.subscriberId, subscriberId)) {
      showToast?.(`Staff member "${staffId}" was not found.`, 'error');
      onBack();
      return;
    }

    setRecord(found);
    setLoading(false);
  }, [mode, staffId, onBack, showToast]);

  const initialData: StaffMemberFormData = useMemo(() => {
    if (record) {
      return mockStaffService.toFormData(record);
    }
    const empty = mockStaffService.getEmptyFormData();
    if (loggedClinicName && !empty.authorizedClinics.includes(loggedClinicName)) {
      empty.authorizedClinics = [loggedClinicName];
    }
    return empty;
  }, [record, loggedClinicName]);

  const staffNumberPreview = useMemo(() => {
    if (record?.staffNumber) return record.staffNumber;
    return mockStaffService.getNextStaffNumber();
  }, [record]);

  const pageTitle =
    mode === 'view'
      ? 'Staff Member Profile'
      : mode === 'edit'
      ? 'Edit Staff Information'
      : 'Add New Staff Member';

  const pageSubtitle =
    mode === 'view'
      ? 'Review staff role designations, access permissions, and account settings.'
      : mode === 'edit'
      ? 'Modify staff details, clinic/lab assignments, and security preferences.'
      : 'Register a new employee, configure branch assignments, and set system privileges.';

  const handleSave = (formData: StaffMemberFormData, draft = false) => {
    if (mode === 'create' && isStaffQuotaReached) {
      showToast?.(`Staff enrollment blocked: Your ${planCode.toUpperCase()} Plan limit of ${maxAllowedStaff} staff members has been reached. Please upgrade to Max Plan.`, 'warning');
      return;
    }

    setSaving(true);
    try {
      if (mode === 'create') {
        const res = mockStaffService.createStaff(formData, subscriberId, draft);
        if (res.ok) {
          if (!draft && res.staff) {
            const account = roleAccountProvisioningService.provision({
              role: 'staff',
              recordId: res.staff.id,
              email: res.staff.email,
              password: res.staff.password,
              name: `${res.staff.firstName} ${res.staff.lastName}`,
              subscriberId: res.staff.subscriberId,
              clinicNames: res.staff.authorizedClinics,
              status: res.staff.status,
              clinicName: res.staff.authorizedClinics[0]
              , privileges: res.staff.privileges as unknown as Record<string, boolean>
            });
            if (!account.ok) {
              mockStaffService.deleteStaff?.(res.staff.id);
              showToast?.(account.error || 'Staff login account could not be provisioned.', 'error');
              return;
            }
          }
          if (!draft && res.staff) {
            mockAuditService.appendAuditEvent({
              action: 'staff.created',
              category: 'clinic',
              module: 'clinic_staff',
              targetType: 'staff',
              targetId: res.staff.id,
              targetLabel: res.staff.staffNumber,
              result: 'success',
              severity: 'low',
              summary: `Staff member ${res.staff.staffNumber} (${res.staff.firstName} ${res.staff.lastName}) enrolled${loggedClinicName ? ` under ${loggedClinicName}` : ''}.`
            });
          }
          showToast?.(
            draft
              ? 'Staff member saved as draft successfully!'
              : 'Staff member created and activated successfully!',
            'success'
          );
          onBack();
        } else {
          showToast?.(res.error || 'Failed to save staff member.', 'error');
        }
      } else if (staffId) {
        const res = mockStaffService.updateStaff(staffId, formData, draft);
        if (res.ok) {
          if (!draft && res.staff) {
            const account = roleAccountProvisioningService.provision({
              role: 'staff',
              recordId: res.staff.id,
              email: res.staff.email,
              password: res.staff.password,
              name: `${res.staff.firstName} ${res.staff.lastName}`,
              subscriberId: res.staff.subscriberId,
              clinicNames: res.staff.authorizedClinics,
              status: res.staff.status,
              clinicName: res.staff.authorizedClinics[0]
              , privileges: res.staff.privileges as unknown as Record<string, boolean>
            });
            if (!account.ok) {
              showToast?.(account.error || 'Staff login account could not be synchronized.', 'error');
              return;
            }
          }
          if (!draft && res.staff) {
            mockAuditService.appendAuditEvent({
              action: 'staff.updated',
              category: 'clinic',
              module: 'clinic_staff',
              targetType: 'staff',
              targetId: res.staff.id,
              targetLabel: res.staff.staffNumber,
              result: 'success',
              severity: 'low',
              summary: `Staff member ${res.staff.staffNumber} (${res.staff.firstName} ${res.staff.lastName}) profile updated.`
            });
          }
          showToast?.(
            draft
              ? 'Staff member saved as draft.'
              : 'Staff member updated successfully!',
            'success'
          );
          onBack();
        } else {
          showToast?.(res.error || 'Failed to update staff member.', 'error');
        }
      }
    } catch {
      showToast?.('An unexpected error occurred.', 'error');
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <main className="main-content" style={{ padding: '2rem' }}>
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading staff member information...
        </div>
      </main>
    );
  }

  return (
    <main className="main-content" style={{ display: 'grid', gap: '1.5rem', paddingBottom: '3rem' }}>
      {/* Header bar with Back button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={onBack}
            style={{ width: 'auto', padding: '0.4rem 0.85rem', height: '38px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <ArrowLeft size={16} /> Back to Directory
          </button>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {pageTitle}
            </h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {pageSubtitle}
            </p>
          </div>
        </div>
      </div>

      {isStaffQuotaReached && (
        <div style={{
          backgroundColor: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: '12px',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          color: '#92400e'
        }}>
          <ShieldAlert size={28} style={{ color: '#d97706', flexShrink: 0 }} />
          <div>
            <strong style={{ fontSize: '0.95rem', display: 'block', color: '#78350f', marginBottom: '0.2rem' }}>
              Plan Staff Quota Limit Reached ({currentStaffCount} / {maxAllowedStaff})
            </strong>
            <span style={{ fontSize: '0.85rem' }}>
              Your current <strong>{planCode.toUpperCase()} Plan</strong> tier supports up to <strong>{maxAllowedStaff} active staff accounts</strong>. You have reached your allocated quota. Please upgrade to the <strong>Max Plan</strong> to enroll unlimited staff members.
            </span>
          </div>
        </div>
      )}

      {/* Staff Stepper */}
      <StaffStepper
        mode={mode}
        initialData={initialData}
        staffNumberPreview={staffNumberPreview}
        subscriberId={subscriberId}
        saving={saving}
        onClose={onBack}
        onSave={handleSave}
      />
    </main>
  );
}
