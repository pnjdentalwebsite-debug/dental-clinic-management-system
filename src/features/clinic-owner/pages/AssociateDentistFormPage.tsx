import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Building2, CalendarDays, FileText, IdCard, Mail, Phone, ShieldAlert, Stethoscope, User, type LucideIcon } from 'lucide-react';
import { useClinicOwnerRead } from '../realData/ClinicOwnerReadProvider';
import { AssociateDentistStepper, type AssociateDentistFormValues } from '../components/AssociateDentistStepper';
import {
  ClinicOwnerAssociateApiError,
  getClinicOwnerAssociateDetail,
  provisionClinicOwnerAssociate,
  updateClinicOwnerAssociate,
  type ClinicOwnerAssociateDetail,
} from '../../../infrastructure/supabase/clinicOwnerAssociateApi';
import { DentistStatusBadge } from '../components/DentistStatusBadge';

interface Props {
  onBack: () => void;
  onEdit?: (membershipId: string) => void;
  showToast?: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  mode?: 'create' | 'edit' | 'view';
  dentistId?: string;
}

type DetailState = 'loading' | 'ready' | 'not_found' | 'error';

const emptyForm = (): AssociateDentistFormValues => ({
  email: '', firstName: '', middleName: '', lastName: '', mobileNumber: '', address: '',
  licenseNumber: '', ptrNumber: '', s2LicenseNumber: '', designation: '', specialization: '',
  calendarColor: '#4f46e5', certificatesAndQualifications: '', clinicIds: [],
});

function formFromDetail(detail: ClinicOwnerAssociateDetail): AssociateDentistFormValues {
  return {
    email: detail.email ?? '', firstName: detail.firstName, middleName: detail.middleName ?? '', lastName: detail.lastName,
    mobileNumber: detail.mobile ?? '', address: detail.address ?? '', licenseNumber: detail.licenseNumber ?? '',
    ptrNumber: detail.ptrNumber ?? '', s2LicenseNumber: detail.s2LicenseNumber ?? '', designation: detail.designation ?? '',
    specialization: detail.specialization ?? '', calendarColor: detail.calendarColor ?? '#4f46e5',
    certificatesAndQualifications: detail.certificatesAndQualifications ?? '', clinicIds: detail.clinics.map((clinic) => clinic.clinicId),
  };
}

function scheduleLabel(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 'Not configured';
  const days = Object.entries(value as Record<string, unknown>)
    .filter(([, schedule]) => schedule && typeof schedule === 'object' && (schedule as Record<string, unknown>).enabled === true)
    .map(([day]) => day);
  return days.length ? days.join(', ') : 'Not configured';
}

function field(value: string | null) { return value || 'Unavailable'; }

