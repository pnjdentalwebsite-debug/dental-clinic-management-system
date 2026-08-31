import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { AddBranchStepper } from '../components/AddBranchStepper';
import { useClinicOwnerRead } from '../realData/ClinicOwnerReadProvider';
import {
  ClinicOwnerApiError,
  clinicBranchHoursToForm,
  clinicBranchInputFromForm,
  createClinicBranch,
  getClinicBranchDetail,
  updateClinicBranch,
  type ClinicOwnerClinicBranch,
  type ClinicOwnerQuotaLimit,
} from '../../../infrastructure/supabase/clinicOwnerApi';
import type { ClinicFormData } from '../../clinics/types';

interface Props {
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  onBack: () => void;
  mode?: 'create' | 'edit' | 'view';
  branchId?: string;
}

type DetailStatus = 'idle' | 'loading' | 'ready' | 'not_found' | 'unavailable';

function detailToFormData(branch: ClinicOwnerClinicBranch): ClinicFormData {
  return {
    subscriberId: '', primaryOwnerUserId: '', branchType: branch.branchType, isPrimaryClinic: branch.isPrimary,
    name: branch.name, legalBusinessName: branch.legalBusinessName ?? '', email: branch.email,
    contactNumber: branch.contactNumber, alternativeContactNumber: branch.alternativeContactNumber ?? '',
    addressLine1: branch.addressLine1, addressLine2: branch.addressLine2 ?? '', barangay: branch.barangay ?? '',
    city: branch.city, province: branch.province, postalCode: branch.postalCode ?? '', country: branch.country,
    timezone: branch.timezone, description: branch.description ?? '', logoFileName: '', logoFileType: '',
    visibility: branch.visibility, businessHours: clinicBranchHoursToForm(branch.businessHours),
    dentistUserIds: [], staffUserIds: [],
  };
}

function quotaMessage(activeUsage: number, limit: ClinicOwnerQuotaLimit | undefined) {
  if (!limit) return null;
  if (limit.kind === 'number') return `${activeUsage} / ${limit.value}`;
  if (limit.kind === 'unlimited') return `${activeUsage} / Unlimited`;
  if (limit.kind === 'not_included') return `${activeUsage} / Not included`;
  return 'Unavailable';
}

