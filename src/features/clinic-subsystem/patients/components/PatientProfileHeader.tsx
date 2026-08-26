import { ArrowLeft, Building2, CalendarClock, ChevronRight, HeartPulse, MapPin, Printer, PencilLine, Phone, ShieldPlus, Stethoscope, Tags, UserRound, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { DatePicker } from '../../../../components/overlays/DatePicker';
import { MASTER_FILE_DIRECTORY_UPDATED_EVENT, masterFileDirectoryService, type MasterFileTagRecord } from '../../master-files/masterFileDirectoryService';
import type { PatientPreviewItem } from './patientTypes';

type PatientProfileDraft = PatientPreviewItem & {
  extensionName?: string;
  alternatePatientIds?: string;
};

interface Props {
  patient: PatientPreviewItem;
  onBack: () => void;
  onOpenFullPatientRecord: () => void;
  onOpenRecordEditor: () => void;
  onSaveTags: (patientId: string, tags: string[]) => void;
  onSavePatientRecord: (patientId: string, nextRecord: PatientPreviewItem) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export function PatientProfileHeader({ patient, onBack, onOpenFullPatientRecord, onOpenRecordEditor, onSaveTags, onSavePatientRecord, showToast }: Props) {
  const [clinicalInfoOpen, setClinicalInfoOpen] = useState(false);
  const [tagEditorOpen, setTagEditorOpen] = useState(false);
  const [quickUpdateOpen, setQuickUpdateOpen] = useState(false);
  const [tagDraft, setTagDraft] = useState('');
  const [tagSelection, setTagSelection] = useState<string[]>(() => patient.tags || []);
  const [availableTags, setAvailableTags] = useState<MasterFileTagRecord[]>(() => masterFileDirectoryService.getActiveTagRecords('risk-tags'));
  const [draft, setDraft] = useState<PatientProfileDraft>(() => createDraft(patient));

  useEffect(() => {
    setDraft(createDraft(patient));
    setTagDraft('');
    setTagSelection(patient.tags || []);
    setAvailableTags(masterFileDirectoryService.getActiveTagRecords('risk-tags'));
    setClinicalInfoOpen(false);
    setTagEditorOpen(false);
  }, [patient]);

  useEffect(() => {
    const refreshTags = () => {
      setAvailableTags(masterFileDirectoryService.getActiveTagRecords('risk-tags'));
    };

    window.addEventListener(MASTER_FILE_DIRECTORY_UPDATED_EVENT, refreshTags);
    return () => window.removeEventListener(MASTER_FILE_DIRECTORY_UPDATED_EVENT, refreshTags);
  }, []);

  const selectedTagRecords = useMemo(
    () => tagSelection
      .map((tagCode) => availableTags.find((tag) => tag.code === tagCode))
      .filter((tag): tag is MasterFileTagRecord => Boolean(tag)),
    [availableTags, tagSelection]
  );

  const visibleTagRecords = useMemo(
    () => (patient.tags || [])
      .map((tagCode) => availableTags.find((tag) => tag.code === tagCode))
      .filter((tag): tag is MasterFileTagRecord => Boolean(tag)),
    [availableTags, patient.tags]
  );

  const tagSuggestions = useMemo(() => {
    const search = tagDraft.trim().toLowerCase();
    return availableTags
      .filter((tag) => !tagSelection.includes(tag.code))
      .filter((tag) => {
        if (!search) return true;
        return [tag.code, tag.name, tag.description, tag.priority]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(search);
      })
      .slice(0, 6);
  }, [availableTags, tagDraft, tagSelection]);

  const addTagToSelection = (tag: MasterFileTagRecord) => {
    if (tagSelection.includes(tag.code)) {
      return;
    }
    setTagSelection((current) => [...current, tag.code]);
    setTagDraft('');
  };

  const handleAddDraftTag = () => {
    const search = tagDraft.trim().toLowerCase();
    if (!search) {
      return;
    }

    const match = tagSuggestions.find((tag) => tag.name.toLowerCase() === search || tag.code.toLowerCase() === search) || tagSuggestions[0];
    if (!match) {
      showToast('No matching reusable tag found.', 'warning');
      return;
    }
    addTagToSelection(match);
  };

  const handleSaveTags = () => {
    onSaveTags(patient.id, tagSelection);
    setTagEditorOpen(false);
    showToast('Patient tags updated.', 'success');
  };

  const handleCancelTags = () => {
    setTagSelection(patient.tags || []);
    setTagDraft('');
    setTagEditorOpen(false);
  };

  const displayName = useMemo(
    () => draft.name || buildPatientName(draft) || patient.name,
    [draft, patient.name]
  );
  const age = getAgeFromBirthDate(draft.birthDate);
  const profileFacts = [
    { label: 'Gender', value: draft.sex ? draft.sex.charAt(0).toUpperCase() : 'N/A' },
    { label: 'Age', value: age !== '--' ? `${age} yrs old` : 'N/A' },
    { label: 'Birthdate', value: toDisplayDate(draft.birthDate) || 'N/A' }
  ];
  const medicalAlert = draft.medicalNotes?.trim() || 'None';
  const summaryItems = [
    { label: 'Last Updated', value: draft.lastUpdated || '6/23/2026' },
    { label: 'Location', value: draft.address?.split(',')[0] || draft.city || draft.address },
    { label: 'At Clinic', value: draft.clinicName || 'P&J Tanarte Dental Clinic' },
    { label: 'Added', value: draft.addedDate || '7/2/2026' },
    { label: 'At Doctor', value: draft.attendingDoctor || draft.physicianName || 'Dr. Maria Jessica Tanarte' },
    { label: 'Last Visit', value: draft.lastDentalVisit || patient.previousAppointments[0]?.split(' - ')[0] || 'None' },
    { label: 'Contact Number', value: draft.mobileNumber || draft.contact },
    { label: 'Balance', value: `${draft.balance} (Remaining)` }
  ];

  const commitDraft = (nextDraft: PatientProfileDraft, successMessage: string) => {
    const normalized = normalizeDraft(nextDraft, patient);
    setDraft(normalized);
    onSavePatientRecord(patient.id, normalized);
    showToast(successMessage, 'success');
  };

  const handleOpenFullPatientRecord = () => {
    onOpenFullPatientRecord();
    window.requestAnimationFrame(() => {
      document.querySelector('.patient-forms-workspace')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleSaveQuickUpdate = () => {
    commitDraft(draft, 'Patient profile updated.');
    setQuickUpdateOpen(false);
  };

  return (
    <div className="patient-record__stack">
      <button type="button" className="patient-record__back" onClick={onBack}>
        <ArrowLeft size={16} aria-hidden="true" />
        Back to Patients
      </button>

      <section className="patient-record__profile-card" aria-label="Patient profile summary">
        <div className="patient-record__profile-top">
          <div className="patient-record__profile-hero">
            <div className="patient-record__avatar patient-record__avatar--hero" aria-hidden="true">
              {draft.photoUrl ? (
                <img src={draft.photoUrl} alt={`${displayName} profile`} />
              ) : (
                <UserRound size={42} />
              )}
            </div>

            <div className="patient-record__profile-title">
              <div className="patient-record__profile-heading">
                <h2>{displayName}</h2>
                <div className={`patient-record__status patient-record__status--${patient.status.toLowerCase()}`}>
                  Status: {patient.status}
                </div>
              </div>
              <div className="patient-record__profile-meta">
                <span>Patient ID: {patient.id}</span>
              </div>
              <div className="patient-record__profile-facts patient-record__profile-facts--stacked">
                {profileFacts.map((item) => (
                  <span key={item.label} className="patient-record__profile-fact patient-record__profile-fact--stacked">
                    <strong>{item.label}</strong>
                    <span>{item.value}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="patient-record__profile-actions" aria-label="Patient record actions">
            <button type="button" className="patient-record__action patient-record__action--ghost" onClick={() => setQuickUpdateOpen(true)}>
              <PencilLine size={16} aria-hidden="true" />
              Quick Update
            </button>
            <button type="button" className="patient-record__action" onClick={onOpenRecordEditor}>
              Update Record
            </button>
            <button type="button" className="patient-record__action patient-record__action--dark" onClick={handleOpenFullPatientRecord}>
              <Printer size={16} aria-hidden="true" />
              Print Full Patient Record
            </button>
          </div>
        </div>

        <div className="patient-record__profile-grid">
          <div className="patient-record__profile-main">
            <div className="patient-record__summary-grid">
              {summaryItems.map((item) => (
                <div key={item.label} className="patient-record__summary-item">
                  <span>{item.label}:</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
              <div className="patient-record__summary-item patient-record__summary-item--alert">
                <span>Medical Alert:</span>
                <div className="patient-record__alert-line">
                  <strong>{medicalAlert}</strong>
                  <button type="button" className="patient-record__alert-more" onClick={() => setClinicalInfoOpen(true)}>
                    Clinical review
                    <ChevronRight size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>

            <div className="patient-record__tags-row">
              <span className="patient-record__profile-label">Tags:</span>
              {visibleTagRecords.length > 0 ? visibleTagRecords.map((tag) => (
                <span key={tag.code} className="patient-record__tag-pill" style={getTagPillStyle(tag.color)}>
                  {tag.name}
                </span>
              )) : (
                <span className="patient-record__tag-empty-inline">No tags assigned</span>
              )}
              <button type="button" className="patient-record__link-button" onClick={() => setTagEditorOpen((current) => !current)}>
                Manage Tags
              </button>
            </div>
          </div>
        </div>

        {tagEditorOpen ? (
          <div className="patient-record__tag-editor" aria-label="Patient tag editor">
            <span className="patient-record__profile-label">Tags</span>
            <div className="patient-record__tag-editor-box">
              {selectedTagRecords.length > 0 ? (
                <div className="patient-record__tag-list" aria-label="Selected patient tags">
                  {selectedTagRecords.map((tag) => (
                    <button
                      key={tag.code}
                      type="button"
                      className="patient-record__tag-pill patient-record__tag-pill--removable"
                      style={getTagPillStyle(tag.color)}
                      onClick={() => setTagSelection((current) => current.filter((code) => code !== tag.code))}
                      title={`Remove ${tag.name}`}
                    >
                      <span>{tag.name}</span>
                      <X size={12} aria-hidden="true" />
                    </button>
                  ))}
                </div>
              ) : (
                <span className="patient-record__tag-empty">No Tag Assigned</span>
              )}
              <div className="patient-record__tag-editor-input">
                <input
                  type="text"
                  value={tagDraft}
                  onChange={(event) => setTagDraft(event.target.value)}
                  placeholder="Search reusable tag..."
                  aria-label="Search reusable tag"
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      handleAddDraftTag();
                    }
                  }}
                />
                <button type="button" className="patient-record__tag-add" onClick={handleAddDraftTag}>
                  <Tags size={12} aria-hidden="true" />
                  Add
                </button>
              </div>
              {tagDraft.trim() ? (
                <div className="patient-record__tag-suggestions" role="listbox" aria-label="Tag suggestions">
                  {tagSuggestions.length > 0 ? tagSuggestions.map((tag) => (
                    <button
                      key={tag.code}
                      type="button"
                      className="patient-record__tag-suggestion"
                      onClick={() => addTagToSelection(tag)}
                    >
                      <span className="patient-record__tag-swatch" style={{ backgroundColor: tag.color || '#94a3b8' }} aria-hidden="true" />
                      <span className="patient-record__tag-suggestion-copy">
                        <strong>{tag.name}</strong>
                        <span>{tag.code}{tag.priority ? ` • ${tag.priority}` : ''}</span>
                      </span>
                    </button>
                  )) : (
                    <span className="patient-record__tag-suggestion-empty">No matching tags found.</span>
                  )}
                </div>
              ) : null}
              <div className="patient-record__tag-editor-actions">
                <button type="button" className="patient-record__tag-save" onClick={handleSaveTags}>Save Changes</button>
                <button type="button" className="patient-record__tag-cancel" onClick={handleCancelTags}>Cancel</button>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {clinicalInfoOpen ? (
        <ClinicalInfoModal
          draft={draft}
          onSave={(nextDraft) => commitDraft(nextDraft, 'Clinical review updated.')}
          onClose={() => setClinicalInfoOpen(false)}
        />
      ) : null}

      {quickUpdateOpen ? (
        <PatientProfileModal
          title="Update Patient Profile"
          subtitle="Personal Profile and alternative identifiers."
          onClose={() => setQuickUpdateOpen(false)}
          footer={(
            <>
              <button type="button" className="patient-record__modal-btn patient-record__modal-btn--secondary" onClick={() => setQuickUpdateOpen(false)}>Cancel</button>
              <button type="button" className="patient-record__modal-btn patient-record__modal-btn--primary" onClick={handleSaveQuickUpdate}>Save Profile</button>
            </>
          )}
        >
          <FormSection title="Personal Profile">
            <div className="patient-record__modal-grid">
              <FormInput label="Lastname" value={draft.lastName || ''} onChange={(value) => setDraft((current) => ({ ...current, lastName: value }))} />
              <FormInput label="Firstname" value={draft.firstName || ''} onChange={(value) => setDraft((current) => ({ ...current, firstName: value }))} />
              <FormInput label="Middlename" value={draft.middleName || ''} onChange={(value) => setDraft((current) => ({ ...current, middleName: value }))} />
              <FormInput label="Extension Name" value={draft.extensionName || ''} placeholder="e.g. Jr., Sr., III" onChange={(value) => setDraft((current) => ({ ...current, extensionName: value }))} />
              <FormInput label="Nickname" value={draft.nickname || ''} onChange={(value) => setDraft((current) => ({ ...current, nickname: value }))} />
              <FormInput label="Birthdate" type="date" value={draft.birthDate} onChange={(value) => setDraft((current) => ({ ...current, birthDate: value }))} />
              <label>
                <span>Gender</span>
                <select value={draft.sex} onChange={(event) => setDraft((current) => ({ ...current, sex: event.target.value as PatientPreviewItem['sex'] }))}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </label>
              <FormInput label="Mobile" value={draft.mobileNumber || draft.contact || ''} onChange={(value) => setDraft((current) => ({ ...current, mobileNumber: value, contact: value }))} />
              <FormInput label="Email" value={draft.email || ''} onChange={(value) => setDraft((current) => ({ ...current, email: value }))} />
              <FormInput label="Address" value={draft.address || ''} onChange={(value) => setDraft((current) => ({ ...current, address: value }))} span />
            </div>
          </FormSection>

          <FormSection title="Alternate Patient IDs" helper="Enter comma-separated patient IDs (e.g., 101, 202, 303)">
            <div className="patient-record__modal-grid">
              <FormInput
                label="Alternate Patient IDs"
                value={draft.alternatePatientIds || ''}
                placeholder="Enter comma-separated patient IDs that are alternate to this patient"
                onChange={(value) => setDraft((current) => ({ ...current, alternatePatientIds: value }))}
                span
              />
            </div>
          </FormSection>
        </PatientProfileModal>
      ) : null}

    </div>
  );
}

function ClinicalInfoModal({
  draft,
  onSave,
  onClose
}: {
  draft: PatientProfileDraft;
  onSave: (nextDraft: PatientProfileDraft) => void;
  onClose: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState<PatientProfileDraft>(draft);

  useEffect(() => {
    setEditDraft(draft);
    setIsEditing(false);
  }, [draft]);

  const patientLocation = editDraft.address?.split(',')[0] || editDraft.city || 'N/A';
  const clinicName = editDraft.clinicName || 'P&J Tanarte Dental Clinic';
  const attendingDoctor = editDraft.attendingDoctor || editDraft.physicianName || 'Dr. Maria Jessica Tanarte';
  const lastVisit = editDraft.lastDentalVisit || '15 March 2026';
  const medicalAlert = editDraft.medicalNotes || editDraft.otherMedicalConcerns || 'Pre-procedural screening clear.';
  const systemicConditions = editDraft.medicalConditions?.length ? editDraft.medicalConditions : [];
  const tagNames = editDraft.tags?.length ? editDraft.tags.join(', ') : 'No tags assigned';

  const handleCancelEdit = () => {
    setEditDraft(draft);
    setIsEditing(false);
  };

  const handleSave = () => {
    onSave(editDraft);
    setIsEditing(false);
  };

  return (
    <div className="patient-record__modal-overlay" role="presentation" onClick={onClose}>
      <div className="patient-record__clinical-modal" role="dialog" aria-modal="true" aria-label="Additional Clinical Information" onClick={(event) => event.stopPropagation()}>
        <header className="patient-record__clinical-modal-header">
          <div className="patient-record__clinical-modal-heading">
            <div className="patient-record__clinical-modal-eyebrow">
              <ShieldPlus size={15} aria-hidden="true" />
              Additional Clinical Information
            </div>
            <h3>Clinical review sheet for {editDraft.name}</h3>
            <p>Detailed bio data, pathology warnings, and systemic conditions.</p>
            <div className="patient-record__clinical-summary-strip" aria-label="Clinical summary strip">
              <div>
                <span>Patient ID</span>
                <strong>{editDraft.id}</strong>
              </div>
              <div>
                <span>Age / Sex</span>
                <strong>{getAgeFromBirthDate(editDraft.birthDate)} yrs old, {editDraft.sex}</strong>
              </div>
              <div>
                <span>Clinic</span>
                <strong>{clinicName}</strong>
              </div>
              <div>
                <span>Attending Doctor</span>
                <strong>{attendingDoctor}</strong>
              </div>
            </div>
          </div>
          <button type="button" className="patient-record__modal-close patient-record__modal-close--plain" onClick={onClose} aria-label="Close clinical information">
            <X size={16} />
          </button>
        </header>

        <section className="patient-record__clinical-alert-banner" aria-label="Medical alert summary">
          <div className="patient-record__clinical-alert-banner-icon">
            <HeartPulse size={18} aria-hidden="true" />
          </div>
          <div className="patient-record__clinical-alert-banner-copy">
            <span>Medical Alert</span>
            <strong>{medicalAlert}</strong>
          </div>
          <div className="patient-record__clinical-alert-banner-meta">
            <div>
              <MapPin size={14} aria-hidden="true" />
              <span>{patientLocation}</span>
            </div>
            <div>
              <CalendarClock size={14} aria-hidden="true" />
              <span>Last visit {lastVisit}</span>
            </div>
          </div>
        </section>

        <div className="patient-record__clinical-grid">
          <section className="patient-record__clinical-panel patient-record__clinical-panel--wide">
            <div className="patient-record__clinical-panel-head">
              <div>
                <span>Patient Record Summary</span>
                <h4>Branch-level clinical registration snapshot</h4>
              </div>
              <div className="patient-record__clinical-panel-kicker">
                <Building2 size={14} aria-hidden="true" />
                <strong>{clinicName}</strong>
              </div>
            </div>
            <dl className="patient-record__clinical-dl--three">
              <ClinicalDataField label="Last Updated" value={editDraft.lastUpdated || '6/23/2026'} isEditing={isEditing} onChange={(value) => setEditDraft((current) => ({ ...current, lastUpdated: value }))} />
              <ClinicalDataField label="Location" value={patientLocation} isEditing={isEditing} onChange={(value) => setEditDraft((current) => ({ ...current, city: value }))} />
              <ClinicalDataField label="At Clinic" value={clinicName} isEditing={isEditing} onChange={(value) => setEditDraft((current) => ({ ...current, clinicName: value }))} />
              <ClinicalDataField label="Added" value={editDraft.addedDate || '7/2/2026'} isEditing={isEditing} onChange={(value) => setEditDraft((current) => ({ ...current, addedDate: value }))} />
              <ClinicalDataField label="At Doctor" value={attendingDoctor} isEditing={isEditing} onChange={(value) => setEditDraft((current) => ({ ...current, attendingDoctor: value, physicianName: value }))} />
              <ClinicalDataField label="Last Visit" value={lastVisit} isEditing={isEditing} onChange={(value) => setEditDraft((current) => ({ ...current, lastDentalVisit: value }))} />
              <ClinicalDataField label="Contact Number" value={editDraft.mobileNumber || editDraft.contact || 'N/A'} isEditing={isEditing} onChange={(value) => setEditDraft((current) => ({ ...current, mobileNumber: value, contact: value }))} />
              <ClinicalDataField label="Balance" value={editDraft.balance || 'PHP 0'} isEditing={isEditing} onChange={(value) => setEditDraft((current) => ({ ...current, balance: value }))} />
              <ClinicalDataField label="Medical Alert" value={medicalAlert} isEditing={isEditing} onChange={(value) => setEditDraft((current) => ({ ...current, medicalNotes: value, otherMedicalConcerns: value }))} textarea />
              <ClinicalDataField label="Tags" value={tagNames} />
              <ClinicalDataField label="City Lived In" value={editDraft.city || patientLocation} isEditing={isEditing} onChange={(value) => setEditDraft((current) => ({ ...current, city: value }))} />
              <ClinicalDataField label="Age" value={`${getAgeFromBirthDate(editDraft.birthDate)} yrs old`} />
              <ClinicalDataField label="Birthday" value={editDraft.birthDate} displayValue={toDisplayDate(editDraft.birthDate)} type="date" isEditing={isEditing} onChange={(value) => setEditDraft((current) => ({ ...current, birthDate: value }))} />
            </dl>
          </section>

          <section className="patient-record__clinical-panel">
            <div className="patient-record__clinical-panel-head patient-record__clinical-panel-head--compact">
              <div>
                <span>Clinical Registration & Bio</span>
                <h4>Administrative and demographic details</h4>
              </div>
            </div>
            <dl>
              <ClinicalDataField label="Mobile Phone" value={editDraft.mobileNumber || editDraft.contact || 'N/A'} isEditing={isEditing} onChange={(value) => setEditDraft((current) => ({ ...current, mobileNumber: value, contact: value }))} />
              <ClinicalDataField label="Email Address" value={editDraft.email || 'N/A'} isEditing={isEditing} onChange={(value) => setEditDraft((current) => ({ ...current, email: value }))} />
              <ClinicalDataField label="Civil Status" value={editDraft.civilStatus || 'N/A'} isEditing={isEditing} onChange={(value) => setEditDraft((current) => ({ ...current, civilStatus: value }))} />
              <ClinicalDataField label="Blood Type" value={editDraft.bloodType || 'N/A'} isEditing={isEditing} onChange={(value) => setEditDraft((current) => ({ ...current, bloodType: value }))} />
              <ClinicalDataField label="Height & Weight" value={editDraft.heightWeight || 'N/A / N/A'} isEditing={isEditing} onChange={(value) => setEditDraft((current) => ({ ...current, heightWeight: value }))} />
              <ClinicalDataField label="Occupation" value={editDraft.occupation || 'N/A'} isEditing={isEditing} onChange={(value) => setEditDraft((current) => ({ ...current, occupation: value }))} />
              <ClinicalDataField label="School" value={editDraft.school || 'N/A'} isEditing={isEditing} onChange={(value) => setEditDraft((current) => ({ ...current, school: value }))} />
              <ClinicalDataField label="Referred By" value={editDraft.referralSource || 'N/A'} isEditing={isEditing} onChange={(value) => setEditDraft((current) => ({ ...current, referralSource: value }))} />
              <ClinicalDataField label="Address" value={editDraft.address || 'N/A'} isEditing={isEditing} onChange={(value) => setEditDraft((current) => ({ ...current, address: value }))} textarea />
            </dl>
          </section>

          <section className="patient-record__clinical-panel">
            <div className="patient-record__clinical-panel-head patient-record__clinical-panel-head--compact">
              <div>
                <span>Pathological History</span>
                <h4>Allergies, medications, and medical caution notes</h4>
              </div>
            </div>
            <dl>
              <ClinicalDataField label="Medication Allergies" value={editDraft.allergies || 'None declared'} isEditing={isEditing} onChange={(value) => setEditDraft((current) => ({ ...current, allergies: value }))} textarea />
              <ClinicalDataField label="Previous Hospitalizations" value={editDraft.previousHospitalizations || 'None declared'} isEditing={isEditing} onChange={(value) => setEditDraft((current) => ({ ...current, previousHospitalizations: value }))} textarea />
              <ClinicalDataField label="Prescribed Medications" value={editDraft.prescribedMedications || 'None'} isEditing={isEditing} onChange={(value) => setEditDraft((current) => ({ ...current, prescribedMedications: value }))} textarea />
              <ClinicalDataField label="Other Medical Concerns" value={editDraft.otherMedicalConcerns || medicalAlert || 'None'} isEditing={isEditing} onChange={(value) => setEditDraft((current) => ({ ...current, otherMedicalConcerns: value, medicalNotes: value }))} textarea />
            </dl>
          </section>

          <section className="patient-record__clinical-panel patient-record__clinical-panel--wide">
            <div className="patient-record__clinical-panel-head patient-record__clinical-panel-head--compact">
              <div>
                <span>Diagnosed Conditions & Systemic History</span>
                <h4>System review and caution checklist</h4>
              </div>
            </div>
            {systemicConditions.length ? (
              <div className="patient-record__clinical-condition-list">
                {systemicConditions.map((condition) => (
                  <span key={condition}>
                    <Stethoscope size={14} aria-hidden="true" />
                    {condition}
                  </span>
                ))}
              </div>
            ) : (
              <p className="patient-record__clinical-empty-state">No system conditions checked</p>
            )}
            {isEditing ? (
              <label className="patient-record__clinical-editor">
                <span>Conditions list</span>
                <textarea
                  value={(editDraft.medicalConditions || []).join(', ')}
                  placeholder="Enter comma-separated systemic conditions"
                  onChange={(event) => setEditDraft((current) => ({
                    ...current,
                    medicalConditions: event.target.value.split(',').map((item) => item.trim()).filter(Boolean)
                  }))}
                />
              </label>
            ) : null}
          </section>
        </div>

        <footer className="patient-record__clinical-modal-footer">
          <div className="patient-record__clinical-modal-actions">
            {isEditing ? (
              <>
                <button type="button" className="patient-record__modal-btn patient-record__modal-btn--secondary" onClick={handleCancelEdit}>
                  Cancel Edit
                </button>
                <button type="button" className="patient-record__modal-btn patient-record__modal-btn--primary" onClick={handleSave}>
                  Save Changes
                </button>
              </>
            ) : (
              <>
                <button type="button" className="patient-record__modal-btn patient-record__modal-btn--secondary" onClick={() => setIsEditing(true)}>
                  Edit Clinical Info
                </button>
                <button type="button" className="patient-record__modal-btn patient-record__modal-btn--dark patient-record__clinical-close" onClick={onClose}>
                  <Phone size={14} aria-hidden="true" />
                  Close View
                </button>
              </>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}

function ClinicalDataField({
  label,
  value,
  displayValue,
  type = 'text',
  isEditing = false,
  textarea = false,
  onChange
}: {
  label: string;
  value: string;
  displayValue?: string;
  type?: 'text' | 'date';
  isEditing?: boolean;
  textarea?: boolean;
  onChange?: (value: string) => void;
}) {
  return (
    <div className={isEditing ? 'patient-record__clinical-data-field patient-record__clinical-data-field--editing' : 'patient-record__clinical-data-field'}>
      <dt>{label}:</dt>
      <dd>
        {isEditing && onChange ? (
          textarea ? (
            <textarea value={value} onChange={(event) => onChange(event.target.value)} />
          ) : type === 'date' ? (
            <DatePicker value={value} onChange={onChange} />
          ) : (
            <input value={value} onChange={(event) => onChange(event.target.value)} />
          )
        ) : displayValue ?? value}
      </dd>
    </div>
  );
}

function FormSection({ title, helper, children }: { title: string; helper?: string; children: ReactNode }) {
  return (
    <section className="patient-record__modal-section">
      <h4>{title}</h4>
      {helper ? <p>{helper}</p> : null}
      {children}
    </section>
  );
}

function FormInput({
  label,
  value,
  placeholder,
  type = 'text',
  span,
  onChange
}: {
  label: string;
  value: string;
  placeholder?: string;
  type?: 'text' | 'date';
  span?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className={span ? 'patient-record__modal-span-2' : undefined}>
      <span>{label}</span>
      {type === 'date' ? (
        <DatePicker value={value} onChange={onChange} placeholder={placeholder || 'dd/mm/yyyy'} />
      ) : (
        <input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}

function createDraft(patient: PatientPreviewItem): PatientProfileDraft {
  return {
    ...patient,
    name: patient.name,
    firstName: patient.firstName || patient.name.split(' ')[0] || '',
    middleName: patient.middleName || '',
    lastName: patient.lastName || patient.name.split(' ').slice(1).join(' ') || '',
    birthDate: patient.birthDate,
    sex: patient.sex,
    city: patient.city,
    address: patient.address,
    contact: patient.mobileNumber || patient.contact,
    mobileNumber: patient.mobileNumber || patient.contact,
    consultationReason: patient.consultationReason || '',
    referralSource: patient.referralSource || '',
    lastDentalVisit: patient.lastDentalVisit || '',
    clinicName: patient.clinicName || 'P&J Tanarte Dental Clinic',
    attendingDoctor: patient.attendingDoctor || patient.physicianName || 'Dr. Maria Jessica Tanarte',
    lastUpdated: patient.lastUpdated || '6/23/2026',
    addedDate: patient.addedDate || '7/2/2026',
    school: patient.school || '',
    heightWeight: patient.heightWeight || '',
    previousHospitalizations: patient.previousHospitalizations || '',
    prescribedMedications: patient.prescribedMedications || '',
    otherMedicalConcerns: patient.otherMedicalConcerns || patient.medicalNotes || '',
    extensionName: '',
    alternatePatientIds: ''
  };
}

function getTagPillStyle(color?: string) {
  if (!color) {
    return undefined;
  }

  return {
    background: `${color}1A`,
    color: '#111827',
    border: `1px solid ${color}33`
  };
}

function normalizeDraft(draft: PatientProfileDraft, patient: PatientPreviewItem): PatientProfileDraft {
  const normalizedName = buildPatientName(draft) || draft.name || patient.name;

  return {
    ...draft,
    name: normalizedName,
    clinicName: draft.clinicName?.trim() || patient.clinicName || 'P&J Tanarte Dental Clinic',
    attendingDoctor: draft.attendingDoctor?.trim() || draft.physicianName?.trim() || patient.attendingDoctor || patient.physicianName || 'Dr. Maria Jessica Tanarte',
    physicianName: draft.physicianName?.trim() || draft.attendingDoctor?.trim() || patient.physicianName,
    lastUpdated: draft.lastUpdated?.trim() || patient.lastUpdated || toDisplayDate(new Date().toISOString()),
    addedDate: draft.addedDate?.trim() || patient.addedDate || '7/2/2026',
    contact: (draft.mobileNumber || draft.contact || patient.contact).trim(),
    mobileNumber: (draft.mobileNumber || draft.contact || patient.contact).trim(),
    address: draft.address.trim() || patient.address,
    city: draft.city.trim() || patient.city,
    email: draft.email?.trim() || '',
    civilStatus: draft.civilStatus?.trim() || '',
    bloodType: draft.bloodType?.trim() || '',
    occupation: draft.occupation?.trim() || '',
    school: draft.school?.trim() || '',
    heightWeight: draft.heightWeight?.trim() || '',
    referralSource: draft.referralSource?.trim() || '',
    allergies: draft.allergies?.trim() || '',
    previousHospitalizations: draft.previousHospitalizations?.trim() || '',
    prescribedMedications: draft.prescribedMedications?.trim() || '',
    otherMedicalConcerns: draft.otherMedicalConcerns?.trim() || draft.medicalNotes?.trim() || '',
    medicalNotes: draft.medicalNotes?.trim() || draft.otherMedicalConcerns?.trim() || '',
    balance: draft.balance.trim() || patient.balance
  };
}

function buildPatientName(draft: PatientProfileDraft) {
  return [draft.firstName, draft.middleName, draft.lastName, draft.extensionName]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function PatientProfileModal({
  title,
  subtitle,
  children,
  footer,
  onClose
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="patient-record__modal-overlay" role="presentation" onClick={onClose}>
      <div className="patient-record__modal" role="dialog" aria-modal="true" aria-label={title} onClick={(event) => event.stopPropagation()}>
        <div className="patient-record__modal-header">
          <div>
            <h3>{title}</h3>
            <p>{subtitle}</p>
          </div>
          <button type="button" className="patient-record__modal-close" onClick={onClose} aria-label="Close dialog">
            <X size={16} />
          </button>
        </div>
        <div className="patient-record__modal-body">
          {children}
        </div>
        <div className="patient-record__modal-footer">
          {footer}
        </div>
      </div>
    </div>
  );
}

function toDisplayDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-GB');
}

function getAgeFromBirthDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '--';
  const diff = Date.now() - parsed.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}
