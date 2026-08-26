import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Award,
  Building2,
  Calendar,
  CalendarDays,
  Clock,
  Eye,
  EyeOff,
  FileText,
  FlaskConical,
  IdCard,
  Lock,
  Mail,
  MapPin,
  Phone,
  Shield,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Tag,
  User
} from 'lucide-react';
import { ConfirmationDialog } from '../../../components/overlays/ConfirmationDialog';
import { mockClinicService } from '../../clinics/services/mockClinicService';
import { mockLaboratoryService } from '../../laboratories/services/mockLaboratoryService';
import type {
  AssociateDentistFormData,
  AssociateDentistPrivileges
} from '../types/associateDentists';

interface Props {
  mode?: 'create' | 'edit' | 'view';
  initialData: AssociateDentistFormData;
  associateNumberPreview: string;
  subscriberId?: string;
  saving?: boolean;
  onClose: () => void;
  onSave: (data: AssociateDentistFormData, draft?: boolean) => void;
}

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

const steps = [
  {
    id: 1,
    title: 'Personal Information',
    description: 'Identity, contact details, and address for this associate dentist.'
  },
  {
    id: 2,
    title: 'Professional Details',
    description: 'PRC license, PTR, S2, clinical specialty, and calendar tagging.'
  },
  {
    id: 3,
    title: 'Access & Permissions',
    description: 'Authorized clinics, laboratories, and calendar/expenses/patient privileges.'
  },
  {
    id: 4,
    title: 'Work Schedule',
    description: 'Weekly clinic availability for appointment bookings and scheduling.'
  },
  {
    id: 5,
    title: 'Account Settings',
    description: 'Login credentials, password setup, and device restriction settings.'
  }
] as const;

type StepIndex = 0 | 1 | 2 | 3 | 4;

const PRESET_COLORS = [
  '#4f46e5', // Indigo
  '#0d9488', // Teal
  '#0284c7', // Sky Blue
  '#7c3aed', // Purple
  '#e11d48', // Rose
  '#ea580c', // Orange
  '#16a34a', // Green
  '#d97706'  // Amber
];