export function ClinicBranchCreatePage({ showToast, onBack, mode = 'create', branchId }: Props) {
  const ownerRead = useClinicOwnerRead();
  const bootstrap = ownerRead.bootstrap;
  const [savingBranch, setSavingBranch] = useState(false);
  const [detailStatus, setDetailStatus] = useState<DetailStatus>(mode === 'create' ? 'ready' : 'idle');
  const [detail, setDetail] = useState<ClinicOwnerClinicBranch | null>(null);

  useEffect(() => {
    if (mode === 'create') {
      setDetail(null);
      setDetailStatus('ready');
      return undefined;
    }
    if (ownerRead.status !== 'ready' || !branchId) return undefined;
    let current = true;
    setDetail(null);
    setDetailStatus('loading');
    void getClinicBranchDetail(branchId)
      .then((next) => {
        if (!current) return;
        setDetail(next);
        setDetailStatus('ready');
      })
      .catch((error: unknown) => {
        if (!current) return;
        setDetailStatus(error instanceof ClinicOwnerApiError && error.code === 'CLINIC_NOT_FOUND' ? 'not_found' : 'unavailable');
      });
    return () => { current = false; };
  }, [branchId, mode, ownerRead.status]);

  const initialData = useMemo(() => detail ? detailToFormData(detail) : null, [detail]);
  const clinicQuota = bootstrap?.quotas.clinics;
  const quotaDisplay = quotaMessage(clinicQuota?.activeUsage ?? 0, clinicQuota?.limit);
  const quotaReached = mode === 'create' && (clinicQuota?.limit.kind === 'not_included'
    || (clinicQuota?.limit.kind === 'number' && clinicQuota.activeUsage >= clinicQuota.limit.value));

  const handleSaveBranch = async (data: ClinicFormData, draft = false) => {
    if (mode === 'view') return onBack();
    const branchToUpdate = mode === 'edit' ? detail : null;
    if (mode === 'edit' && !branchToUpdate) return;
    setSavingBranch(true);
    try {
      const input = clinicBranchInputFromForm(data);
      const saved = branchToUpdate
        ? await updateClinicBranch(branchToUpdate.id, input)
        : await createClinicBranch({ ...input, saveMode: draft ? 'draft' : 'active' });
      await ownerRead.refresh();
      showToast(mode === 'edit'
        ? `Branch ${saved.clinicNumber} updated successfully.`
        : draft ? `Branch draft ${saved.clinicNumber} saved successfully.` : `Branch ${saved.clinicNumber} created successfully.`, draft ? 'info' : 'success');
      onBack();
    } catch (error) {
      showToast(error instanceof ClinicOwnerApiError ? error.message : 'Branch service is temporarily unavailable. Please try again.', 'error');
    } finally {
      setSavingBranch(false);
    }
  };

  const pageEyebrow = mode === 'view' ? 'Branch Details' : mode === 'edit' ? 'Edit Branch' : 'Clinic Branches';
  const pageTitle = mode === 'view' ? 'View Branch' : mode === 'edit' ? 'Edit Branch' : 'Add New Branch';
  const organizationName = bootstrap?.subscriber.businessName || 'your organization';
  const pageDescription = mode === 'view' ? 'Review this RLS-protected branch using the existing guided workflow.'
    : mode === 'edit' ? `Update the operational branch profile for ${detail?.name || organizationName}.`
      : `Create a new operational branch under ${organizationName}.`;

  return <div style={{ display: 'grid', gap: '1.25rem' }}>
    <div className="dashboard-panel" style={{ margin: 0, padding: 'var(--card-pad)', borderRadius: 'var(--radius-lg)', display: 'grid', gap: '1rem' }}>
      <button type="button" className="btn btn-outline" onClick={onBack} style={{ width: 'fit-content', padding: '0.5rem 1rem' }}><ArrowLeft size={16} /> Back to Clinic Branches</button>
      <div style={{ display: 'grid', gap: '0.35rem' }}>
        <span style={{ fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--primary)' }}>{pageEyebrow}</span>
        <h1 style={{ margin: 0, fontSize: '1.9rem', fontWeight: 800 }}>{pageTitle}</h1>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{pageDescription}</p>
      </div>
    </div>

    {quotaReached && <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', color: '#92400e' }}>
      <ShieldAlert size={28} style={{ color: '#d97706', flexShrink: 0 }} />
      <div><strong style={{ display: 'block', color: '#78350f' }}>Current plan clinic limit reached ({quotaDisplay})</strong><span style={{ fontSize: '0.85rem' }}>The server will confirm current plan eligibility when you save a branch.</span></div>
    </div>}

    {ownerRead.status !== 'ready' || !bootstrap ? <div className="dashboard-panel" role={ownerRead.loading ? 'status' : 'alert'} style={{ margin: 0, padding: 'var(--card-pad)', borderRadius: 'var(--radius-lg)' }}>
      <h3 style={{ marginTop: 0 }}>{ownerRead.loading ? 'Loading branch access…' : 'Branch access unavailable'}</h3>
      <p style={{ marginBottom: 0, color: 'var(--text-secondary)' }}>{ownerRead.loading ? 'Loading your RLS-protected Clinic Owner context.' : ownerRead.error}</p>
    </div> : detailStatus === 'loading' || detailStatus === 'idle' ? <div className="dashboard-panel" role="status" style={{ margin: 0, padding: 'var(--card-pad)', borderRadius: 'var(--radius-lg)' }}>Loading the current branch record…</div>
      : detailStatus === 'not_found' ? <div className="dashboard-panel" role="alert" style={{ margin: 0, padding: 'var(--card-pad)', borderRadius: 'var(--radius-lg)' }}><h3 style={{ marginTop: 0 }}>Branch record not found</h3><p style={{ marginBottom: 0, color: 'var(--text-secondary)' }}>This branch is unavailable in your authorized Clinic Owner scope.</p></div>
        : detailStatus === 'unavailable' ? <div className="dashboard-panel" role="alert" style={{ margin: 0, padding: 'var(--card-pad)', borderRadius: 'var(--radius-lg)' }}><h3 style={{ marginTop: 0 }}>Branch service unavailable</h3><p style={{ marginBottom: 0, color: 'var(--text-secondary)' }}>The branch could not be loaded. No local data was substituted.</p></div>
          : <section className="clinic-dashboard-panel" aria-label="Branch registration stepper"><AddBranchStepper ownerDisplayName={bootstrap.owner.displayName} mode={mode} initialData={initialData} businessHoursConfigured={detail?.businessHoursConfigured ?? true} branchNumberPreview={detail?.clinicNumber} saving={savingBranch} renderMode="page" onClose={onBack} onSave={handleSaveBranch} /></section>}
  </div>;
}
