import { useEffect, useMemo, useState } from 'react';
import { Building2, Clock3, Mail, MapPinned, Phone, UserRound, X } from 'lucide-react';
import { ConfirmationDialog } from '../../../components/overlays/ConfirmationDialog';
import type { ClinicBranchType, ClinicFormData } from '../../clinics/types';

interface Props {
  ownerDisplayName: string;
  mode?: 'create' | 'edit' | 'view';
  initialData?: ClinicFormData | null;
  businessHoursConfigured?: boolean;
  branchNumberPreview?: string;
  saving?: boolean;
  renderMode?: 'modal' | 'page';
  onClose: () => void;
  onSave: (data: ClinicFormData, draft?: boolean) => void;
}

const branchSteps = [
  { id: 1, title: 'Branch Information', desc: 'Name, type, and branch setup.' },
  { id: 2, title: 'Location', desc: 'Address and clinic placement.' },
  { id: 3, title: 'Contact', desc: 'Email, phone, and branch contact.' },
  { id: 4, title: 'Schedule & Team', desc: 'Working hours and assignments.' }
];

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

type StepIndex = 0 | 1 | 2 | 3;

const buildInitialData = (): ClinicFormData => ({
    subscriberId: '',
    primaryOwnerUserId: '',
    branchType: 'satellite',
    isPrimaryClinic: false,
    visibility: 'visible',
    country: 'Philippines',
    timezone: 'Asia/Manila',
    businessHours: Object.fromEntries(weekDays.map((day) => [day, {
      enabled: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(day),
      openingTime: '09:00', closingTime: '17:00', breakEnabled: false, breakStart: '', breakEnd: '',
    }])),
    name: '', legalBusinessName: '', email: '', contactNumber: '', alternativeContactNumber: '',
    addressLine1: '', addressLine2: '', barangay: '', city: '', province: '', postalCode: '',
    description: '', logoFileName: '', logoFileType: '', dentistUserIds: [], staffUserIds: [],
  });

