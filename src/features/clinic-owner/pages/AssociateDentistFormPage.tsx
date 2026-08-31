import { useEffect, useState } from 'react';
import { ArrowLeft, Building2, CalendarDays, FileText, IdCard, Mail, Phone, ShieldAlert, Stethoscope, User, type LucideIcon } from 'lucide-react';
import { useClinicOwnerRead } from '../realData/ClinicOwnerReadProvider';
import {
  ClinicOwnerAssociateApiError,
  getClinicOwnerAssociateDetail,
  type ClinicOwnerAssociateDetail,
} from '../../../infrastructure/supabase/clinicOwnerAssociateApi';
import { DentistStatusBadge } from '../components/DentistStatusBadge';

interface Props {
  onBack: () => void;
  mode?: 'create' | 'edit' | 'view';
  dentistId?: string;
}

type DetailState = 'loading' | 'ready' | 'not_found' | 'error';

function scheduleLabel(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 'Not configured';
  const days = Object.entries(value as Record<string, unknown>)
    .filter(([, schedule]) => schedule && typeof schedule === 'object' && (schedule as Record<string, unknown>).enabled === true)
    .map(([day]) => day);
  return days.length ? days.join(', ') : 'Not configured';
}

function field(value: string | null) {
  return value || 'Unavailable';
}

