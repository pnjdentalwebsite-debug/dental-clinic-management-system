import { useEffect, useMemo, useRef, useState } from 'react';
import { Building2, ImageIcon, Mail, MapPin, Phone, Upload } from 'lucide-react';
import { ConfirmationDialog } from '../../../components/overlays/ConfirmationDialog';
import { defaultBusinessHours } from '../../clinics/services/mockClinicService';
import type { Clinic } from '../../clinics/types';
import type { Subscriber } from '../../platformManagement/types';
import { mockLaboratoryService } from '../../laboratories/services/mockLaboratoryService';
import type { Laboratory, LaboratoryFormData } from '../../laboratories/types';

interface Props {
  mode?: 'create' | 'edit' | 'view';
  laboratory?: Laboratory;
  subscriberId: string;
  subscribers: Subscriber[];
  clinics: Clinic[];
  saving?: boolean;
  onCancel: () => void;
  onSave: (data: LaboratoryFormData, draft?: boolean, allowPendingOverride?: boolean) => void;
}

const steps = [
  {
    id: 1,
    title: 'Laboratory Information',
    description: 'Identity, contact profile, visibility, and presentation details.'
  },
  {
    id: 2,
    title: 'Location',
    description: 'Address, city mapping, and location metadata for the laboratory.'
  }
] as const;

type StepIndex = 0 | 1;

const nextStep = (current: StepIndex): StepIndex => (current === 0 ? 1 : 1);
const previousStep = (current: StepIndex): StepIndex => (current === 1 ? 0 : 0);

const buildInitialData = (subscriberId: string, laboratory?: Laboratory): LaboratoryFormData => {
  const base = mockLaboratoryService.toFormData(laboratory);
  return {
    ...base,
    subscriberId,
    laboratoryType: base.laboratoryType || 'external',
    visibility: base.visibility || 'visible',
    country: base.country || 'Philippines',
    timezone: base.timezone || 'Asia/Manila',
    serviceArea: base.serviceArea || 'Metro Manila',
    defaultTurnaroundDays: base.defaultTurnaroundDays || 7,
    rushTurnaroundDays: base.rushTurnaroundDays || 3,
    acceptsRushOrders: base.acceptsRushOrders ?? true,
    businessHours: base.businessHours || defaultBusinessHours(),
    initialClinicIds: Array.isArray(base.initialClinicIds) ? base.initialClinicIds : [],
    initialServices: []
  };
};

