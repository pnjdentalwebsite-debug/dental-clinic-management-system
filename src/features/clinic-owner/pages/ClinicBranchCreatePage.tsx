import { useMemo, useState } from 'react';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { AddBranchStepper } from '../components/AddBranchStepper';
import { mockClinicService } from '../../clinics/services/mockClinicService';
import { mockPlatformManagementService } from '../../platformManagement/services/mockPlatformManagementService';
import { resolveClinicOwnerContext } from '../services/tenantScope';
import { branchSettingsStore } from '../../clinic-subsystem/settings/services/branchSettingsStore';
import { mockAuditService } from '../../audit/services/mockAuditService';
import type { ClinicFormData } from '../../clinics/types';


interface Props {
  loggedClinicName: string;
  loggedUserEmail: string;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  onBack: () => void;
  mode?: 'create' | 'edit' | 'view';
  branchId?: string;
}

export function ClinicBranchCreatePage({
  loggedClinicName,
  loggedUserEmail,
  showToast,
  onBack,
  mode = 'create',
  branchId
}: Props) {
  const [savingBranch, setSavingBranch] = useState(false);

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

  const maxAllowedBranches = planCode === 'max' ? Infinity : planCode === 'plus' ? 3 : 1;

  const subscriberUsers = useMemo(
    () => (subscriberId ? mockPlatformManagementService.getUsersBySubscriberId(subscriberId) : []),
    [subscriberId]
  );
  const existingClinic = useMemo(
    () => (branchId ? mockClinicService.getClinicById(branchId) : null),
    [branchId]
  );
  const existingBranchCount = useMemo(
    () => (subscriberId ? mockClinicService.getClinicsBySubscriberId(subscriberId).length : mockClinicService.listClinics().length),
    [subscriberId]
  );

  const isBranchQuotaReached = mode === 'create' && existingBranchCount >= maxAllowedBranches;

  const initialData = useMemo(
    () => (existingClinic ? mockClinicService.toFormData(existingClinic) : null),
    [existingClinic]
  );

  const handleSaveBranch = (data: ClinicFormData, draft = false) => {
    if (mode === 'view') {
      onBack();
      return;
    }

    if (mode === 'create' && isBranchQuotaReached) {
      showToast(`Branch creation blocked: Your ${planCode.toUpperCase()} Plan limit of ${maxAllowedBranches} branches has been reached. Please upgrade to Max Plan.`, 'warning');
      return;
    }

    if (mode === 'edit' && existingClinic) {
      const currentSnapshot = JSON.stringify(mockClinicService.toFormData(existingClinic));
      const incomingSnapshot = JSON.stringify(data);
      if (currentSnapshot === incomingSnapshot) {
        showToast(`No branch changes detected for ${existingClinic.clinicNumber}.`, 'info');
        return;
      }
    }

    setSavingBranch(true);
    const result =
      mode === 'edit' && existingClinic
        ? mockClinicService.updateClinic(existingClinic.id, data)
        : mockClinicService.createClinic(data, draft, false);

    if (!result.ok || !result.data) {
      setSavingBranch(false);
      showToast(
        result.error || (mode === 'edit' ? 'Branch update failed. Please review the branch fields and try again.' : 'Branch creation failed. Please review the branch fields and try again.'),
        'error'
      );
      return;
    }

    setSavingBranch(false);

    // Eagerly initialize branch settings storage for new branches so defaults are
    // persisted before the workspace is first opened (triggers safeRead → writes defaults).
    if (mode === 'create' && !draft && result.data.id) {
      branchSettingsStore.getSettings(result.data.id);
      mockAuditService.appendAuditEvent({
        action: 'branch.settings_initialized',
        category: 'clinic',
        module: 'clinic_branches',
        targetType: 'clinic',
        targetId: result.data.id,
        targetLabel: result.data.clinicNumber,
        result: 'success',
        severity: 'low',
        summary: `Branch settings storage initialized with defaults for ${result.data.clinicNumber}.`
      });
    }

    showToast(
      mode === 'edit'
        ? `Branch ${result.data.clinicNumber} updated successfully.`
        : draft
          ? `Branch draft ${result.data.clinicNumber} saved successfully. You can continue editing later.`
          : `Branch ${result.data.clinicNumber} created successfully.`,
      mode === 'edit' ? 'success' : draft ? 'info' : 'success'
    );
    onBack();
  };


  const pageEyebrow =
    mode === 'view' ? 'Branch Details' : mode === 'edit' ? 'Edit Branch' : 'Clinic Branches';
  const pageTitle =
    mode === 'view' ? 'View Branch' : mode === 'edit' ? 'Edit Branch' : 'Add New Branch';
  const pageDescription =
    mode === 'view'
      ? 'Review this branch using the same guided workflow as branch creation.'
      : mode === 'edit'
        ? `Update the operational branch profile for ${existingClinic?.name || loggedClinicName}.`
        : `Create a new operational branch under ${loggedClinicName}.`;

  return (
    <div style={{ display: 'grid', gap: '1.25rem' }}>
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
        <button
          type="button"
          className="btn btn-outline"
          onClick={onBack}
          style={{ width: 'fit-content', padding: '0.5rem 1rem' }}
        >
          <ArrowLeft size={16} />
          Back to Clinic Branches
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'start', flexWrap: 'wrap' }}>
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
              {pageEyebrow}
            </span>
            <h1 style={{ margin: 0, fontSize: '1.9rem', fontWeight: 800 }}>{pageTitle}</h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{pageDescription}</p>
          </div>
        </div>
      </div>

      {isBranchQuotaReached && (
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
              Plan Branch Limit Reached ({existingBranchCount} / {maxAllowedBranches})
            </strong>
            <span style={{ fontSize: '0.85rem' }}>
              Your current <strong>{planCode.toUpperCase()} Plan</strong> tier supports up to <strong>{maxAllowedBranches} clinic {maxAllowedBranches === 1 ? 'branch' : 'branches'}</strong>. You have reached your allocated quota. Please upgrade to the <strong>Max Plan</strong> to provision unlimited clinic locations.
            </span>
          </div>
        </div>
      )}

      {!subscriberId ? (
        <div className="dashboard-panel" style={{ margin: 0, padding: 'var(--card-pad)', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ marginTop: 0 }}>
            {ownerContext.status === 'pending_approval' ? 'Account approval in progress' : 'No subscriber context found'}
          </h3>
          <p style={{ marginBottom: 0, color: 'var(--text-secondary)' }}>
            {ownerContext.message ||
              'This clinic owner account is missing subscriber linkage, so branch creation cannot continue yet.'}
          </p>
        </div>
      ) : (mode === 'edit' || mode === 'view') && !existingClinic ? (
        <div className="dashboard-panel" style={{ margin: 0, padding: 'var(--card-pad)', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ marginTop: 0 }}>Branch record not found</h3>
          <p style={{ marginBottom: 0, color: 'var(--text-secondary)' }}>
            The requested branch could not be loaded, so this workflow cannot continue.
          </p>
          <div style={{ marginTop: '1rem' }}>
            <button type="button" className="btn btn-outline" style={{ width: 'auto' }} onClick={onBack}>
              Return to Branch List
            </button>
          </div>
        </div>
      ) : (
        <section className="clinic-dashboard-panel" aria-label="Branch registration stepper">
          <AddBranchStepper
            subscriberId={subscriberId}
            users={subscriberUsers}
            existingBranchCount={existingBranchCount}
            mode={mode}
            initialData={initialData}
            branchNumberPreview={existingClinic?.clinicNumber}
            saving={savingBranch}
            renderMode="page"
            onClose={onBack}
            onSave={handleSaveBranch}
          />
        </section>
      )}
    </div>
  );
}
