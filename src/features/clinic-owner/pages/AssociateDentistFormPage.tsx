import { useMemo, useState } from 'react';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { mockClinicService } from '../../clinics/services/mockClinicService';
import { mockPlatformManagementService } from '../../platformManagement/services/mockPlatformManagementService';
import { AssociateDentistStepper } from '../components/AssociateDentistStepper';
import { mockAssociateDentistService } from '../services/mockAssociateDentistService';
import { mockAuditService } from '../../audit/services/mockAuditService';
import { subscriberIdMatches } from '../services/tenantScope';
import { roleAccountProvisioningService } from '../services/roleAccountProvisioningService';


interface Props {
  loggedClinicName: string;
  loggedUserEmail: string;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  onBack: () => void;
  mode?: 'create' | 'edit' | 'view';
  dentistId?: string;
}

export function AssociateDentistFormPage({
  loggedClinicName,
  loggedUserEmail,
  showToast,
  onBack,
  mode = 'create',
  dentistId
}: Props) {
  const [saving, setSaving] = useState(false);
  const users = useMemo(() => mockPlatformManagementService.listUsers(), []);
  const matchedUser = users.find((user: any) => user.email?.toLowerCase() === loggedUserEmail?.toLowerCase());
  const subscriberId = useMemo(() => {
    if (matchedUser?.subscriberId || matchedUser?.id) {
      return matchedUser.subscriberId || matchedUser.id || '';
    }

    const clinics = mockClinicService.listClinics();
    const matchedClinic = clinics.find(
      (clinic) =>
        clinic.email?.toLowerCase() === loggedUserEmail?.toLowerCase()
    );
    return matchedClinic?.subscriberId || '';
  }, [loggedUserEmail, matchedUser]);

  const subscriber = useMemo(() => {
    const subs = mockPlatformManagementService.listSubscribers();
    return subs.find((s) => s.id === subscriberId || s.email?.toLowerCase() === loggedUserEmail?.toLowerCase()) || null;
  }, [subscriberId, loggedUserEmail]);

  const planCode = useMemo(() => {
    const raw = subscriber?.planId || 'Max';
    if (/max/i.test(raw)) return 'max';
    if (/plus/i.test(raw)) return 'plus';
    return 'basic';
  }, [subscriber]);

  const maxAllowedDentists = planCode === 'max' ? Infinity : planCode === 'plus' ? 6 : 1;
  const currentDentistsCount = useMemo(() => {
    return mockAssociateDentistService
      .getDentistsBySubscriberId(subscriberId)
      .filter((d) => d.status === 'active' || !d.status).length;
  }, [subscriberId]);
  const isDentistQuotaReached = mode === 'create' && currentDentistsCount >= maxAllowedDentists;

  const effectiveSubscriberId = subscriberId;
  const rawExistingRecord = dentistId ? mockAssociateDentistService.getDentistById(dentistId) : null;
  const existingRecord = rawExistingRecord && subscriberIdMatches(rawExistingRecord.subscriberId, effectiveSubscriberId)
    ? rawExistingRecord
    : null;
  const initialData = mockAssociateDentistService.toFormData(existingRecord || undefined);
  initialData.subscriberId = initialData.subscriberId || effectiveSubscriberId;
  const previewNumber =
    existingRecord?.associateNumber ||
    mockAssociateDentistService.getNextAssociateNumber();

  const title =
    mode === 'view'
      ? `View Associate ${existingRecord ? `${existingRecord.firstName} ${existingRecord.lastName}` : ''}`
      : mode === 'edit'
        ? `Edit ${existingRecord ? `${existingRecord.firstName} ${existingRecord.lastName}` : 'Associate Dentist'}`
        : 'Add New Associate Dentist';

  const subtitle =
    mode === 'view'
      ? 'Review this associate dentist profile, professional credentials, and work schedule.'
      : mode === 'edit'
        ? 'Update the associate dentist profile, licenses, and weekly work availability.'
        : `Create a new associate dentist profile under ${loggedClinicName}.`;

  if (mode !== 'create' && !existingRecord) {
    return (
      <div className="dashboard-panel" style={{ margin: 0, padding: 'var(--card-pad)', borderRadius: 'var(--radius-lg)' }}>
        <h3 style={{ marginTop: 0 }}>Associate dentist not found</h3>
        <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
          The selected associate dentist record could not be loaded for this clinic owner workspace.
        </p>
        <button type="button" className="btn btn-outline" style={{ width: 'auto' }} onClick={onBack}>
          Back to Associate Dentists
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '1.25rem' }}>
      <div
        className="dashboard-panel"
        style={{
          margin: 0,
          padding: 'var(--card-pad)',
          borderRadius: 'var(--radius-lg)',
          display: 'grid',
          gap: '1rem',
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--border)'
        }}
      >
        <button
          type="button"
          className="btn btn-outline"
          onClick={onBack}
          style={{ width: 'fit-content', padding: '0.5rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <ArrowLeft size={16} />
          Back to Associate Dentists
        </button>

        <div style={{ display: 'grid', gap: '0.35rem' }}>
          <span
            style={{
              fontSize: '0.74rem',
              fontWeight: 800,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--primary)'
            }}
          >
            {mode === 'create' ? 'Associate Dentists' : mode === 'edit' ? 'Edit Associate' : 'Associate Details'}
          </span>
          <h1 style={{ margin: 0, fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {title}
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {subtitle}
          </p>
        </div>
      </div>

      {isDentistQuotaReached && (
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
              Plan Associate Dentist Limit Reached ({currentDentistsCount} / {maxAllowedDentists})
            </strong>
            <span style={{ fontSize: '0.85rem' }}>
              Your current <strong>{planCode.toUpperCase()} Plan</strong> tier supports up to <strong>{maxAllowedDentists} active associate {maxAllowedDentists === 1 ? 'dentist' : 'dentists'}</strong>. You have reached your allocated quota. Please upgrade to the <strong>Max Plan</strong> to enroll unlimited dentists.
            </span>
          </div>
        </div>
      )}

      <AssociateDentistStepper
        mode={mode}
        initialData={initialData}
        associateNumberPreview={previewNumber}
        subscriberId={effectiveSubscriberId}
        saving={saving}
        onClose={onBack}
        onSave={(data, draft = false) => {
          if (saving) return;

          if (mode === 'create' && isDentistQuotaReached) {
            showToast(`Dentist enrollment blocked: Your ${planCode.toUpperCase()} Plan limit of ${maxAllowedDentists} dentists has been reached. Please upgrade to Max Plan.`, 'warning');
            return;
          }

          setSaving(true);

          try {
            const payload = {
              ...data,
              subscriberId: data.subscriberId || subscriberId,
              clinicIds: mockClinicService
                .getClinicsBySubscriberId(effectiveSubscriberId)
                .filter((clinic) => (data.authorizedClinics || []).some((name) => String(name).trim().toLowerCase() === String(clinic.name || '').trim().toLowerCase()))
                .map((clinic) => clinic.id)
            };

            const result =
              mode === 'edit' && existingRecord
                ? mockAssociateDentistService.updateDentist(existingRecord.id, payload, loggedUserEmail, draft)
                : mockAssociateDentistService.createDentist(payload, loggedUserEmail, draft);

            if (!result.ok || !result.data) {
              showToast(result.error || 'Associate dentist record could not be saved.', 'error');
              return;
            }

            if (!draft) {
              const account = roleAccountProvisioningService.provision({
                role: 'associate',
                recordId: result.data.id,
                email: result.data.email || '',
                password: result.data.password,
                name: `${result.data.firstName} ${result.data.lastName}`,
                subscriberId: result.data.subscriberId,
                clinicNames: result.data.authorizedClinics,
                status: result.data.status,
                clinicName: result.data.authorizedClinics[0]
                , privileges: result.data.privileges as unknown as Record<string, boolean>
              });
              if (!account.ok) {
                if (mode === 'create') mockAssociateDentistService.deleteDentist(result.data.id);
                showToast(account.error || 'Associate login account could not be provisioned.', 'error');
                return;
              }
            }

            // Audit trail: record dentist create/update in the platform audit ledger
            if (!draft) {
              mockAuditService.appendAuditEvent({
                action: mode === 'edit' ? 'associate_dentist.updated' : 'associate_dentist.created',
                category: 'clinic',
                module: 'clinic_associates',
                targetType: 'associate_dentist',
                targetId: result.data.id,
                targetLabel: result.data.associateNumber,
                result: 'success',
                severity: 'low',
                summary: mode === 'edit'
                  ? `Associate dentist ${result.data.associateNumber} (${result.data.firstName} ${result.data.lastName}) profile updated.`
                  : `Associate dentist ${result.data.associateNumber} (${result.data.firstName} ${result.data.lastName}) enrolled under ${loggedClinicName}.`
              });
            }

            if (draft) {
              showToast(`${result.data.associateNumber} saved as draft.`, 'info');
            } else if (mode === 'edit') {
              showToast(`${result.data.associateNumber} updated successfully.`, 'success');
            } else {
              showToast(`${result.data.associateNumber} created successfully.`, 'success');
            }

            onBack();
          } finally {
            setSaving(false);
          }
        }}

      />
    </div>
  );
}