export function AssociateDentistFormPage({ onBack, onEdit, showToast, mode = 'create', dentistId }: Props) {
  const ownerRead = useClinicOwnerRead();
  const bootstrap = ownerRead.bootstrap;
  const requiresDetail = mode === 'view' || mode === 'edit';
  const [detail, setDetail] = useState<ClinicOwnerAssociateDetail | null>(null);
  const [detailState, setDetailState] = useState<DetailState>(requiresDetail ? 'loading' : 'ready');
  const [saving, setSaving] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  useEffect(() => {
    if (!requiresDetail) {
      setDetail(null);
      setDetailState('ready');
      return;
    }
    if (ownerRead.status !== 'ready' || !bootstrap) {
      setDetail(null);
      setDetailState(ownerRead.loading ? 'loading' : 'error');
      return;
    }
    let active = true;
    setDetailState('loading');
    void getClinicOwnerAssociateDetail(bootstrap, dentistId || '')
      .then((result) => { if (active) { setDetail(result); setDetailState('ready'); } })
      .catch((error) => {
        if (!active) return;
        setDetail(null);
        setDetailState(error instanceof ClinicOwnerAssociateApiError && error.code === 'ASSOCIATE_NOT_FOUND' ? 'not_found' : 'error');
      });
    return () => { active = false; };
  }, [bootstrap, dentistId, ownerRead.loading, ownerRead.status, requiresDetail]);

  const clinicOptions = useMemo(() => (bootstrap?.clinics ?? [])
    .filter((clinic) => clinic.status === 'active')
    .map((clinic) => ({ id: clinic.id, name: clinic.name, location: [clinic.addressLine1, clinic.city, clinic.province].filter(Boolean).join(', ') || 'Active clinic' })), [bootstrap]);
  const initialData = useMemo(() => mode === 'edit' && detail ? formFromDetail(detail) : emptyForm(), [detail, mode]);

  const submit = async (data: AssociateDentistFormValues) => {
    if (saving) return;
    setSaving(true);
    setMutationError(null);
    try {
      if (mode === 'create') {
        const result = await provisionClinicOwnerAssociate(data);
        await ownerRead.refresh();
        if (result.credentialDelivery.status === 'sent') {
          showToast?.("Associate Dentist created successfully. Initial sign-in instructions were sent to the Associate's email.", 'success');
        } else {
          showToast?.('Associate Dentist created. Credential delivery is awaiting server confirmation.', 'info');
        }
        onEdit?.(result.membershipId);
        return;
      }
      if (!dentistId) throw new ClinicOwnerAssociateApiError('ASSOCIATE_NOT_FOUND');
      const { email: _immutableEmail, ...editableData } = data;
      const result = await updateClinicOwnerAssociate(dentistId, editableData);
      await ownerRead.refresh();
      showToast?.('Associate Dentist changes saved.', 'success');
      onEdit?.(result.membershipId);
    } catch (error) {
      const safe = error instanceof ClinicOwnerAssociateApiError ? error.message : 'Associate Dentist service unavailable. Please try again later.';
      setMutationError(safe);
      showToast?.(safe, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (mode !== 'view' && (ownerRead.status !== 'ready' || !bootstrap || detailState === 'loading')) {
    return <LoadingOrError loading={ownerRead.loading || detailState === 'loading'} error={ownerRead.error} onBack={onBack} />;
  }
  if (requiresDetail && detailState === 'loading') return <LoadingOrError loading onBack={onBack} />;
  if (requiresDetail && detailState === 'not_found') return <NotFound onBack={onBack} />;
  if (requiresDetail && (detailState === 'error' || !detail)) return <LoadingOrError loading={false} error="No mock data was substituted. Please return to the directory and try again." onBack={onBack} />;

  if (mode !== 'view') {
    const label = mode === 'edit' ? 'Edit Associate Dentist' : 'Add Associate Dentist';
    return <div style={{ display: 'grid', gap: '1.25rem' }}>
      <Header title={label} subtitle={mode === 'create' ? 'Create an Associate Dentist through the secure server-owned provisioning flow.' : 'Update this exact real Associate membership. Email and account authority remain immutable.'} onBack={onBack} />
      {mutationError && <div role="alert" className="dashboard-panel" style={{ margin: 0, border: '1px solid var(--danger)' }}><strong>Unable to save Associate Dentist</strong><p style={{ marginBottom: 0 }}>{mutationError}</p></div>}
      <AssociateDentistStepper mode={mode} initialData={initialData} clinicOptions={clinicOptions} saving={saving} onClose={onBack} onSave={(data) => void submit(data)} />
    </div>;
  }

  return <ViewDetail detail={detail!} onBack={onBack} onEdit={() => onEdit?.(detail!.membershipId)} editEnabled={Boolean(onEdit)} />;
}

function LoadingOrError({ loading, error, onBack }: { loading: boolean; error?: string | null; onBack: () => void }) {
  return <div className="dashboard-panel" role={loading ? 'status' : 'alert'}><h2>{loading ? 'Loading Associate Dentist...' : 'Associate Dentist service unavailable'}</h2><p>{loading ? 'Loading the exact RLS-protected Associate membership.' : error || 'No mock data was substituted. Please return to the directory and try again.'}</p>{!loading && <button type="button" className="btn btn-outline" style={{ width: 'auto' }} onClick={onBack}>Back to Associate Dentists</button>}</div>;
}

function NotFound({ onBack }: { onBack: () => void }) {
  return <div className="dashboard-panel" role="alert"><h2>Associate Dentist not found</h2><p>The requested Associate membership is unavailable in this Clinic Owner tenant.</p><button type="button" className="btn btn-outline" style={{ width: 'auto' }} onClick={onBack}>Back to Associate Dentists</button></div>;
}

function ViewDetail({ detail, onBack, onEdit, editEnabled }: { detail: ClinicOwnerAssociateDetail; onBack: () => void; onEdit: () => void; editEnabled: boolean }) {
  return <div style={{ display: 'grid', gap: '1.25rem' }}>
    <Header title={`View Associate ${detail.displayName}`} subtitle="Review this real Associate Dentist profile, professional credentials, account status, and clinic assignments." onBack={onBack} />
    <div className="dashboard-panel" style={{ margin: 0, padding: 'var(--card-pad)', borderRadius: 'var(--radius-lg)', display: 'grid', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}><div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}><div style={{ width: 46, height: 46, borderRadius: 14, display: 'grid', placeItems: 'center', color: detail.calendarColor || 'var(--primary)', background: detail.calendarColor ? `${detail.calendarColor}22` : 'var(--background)' }}><User size={22} /></div><div><h2 style={{ margin: 0, fontSize: '1.25rem' }}>{detail.displayName}</h2><span style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.82rem' }}>{detail.associateNumber || 'Not configured'}</span></div></div><DentistStatusBadge status={detail.accountStatus} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <ReadField icon={Mail} label="Email" value={field(detail.email)} /><ReadField icon={Phone} label="Mobile Number" value={field(detail.mobile)} /><ReadField icon={Stethoscope} label="Designation" value={field(detail.designation)} /><ReadField icon={Stethoscope} label="Specialization" value={field(detail.specialization)} /><ReadField icon={IdCard} label="PRC License" value={field(detail.licenseNumber)} /><ReadField icon={IdCard} label="PTR Number" value={field(detail.ptrNumber)} /><ReadField icon={IdCard} label="S2 License" value={field(detail.s2LicenseNumber)} /><ReadField icon={CalendarDays} label="Weekly Schedule" value={scheduleLabel(detail.workSchedule)} /><ReadField icon={FileText} label="Qualifications" value={field(detail.certificatesAndQualifications)} /><ReadField icon={ShieldAlert} label="Device Restriction" value={detail.deviceRestrictionEnabled ? 'Enabled' : 'Not configured'} /><ReadField icon={ShieldAlert} label="Privileges / Visibility" value="Unavailable" /><ReadField icon={Building2} label="Laboratory Access" value="Unavailable" />
      </div>
      <div style={{ display: 'grid', gap: '0.65rem' }}><h3 style={{ margin: 0, fontSize: '1rem' }}>Assigned Clinics</h3>{detail.clinics.length ? detail.clinics.map((clinic) => <div key={clinic.clinicId} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', padding: '0.75rem 0', borderTop: '1px solid var(--border)' }}><strong>{clinic.clinicName}</strong><span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{clinic.assignmentStatus}</span></div>) : <p style={{ margin: 0, color: 'var(--text-secondary)' }}>No clinic assignments configured.</p>}</div>
      <div><button type="button" className="btn btn-primary" disabled={!editEnabled} title={!editEnabled ? 'Associate edit routing is unavailable' : undefined} style={{ width: 'auto', opacity: editEnabled ? 1 : 0.6, cursor: editEnabled ? 'pointer' : 'not-allowed' }} onClick={onEdit}>Edit Associate</button></div>
    </div>
  </div>;
}

function Header({ title, subtitle, onBack }: { title: string; subtitle: string; onBack: () => void }) {
  return <div className="dashboard-panel" style={{ margin: 0, padding: 'var(--card-pad)', borderRadius: 'var(--radius-lg)', display: 'grid', gap: '1rem', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}><button type="button" className="btn btn-outline" onClick={onBack} style={{ width: 'fit-content', padding: '0.5rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}><ArrowLeft size={16} />Back to Associate Dentists</button><div style={{ display: 'grid', gap: '0.35rem' }}><span style={{ fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--primary)' }}>Associate Details</span><h1 style={{ margin: 0, fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>{title}</h1><p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{subtitle}</p></div></div>;
}

function ReadField({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return <div style={{ display: 'grid', gap: '0.25rem' }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.76rem', color: 'var(--text-muted)' }}><Icon size={14} />{label}</span><strong style={{ fontSize: '0.9rem', overflowWrap: 'anywhere' }}>{value}</strong></div>;
}