export function AssociateDentistFormPage({ onBack, mode = 'create', dentistId }: Props) {
  const ownerRead = useClinicOwnerRead();
  const bootstrap = ownerRead.bootstrap;
  const [detail, setDetail] = useState<ClinicOwnerAssociateDetail | null>(null);
  const [detailState, setDetailState] = useState<DetailState>(mode === 'view' ? 'loading' : 'ready');

  useEffect(() => {
    if (mode !== 'view') {
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
      .then((result) => {
        if (!active) return;
        setDetail(result);
        setDetailState('ready');
      })
      .catch((error) => {
        if (!active) return;
        setDetail(null);
        setDetailState(error instanceof ClinicOwnerAssociateApiError && error.code === 'ASSOCIATE_NOT_FOUND' ? 'not_found' : 'error');
      });
    return () => { active = false; };
  }, [bootstrap, dentistId, mode, ownerRead.loading, ownerRead.status]);

  if (mode !== 'view') {
    const label = mode === 'edit' ? 'Edit Associate Dentist' : 'Add Associate Dentist';
    return (
      <div style={{ display: 'grid', gap: '1.25rem' }}>
        <Header title={label} subtitle="This workflow is read-only until the secure Associate Dentist provisioning cutover is complete." onBack={onBack} />
        <div className="dashboard-panel" role="status" style={{ margin: 0, padding: 'var(--card-pad)', borderRadius: 'var(--radius-lg)', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <ShieldAlert size={24} style={{ color: 'var(--warning)', flexShrink: 0 }} />
          <div><h2 style={{ margin: 0, fontSize: '1.1rem' }}>{label} unavailable</h2><p style={{ marginBottom: 0, color: 'var(--text-secondary)' }}>Available after secure provisioning cutover. No local record, password, clinic assignment, or account will be created or changed.</p></div>
        </div>
      </div>
    );
  }

  if (detailState === 'loading') {
    return <div className="dashboard-panel" role="status"><h2>Loading Associate Dentist...</h2><p>Loading the exact RLS-protected Associate membership.</p></div>;
  }
  if (detailState === 'not_found') {
    return <div className="dashboard-panel" role="alert"><h2>Associate Dentist not found</h2><p>The requested Associate membership is unavailable in this Clinic Owner tenant.</p><button type="button" className="btn btn-outline" style={{ width: 'auto' }} onClick={onBack}>Back to Associate Dentists</button></div>;
  }
  if (detailState === 'error' || !detail) {
    return <div className="dashboard-panel" role="alert"><h2>Associate Dentist service unavailable</h2><p>No mock data was substituted. Please return to the directory and try again.</p><button type="button" className="btn btn-outline" style={{ width: 'auto' }} onClick={onBack}>Back to Associate Dentists</button></div>;
  }

  return (
    <div style={{ display: 'grid', gap: '1.25rem' }}>
      <Header title={`View Associate ${detail.displayName}`} subtitle="Review this real Associate Dentist profile, professional credentials, account status, and clinic assignments." onBack={onBack} />
      <div className="dashboard-panel" style={{ margin: 0, padding: 'var(--card-pad)', borderRadius: 'var(--radius-lg)', display: 'grid', gap: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}><div style={{ width: 46, height: 46, borderRadius: 14, display: 'grid', placeItems: 'center', color: detail.calendarColor || 'var(--primary)', background: detail.calendarColor ? `${detail.calendarColor}22` : 'var(--background)' }}><User size={22} /></div><div><h2 style={{ margin: 0, fontSize: '1.25rem' }}>{detail.displayName}</h2><span style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.82rem' }}>{detail.associateNumber || 'Not configured'}</span></div></div>
          <DentistStatusBadge status={detail.accountStatus} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <ReadField icon={Mail} label="Email" value={field(detail.email)} />
          <ReadField icon={Phone} label="Mobile Number" value={field(detail.mobile)} />
          <ReadField icon={Stethoscope} label="Designation" value={field(detail.designation)} />
          <ReadField icon={Stethoscope} label="Specialization" value={field(detail.specialization)} />
          <ReadField icon={IdCard} label="PRC License" value={field(detail.licenseNumber)} />
          <ReadField icon={IdCard} label="PTR Number" value={field(detail.ptrNumber)} />
          <ReadField icon={IdCard} label="S2 License" value={field(detail.s2LicenseNumber)} />
          <ReadField icon={CalendarDays} label="Weekly Schedule" value={scheduleLabel(detail.workSchedule)} />
          <ReadField icon={FileText} label="Qualifications" value={field(detail.certificatesAndQualifications)} />
          <ReadField icon={ShieldAlert} label="Device Restriction" value={detail.deviceRestrictionEnabled ? 'Enabled' : 'Not configured'} />
          <ReadField icon={ShieldAlert} label="Privileges / Visibility" value="Unavailable" />
          <ReadField icon={Building2} label="Laboratory Access" value="Unavailable" />
        </div>
        <div style={{ display: 'grid', gap: '0.65rem' }}>
          <h3 style={{ margin: 0, fontSize: '1rem' }}>Assigned Clinics</h3>
          {detail.clinics.length ? detail.clinics.map((clinic) => <div key={clinic.clinicId} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', padding: '0.75rem 0', borderTop: '1px solid var(--border)' }}><strong>{clinic.clinicName}</strong><span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{clinic.assignmentStatus}</span></div>) : <p style={{ margin: 0, color: 'var(--text-secondary)' }}>No clinic assignments configured.</p>}
        </div>
        <div><button type="button" className="btn btn-primary" disabled title="Available after secure provisioning cutover" style={{ width: 'auto', opacity: 0.6, cursor: 'not-allowed' }}>Edit Associate</button></div>
      </div>
    </div>
  );
}

function Header({ title, subtitle, onBack }: { title: string; subtitle: string; onBack: () => void }) {
  return <div className="dashboard-panel" style={{ margin: 0, padding: 'var(--card-pad)', borderRadius: 'var(--radius-lg)', display: 'grid', gap: '1rem', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}><button type="button" className="btn btn-outline" onClick={onBack} style={{ width: 'fit-content', padding: '0.5rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}><ArrowLeft size={16} />Back to Associate Dentists</button><div style={{ display: 'grid', gap: '0.35rem' }}><span style={{ fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--primary)' }}>Associate Details</span><h1 style={{ margin: 0, fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>{title}</h1><p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{subtitle}</p></div></div>;
}

function ReadField({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return <div style={{ display: 'grid', gap: '0.25rem' }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.76rem', color: 'var(--text-muted)' }}><Icon size={14} />{label}</span><strong style={{ fontSize: '0.9rem', overflowWrap: 'anywhere' }}>{value}</strong></div>;
}
