import { useEffect, useMemo, useState } from 'react';
import { Building2, FileText, IdCard, Mail, MapPin, Phone, ShieldAlert, Stethoscope, User } from 'lucide-react';
import { ConfirmationDialog } from '../../../components/overlays/ConfirmationDialog';

export interface AssociateDentistFormValues {
  email: string;
  firstName: string;
  middleName: string;
  lastName: string;
  mobileNumber: string;
  address: string;
  licenseNumber: string;
  ptrNumber: string;
  s2LicenseNumber: string;
  designation: string;
  specialization: string;
  calendarColor: string;
  certificatesAndQualifications: string;
  clinicIds: string[];
}

export interface AssociateDentistClinicOption {
  id: string;
  name: string;
  location: string;
}

interface Props {
  mode: 'create' | 'edit';
  initialData: AssociateDentistFormValues;
  clinicOptions: AssociateDentistClinicOption[];
  saving?: boolean;
  onClose: () => void;
  onSave: (data: AssociateDentistFormValues) => void;
}

const steps = [
  ['Personal Information', 'Identity, contact details, and address.'],
  ['Professional Details', 'Professional credentials and calendar tagging.'],
  ['Clinic Assignments', 'Assign this Associate to real active clinics.'],
] as const;

const colors = ['#4f46e5', '#0d9488', '#0284c7', '#7c3aed', '#e11d48', '#ea580c', '#16a34a', '#d97706'];

