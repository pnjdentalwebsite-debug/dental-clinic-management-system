import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Building2,
  CalendarDays,
  Clock,
  Eye,
  EyeOff,
  FlaskConical,
  Lock,
  Mail,
  MapPin,
  Phone,
  PhoneCall,
  Shield,
  ShieldCheck,
  Smartphone,
  Sparkles,
  User
} from 'lucide-react';
import { ConfirmationDialog } from '../../../components/overlays/ConfirmationDialog';
import { mockClinicService } from '../../clinics/services/mockClinicService';
import { mockLaboratoryService } from '../../laboratories/services/mockLaboratoryService';
import type { StaffMemberFormData, SystemPrivileges } from '../types/staffManagement';

interface Props {
  mode?: 'create' | 'edit' | 'view';
  initialData: StaffMemberFormData;
  staffNumberPreview: string;
  subscriberId?: string;
  saving?: boolean;
  onClose: () => void;
  onSave: (data: StaffMemberFormData, draft?: boolean) => void;
}

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

const steps = [
  {
    id: 1,
    title: 'Personal Information',
    description: 'Identity, contact details, and role designation for this staff member.'
  },
  {
    id: 2,
    title: 'Access & Permissions',
    description: 'Authorized clinics, laboratories, and feature access permissions.'
  },
  {
    id: 3,
    title: 'Work Schedule',
    description: 'Weekly clinic shift availability and working hours.'
  },
  {
    id: 4,
    title: 'Account Settings',
    description: 'Login credentials, password setup, and device restriction settings.'
  }
] as const;

type StepIndex = 0 | 1 | 2 | 3;

const STAFF_ROLES = [
  'Dental Assistant',
  'Receptionist',
  'Clinic Administrator',
  'Dental Hygienist',
  'Accountant / Billing Clerk',
  'Office Manager'
];