export function AddBranchStepper({
  ownerDisplayName,
  mode = 'create',
  initialData = null,
  businessHoursConfigured = true,
  branchNumberPreview,
  saving = false,
  renderMode = 'modal',
  onClose,
  onSave
}: Props) {
  const baseData = useMemo(
    () => initialData ?? buildInitialData(),
    [initialData]
  );
  const [step, setStep] = useState<StepIndex>(0);
  const [data, setData] = useState<ClinicFormData>(() => baseData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';
  const isCreateMode = mode === 'create';

  useEffect(() => {
    setData(baseData);
    setErrors({});
    setStep(0);
    setLeaveDialogOpen(false);
  }, [baseData]);

  const branchPreview = branchNumberPreview || 'Generated on save';
  const isDirty = !isViewMode && JSON.stringify(data) !== JSON.stringify(baseData);

  useEffect(() => {
    if (!isDirty || isViewMode) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, isViewMode]);

  const setField = <K extends keyof ClinicFormData>(key: K, value: ClinicFormData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key as string] && !prev.submission) return prev;
      const next = { ...prev };
      delete next[key as string];
      delete next.submission;
      return next;
    });
  };

  const setHour = (day: string, key: string, value: string | boolean) => {
    setData((prev) => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: {
          ...prev.businessHours[day],
          [key]: value
        }
      }
    }));
    setErrors((prev) => {
      if (!prev.businessHours && !prev.submission) return prev;
      const next = { ...prev };
      delete next.businessHours;
      delete next.submission;
      return next;
    });
  };

  const validateStep = (targetStep: StepIndex) => {
    const nextErrors: Record<string, string> = {};

    if (targetStep === 0) {
      if (!data.name.trim()) nextErrors.name = 'Branch name is required.';
      if (!data.branchType) nextErrors.branchType = 'Branch type is required.';
    }

    if (targetStep === 1) {
      if (!data.addressLine1.trim()) nextErrors.addressLine1 = 'Complete street address is required.';
      if (!data.city.trim()) nextErrors.city = 'City or municipality is required.';
      if (!data.province.trim()) nextErrors.province = 'Province is required.';
    }

    if (targetStep === 2) {
      if (!data.contactNumber.trim()) nextErrors.contactNumber = 'Branch phone number is required.';
      if (!data.email.trim()) nextErrors.email = 'Branch email is required.';
    }

    if (targetStep === 3) {
      const hasEnabledDay = weekDays.some((day) => data.businessHours[day]?.enabled);
      if (!hasEnabledDay) nextErrors.businessHours = 'Enable at least one working day.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const nextStep = () => {
    if (!validateStep(step)) return;
    setStep((prev) => Math.min(prev + 1, branchSteps.length - 1) as StepIndex);
  };

  const validateSubmission = (requireWorkingHours: boolean) => {
    const nextErrors: Record<string, string> = {};
    if (!data.name.trim()) nextErrors.name = 'Branch name is required.';
    if (!data.branchType) nextErrors.branchType = 'Branch type is required.';
    if (!data.addressLine1.trim()) nextErrors.addressLine1 = 'Complete street address is required.';
    if (!data.city.trim()) nextErrors.city = 'City or municipality is required.';
    if (!data.province.trim()) nextErrors.province = 'Province is required.';
    if (!data.contactNumber.trim()) nextErrors.contactNumber = 'Branch phone number is required.';
    if (!data.email.trim()) nextErrors.email = 'Branch email is required.';
    if (requireWorkingHours && !weekDays.some((day) => data.businessHours[day]?.enabled)) {
      nextErrors.businessHours = 'Enable at least one working day.';
    }
    const valid = Object.keys(nextErrors).length === 0;
    if (!valid) {
      nextErrors.submission = requireWorkingHours
        ? 'Complete the required branch profile and schedule before saving.'
        : 'Save Draft requires branch name, location, phone number, and email.';
    }
    setErrors(nextErrors);
    return valid;
  };

  const previousStep = () => setStep((prev) => Math.max(prev - 1, 0) as StepIndex);

  const requestClose = () => {
    if (saving) return;
    if (isViewMode || !isDirty) {
      onClose();
      return;
    }
    setLeaveDialogOpen(true);
  };

  const saveRecord = (draft = false) => {
    if (saving) return;
    if (isViewMode) {
      onClose();
      return;
    }
    if (!validateSubmission(!draft)) return;
    onSave(data, draft);
    if (draft) {
      setLeaveDialogOpen(false);
    }
  };

  const renderFieldError = (field: string) =>
    errors[field] ? <span style={{ color: '#dc2626', fontSize: '0.72rem', fontWeight: 700 }}>{errors[field]}</span> : null;

  const fieldLabelStyle: React.CSSProperties = {
    display: 'grid',
    gap: '0.45rem'
  };

  const sectionTitle = branchSteps[step];
  const isModal = renderMode === 'modal';
  const headerTitle = isViewMode ? 'View Branch' : isEditMode ? 'Edit Branch' : 'Add New Branch';
  const headerSubtitle = isViewMode
    ? 'Review the branch profile, location, contact details, and schedule in the same guided workflow.'
    : isEditMode
      ? 'Update the branch profile, location, contact details, and schedule using the same guided workflow.'
      : 'Create a new clinic branch with the required branch profile and hours.';
  const branchIdHelpText = isViewMode
    ? 'Branch ID is shown for reference.'
    : isEditMode
      ? 'Branch ID remains unchanged while editing this branch.'
      : 'Final branch ID is generated on save.';
  const continueLabel = isViewMode ? 'Next Section' : 'Continue';
  const submitLabel = isViewMode ? 'Done' : isEditMode ? 'Save Changes' : 'Create Branch';

  const content = (
    <div
      className={isModal ? 'patient-record__modal patient-record__wizard' : 'patient-record__wizard'}
      style={
        isModal
          ? { maxWidth: '1100px', width: 'min(1100px, 96vw)', maxHeight: '92vh' }
          : { width: '100%', gap: '1rem' }
      }
    >
      <div className="patient-record__modal-header">
        <div style={{ display: 'grid', gap: '0.3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '14px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(20, 184, 166, 0.16))',
                color: 'var(--primary)'
              }}
            >
              <Building2 size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0 }}>{headerTitle}</h3>
              <p style={{ margin: '0.2rem 0 0' }}>{headerSubtitle}</p>
            </div>
          </div>
        </div>
        <button type="button" className="patient-record__modal-close" onClick={requestClose} aria-label="Close">
          <X size={18} />
        </button>
      </div>

      <div className="patient-record__modal-body" style={{ gap: '1rem' }}>
        <div className="patient-record__wizard-steps">
          {branchSteps.map((branchStep, index) => (
            <div key={branchStep.id} className={index === step ? 'is-active' : undefined}>
              <span>{branchStep.id}</span>
              <strong>{branchStep.title}</strong>
              <small>{branchStep.desc}</small>
            </div>
          ))}
        </div>

        <div
          className="patient-record__wizard-card"
          style={{
            background: 'linear-gradient(180deg, rgba(248, 250, 252, 0.9), rgba(255, 255, 255, 0.98))',
            borderRadius: '22px',
            padding: '1.25rem'
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) auto',
              gap: '1rem',
              alignItems: 'center',
              borderBottom: '1px solid rgba(226, 232, 240, 0.9)',
              paddingBottom: '1rem'
            }}
          >
            <div style={{ display: 'grid', gap: '0.3rem' }}>
              <span
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: 'var(--primary)'
                }}
              >
                Phase {step + 1}
              </span>
              <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{sectionTitle.title}</h4>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{sectionTitle.desc}</p>
            </div>
            <div
              style={{
                minWidth: '220px',
                border: '1px solid rgba(99, 102, 241, 0.18)',
                borderRadius: '18px',
                padding: '0.85rem 1rem',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(20, 184, 166, 0.08))'
              }}
            >
              <div style={{ display: 'grid', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Branch ID
                </span>
                <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1rem' }}>{branchPreview}</strong>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{branchIdHelpText}</span>
              </div>
            </div>
          </div>

          <fieldset
            disabled={saving || isViewMode}
            style={{
              border: 'none',
              margin: 0,
              padding: 0,
              minWidth: 0,
              display: 'grid',
              gap: 0
            }}
          >
          {step === 0 && (
            <div className="patient-record__modal-grid" style={{ marginTop: '1rem' }}>
              <label style={fieldLabelStyle}>
                <span>Branch Name</span>
                <input className="form-input" value={data.name} onChange={(event) => setField('name', event.target.value)} placeholder="e.g. P&J Tanarte Dental - South Branch" />
                {renderFieldError('name')}
              </label>
              <label style={fieldLabelStyle}>
                <span>Branch Type</span>
                <select className="form-input" value={data.branchType} onChange={(event) => setField('branchType', event.target.value as ClinicBranchType)}>
                  <option value="main">Main Branch</option>
                  <option value="satellite">Satellite Branch</option>
                </select>
                {renderFieldError('branchType')}
              </label>
              <label style={fieldLabelStyle}>
                <span>Primary Clinic Owner</span>
                <input className="form-input" value={ownerDisplayName || 'Organization owner'} readOnly disabled />
                <small style={{ color: 'var(--text-secondary)' }}>Ownership is inherited from the organization and cannot be changed here.</small>
              </label>
              <label style={{ ...fieldLabelStyle, justifyContent: 'end' }}>
                <span>Branch Visibility</span>
                <select className="form-input" value={data.visibility} onChange={(event) => setField('visibility', event.target.value as ClinicFormData['visibility'])}>
                  <option value="visible">Visible</option>
                  <option value="hidden">Hidden</option>
                </select>
              </label>
              <label className="patient-record__modal-span-2" style={{ ...fieldLabelStyle, gap: '0.8rem' }}>
                <span>Primary Branch Setting</span>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    border: '1px solid rgba(226, 232, 240, 0.95)',
                    borderRadius: '16px',
                    padding: '0.95rem 1rem',
                    background: '#fff'
                  }}
                >
                  <div style={{ display: 'grid', gap: '0.2rem' }}>
                    <strong style={{ fontSize: '0.94rem' }}>Set as subscriber primary branch</strong>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                      Primary branch changes will be available in the branch lifecycle phase.
                    </span>
                  </div>
                  <input type="checkbox" checked={data.isPrimaryClinic} disabled aria-label="Primary branch setting is read-only" />
                </div>
              </label>
            </div>
          )}

          {step === 1 && (
            <div className="patient-record__modal-grid" style={{ marginTop: '1rem' }}>
              <label className="patient-record__modal-span-2" style={fieldLabelStyle}>
                <span>Complete Address</span>
                <input className="form-input" value={data.addressLine1} onChange={(event) => setField('addressLine1', event.target.value)} placeholder="Street address / building / unit" />
                {renderFieldError('addressLine1')}
              </label>
              <label style={fieldLabelStyle}>
                <span>Barangay</span>
                <input className="form-input" value={data.barangay} onChange={(event) => setField('barangay', event.target.value)} placeholder="Barangay / district" />
              </label>
              <label style={fieldLabelStyle}>
                <span>Address Line 2</span>
                <input className="form-input" value={data.addressLine2} onChange={(event) => setField('addressLine2', event.target.value)} placeholder="Landmark / floor / suite" />
              </label>
              <label style={fieldLabelStyle}>
                <span>City / Municipality</span>
                <input className="form-input" value={data.city} onChange={(event) => setField('city', event.target.value)} placeholder="City" />
                {renderFieldError('city')}
              </label>
              <label style={fieldLabelStyle}>
                <span>Province</span>
                <input className="form-input" value={data.province} onChange={(event) => setField('province', event.target.value)} placeholder="Province" />
                {renderFieldError('province')}
              </label>
              <label style={fieldLabelStyle}>
                <span>ZIP Code</span>
                <input className="form-input" value={data.postalCode} onChange={(event) => setField('postalCode', event.target.value)} placeholder="Optional ZIP code" />
              </label>
              <label style={fieldLabelStyle}>
                <span>Country</span>
                <input className="form-input" value={data.country} onChange={(event) => setField('country', event.target.value)} />
              </label>
              <label style={fieldLabelStyle}>
                <span>Timezone</span>
                <input className="form-input" value={data.timezone} onChange={(event) => setField('timezone', event.target.value)} />
              </label>
            </div>
          )}

          {step === 2 && (
            <div className="patient-record__modal-grid" style={{ marginTop: '1rem' }}>
              <label style={fieldLabelStyle}>
                <span>Branch Phone Number</span>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{ position: 'absolute', left: '0.95rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input className="form-input" style={{ paddingLeft: '2.6rem' }} value={data.contactNumber} onChange={(event) => setField('contactNumber', event.target.value)} placeholder="+63 917 123 4567" />
                </div>
                {renderFieldError('contactNumber')}
              </label>
              <label style={fieldLabelStyle}>
                <span>Mobile / Alternate Number</span>
                <input className="form-input" value={data.alternativeContactNumber} onChange={(event) => setField('alternativeContactNumber', event.target.value)} placeholder="Optional mobile number" />
              </label>
              <label className="patient-record__modal-span-2" style={fieldLabelStyle}>
                <span>Branch Email Address</span>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '0.95rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input className="form-input" style={{ paddingLeft: '2.6rem' }} value={data.email} onChange={(event) => setField('email', event.target.value)} placeholder="branch@example.com" />
                </div>
                {renderFieldError('email')}
              </label>
              <label className="patient-record__modal-span-2" style={fieldLabelStyle}>
                <span>Clinic Description</span>
                <textarea className="form-input" rows={4} value={data.description} onChange={(event) => setField('description', event.target.value)} placeholder="Short branch description, specialization, or operating notes..." />
              </label>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
              <div
                style={{
                  border: '1px solid rgba(226, 232, 240, 0.95)',
                  borderRadius: '18px',
                  padding: '1rem',
                  background: '#fff'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem' }}>
                  <Clock3 size={18} color="var(--primary)" />
                  <strong style={{ fontSize: '0.95rem' }}>Operating Hours</strong>
                </div>
                {!businessHoursConfigured && (
                  <p style={{ margin: '0 0 0.8rem', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                    Operating hours are not configured for this legacy branch. Select the hours to include when saving changes.
                  </p>
                )}
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {weekDays.map((day) => {
                    const hours = data.businessHours[day];
                    return (
                      <div
                        key={day}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '180px 90px minmax(120px, 1fr) minmax(120px, 1fr)',
                          gap: '0.75rem',
                          alignItems: 'center'
                        }}
                      >
                        <strong>{day}</strong>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem' }}>
                          <input type="checkbox" checked={hours.enabled} onChange={(event) => setHour(day, 'enabled', event.target.checked)} />
                          Open
                        </label>
                        <input className="form-input" type="time" value={hours.openingTime} disabled={!hours.enabled} onChange={(event) => setHour(day, 'openingTime', event.target.value)} />
                        <input className="form-input" type="time" value={hours.closingTime} disabled={!hours.enabled} onChange={(event) => setHour(day, 'closingTime', event.target.value)} />
                      </div>
                    );
                  })}
                </div>
                {renderFieldError('businessHours')}
              </div>

              <div className="patient-record__sections" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
                <div className="patient-record__card" style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem' }}>
                    <UserRound size={16} color="var(--primary)" />
                    <strong>Clinic Owner</strong>
                  </div>
                  <label style={fieldLabelStyle}>
                    <span>Primary Owner Assignment</span>
                    <input className="form-input" value={ownerDisplayName || 'Organization owner'} readOnly disabled />
                  </label>
                </div>

                <div className="patient-record__card" style={{ padding: '1rem' }}>
                  <strong style={{ display: 'block', marginBottom: '0.8rem' }}>Associate Dentists</strong>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Real personnel assignments will be available after personnel real-data cutover.</span>
                </div>

                <div className="patient-record__card" style={{ padding: '1rem' }}>
                  <strong style={{ display: 'block', marginBottom: '0.8rem' }}>Staff Members</strong>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Real personnel assignments will be available after personnel real-data cutover.</span>
                </div>
              </div>
            </div>
          )}
          </fieldset>
        </div>
      </div>

      <div className="patient-record__modal-footer" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
          <MapPinned size={16} />
          <span>Organization-linked branch setup.</span>
          {errors.submission && <span role="alert" style={{ color: '#b91c1c', fontWeight: 700 }}>{errors.submission}</span>}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button type="button" className="patient-record__modal-btn patient-record__modal-btn--secondary" onClick={requestClose} disabled={saving}>
            Cancel
          </button>
          {step > 0 && (
            <button type="button" className="patient-record__modal-btn patient-record__modal-btn--secondary" onClick={previousStep} disabled={saving}>
              Back
            </button>
          )}
          {isCreateMode && (
            <button type="button" className="patient-record__modal-btn patient-record__modal-btn--secondary" onClick={() => saveRecord(true)} disabled={saving}>
              Save as Draft
            </button>
          )}
          {step < branchSteps.length - 1 ? (
            <button type="button" className="patient-record__modal-btn patient-record__modal-btn--primary" onClick={nextStep} disabled={saving}>
              {continueLabel}
            </button>
          ) : (
            <button type="button" className="patient-record__modal-btn patient-record__modal-btn--primary" onClick={() => saveRecord(false)} disabled={saving}>
              {saving ? 'Saving...' : submitLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (!isModal) {
    return (
      <>
        {content}
        <ConfirmationDialog
          open={leaveDialogOpen}
          title={isCreateMode ? 'Leave branch registration?' : 'Discard branch changes?'}
          description={
            isCreateMode
              ? 'You have unfinished branch information. Choose how you want to leave this workflow.'
              : 'You have unsaved branch edits. Choose how you want to leave this workflow.'
          }
          confirmLabel={isCreateMode ? 'Discard Draft' : 'Discard Changes'}
          cancelLabel="Continue Editing"
          onConfirm={() => {
            setLeaveDialogOpen(false);
            onClose();
          }}
          onCancel={() => setLeaveDialogOpen(false)}
          footerPrefix={isCreateMode ? (
            <button
              className="btn btn-outline"
              style={{ width: 'auto' }}
              type="button"
              onClick={() => saveRecord(true)}
              disabled={saving}
            >
              Save as Draft
            </button>
          ) : null}
        />
      </>
    );
  }

  return (
    <>
      <div className="patient-record__modal-overlay">
        {content}
      </div>
      <ConfirmationDialog
        open={leaveDialogOpen}
        title={isCreateMode ? 'Leave branch registration?' : 'Discard branch changes?'}
        description={
          isCreateMode
            ? 'You have unfinished branch information. Choose how you want to leave this workflow.'
            : 'You have unsaved branch edits. Choose how you want to leave this workflow.'
        }
        confirmLabel={isCreateMode ? 'Discard Draft' : 'Discard Changes'}
        cancelLabel="Continue Editing"
        onConfirm={() => {
          setLeaveDialogOpen(false);
          onClose();
        }}
        onCancel={() => setLeaveDialogOpen(false)}
        footerPrefix={isCreateMode ? (
          <button
            className="btn btn-outline"
            style={{ width: 'auto' }}
            type="button"
            onClick={() => saveRecord(true)}
            disabled={saving}
          >
            Save as Draft
          </button>
        ) : null}
      />
    </>
  );
}
