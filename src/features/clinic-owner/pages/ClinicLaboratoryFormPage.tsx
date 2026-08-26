import { useMemo } from 'react';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { mockClinicService } from '../../clinics/services/mockClinicService';
import { mockPlatformManagementService } from '../../platformManagement/services/mockPlatformManagementService';
import { mockLaboratoryService } from '../../laboratories/services/mockLaboratoryService';
import { resolveClinicOwnerContext } from '../services/tenantScope';
import type { LaboratoryFormData } from '../../laboratories/types';
import { ClinicLaboratoryStepper } from '../components/ClinicLaboratoryStepper';

interface Props {
  loggedClinicName: string;
  loggedUserEmail: string;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  onBack: () => void;
  mode?: 'create' | 'edit';
  laboratoryId?: string;
}

export function ClinicLaboratoryFormPage({
  loggedClinicName,
  loggedUserEmail,
  showToast,
  onBack,
  mode = 'create',
  laboratoryId
}: Props) {
  const ownerContext = useMemo(
    () => resolveClinicOwnerContext(loggedUserEmail, loggedClinicName),
    [loggedUserEmail, loggedClinicName]
  );
  const subscriberId = ownerContext.subscriberId;
  const subscriber = ownerContext.subscriber;

  const planCode = useMemo(() => {
    const raw = subscriber?.planId || 'Max';
    if (/max/i.test(raw)) return 'max';
    if (/plus/i.test(raw)) return 'plus';
    return 'basic';
  }, [subscriber]);

  const maxAllowedLabs = planCode === 'max' ? Infinity : planCode === 'plus' ? 2 : 0;
  const existingLabsCount = useMemo(() => {
    return subscriberId ? mockLaboratoryService.getLaboratoriesBySubscriberId(subscriberId).length : 0;
  }, [subscriberId]);

  const isLabQuotaReached = mode === 'create' && existingLabsCount >= maxAllowedLabs;

  const laboratory = laboratoryId ? mockLaboratoryService.getLaboratoryById(laboratoryId) || undefined : undefined;

  if (!subscriberId) {
    return (
      <div className="dashboard-panel" style={{ margin: 0, padding: 'var(--card-pad)', borderRadius: 'var(--radius-lg)' }}>
        <h3 style={{ marginTop: 0 }}>
          {ownerContext.status === 'pending_approval' ? 'Account approval in progress' : 'No subscriber context found'}
        </h3>
        <p style={{ marginBottom: 0, color: 'var(--text-secondary)' }}>
          {ownerContext.message ||
            'This clinic owner account is missing subscriber linkage, so the dental laboratory workflow cannot continue yet.'}
        </p>
      </div>
    );
  }

  if (mode === 'edit' && (!laboratory || laboratory.subscriberId !== subscriberId)) {
    return (
      <div className="dashboard-panel" style={{ margin: 0, padding: 'var(--card-pad)', borderRadius: 'var(--radius-lg)' }}>
        <h3 style={{ marginTop: 0 }}>Laboratory record not found</h3>
        <p style={{ marginBottom: 0, color: 'var(--text-secondary)' }}>
          The requested dental laboratory could not be loaded for this clinic owner workspace.
        </p>
        <div style={{ marginTop: '1rem' }}>
          <button type="button" className="btn btn-outline" style={{ width: 'auto' }} onClick={onBack}>
            Return to Dental Laboratories
          </button>
        </div>
      </div>
    );
  }

  const subscribers = mockPlatformManagementService.listSubscribers().filter((subscriber) => subscriber.id === subscriberId);
  const clinics = mockClinicService.listClinics().filter((clinic) => clinic.subscriberId === subscriberId);

  const save = (data: LaboratoryFormData, draft = false, allowPendingOverride = false) => {
    if (mode === 'create' && isLabQuotaReached) {
      showToast(
        maxAllowedLabs === 0
          ? `Laboratory creation blocked: The Basic Plan does not include partner dental laboratories. Please upgrade to Plus (2 Labs) or Max Plan (Unlimited Labs).`
          : `Laboratory creation blocked: Your ${planCode.toUpperCase()} Plan limit of ${maxAllowedLabs} laboratories has been reached. Please upgrade to Max Plan for unlimited laboratories.`,
        'warning'
      );
      return;
    }

    const normalized = { ...data, subscriberId };
    const result =
      mode === 'create'
        ? mockLaboratoryService.createLaboratory(normalized, draft, allowPendingOverride)
        : mockLaboratoryService.updateLaboratory(laboratory!.id, normalized);

    if (!result.ok || !result.data) {
      showToast(result.error || 'Laboratory could not be saved.', 'error');
      return;
    }

    showToast(
      result.warning ||
        (mode === 'create'
          ? draft
            ? `Laboratory draft ${result.data.laboratoryNumber} saved successfully.`
            : `Laboratory ${result.data.laboratoryNumber} created successfully.`
          : `Laboratory ${result.data.laboratoryNumber} updated successfully.`),
      result.warning ? 'warning' : 'success'
    );
    onBack();
  };

  return (
    <div style={{ display: 'grid', gap: '1.25rem' }}>
      {isLabQuotaReached && (
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
              Plan Laboratory Limit Reached ({existingLabsCount} / {maxAllowedLabs === Infinity ? 'Unlimited' : maxAllowedLabs})
            </strong>
            <span style={{ fontSize: '0.85rem' }}>
              {maxAllowedLabs === 0
                ? <>Your current <strong>{planCode.toUpperCase()} Plan</strong> tier does not include partner laboratory connections. Please upgrade to the <strong>Plus Plan (2 Labs)</strong> or <strong>Max Plan (Unlimited)</strong> to connect dental laboratories.</>
                : <>Your current <strong>{planCode.toUpperCase()} Plan</strong> tier supports up to <strong>{maxAllowedLabs} dental laboratories</strong>. You have reached your allocated quota. Please upgrade to the <strong>Max Plan</strong> for unlimited laboratory integrations.</>
              }
            </span>
          </div>
        </div>
      )}
      <div
        className="dashboard-panel"
        style={{
          margin: 0,
          padding: 'var(--card-pad)',
          borderRadius: 'var(--radius-lg)',
          display: 'grid',
          gap: '1rem'
        }}
      >
        <button type="button" className="btn btn-outline" onClick={onBack} style={{ width: 'fit-content', padding: '0.5rem 1rem' }}>
          <ArrowLeft size={16} />
          Back to Dental Laboratories
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
            {mode === 'create' ? 'Dental Laboratories' : 'Edit Laboratory'}
          </span>
          <h1 style={{ margin: 0, fontSize: '1.9rem', fontWeight: 800 }}>
            {mode === 'create' ? 'Add New Laboratory' : `Edit ${laboratory?.name || 'Laboratory'}`}
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            {mode === 'create'
              ? `Create a new dental laboratory under ${loggedClinicName}.`
              : 'Update laboratory ownership, contacts, services, turnaround settings, and clinic connections.'}
          </p>
        </div>
      </div>

      <ClinicLaboratoryStepper
        mode={mode}
        laboratory={laboratory}
        subscriberId={subscriberId}
        subscribers={subscribers}
        clinics={clinics}
        onCancel={onBack}
        onSave={save}
      />
    </div>
  );
}