export function AssociateDentistStepper({ mode, initialData, clinicOptions, saving = false, onClose, onSave }: Props) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);

  useEffect(() => {
    setData(initialData);
    setErrors({});
    setStep(0);
    setLeaveDialogOpen(false);
  }, [initialData]);

  const dirty = useMemo(() => JSON.stringify(data) !== JSON.stringify(initialData), [data, initialData]);
  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [dirty]);

  const setField = <K extends keyof AssociateDentistFormValues>(key: K, value: AssociateDentistFormValues[K]) => {
    setData((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const validate = (index: number) => {
    const next: Record<string, string> = {};
    if (index === 0) {
      if (!data.firstName.trim()) next.firstName = 'First name is required.';
      if (!data.lastName.trim()) next.lastName = 'Last name is required.';
      if (!data.email.trim()) next.email = 'Email address is required.';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) next.email = 'Enter a valid email address.';
    }
    if (index === 1) {
      for (const [key, label] of [['licenseNumber', 'PRC license number'], ['ptrNumber', 'PTR number'], ['s2LicenseNumber', 'S2 license number'], ['designation', 'Designation'], ['specialization', 'Specialization']] as const) {
        if (!data[key].trim()) next[key] = `${label} is required.`;
      }
    }
    if (index === 2 && data.clinicIds.length === 0) next.clinicIds = 'Select at least one active clinic.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const requestClose = () => {
    if (saving) return;
    if (!dirty) onClose();
    else setLeaveDialogOpen(true);
  };

  const submit = () => {
    if (saving || !validate(2)) return;
    onSave(data);
  };

  const inputStyle = (error?: string): React.CSSProperties => ({
    width: '100%', height: '42px', borderRadius: 'var(--radius-md)', border: error ? '1px solid var(--danger)' : '1px solid var(--border)', backgroundColor: 'var(--background)', padding: '0 0.75rem', color: 'var(--text-primary)',
  });
  const labelStyle: React.CSSProperties = { display: 'grid', gap: '0.4rem' };
  const error = (key: string) => errors[key] ? <span style={{ color: 'var(--danger)', fontSize: '0.74rem' }}>{errors[key]}</span> : null;
  const toggleClinic = (clinicId: string) => setField('clinicIds', data.clinicIds.includes(clinicId) ? data.clinicIds.filter((id) => id !== clinicId) : [...data.clinicIds, clinicId]);

  return (
    <>
      <div style={{ display: 'grid', gap: '1.25rem' }}>
        <div className="dashboard-panel" style={{ margin: 0, padding: '1.25rem 1.5rem', borderRadius: 'var(--radius-lg)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {steps.map(([title, description], index) => <button key={title} type="button" onClick={() => (index < step || index === step) && setStep(index)} style={{ flex: 1, minWidth: '190px', border: 'none', background: 'none', padding: 0, textAlign: 'left', cursor: index <= step ? 'pointer' : 'default', opacity: index <= step ? 1 : 0.55 }}><span style={{ display: 'inline-grid', placeItems: 'center', width: 30, height: 30, borderRadius: '50%', color: '#fff', background: index === step ? 'var(--primary)' : index < step ? 'var(--success)' : 'var(--text-muted)', fontWeight: 800 }}>{index + 1}</span><strong style={{ display: 'block', marginTop: '0.45rem', color: 'var(--text-primary)' }}>{title}</strong><span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{description}</span></button>)}
        </div>

        <div className="dashboard-panel" style={{ margin: 0, padding: 'var(--card-pad)', borderRadius: 'var(--radius-lg)', display: 'grid', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
            <div><span style={{ fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.14em', color: 'var(--primary)' }}>PHASE {step + 1}</span><h2 style={{ margin: '0.3rem 0 0', fontSize: '1.25rem' }}>{steps[step][0]}</h2></div>
            {mode === 'create' ? <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', textAlign: 'right' }}><strong style={{ display: 'block', color: 'var(--text-primary)' }}>Associate ID</strong>Assigned securely by the server after creation.</div> : <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', textAlign: 'right' }}><strong style={{ display: 'block', color: 'var(--text-primary)' }}>Identity fields</strong>Email and account identity are read-only.</div>}
          </div>

          <fieldset disabled={saving} style={{ border: 'none', padding: 0, margin: 0, minWidth: 0 }}>
            {step === 0 && <div style={{ display: 'grid', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                <label style={labelStyle}><span className="input-label">Last Name *</span><input aria-label="Last Name" value={data.lastName} onChange={(event) => setField('lastName', event.target.value)} style={inputStyle(errors.lastName)} />{error('lastName')}</label>
                <label style={labelStyle}><span className="input-label">First Name *</span><input aria-label="First Name" value={data.firstName} onChange={(event) => setField('firstName', event.target.value)} style={inputStyle(errors.firstName)} />{error('firstName')}</label>
                <label style={labelStyle}><span className="input-label">Middle Name</span><input aria-label="Middle Name" value={data.middleName} onChange={(event) => setField('middleName', event.target.value)} style={inputStyle()} /></label>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
                <label style={labelStyle}><span className="input-label">{mode === 'edit' ? 'Email (read-only)' : 'Email Address *'}</span><span style={{ position: 'relative' }}><Mail size={16} style={{ position: 'absolute', left: '0.75rem', top: '0.8rem', color: 'var(--text-muted)' }} /><input aria-label="Email Address" readOnly={mode === 'edit'} value={data.email} onChange={(event) => setField('email', event.target.value)} style={{ ...inputStyle(errors.email), paddingLeft: '2.25rem', opacity: mode === 'edit' ? 0.75 : 1 }} /></span>{mode === 'edit' && <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>Email is immutable in the verified backend contract.</span>}{error('email')}</label>
                <label style={labelStyle}><span className="input-label">Mobile Number</span><span style={{ position: 'relative' }}><Phone size={16} style={{ position: 'absolute', left: '0.75rem', top: '0.8rem', color: 'var(--text-muted)' }} /><input aria-label="Mobile Number" value={data.mobileNumber} onChange={(event) => setField('mobileNumber', event.target.value)} style={{ ...inputStyle(), paddingLeft: '2.25rem' }} /></span></label>
              </div>
              <label style={labelStyle}><span className="input-label">Address</span><span style={{ position: 'relative' }}><MapPin size={16} style={{ position: 'absolute', left: '0.75rem', top: '0.85rem', color: 'var(--text-muted)' }} /><textarea aria-label="Address" value={data.address} onChange={(event) => setField('address', event.target.value)} style={{ ...inputStyle(), minHeight: '86px', height: 'auto', padding: '0.75rem 0.75rem 0.75rem 2.25rem', resize: 'vertical' }} /></span></label>
            </div>}

            {step === 1 && <div style={{ display: 'grid', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                <Field icon={IdCard} label="PRC License Number *" value={data.licenseNumber} onChange={(value) => setField('licenseNumber', value)} error={errors.licenseNumber} />
                <Field icon={IdCard} label="PTR Number *" value={data.ptrNumber} onChange={(value) => setField('ptrNumber', value)} error={errors.ptrNumber} />
                <Field icon={IdCard} label="S2 License Number *" value={data.s2LicenseNumber} onChange={(value) => setField('s2LicenseNumber', value)} error={errors.s2LicenseNumber} />
                <Field icon={Stethoscope} label="Designation *" value={data.designation} onChange={(value) => setField('designation', value)} error={errors.designation} />
                <Field icon={Stethoscope} label="Specialization *" value={data.specialization} onChange={(value) => setField('specialization', value)} error={errors.specialization} />
              </div>
              <div style={{ display: 'grid', gap: '0.65rem' }}><span className="input-label">Calendar Color</span><div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap' }}>{colors.map((color) => <button key={color} type="button" aria-label={`Select ${color}`} onClick={() => setField('calendarColor', color)} style={{ width: 30, height: 30, borderRadius: '50%', background: color, border: data.calendarColor === color ? '3px solid var(--text-primary)' : '2px solid transparent', cursor: 'pointer' }} />)}</div></div>
              <label style={labelStyle}><span className="input-label">Certificates and Qualifications</span><span style={{ position: 'relative' }}><FileText size={16} style={{ position: 'absolute', left: '0.75rem', top: '0.85rem', color: 'var(--text-muted)' }} /><textarea aria-label="Certificates and Qualifications" value={data.certificatesAndQualifications} onChange={(event) => setField('certificatesAndQualifications', event.target.value)} style={{ ...inputStyle(), minHeight: '100px', height: 'auto', padding: '0.75rem 0.75rem 0.75rem 2.25rem', resize: 'vertical' }} /></span></label>
              <UnavailableNotice />
            </div>}

            {step === 2 && <div style={{ display: 'grid', gap: '1rem' }}>
              <div><h3 style={{ margin: 0 }}>Authorized Clinics *</h3><p style={{ margin: '0.35rem 0 0', color: 'var(--text-secondary)', fontSize: '0.86rem' }}>Select only real active clinics from this Clinic Owner tenant. The server validates assignments again.</p></div>
              {clinicOptions.length ? <div style={{ display: 'grid', gap: '0.75rem' }}>{clinicOptions.map((clinic) => <label key={clinic.id} data-testid={`clinic-option-${clinic.id}`} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '1rem', border: data.clinicIds.includes(clinic.id) ? '1px solid var(--primary)' : '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: data.clinicIds.includes(clinic.id) ? 'rgba(99, 102, 241, 0.05)' : 'var(--background)', cursor: 'pointer' }}><input type="checkbox" checked={data.clinicIds.includes(clinic.id)} onChange={() => toggleClinic(clinic.id)} aria-label={`Assign ${clinic.name}`} /><span><strong style={{ display: 'block' }}><Building2 size={15} style={{ verticalAlign: '-2px', marginRight: '0.35rem', color: 'var(--primary)' }} />{clinic.name}</strong><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{clinic.location}</span></span></label>)}</div> : <div role="alert" className="dashboard-panel" style={{ margin: 0 }}><strong>No active clinics are available.</strong><p style={{ marginBottom: 0 }}>An Associate Dentist cannot be assigned until an active clinic is available.</p></div>}
              {error('clinicIds')}
              <UnavailableNotice />
            </div>}
          </fieldset>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
            <button type="button" className="btn btn-outline" onClick={requestClose} disabled={saving} style={{ width: 'auto' }}>Cancel</button>
            <div style={{ display: 'flex', gap: '0.75rem' }}>{step > 0 && <button type="button" className="btn btn-outline" onClick={() => setStep((current) => current - 1)} disabled={saving} style={{ width: 'auto' }}>Back</button>}{step < steps.length - 1 ? <button type="button" className="btn btn-primary" onClick={() => validate(step) && setStep((current) => current + 1)} disabled={saving} style={{ width: 'auto' }}>Continue</button> : <button type="button" className="btn btn-primary" onClick={submit} disabled={saving || clinicOptions.length === 0} style={{ width: 'auto' }}>{saving ? 'Saving...' : mode === 'create' ? 'Create Associate Dentist' : 'Save Changes'}</button>}</div>
          </div>
        </div>
      </div>
      <ConfirmationDialog open={leaveDialogOpen} title="Discard Associate Dentist changes?" description="Your unsaved changes will not be stored." confirmLabel="Discard" cancelLabel="Continue Editing" onConfirm={onClose} onCancel={() => setLeaveDialogOpen(false)} />
    </>
  );
}

function Field({ icon: Icon, label, value, onChange, error }: { icon: typeof User; label: string; value: string; onChange: (value: string) => void; error?: string }) {
  return <label style={{ display: 'grid', gap: '0.4rem' }}><span className="input-label">{label}</span><span style={{ position: 'relative' }}><Icon size={16} style={{ position: 'absolute', left: '0.75rem', top: '0.8rem', color: 'var(--text-muted)' }} /><input aria-label={label.replace(' *', '')} value={value} onChange={(event) => onChange(event.target.value)} style={{ width: '100%', height: '42px', borderRadius: 'var(--radius-md)', border: error ? '1px solid var(--danger)' : '1px solid var(--border)', backgroundColor: 'var(--background)', padding: '0 0.75rem 0 2.25rem', color: 'var(--text-primary)' }} /></span>{error && <span style={{ color: 'var(--danger)', fontSize: '0.74rem' }}>{error}</span>}</label>;
}

function UnavailableNotice() {
  return <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '0.82rem' }}><ShieldAlert size={17} style={{ color: 'var(--warning)', flexShrink: 0 }} /><span>Privileges, laboratory access, visibility, work schedules, browser passwords, account status, and lifecycle controls are unavailable in this Add/Edit contract.</span></div>;
}