export function AssociateDentistStepper({
  mode = 'create',
  initialData,
  associateNumberPreview,
  subscriberId,
  saving = false,
  onClose,
  onSave
}: Props) {
  const [step, setStep] = useState<StepIndex>(0);
  const [data, setData] = useState<AssociateDentistFormData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const availableClinics = useMemo(() => {
    try {
      const clinics = subscriberId ? mockClinicService.getClinicsBySubscriberId(subscriberId) : [];
      const filtered = clinics.filter((c: any) => {
        const nameLower = (c.name || '').toLowerCase();
        return !nameLower.includes('northline') && !nameLower.includes('harbor smile') && !nameLower.includes('metro max') && !nameLower.includes('paused care') && !nameLower.includes('legacy dental') && !nameLower.includes('kimberl');
      });
      if (filtered.length > 0) {
        return filtered.map((c: any) => ({
          name: c.name,
          address: c.city ? `${c.city}, ${c.province || 'Philippines'}` : c.address || 'Main Branch Clinic'
        }));
      }
    } catch {
      // ignore
    }
    return [];
  }, [subscriberId]);

  const availableLaboratories = useMemo(() => {
    try {
      const labs = subscriberId ? mockLaboratoryService.getLaboratoriesBySubscriberId(subscriberId) : [];
      if (labs && labs.length > 0) {
        return labs.map((l: any) => ({
          name: l.name,
          location: l.city ? `${l.city}, ${l.province || ''}` : l.address || 'Partner Facility'
        }));
      }
    } catch {
      // ignore
    }
    return [];
  }, [subscriberId]);

  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';
  const isCreateMode = mode === 'create';

  useEffect(() => {
    setData(initialData);
    setErrors({});
    setStep(0);
    setShowPassword(false);
    setLeaveDialogOpen(false);
  }, [initialData]);

  const isDirty = useMemo(
    () => !isViewMode && JSON.stringify(data) !== JSON.stringify(initialData),
    [data, initialData, isViewMode]
  );

  useEffect(() => {
    if (!isDirty || isViewMode) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, isViewMode]);

  const setField = <K extends keyof AssociateDentistFormData>(key: K, value: AssociateDentistFormData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key as string]) return prev;
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  };

  const toggleClinic = (clinicName: string) => {
    setData((prev) => {
      const current = prev.authorizedClinics || [];
      const exists = current.includes(clinicName);
      return {
        ...prev,
        authorizedClinics: exists
          ? current.filter((c) => c !== clinicName)
          : [...current, clinicName]
      };
    });
  };

  const toggleLaboratory = (labName: string) => {
    setData((prev) => {
      const current = prev.authorizedLaboratories || [];
      const exists = current.includes(labName);
      return {
        ...prev,
        authorizedLaboratories: exists
          ? current.filter((l) => l !== labName)
          : [...current, labName]
      };
    });
  };

  const setPrivilege = <K extends keyof AssociateDentistPrivileges>(key: K, value: boolean) => {
    setData((prev) => ({
      ...prev,
      privileges: {
        ...prev.privileges,
        [key]: value
      }
    }));
  };

  const setScheduleField = (
    day: typeof weekDays[number],
    key: 'enabled' | 'startTime' | 'endTime',
    value: boolean | string
  ) => {
    setData((prev) => ({
      ...prev,
      workSchedule: {
        ...prev.workSchedule,
        [day]: {
          ...prev.workSchedule[day],
          [key]: value
        }
      }
    }));
  };

  const applyWeekdayTemplate = () => {
    setData((prev) => ({
      ...prev,
      workSchedule: {
        ...prev.workSchedule,
        Monday: { enabled: true, startTime: '09:00', endTime: '17:00' },
        Tuesday: { enabled: true, startTime: '09:00', endTime: '17:00' },
        Wednesday: { enabled: true, startTime: '09:00', endTime: '17:00' },
        Thursday: { enabled: true, startTime: '09:00', endTime: '17:00' },
        Friday: { enabled: true, startTime: '09:00', endTime: '17:00' },
        Saturday: { enabled: false, startTime: '09:00', endTime: '14:00' },
        Sunday: { enabled: false, startTime: '09:00', endTime: '14:00' }
      }
    }));
  };

  const validateStep = (targetStep: StepIndex) => {
    const nextErrors: Record<string, string> = {};

    if (targetStep === 0) {
      if (!data.lastName.trim()) nextErrors.lastName = 'Last name is required.';
      if (!data.firstName.trim()) nextErrors.firstName = 'First name is required.';
      if (!data.mobileNumber.trim()) nextErrors.mobileNumber = 'Mobile number is required.';
      if (!data.address.trim()) nextErrors.address = 'Address is required.';
    }

    if (targetStep === 1) {
      if (!data.licenseNumber.trim()) nextErrors.licenseNumber = 'PRC license number is required.';
      if (!data.ptrNumber.trim()) nextErrors.ptrNumber = 'PTR number is required.';
      if (!data.s2LicenseNumber.trim()) nextErrors.s2LicenseNumber = 'S2 license number is required.';
      if (!data.designation.trim()) nextErrors.designation = 'Designation is required.';
      if (!data.specialization.trim()) nextErrors.specialization = 'Specialization is required.';
    }

    if (targetStep === 2) {
      if (!data.authorizedClinics || data.authorizedClinics.length === 0) {
        nextErrors.authorizedClinics = 'Please select at least one authorized clinic.';
      }
    }

    if (targetStep === 3) {
      const hasSchedule = weekDays.some((day) => data.workSchedule[day].enabled);
      if (!hasSchedule) {
        nextErrors.workSchedule = 'Please enable at least one available work day.';
      }

      weekDays.forEach((day) => {
        const schedule = data.workSchedule[day];
        if (schedule.enabled && (!schedule.startTime || !schedule.endTime)) {
          nextErrors.workSchedule = 'Each enabled work day must specify both start and end times.';
        }
      });
    }

    if (targetStep === 4) {
      if (!data.email.trim()) {
        nextErrors.email = 'Email address is required.';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
        nextErrors.email = 'Please enter a valid email address.';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const requestClose = () => {
    if (saving) return;
    if (isViewMode || !isDirty) {
      onClose();
      return;
    }
    setLeaveDialogOpen(true);
  };

  const handleNext = () => {
    if (!isViewMode && !validateStep(step)) return;
    setStep((prev) => Math.min(prev + 1, steps.length - 1) as StepIndex);
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 0) as StepIndex);
  };

  const handleSave = (draft = false) => {
    if (saving) return;
    if (!draft && !isViewMode && !validateStep(step)) return;
    onSave(data, draft);
    if (draft) {
      setLeaveDialogOpen(false);
    }
  };

  const renderError = (field: string) =>
    errors[field] ? (
      <span style={{ color: 'var(--danger)', fontSize: '0.74rem', fontWeight: 600, display: 'block', marginTop: '0.15rem', lineHeight: 1.2 }}>
        {errors[field]}
      </span>
    ) : null;

  const labelStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    justifyContent: 'flex-start'
  };

  const submitLabel = isViewMode ? 'Done' : isEditMode ? 'Save Changes' : 'Create Associate Dentist';

  return (
    <>
      <div style={{ display: 'grid', gap: '1.25rem' }}>
        {/* Step Progress Navigation Bar */}
        <div
          className="dashboard-panel"
          style={{
            margin: 0,
            padding: '1.25rem 1.5rem',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--border)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            {steps.map((item, index) => {
              const isActive = index === step;
              const isPast = index < step;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (isViewMode || isPast) setStep(index as StepIndex);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    cursor: isViewMode || isPast ? 'pointer' : 'default',
                    opacity: isActive || isPast ? 1 : 0.6,
                    flex: 1,
                    minWidth: '200px'
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      backgroundColor: isActive ? 'var(--primary)' : isPast ? 'var(--success)' : 'var(--background)',
                      color: isActive || isPast ? '#fff' : 'var(--text-muted)',
                      border: isActive || isPast ? 'none' : '1px solid var(--border)',
                      boxShadow: isActive ? '0 6px 16px rgba(79, 70, 229, 0.25)' : 'none',
                      flexShrink: 0,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {item.id}
                  </div>
                  <div style={{ display: 'grid', gap: '0.1rem' }}>
                    <span style={{ fontSize: '0.86rem', fontWeight: 700, color: isActive ? 'var(--primary)' : 'var(--text-primary)' }}>
                      {item.title}
                    </span>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      Step {item.id} of {steps.length}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Phase Header Card with Associate ID preview */}
        <div
          className="dashboard-panel"
          style={{
            margin: 0,
            padding: 'var(--card-pad)',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--border)',
            display: 'grid',
            gap: '1.25rem'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              borderBottom: '1px solid var(--border)',
              paddingBottom: '1rem'
            }}
          >
            <div style={{ display: 'grid', gap: '0.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'var(--primary)'
                  }}
                >
                  Phase {step + 1}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>•</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{steps[step].description}</span>
              </div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {steps[step].title}
              </h3>
            </div>

            {/* Associate ID Preview Badge */}
            <div
              style={{
                minWidth: '220px',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.06), rgba(20, 184, 166, 0.06))',
                display: 'grid',
                gap: '0.15rem'
              }}
            >
              <span style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Associate ID
              </span>
              <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                {associateNumberPreview}
              </strong>
            </div>
          </div>

          {/* Form Content Steps */}
          <fieldset
            disabled={saving || isViewMode}
            style={{
              border: 'none',
              margin: 0,
              padding: 0,
              minWidth: 0,
              display: 'grid',
              gap: '1.25rem'
            }}
          >
            {/* Step 1: Personal Information */}
            {step === 0 && (
              <div style={{ display: 'grid', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '1.25rem', alignItems: 'start' }}>
                  <label style={labelStyle}>
                    <span className="input-label">Last Name *</span>
                    <div style={{ position: 'relative' }}>
                      <User size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        type="text"
                        placeholder="e.g. Santos"
                        value={data.lastName}
                        onChange={(e) => setField('lastName', e.target.value)}
                        style={{
                          width: '100%',
                          paddingLeft: '2.4rem',
                          height: '42px',
                          borderRadius: 'var(--radius-md)',
                          border: errors.lastName ? '1px solid var(--danger)' : '1px solid var(--border)',
                          backgroundColor: errors.lastName ? 'rgba(239, 68, 68, 0.02)' : 'var(--background)'
                        }}
                      />
                    </div>
                    <div style={{ minHeight: '1.1rem' }}>{renderError('lastName')}</div>
                  </label>

                  <label style={labelStyle}>
                    <span className="input-label">First Name *</span>
                    <div style={{ position: 'relative' }}>
                      <User size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        type="text"
                        placeholder="e.g. Maria Clara"
                        value={data.firstName}
                        onChange={(e) => setField('firstName', e.target.value)}
                        style={{
                          width: '100%',
                          paddingLeft: '2.4rem',
                          height: '42px',
                          borderRadius: 'var(--radius-md)',
                          border: errors.firstName ? '1px solid var(--danger)' : '1px solid var(--border)',
                          backgroundColor: errors.firstName ? 'rgba(239, 68, 68, 0.02)' : 'var(--background)'
                        }}
                      />
                    </div>
                    <div style={{ minHeight: '1.1rem' }}>{renderError('firstName')}</div>
                  </label>

                  <label style={labelStyle}>
                    <span className="input-label">Middle Name</span>
                    <input
                      type="text"
                      placeholder="Optional"
                      value={data.middleName}
                      onChange={(e) => setField('middleName', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0 0.85rem',
                        height: '42px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--background)'
                      }}
                    />
                    <div style={{ minHeight: '1.1rem' }} />
                  </label>

                  <label style={labelStyle}>
                    <span className="input-label">Extension Name</span>
                    <input
                      type="text"
                      placeholder="e.g. Jr., Sr., III"
                      value={data.extensionName}
                      onChange={(e) => setField('extensionName', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0 0.85rem',
                        height: '42px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--background)'
                      }}
                    />
                    <div style={{ minHeight: '1.1rem' }} />
                  </label>

                  <label style={labelStyle}>
                    <span className="input-label">Mobile Number *</span>
                    <div style={{ position: 'relative' }}>
                      <Phone size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        type="text"
                        placeholder="e.g. +63 917 123 4567"
                        value={data.mobileNumber}
                        onChange={(e) => setField('mobileNumber', e.target.value)}
                        style={{
                          width: '100%',
                          paddingLeft: '2.4rem',
                          height: '42px',
                          borderRadius: 'var(--radius-md)',
                          border: errors.mobileNumber ? '1px solid var(--danger)' : '1px solid var(--border)',
                          backgroundColor: errors.mobileNumber ? 'rgba(239, 68, 68, 0.02)' : 'var(--background)'
                        }}
                      />
                    </div>
                    <div style={{ minHeight: '1.1rem' }}>{renderError('mobileNumber')}</div>
                  </label>

                  <label style={labelStyle}>
                    <span className="input-label">Directory Visibility</span>
                    <div style={{ position: 'relative' }}>
                      <Eye size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <select
                        value={data.visibility}
                        onChange={(e) => setField('visibility', e.target.value as AssociateDentistFormData['visibility'])}
                        style={{
                          width: '100%',
                          paddingLeft: '2.4rem',
                          height: '42px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border)',
                          backgroundColor: 'var(--background)'
                        }}
                      >
                        <option value="visible">Visible (Active on roster and scheduling)</option>
                        <option value="hidden">Hidden (Internal reference only)</option>
                      </select>
                    </div>
                    <div style={{ minHeight: '1.1rem' }} />
                  </label>
                </div>

                <label style={labelStyle}>
                  <span className="input-label">Clinic / Practice Address *</span>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={16} style={{ position: 'absolute', left: '0.85rem', top: '0.9rem', color: 'var(--text-muted)' }} />
                    <textarea
                      placeholder="Enter residential or clinic practice address..."
                      value={data.address}
                      onChange={(e) => setField('address', e.target.value)}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.85rem 0.75rem 2.4rem',
                        borderRadius: 'var(--radius-md)',
                        border: errors.address ? '1px solid var(--danger)' : '1px solid var(--border)',
                        backgroundColor: errors.address ? 'rgba(239, 68, 68, 0.02)' : 'var(--background)',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                  <div style={{ minHeight: '1.1rem' }}>{renderError('address')}</div>
                </label>
              </div>
            )}

            {/* Step 2: Professional Information */}
            {step === 1 && (
              <div style={{ display: 'grid', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '1.25rem', alignItems: 'start' }}>
                  <label style={labelStyle}>
                    <span className="input-label">PRC License Number *</span>
                    <div style={{ position: 'relative' }}>
                      <IdCard size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        type="text"
                        placeholder="e.g. PRC-0089123"
                        value={data.licenseNumber}
                        onChange={(e) => setField('licenseNumber', e.target.value)}
                        style={{
                          width: '100%',
                          paddingLeft: '2.4rem',
                          height: '42px',
                          borderRadius: 'var(--radius-md)',
                          border: errors.licenseNumber ? '1px solid var(--danger)' : '1px solid var(--border)',
                          backgroundColor: errors.licenseNumber ? 'rgba(239, 68, 68, 0.02)' : 'var(--background)'
                        }}
                      />
                    </div>
                    <div style={{ minHeight: '1.1rem' }}>{renderError('licenseNumber')}</div>
                  </label>

                  <label style={labelStyle}>
                    <span className="input-label">PTR Number *</span>
                    <div style={{ position: 'relative' }}>
                      <IdCard size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        type="text"
                        placeholder="e.g. PTR-2026-4491"
                        value={data.ptrNumber}
                        onChange={(e) => setField('ptrNumber', e.target.value)}
                        style={{
                          width: '100%',
                          paddingLeft: '2.4rem',
                          height: '42px',
                          borderRadius: 'var(--radius-md)',
                          border: errors.ptrNumber ? '1px solid var(--danger)' : '1px solid var(--border)',
                          backgroundColor: errors.ptrNumber ? 'rgba(239, 68, 68, 0.02)' : 'var(--background)'
                        }}
                      />
                    </div>
                    <div style={{ minHeight: '1.1rem' }}>{renderError('ptrNumber')}</div>
                  </label>

                  <label style={labelStyle}>
                    <span className="input-label">S2 License Number *</span>
                    <div style={{ position: 'relative' }}>
                      <Award size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        type="text"
                        placeholder="e.g. S2-8921-X"
                        value={data.s2LicenseNumber}
                        onChange={(e) => setField('s2LicenseNumber', e.target.value)}
                        style={{
                          width: '100%',
                          paddingLeft: '2.4rem',
                          height: '42px',
                          borderRadius: 'var(--radius-md)',
                          border: errors.s2LicenseNumber ? '1px solid var(--danger)' : '1px solid var(--border)',
                          backgroundColor: errors.s2LicenseNumber ? 'rgba(239, 68, 68, 0.02)' : 'var(--background)'
                        }}
                      />
                    </div>
                    <div style={{ minHeight: '1.1rem' }}>{renderError('s2LicenseNumber')}</div>
                  </label>

                  <label style={labelStyle}>
                    <span className="input-label">Designation *</span>
                    <div style={{ position: 'relative' }}>
                      <Stethoscope size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        type="text"
                        placeholder="e.g. Senior Associate Dentist"
                        value={data.designation}
                        onChange={(e) => setField('designation', e.target.value)}
                        style={{
                          width: '100%',
                          paddingLeft: '2.4rem',
                          height: '42px',
                          borderRadius: 'var(--radius-md)',
                          border: errors.designation ? '1px solid var(--danger)' : '1px solid var(--border)',
                          backgroundColor: errors.designation ? 'rgba(239, 68, 68, 0.02)' : 'var(--background)'
                        }}
                      />
                    </div>
                    <div style={{ minHeight: '1.1rem' }}>{renderError('designation')}</div>
                  </label>

                  <label style={labelStyle}>
                    <span className="input-label">Clinical Specialization *</span>
                    <div style={{ position: 'relative' }}>
                      <Award size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        type="text"
                        placeholder="e.g. Orthodontics, Endodontics, Implantology"
                        value={data.specialization}
                        onChange={(e) => setField('specialization', e.target.value)}
                        style={{
                          width: '100%',
                          paddingLeft: '2.4rem',
                          height: '42px',
                          borderRadius: 'var(--radius-md)',
                          border: errors.specialization ? '1px solid var(--danger)' : '1px solid var(--border)',
                          backgroundColor: errors.specialization ? 'rgba(239, 68, 68, 0.02)' : 'var(--background)'
                        }}
                      />
                    </div>
                    <div style={{ minHeight: '1.1rem' }}>{renderError('specialization')}</div>
                  </label>

                  {/* Calendar Color Tag Selection */}
                  <label style={labelStyle}>
                    <span className="input-label">Calendar Schedule Color Tag</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', height: '42px' }}>
                      <input
                        type="color"
                        value={data.calendarColor || '#4f46e5'}
                        onChange={(e) => setField('calendarColor', e.target.value)}
                        style={{
                          width: '42px',
                          height: '42px',
                          padding: '0.2rem',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border)',
                          cursor: 'pointer',
                          backgroundColor: 'var(--background)'
                        }}
                      />
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {PRESET_COLORS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setField('calendarColor', c)}
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              backgroundColor: c,
                              border: data.calendarColor === c ? '2px solid #000' : '1px solid rgba(0,0,0,0.1)',
                              cursor: 'pointer',
                              padding: 0
                            }}
                            title={c}
                          />
                        ))}
                      </div>
                    </div>
                    <div style={{ minHeight: '1.1rem' }} />
                  </label>
                </div>

                <label style={labelStyle}>
                  <span className="input-label">Certificates & Qualifications</span>
                  <div style={{ position: 'relative' }}>
                    <FileText size={16} style={{ position: 'absolute', left: '0.85rem', top: '0.9rem', color: 'var(--text-muted)' }} />
                    <textarea
                      placeholder="List certifications, master's degrees, training programs, and clinical seminars..."
                      value={data.certificatesAndQualifications}
                      onChange={(e) => setField('certificatesAndQualifications', e.target.value)}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.85rem 0.75rem 2.4rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--background)',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                  <div style={{ minHeight: '1.1rem' }} />
                </label>

                <label style={labelStyle}>
                  <span className="input-label">Alternate Associate IDs (Optional)</span>
                  <div style={{ position: 'relative' }}>
                    <Tag size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="Enter comma-separated IDs (e.g., EXT-101, HMO-202)"
                      value={data.alternateAssociateIds}
                      onChange={(e) => setField('alternateAssociateIds', e.target.value)}
                      style={{
                        width: '100%',
                        paddingLeft: '2.4rem',
                        height: '42px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--background)'
                      }}
                    />
                  </div>
                  <div style={{ minHeight: '1.1rem' }} />
                </label>
              </div>
            )}

            {/* Step 3: Access & Permissions */}
            {step === 2 && (
              <div style={{ display: 'grid', gap: '1.75rem' }}>
                {/* Authorized Clinics Section */}
                <div style={{ display: 'grid', gap: '0.65rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Building2 size={18} style={{ color: 'var(--primary)' }} />
                    <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>Authorized Clinics</strong>
                  </div>
                  <div style={{ display: 'grid', gap: '0.65rem' }}>
                    {availableClinics.map((clinic) => {
                      const isSelected = data.authorizedClinics?.includes(clinic.name);
                      return (
                        <div
                          key={clinic.name}
                          onClick={() => !isViewMode && toggleClinic(clinic.name)}
                          style={{
                            padding: '0.85rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            border: isSelected ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid var(--border)',
                            backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.04)' : 'var(--background)',
                            cursor: isViewMode ? 'default' : 'pointer',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.75rem',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleClinic(clinic.name)}
                            disabled={isViewMode}
                            style={{ marginTop: '0.2rem', cursor: isViewMode ? 'default' : 'pointer' }}
                          />
                          <div style={{ display: 'grid', gap: '0.15rem' }}>
                            <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>{clinic.name}</strong>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{clinic.address}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {renderError('authorizedClinics')}
                </div>

                {/* Authorized Laboratories Section */}
                <div style={{ display: 'grid', gap: '0.65rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FlaskConical size={18} style={{ color: '#0284c7' }} />
                    <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>Authorized Laboratories</strong>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                    {availableLaboratories.map((lab) => {
                      const isSelected = data.authorizedLaboratories?.includes(lab.name);
                      return (
                        <div
                          key={lab.name}
                          onClick={() => !isViewMode && toggleLaboratory(lab.name)}
                          style={{
                            padding: '0.75rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            border: isSelected ? '1px solid rgba(2, 132, 199, 0.4)' : '1px solid var(--border)',
                            backgroundColor: isSelected ? 'rgba(2, 132, 199, 0.04)' : 'var(--background)',
                            cursor: isViewMode ? 'default' : 'pointer',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.75rem',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleLaboratory(lab.name)}
                            disabled={isViewMode}
                            style={{ marginTop: '0.2rem', cursor: isViewMode ? 'default' : 'pointer' }}
                          />
                          <div style={{ display: 'grid', gap: '0.15rem' }}>
                            <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{lab.name}</strong>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lab.location}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Grouped System Privileges Section */}
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={18} style={{ color: 'var(--primary)' }} />
                    <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>System Privileges</strong>
                  </div>

                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {/* Calendar */}
                    <div style={{ padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', backgroundColor: 'var(--background)', display: 'grid', gap: '0.65rem' }}>
                      <strong style={{ fontSize: '0.84rem', color: 'var(--text-primary)' }}>Calendar</strong>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.65rem' }}>
                        <PrivilegeToggle label="View Calendar" checked={data.privileges?.viewCalendar} onChange={(v) => setPrivilege('viewCalendar', v)} disabled={isViewMode} />
                        <PrivilegeToggle label="View Associates" checked={data.privileges?.viewAssociates} onChange={(v) => setPrivilege('viewAssociates', v)} disabled={isViewMode} />
                        <PrivilegeToggle label="View Appointments" checked={data.privileges?.viewAppointments} onChange={(v) => setPrivilege('viewAppointments', v)} disabled={isViewMode} />
                        <PrivilegeToggle label="View Birthdays" checked={data.privileges?.viewBirthdays} onChange={(v) => setPrivilege('viewBirthdays', v)} disabled={isViewMode} />
                        <PrivilegeToggle label="View Follow-ups" checked={data.privileges?.viewFollowUps} onChange={(v) => setPrivilege('viewFollowUps', v)} disabled={isViewMode} />
                        <PrivilegeToggle label="View Events/Schedules" checked={data.privileges?.viewEventsSchedules} onChange={(v) => setPrivilege('viewEventsSchedules', v)} disabled={isViewMode} />
                        <PrivilegeToggle label="View Online Bookings" checked={data.privileges?.viewOnlineBookings} onChange={(v) => setPrivilege('viewOnlineBookings', v)} disabled={isViewMode} />
                      </div>
                    </div>

                    {/* Expenses */}
                    <div style={{ padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', backgroundColor: 'var(--background)', display: 'grid', gap: '0.65rem' }}>
                      <strong style={{ fontSize: '0.84rem', color: 'var(--text-primary)' }}>Expenses</strong>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.65rem' }}>
                        <PrivilegeToggle label="View Expenses" checked={data.privileges?.viewExpenses} onChange={(v) => setPrivilege('viewExpenses', v)} disabled={isViewMode} />
                        <PrivilegeToggle label="Post Expenses" checked={data.privileges?.postExpenses} onChange={(v) => setPrivilege('postExpenses', v)} disabled={isViewMode} />
                        <PrivilegeToggle label="Add Expenses" checked={data.privileges?.addExpenses} onChange={(v) => setPrivilege('addExpenses', v)} disabled={isViewMode} />
                      </div>
                    </div>

                    {/* Patients */}
                    <div style={{ padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', backgroundColor: 'var(--background)', display: 'grid', gap: '0.65rem' }}>
                      <strong style={{ fontSize: '0.84rem', color: 'var(--text-primary)' }}>Patients</strong>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.65rem' }}>
                        <PrivilegeToggle label="View patient contact number, email address and home address" checked={data.privileges?.viewPatientContactInfo} onChange={(v) => setPrivilege('viewPatientContactInfo', v)} disabled={isViewMode} />
                        <PrivilegeToggle label="Edit patient data" checked={data.privileges?.editPatientData} onChange={(v) => setPrivilege('editPatientData', v)} disabled={isViewMode} />
                      </div>
                    </div>

                    {/* Dashboard privileges */}
                    <div style={{ padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', backgroundColor: 'var(--background)', display: 'grid', gap: '0.65rem' }}>
                      <strong style={{ fontSize: '0.84rem', color: 'var(--text-primary)' }}>Dashboard privileges</strong>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.65rem' }}>
                        <PrivilegeToggle label="View patients with balance" checked={data.privileges?.viewPatientsWithBalance} onChange={(v) => setPrivilege('viewPatientsWithBalance', v)} disabled={isViewMode} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Work Schedule (Weekly Availability Matrix) */}
            {step === 3 && (
              <div style={{ display: 'grid', gap: '1.25rem' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CalendarDays size={18} style={{ color: 'var(--primary)' }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Weekly Clinic Availability Schedule
                    </span>
                  </div>
                  {!isViewMode && (
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={applyWeekdayTemplate}
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', height: '32px', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <Sparkles size={14} /> Apply Weekdays (Mon-Fri, 9AM-5PM)
                    </button>
                  )}
                </div>

                <div style={{ display: 'grid', gap: '0.65rem' }}>
                  {weekDays.map((day) => {
                    const schedule = data.workSchedule[day];
                    return (
                      <div
                        key={day}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '150px 110px minmax(0, 1fr) minmax(0, 1fr)',
                          gap: '1rem',
                          alignItems: 'center',
                          padding: '0.75rem 1rem',
                          borderRadius: 'var(--radius-md)',
                          border: schedule.enabled ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid var(--border)',
                          backgroundColor: schedule.enabled ? 'rgba(99, 102, 241, 0.04)' : 'var(--background)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.88rem', color: schedule.enabled ? 'var(--primary)' : 'var(--text-secondary)' }}>
                          <Calendar size={16} />
                          {day}
                        </div>

                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: isViewMode ? 'default' : 'pointer', fontSize: '0.84rem', fontWeight: 600 }}>
                          <input
                            type="checkbox"
                            checked={schedule.enabled}
                            onChange={(e) => setScheduleField(day, 'enabled', e.target.checked)}
                            disabled={isViewMode || saving}
                            style={{ cursor: 'pointer' }}
                          />
                          <span>{schedule.enabled ? 'Active' : 'Off'}</span>
                        </label>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                          <input
                            type="time"
                            value={schedule.startTime}
                            onChange={(e) => setScheduleField(day, 'startTime', e.target.value)}
                            disabled={isViewMode || saving || !schedule.enabled}
                            style={{
                              width: '100%',
                              height: '36px',
                              padding: '0 0.5rem',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--border)',
                              backgroundColor: schedule.enabled ? 'var(--card-bg)' : 'var(--background)',
                              opacity: schedule.enabled ? 1 : 0.5
                            }}
                          />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                          <input
                            type="time"
                            value={schedule.endTime}
                            onChange={(e) => setScheduleField(day, 'endTime', e.target.value)}
                            disabled={isViewMode || saving || !schedule.enabled}
                            style={{
                              width: '100%',
                              height: '36px',
                              padding: '0 0.5rem',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--border)',
                              backgroundColor: schedule.enabled ? 'var(--card-bg)' : 'var(--background)',
                              opacity: schedule.enabled ? 1 : 0.5
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                {errors.workSchedule && (
                  <div
                    style={{
                      padding: '0.65rem 0.9rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--danger-light)',
                      color: 'var(--danger)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <AlertCircle size={16} />
                    {errors.workSchedule}
                  </div>
                )}
              </div>
            )}

            {/* Step 5: Account Settings */}
            {step === 4 && (
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '1.25rem', alignItems: 'start' }}>
                  <label style={labelStyle}>
                    <span className="input-label">Email Address *</span>
                    <div style={{ position: 'relative' }}>
                      <Mail size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        type="email"
                        placeholder="Enter email address"
                        value={data.email}
                        onChange={(e) => setField('email', e.target.value)}
                        style={{
                          width: '100%',
                          paddingLeft: '2.4rem',
                          height: '42px',
                          borderRadius: 'var(--radius-md)',
                          border: errors.email ? '1px solid var(--danger)' : '1px solid var(--border)',
                          backgroundColor: errors.email ? 'rgba(239, 68, 68, 0.02)' : 'var(--background)'
                        }}
                      />
                    </div>
                    <div style={{ minHeight: '1.1rem' }}>{renderError('email')}</div>
                  </label>

                  <label style={labelStyle}>
                    <span className="input-label">Password {isCreateMode ? '' : '(Optional)'}</span>
                    <div style={{ position: 'relative' }}>
                      <Lock size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter password"
                        value={data.password || ''}
                        onChange={(e) => setField('password', e.target.value)}
                        style={{
                          width: '100%',
                          paddingLeft: '2.4rem',
                          paddingRight: '2.4rem',
                          height: '42px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border)',
                          backgroundColor: 'var(--background)'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '0.75rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--text-muted)'
                        }}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <div style={{ minHeight: '1.1rem' }}>{renderError('password')}</div>
                  </label>
                </div>

                {/* Device Restriction Settings */}
                <div
                  style={{
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--background)',
                    display: 'grid',
                    gap: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Shield size={18} style={{ color: 'var(--primary)' }} />
                    <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>Device Restriction Settings</strong>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: isViewMode ? 'default' : 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={data.deviceRestrictionEnabled}
                      onChange={(e) => setField('deviceRestrictionEnabled', e.target.checked)}
                      disabled={isViewMode}
                      style={{ cursor: isViewMode ? 'default' : 'pointer' }}
                    />
                    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Enable Device Restriction
                    </span>
                  </label>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', paddingLeft: '1.8rem' }}>
                    When enabled, this staff will only be able to access the system from approved devices or device groups.
                  </p>
                </div>
              </div>
            )}
          </fieldset>

          {/* Footer Action Controls */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              borderTop: '1px solid var(--border)',
              paddingTop: '1.25rem',
              marginTop: '0.5rem'
            }}
          >
            <button
              type="button"
              className="btn btn-outline"
              onClick={requestClose}
              disabled={saving}
              style={{ width: 'auto', padding: '0.5rem 1.25rem', height: '38px', fontSize: '0.85rem' }}
            >
              {isViewMode ? 'Close' : 'Cancel'}
            </button>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {!isViewMode && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleSave(true)}
                  disabled={saving}
                  style={{ width: 'auto', padding: '0.5rem 1.25rem', height: '38px', fontSize: '0.85rem' }}
                >
                  Save as Draft
                </button>
              )}

              {step > 0 && (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleBack}
                  disabled={saving}
                  style={{ width: 'auto', padding: '0.5rem 1.25rem', height: '38px', fontSize: '0.85rem' }}
                >
                  Back
                </button>
              )}

              {step < steps.length - 1 ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleNext}
                  disabled={saving}
                  style={{ width: 'auto', padding: '0.5rem 1.25rem', height: '38px', fontSize: '0.85rem' }}
                >
                  {isViewMode ? 'Next Section' : 'Continue'}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleSave(false)}
                  disabled={saving}
                  style={{ width: 'auto', padding: '0.5rem 1.5rem', height: '38px', fontSize: '0.85rem' }}
                >
                  {saving ? 'Saving...' : submitLabel}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation modal on unsaved changes */}
      <ConfirmationDialog
        open={leaveDialogOpen}
        title={`Save associate dentist ${isCreateMode ? 'draft' : 'changes'}?`}
        description={`You have unfinished ${isCreateMode ? 'associate dentist setup' : 'associate dentist edits'}.`}
        confirmLabel="Save as Draft"
        cancelLabel="Continue Editing"
        onConfirm={() => handleSave(true)}
        onCancel={() => setLeaveDialogOpen(false)}
        footerPrefix={
          <button
            type="button"
            className="btn btn-outline"
            onClick={onClose}
            disabled={saving}
            style={{ width: 'auto' }}
          >
            Discard
          </button>
        }
      />
    </>
  );
}

function PrivilegeToggle({
  label,
  checked = false,
  onChange,
  disabled
}: {
  label: string;
  checked?: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '0.82rem',
        color: 'var(--text-secondary)',
        cursor: disabled ? 'default' : 'pointer'
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        style={{ cursor: disabled ? 'default' : 'pointer' }}
      />
      <span>{label}</span>
    </label>
  );
}