export function ClinicLaboratoryStepper({
  mode = 'create',
  laboratory,
  subscriberId,
  subscribers,
  clinics,
  saving = false,
  onCancel,
  onSave
}: Props) {
  const initialData = useMemo(() => buildInitialData(subscriberId, laboratory), [laboratory, subscriberId]);
  const [step, setStep] = useState<StepIndex>(0);
  const [data, setData] = useState<LaboratoryFormData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const isCreateMode = mode === 'create';
  const isEditMode = mode === 'edit';
  const isViewMode = mode === 'view';
  const selectedSubscriber = subscribers.find((item) => item.id === subscriberId);
  const linkedClinicCount = clinics.filter((clinic) => clinic.subscriberId === subscriberId).length;
  const laboratoryPreview =
    laboratory?.laboratoryNumber ||
    `LAB-${String(mockLaboratoryService.listLaboratories().filter((item) => item.subscriberId === subscriberId).length + 1).padStart(6, '0')}`;
  const isDirty = !isViewMode && JSON.stringify(data) !== JSON.stringify(initialData);

  useEffect(() => {
    setData(initialData);
    setErrors({});
    setStep(0);
    setLeaveDialogOpen(false);
  }, [initialData]);

  useEffect(() => {
    if (mode === 'edit' || !selectedSubscriber) return;
    setData((prev) => ({
      ...prev,
      legalBusinessName: prev.legalBusinessName || prev.name || selectedSubscriber.businessName,
      email: prev.email || selectedSubscriber.email.replace('@', '+lab@'),
      contactNumber: prev.contactNumber || selectedSubscriber.mobileNumber
    }));
  }, [mode, selectedSubscriber]);

  useEffect(() => {
    if (!isDirty || isViewMode) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, isViewMode]);

  const setField = <K extends keyof LaboratoryFormData>(key: K, value: LaboratoryFormData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key as string]) return prev;
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  };

  const handleLogoPick = async (file?: File | null) => {
    if (!file || isViewMode) return;

    const extension = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() || '' : '';
    const fileType = file.type || (extension ? `image/${extension}` : 'unknown');

    const previewUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });

    setData((prev) => ({
      ...prev,
      logoFileName: file.name,
      logoFileType: fileType,
      logoPreviewUrl: previewUrl
    }));
  };

  const validateCurrentStep = () => {
    const nextErrors: Record<string, string> = {};

    if (step === 0) {
      if (!data.name.trim()) nextErrors.name = 'Laboratory name is required.';
      if (!data.email.trim()) nextErrors.email = 'Email is required.';
      if (!data.contactNumber.trim()) nextErrors.contactNumber = 'Contact number is required.';
      if (!data.contactPersonName.trim()) nextErrors.contactPersonName = 'Contact person is required.';
      if (!data.contactPersonPosition.trim()) nextErrors.contactPersonPosition = 'Contact person position is required.';
    }

    if (step === 1) {
      if (!data.addressLine1.trim()) nextErrors.addressLine1 = 'Address line 1 is required.';
      if (!data.city.trim()) nextErrors.city = 'City is required.';
      if (!data.province.trim()) nextErrors.province = 'Province is required.';
      if (!data.country.trim()) nextErrors.country = 'Country is required.';
      if (!data.timezone.trim()) nextErrors.timezone = 'Timezone is required.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const requestClose = () => {
    if (saving) return;
    if (isViewMode || !isDirty) {
      onCancel();
      return;
    }
    setLeaveDialogOpen(true);
  };

  const handleNext = () => {
    if (isViewMode) {
      setStep((prev) => nextStep(prev));
      return;
    }
    if (!validateCurrentStep()) return;
    setStep((prev) => nextStep(prev));
  };

  const handleBack = () => setStep((prev) => previousStep(prev));

  const handleSave = (draft = false) => {
    if (saving) return;
    if (!draft && !isViewMode && !validateCurrentStep()) return;
    onSave(data, draft, false);
    if (draft) {
      setLeaveDialogOpen(false);
    }
  };

  const renderError = (field: string) =>
    errors[field] ? <span style={{ color: '#dc2626', fontSize: '0.72rem', fontWeight: 700 }}>{errors[field]}</span> : null;

  const labelStyle: React.CSSProperties = {
    display: 'grid',
    gap: '0.45rem'
  };

  return (
    <>
      <div className="patient-record__wizard" style={{ display: 'grid', gap: '1rem' }}>
        <section className="clinic-dashboard-panel" aria-label="Dental laboratory stepper">
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '2rem',
                      height: '2rem',
                      borderRadius: '999px',
                      background: 'var(--primary)',
                      color: '#fff',
                      fontSize: '0.92rem',
                      fontWeight: 800,
                      boxShadow: '0 10px 24px rgba(79, 70, 229, 0.22)'
                    }}
                  >
                    {step + 1}
                  </span>
                  <span
                    style={{
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      letterSpacing: '0.16em',
                      textTransform: 'uppercase',
                      color: 'var(--primary)'
                    }}
                  >
                    Phase
                  </span>
                </div>
                <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{steps[step].title}</h4>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{steps[step].description}</p>
              </div>

              <div
                style={{
                  minWidth: '240px',
                  border: '1px solid rgba(99, 102, 241, 0.18)',
                  borderRadius: '18px',
                  padding: '0.85rem 1rem',
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(20, 184, 166, 0.08))'
                }}
              >
                <div style={{ display: 'grid', gap: '0.28rem' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    Laboratory ID
                  </span>
                  <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1rem' }}>{laboratoryPreview}</strong>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                    {isCreateMode ? 'Final ID is confirmed when the record is saved.' : 'Existing record reference for this subscriber-linked laboratory.'}
                  </span>
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
              {step === 0 ? (
                <div className="patient-record__modal-grid" style={{ marginTop: '1rem' }}>
                  <label style={labelStyle}>
                    <span>Laboratory Name</span>
                    <div style={{ position: 'relative' }}>
                      <Building2 size={16} style={{ position: 'absolute', left: '0.95rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        className="form-input"
                        style={{ paddingLeft: '2.6rem' }}
                        value={data.name}
                        onChange={(event) => setField('name', event.target.value)}
                        placeholder="e.g. Bright Smile Partner Lab"
                      />
                    </div>
                    {renderError('name')}
                  </label>

                  <label style={labelStyle}>
                    <span>Legal Business Name</span>
                    <input
                      className="form-input"
                      value={data.legalBusinessName}
                      onChange={(event) => setField('legalBusinessName', event.target.value)}
                      placeholder="Registered business name"
                    />
                  </label>

                  <label style={labelStyle}>
                    <span>Email</span>
                    <div style={{ position: 'relative' }}>
                      <Mail size={16} style={{ position: 'absolute', left: '0.95rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        className="form-input"
                        style={{ paddingLeft: '2.6rem' }}
                        value={data.email}
                        onChange={(event) => setField('email', event.target.value)}
                        placeholder="partnerlab@example.com"
                      />
                    </div>
                    {renderError('email')}
                  </label>

                  <label style={labelStyle}>
                    <span>Contact Number</span>
                    <div style={{ position: 'relative' }}>
                      <Phone size={16} style={{ position: 'absolute', left: '0.95rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        className="form-input"
                        style={{ paddingLeft: '2.6rem' }}
                        value={data.contactNumber}
                        onChange={(event) => setField('contactNumber', event.target.value)}
                        placeholder="+63 953 834 3052"
                      />
                    </div>
                    {renderError('contactNumber')}
                  </label>

                  <label style={labelStyle}>
                    <span>Alternative Contact</span>
                    <input
                      className="form-input"
                      value={data.alternativeContactNumber}
                      onChange={(event) => setField('alternativeContactNumber', event.target.value)}
                      placeholder="Optional alternate line"
                    />
                  </label>

                  <label style={labelStyle}>
                    <span>Contact Person</span>
                    <input
                      className="form-input"
                      value={data.contactPersonName}
                      onChange={(event) => setField('contactPersonName', event.target.value)}
                      placeholder="Primary laboratory contact"
                    />
                    {renderError('contactPersonName')}
                  </label>

                  <label style={labelStyle}>
                    <span>Contact Person Position</span>
                    <input
                      className="form-input"
                      value={data.contactPersonPosition}
                      onChange={(event) => setField('contactPersonPosition', event.target.value)}
                      placeholder="Coordinator / Manager / Owner"
                    />
                    {renderError('contactPersonPosition')}
                  </label>

                  <label style={labelStyle}>
                    <span>Visibility</span>
                    <select className="form-input" value={data.visibility} onChange={(event) => setField('visibility', event.target.value as LaboratoryFormData['visibility'])}>
                      <option value="visible">Visible</option>
                      <option value="hidden">Hidden</option>
                    </select>
                  </label>

                  <div
                    className="patient-record__modal-span-2"
                    style={{
                      display: 'grid',
                      gap: '0.85rem',
                      border: '1px solid rgba(99, 102, 241, 0.14)',
                      borderRadius: '18px',
                      padding: '1rem',
                      background: 'linear-gradient(135deg, rgba(239, 246, 255, 0.7), rgba(255, 255, 255, 0.98))'
                    }}
                  >
                    <div style={{ display: 'grid', gap: '0.2rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--primary)' }}>
                        Upload Logo
                      </span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
                        Upload the laboratory logo and the system will auto-detect the file type.
                      </span>
                    </div>

                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                      style={{ display: 'none' }}
                      onChange={(event) => {
                        void handleLogoPick(event.target.files?.[0] || null);
                        event.currentTarget.value = '';
                      }}
                    />

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(0, 180px) minmax(0, 1fr)',
                        gap: '1rem',
                        alignItems: 'start'
                      }}
                    >
                      <div
                        style={{
                          border: '1px dashed rgba(99, 102, 241, 0.28)',
                          borderRadius: '18px',
                          minHeight: '132px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: '#fff',
                          overflow: 'hidden'
                        }}
                      >
                        {data.logoPreviewUrl ? (
                          <img
                            src={data.logoPreviewUrl}
                            alt={data.logoFileName || 'Laboratory logo preview'}
                            style={{ width: '100%', height: '132px', objectFit: 'contain', background: '#fff' }}
                          />
                        ) : (
                          <div style={{ display: 'grid', gap: '0.45rem', justifyItems: 'center', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
                            <ImageIcon size={28} />
                            <span style={{ fontSize: '0.8rem' }}>No logo uploaded</span>
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'grid', gap: '0.75rem', alignContent: 'start' }}>
                        <button
                          type="button"
                          className="patient-record__modal-btn patient-record__modal-btn--primary"
                          style={{ width: 'fit-content' }}
                          onClick={() => logoInputRef.current?.click()}
                        >
                          <Upload size={16} />
                          Upload Logo
                        </button>

                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                            gap: '0.75rem'
                          }}
                        >
                          <label style={labelStyle}>
                            <span>File Name</span>
                            <input className="form-input" value={data.logoFileName} readOnly placeholder="No file selected" />
                          </label>

                          <label style={labelStyle}>
                            <span>Detected File Type</span>
                            <input className="form-input" value={data.logoFileType} readOnly placeholder="Auto-detected after upload" />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <label className="patient-record__modal-span-2" style={labelStyle}>
                    <span>Description</span>
                    <textarea
                      className="form-input"
                      rows={4}
                      value={data.description}
                      onChange={(event) => setField('description', event.target.value)}
                      placeholder="Describe laboratory scope, output quality, or client-facing notes..."
                    />
                  </label>
                </div>
              ) : (
                <div className="patient-record__modal-grid" style={{ marginTop: '1rem' }}>
                  <label className="patient-record__modal-span-2" style={labelStyle}>
                    <span>Address Line 1</span>
                    <div style={{ position: 'relative' }}>
                      <MapPin size={16} style={{ position: 'absolute', left: '0.95rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        className="form-input"
                        style={{ paddingLeft: '2.6rem' }}
                        value={data.addressLine1}
                        onChange={(event) => setField('addressLine1', event.target.value)}
                        placeholder="Street address / building / unit"
                      />
                    </div>
                    {renderError('addressLine1')}
                  </label>

                  <label style={labelStyle}>
                    <span>Address Line 2</span>
                    <input
                      className="form-input"
                      value={data.addressLine2}
                      onChange={(event) => setField('addressLine2', event.target.value)}
                      placeholder="Optional landmark / suite"
                    />
                  </label>

                  <label style={labelStyle}>
                    <span>Barangay</span>
                    <input
                      className="form-input"
                      value={data.barangay}
                      onChange={(event) => setField('barangay', event.target.value)}
                      placeholder="Barangay / district"
                    />
                  </label>

                  <label style={labelStyle}>
                    <span>City</span>
                    <input className="form-input" value={data.city} onChange={(event) => setField('city', event.target.value)} placeholder="City / municipality" />
                    {renderError('city')}
                  </label>

                  <label style={labelStyle}>
                    <span>Province</span>
                    <input className="form-input" value={data.province} onChange={(event) => setField('province', event.target.value)} placeholder="Province" />
                    {renderError('province')}
                  </label>

                  <label style={labelStyle}>
                    <span>Postal Code</span>
                    <input className="form-input" value={data.postalCode} onChange={(event) => setField('postalCode', event.target.value)} placeholder="Postal / ZIP code" />
                  </label>

                  <label style={labelStyle}>
                    <span>Country</span>
                    <input className="form-input" value={data.country} onChange={(event) => setField('country', event.target.value)} />
                    {renderError('country')}
                  </label>

                  <label style={labelStyle}>
                    <span>Timezone</span>
                    <input className="form-input" value={data.timezone} onChange={(event) => setField('timezone', event.target.value)} />
                    {renderError('timezone')}
                  </label>

                  <div
                    className="patient-record__modal-span-2"
                    style={{
                      border: '1px solid rgba(99, 102, 241, 0.16)',
                      borderRadius: '18px',
                      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.06), rgba(20, 184, 166, 0.08))',
                      padding: '1rem 1.1rem',
                      display: 'grid',
                      gap: '0.4rem'
                    }}
                  >
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--primary)' }}>
                      Subscriber Context
                    </span>
                    <strong>{selectedSubscriber?.businessName || 'Linked subscriber'}</strong>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                      {linkedClinicCount} clinic{linkedClinicCount === 1 ? '' : 's'} currently linked to this clinic owner workspace. Initial services and business-hour configuration stay on default internal values for now.
                    </span>
                  </div>
                </div>
              )}
            </fieldset>
          </div>

          <div className="patient-record__modal-footer" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              <Building2 size={16} />
              Subscriber-linked laboratory setup for `{subscriberId}`.
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <button type="button" className="patient-record__modal-btn patient-record__modal-btn--secondary" onClick={requestClose} disabled={saving}>
                Cancel
              </button>
              {step > 0 ? (
                <button type="button" className="patient-record__modal-btn patient-record__modal-btn--secondary" onClick={handleBack} disabled={saving}>
                  Back
                </button>
              ) : null}
              {!isViewMode ? (
                <button type="button" className="patient-record__modal-btn patient-record__modal-btn--secondary" onClick={() => handleSave(true)} disabled={saving}>
                  Save as Draft
                </button>
              ) : null}
              {step < steps.length - 1 ? (
                <button type="button" className="patient-record__modal-btn patient-record__modal-btn--primary" onClick={handleNext} disabled={saving}>
                  {isViewMode ? 'Next Section' : 'Continue'}
                </button>
              ) : (
                <button type="button" className="patient-record__modal-btn patient-record__modal-btn--primary" onClick={() => handleSave(false)} disabled={saving}>
                  {isViewMode ? 'Done' : saving ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Laboratory'}
                </button>
              )}
            </div>
          </div>
        </section>
      </div>

      <ConfirmationDialog
        open={leaveDialogOpen}
        title={isCreateMode ? 'Leave laboratory registration?' : 'Discard laboratory changes?'}
        description={
          isCreateMode
            ? 'You have unfinished laboratory information. Choose how you want to leave this workflow.'
            : 'You have unsaved laboratory edits. Choose how you want to leave this workflow.'
        }
        confirmLabel={isCreateMode ? 'Discard Draft' : 'Discard Changes'}
        cancelLabel="Continue Editing"
        onConfirm={() => {
          setLeaveDialogOpen(false);
          onCancel();
        }}
        onCancel={() => setLeaveDialogOpen(false)}
        footerPrefix={!isViewMode ? (
          <button className="btn btn-outline" style={{ width: 'auto' }} type="button" onClick={() => handleSave(true)} disabled={saving}>
            Save as Draft
          </button>
        ) : null}
      />
    </>
  );
}