export function StaffStepper({
  mode = 'create',
  initialData,
  staffNumberPreview,
  subscriberId,
  saving = false,
  onClose,
  onSave
}: Props) {
  const [step, setStep] = useState<StepIndex>(0);
  const [data, setData] = useState<StaffMemberFormData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);

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
    return [
      {
        name: 'Angelo Dental Clinic',
        address: 'Main Branch Clinic, Cavite'
      }
    ];
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

  const setField = <K extends keyof StaffMemberFormData>(key: K, value: StaffMemberFormData[K]) => {
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
      const exists = prev.authorizedClinics.includes(clinicName);
      return {
        ...prev,
        authorizedClinics: exists
          ? prev.authorizedClinics.filter((c) => c !== clinicName)
          : [...prev.authorizedClinics, clinicName]
      };
    });
  };

  const toggleLaboratory = (labName: string) => {
    setData((prev) => {
      const exists = prev.authorizedLaboratories.includes(labName);
      return {
        ...prev,
        authorizedLaboratories: exists
          ? prev.authorizedLaboratories.filter((l) => l !== labName)
          : [...prev.authorizedLaboratories, labName]
      };
    });
  };

  const setPrivilege = <K extends keyof SystemPrivileges>(key: K, value: boolean) => {
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
      if (!data.phoneNumber.trim()) nextErrors.phoneNumber = 'Phone number is required.';
      if (!data.address.trim()) nextErrors.address = 'Address is required.';
    }

    if (targetStep === 1) {
      if (data.authorizedClinics.length === 0) {
        nextErrors.authorizedClinics = 'Please assign at least one authorized clinic.';
      }
    }

    if (targetStep === 2) {
      const hasSchedule = weekDays.some((day) => data.workSchedule?.[day]?.enabled);
      if (!hasSchedule) {
        nextErrors.workSchedule = 'Please enable at least one available work day.';
      }

      weekDays.forEach((day) => {
        const schedule = data.workSchedule?.[day];
        if (schedule?.enabled && (!schedule.startTime || !schedule.endTime)) {
          nextErrors.workSchedule = 'Each enabled work day must specify both start and end times.';
        }
      });
    }

    if (targetStep === 3) {
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

  const submitLabel = isViewMode ? 'Done' : isEditMode ? 'Save Changes' : 'Create Staff Member';

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
                      boxShadow: isActive ? '0 6px 16px rgba(99, 102, 241, 0.25)' : 'none',
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

        {/* Phase Header Card with Staff ID preview */}
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

            {/* Staff ID Preview Badge */}
            <div
              style={{
                minWidth: '200px',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.06), rgba(168, 85, 247, 0.06))',
                display: 'grid',
                gap: '0.15rem'
              }}
            >
              <span style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Staff ID
              </span>
              <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                {staffNumberPreview}
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
                        placeholder="e.g. Dela Cruz"
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
                        placeholder="e.g. Maria Cristina"
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
                        placeholder="e.g. 0917 555 1111"
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
                    <span className="input-label">Phone Number * (Landline / Tel)</span>
                    <div style={{ position: 'relative' }}>
                      <PhoneCall size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        type="text"
                        placeholder="e.g. (046) 471 2281"
                        value={data.phoneNumber}
                        onChange={(e) => setField('phoneNumber', e.target.value)}
                        style={{
                          width: '100%',
                          paddingLeft: '2.4rem',
                          height: '42px',
                          borderRadius: 'var(--radius-md)',
                          border: errors.phoneNumber ? '1px solid var(--danger)' : '1px solid var(--border)',
                          backgroundColor: errors.phoneNumber ? 'rgba(239, 68, 68, 0.02)' : 'var(--background)'
                        }}
                      />
                    </div>
                    <div style={{ minHeight: '1.1rem' }}>{renderError('phoneNumber')}</div>
                  </label>

                  <label style={labelStyle}>
                    <span className="input-label">Role Designation</span>
                    <div style={{ position: 'relative' }}>
                      <Shield size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <select
                        value={data.role}
                        onChange={(e) => setField('role', e.target.value)}
                        style={{
                          width: '100%',
                          paddingLeft: '2.4rem',
                          height: '42px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border)',
                          backgroundColor: 'var(--background)'
                        }}
                      >
                        {STAFF_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div style={{ minHeight: '1.1rem' }} />
                  </label>
                </div>

                <label style={labelStyle}>
                  <span className="input-label">Residential / Contact Address *</span>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={16} style={{ position: 'absolute', left: '0.85rem', top: '0.9rem', color: 'var(--text-muted)' }} />
                    <textarea
                      placeholder="Enter residential or clinic work address..."
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

            {/* Step 2: Access & Permissions */}
            {step === 1 && (
              <div style={{ display: 'grid', gap: '1.75rem' }}>
                {/* Authorized Clinics Section */}
                <div style={{ display: 'grid', gap: '0.65rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Building2 size={18} style={{ color: 'var(--primary)' }} />
                    <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>Authorized Clinics</strong>
                  </div>
                  <div style={{ display: 'grid', gap: '0.65rem' }}>
                    {availableClinics.map((clinic) => {
                      const isSelected = data.authorizedClinics.includes(clinic.name);
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
                      const isSelected = data.authorizedLaboratories.includes(lab.name);
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
                    {/* 1. Progress notes */}
                    <PrivilegeGroup title="Progress notes">
                      <PrivilegeItem
                        label="View progress notes list actions"
                        checked={data.privileges.viewProgressNotesActions}
                        onChange={(val) => setPrivilege('viewProgressNotesActions', val)}
                        disabled={isViewMode}
                      />
                      <PrivilegeItem
                        label="Add new progress note"
                        checked={data.privileges.addNewProgressNote}
                        onChange={(val) => setPrivilege('addNewProgressNote', val)}
                        disabled={isViewMode}
                      />
                      <PrivilegeItem
                        label="View only progress notes"
                        checked={data.privileges.viewOnlyProgressNotes}
                        onChange={(val) => setPrivilege('viewOnlyProgressNotes', val)}
                        disabled={isViewMode}
                      />
                    </PrivilegeGroup>

                    {/* 2. Patient treatment plans */}
                    <PrivilegeGroup title="Patient treatment plans">
                      <PrivilegeItem
                        label="Delete treatment plan"
                        checked={data.privileges.deleteTreatmentPlan}
                        onChange={(val) => setPrivilege('deleteTreatmentPlan', val)}
                        disabled={isViewMode}
                      />
                      <PrivilegeItem
                        label="Edit existing treatment plan"
                        checked={data.privileges.editExistingTreatmentPlan}
                        onChange={(val) => setPrivilege('editExistingTreatmentPlan', val)}
                        disabled={isViewMode}
                      />
                      <PrivilegeItem
                        label="Add new treatment plan"
                        checked={data.privileges.addNewTreatmentPlan}
                        onChange={(val) => setPrivilege('addNewTreatmentPlan', val)}
                        disabled={isViewMode}
                      />
                      <PrivilegeItem
                        label="Generate Progress Note"
                        checked={data.privileges.generateProgressNote}
                        onChange={(val) => setPrivilege('generateProgressNote', val)}
                        disabled={isViewMode}
                      />
                    </PrivilegeGroup>

                    {/* 3. Patient charting */}
                    <PrivilegeGroup title="Patient charting">
                      <PrivilegeItem
                        label="Delete patient chart"
                        checked={data.privileges.deletePatientChart}
                        onChange={(val) => setPrivilege('deletePatientChart', val)}
                        disabled={isViewMode}
                      />
                    </PrivilegeGroup>

                    {/* 4. Patient bills/payments */}
                    <PrivilegeGroup title="Patient bills/payments">
                      <PrivilegeItem
                        label="Add bill"
                        checked={data.privileges.addBill}
                        onChange={(val) => setPrivilege('addBill', val)}
                        disabled={isViewMode}
                      />
                      <PrivilegeItem
                        label="Edit Patient bill"
                        checked={data.privileges.editPatientBill}
                        onChange={(val) => setPrivilege('editPatientBill', val)}
                        disabled={isViewMode}
                      />
                      <PrivilegeItem
                        label="Add Payment"
                        checked={data.privileges.addPayment}
                        onChange={(val) => setPrivilege('addPayment', val)}
                        disabled={isViewMode}
                      />
                      <PrivilegeItem
                        label="Apply Account Credit"
                        checked={data.privileges.applyAccountCredit}
                        onChange={(val) => setPrivilege('applyAccountCredit', val)}
                        disabled={isViewMode}
                      />
                      <PrivilegeItem
                        label="Delete patient bill"
                        checked={data.privileges.deletePatientBill}
                        onChange={(val) => setPrivilege('deletePatientBill', val)}
                        disabled={isViewMode}
                      />
                    </PrivilegeGroup>

                    {/* 5. Patient prescriptions */}
                    <PrivilegeGroup title="Patient prescriptions">
                      <PrivilegeItem
                        label="Delete patient prescription"
                        checked={data.privileges.deletePatientPrescription}
                        onChange={(val) => setPrivilege('deletePatientPrescription', val)}
                        disabled={isViewMode}
                      />
                      <PrivilegeItem
                        label="Create patient prescription"
                        checked={data.privileges.createPatientPrescription}
                        onChange={(val) => setPrivilege('createPatientPrescription', val)}
                        disabled={isViewMode}
                      />
                      <PrivilegeItem
                        label="Edit patient prescription"
                        checked={data.privileges.editPatientPrescription}
                        onChange={(val) => setPrivilege('editPatientPrescription', val)}
                        disabled={isViewMode}
                      />
                    </PrivilegeGroup>

                    {/* 6. Upload attachments / lab results */}
                    <PrivilegeGroup title="Upload attachments / lab results">
                      <PrivilegeItem
                        label="Delete patient attachment"
                        checked={data.privileges.deletePatientAttachment}
                        onChange={(val) => setPrivilege('deletePatientAttachment', val)}
                        disabled={isViewMode}
                      />
                    </PrivilegeGroup>

                    {/* 7. Patient certificates */}
                    <PrivilegeGroup title="Patient certificates">
                      <PrivilegeItem
                        label="Delete patient certificate"
                        checked={data.privileges.deletePatientCertificate}
                        onChange={(val) => setPrivilege('deletePatientCertificate', val)}
                        disabled={isViewMode}
                      />
                      <PrivilegeItem
                        label="Create patient certificate"
                        checked={data.privileges.createPatientCertificate}
                        onChange={(val) => setPrivilege('createPatientCertificate', val)}
                        disabled={isViewMode}
                      />
                      <PrivilegeItem
                        label="Edit patient certificate"
                        checked={data.privileges.editPatientCertificate}
                        onChange={(val) => setPrivilege('editPatientCertificate', val)}
                        disabled={isViewMode}
                      />
                    </PrivilegeGroup>

                    {/* 8. Expenses */}
                    <PrivilegeGroup title="Expenses">
                      <PrivilegeItem
                        label="View Expenses"
                        checked={data.privileges.viewExpenses}
                        onChange={(val) => setPrivilege('viewExpenses', val)}
                        disabled={isViewMode}
                      />
                      <PrivilegeItem
                        label="Post Expenses"
                        checked={data.privileges.postExpenses}
                        onChange={(val) => setPrivilege('postExpenses', val)}
                        disabled={isViewMode}
                      />
                      <PrivilegeItem
                        label="Add Expenses"
                        checked={data.privileges.addExpenses}
                        onChange={(val) => setPrivilege('addExpenses', val)}
                        disabled={isViewMode}
                      />
                    </PrivilegeGroup>

                    {/* 9. Patient privileges */}
                    <PrivilegeGroup title="Patient privileges">
                      <PrivilegeItem
                        label="Can delete patients"
                        checked={data.privileges.canDeletePatients}
                        onChange={(val) => setPrivilege('canDeletePatients', val)}
                        disabled={isViewMode}
                      />
                    </PrivilegeGroup>

                    {/* 10. Dashboard privileges */}
                    <PrivilegeGroup title="Dashboard privileges">
                      <PrivilegeItem
                        label="View patients with balance"
                        checked={data.privileges.viewPatientsWithBalance}
                        onChange={(val) => setPrivilege('viewPatientsWithBalance', val)}
                        disabled={isViewMode}
                      />
                    </PrivilegeGroup>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Work Schedule (Weekly Availability Matrix) */}
            {step === 2 && (
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
                      onClick={applyWeekdayTemplate}
                      className="btn btn-outline"
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', height: 'auto', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <Sparkles size={13} style={{ color: 'var(--primary)' }} />
                      Apply Weekdays (Mon-Fri, 9AM-5PM)
                    </button>
                  )}
                </div>

                <div style={{ display: 'grid', gap: '0.6rem' }}>
                  {weekDays.map((day) => {
                    const schedule = data.workSchedule?.[day] || { enabled: false, startTime: '', endTime: '' };
                    return (
                      <div
                        key={day}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'minmax(110px, 140px) minmax(90px, 120px) 1fr 1fr',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.65rem 0.85rem',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: schedule.enabled ? 'rgba(99, 102, 241, 0.03)' : 'var(--background)',
                          border: schedule.enabled ? '1px solid rgba(99, 102, 241, 0.25)' : '1px solid var(--border)'
                        }}
                      >
                        <strong style={{ fontSize: '0.84rem', color: 'var(--text-primary)' }}>{day}</strong>

                        <button
                          type="button"
                          onClick={() => setScheduleField(day, 'enabled', !schedule.enabled)}
                          disabled={isViewMode || saving}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.35rem',
                            padding: '0.3rem 0.6rem',
                            borderRadius: '9999px',
                            border: 'none',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: isViewMode || saving ? 'default' : 'pointer',
                            backgroundColor: schedule.enabled ? 'rgba(16, 185, 129, 0.12)' : 'rgba(100, 116, 139, 0.12)',
                            color: schedule.enabled ? 'var(--success)' : 'var(--text-muted)'
                          }}
                        >
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: schedule.enabled ? 'var(--success)' : 'var(--text-muted)'
                            }}
                          />
                          {schedule.enabled ? 'Active' : 'Off'}
                        </button>

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

            {/* Step 4: Account Settings & Security */}
            {step === 3 && (
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '1.25rem', alignItems: 'start' }}>
                  <label style={labelStyle}>
                    <span className="input-label">Email Address *</span>
                    <div style={{ position: 'relative' }}>
                      <Mail size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        type="email"
                        placeholder="Enter email address (e.g. staff@pjtanarte.com)"
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
                    <span className="input-label">Password {isCreateMode ? '*' : '(Leave blank to retain)'}</span>
                    <div style={{ position: 'relative' }}>
                      <Lock size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder={isCreateMode ? 'Enter temporary password' : '••••••••'}
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
                          color: 'var(--text-muted)',
                          padding: '2px'
                        }}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <div style={{ minHeight: '1.1rem' }} />
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Smartphone size={18} style={{ color: 'var(--primary)' }} />
                    <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                      Device Restriction Settings
                    </strong>
                  </div>

                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: isViewMode ? 'default' : 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={data.enableDeviceRestriction}
                      onChange={(e) => setField('enableDeviceRestriction', e.target.checked)}
                      disabled={isViewMode || saving}
                      style={{ marginTop: '0.2rem', cursor: isViewMode ? 'default' : 'pointer' }}
                    />
                    <div style={{ display: 'grid', gap: '0.2rem' }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Enable Device Restriction
                      </span>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        When enabled, this staff will only be able to access the system from approved devices or device groups.
                      </p>
                    </div>
                  </label>
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
        title={`Save staff member ${isCreateMode ? 'draft' : 'changes'}?`}
        description={`You have unfinished ${isCreateMode ? 'staff setup' : 'staff edits'}.`}
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

function PrivilegeGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: '0.85rem 1rem',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border)',
        backgroundColor: 'var(--background)',
        display: 'grid',
        gap: '0.65rem'
      }}
    >
      <strong style={{ fontSize: '0.84rem', color: 'var(--text-primary)', textTransform: 'capitalize' }}>
        {title}
      </strong>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.65rem' }}>
        {children}
      </div>
    </div>
  );
}

function PrivilegeItem({
  label,
  checked,
  onChange,
  disabled
}: {
  label: string;
  checked: boolean;
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
