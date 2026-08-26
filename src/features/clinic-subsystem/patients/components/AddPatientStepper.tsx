import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Camera, Check, ChevronLeft, ChevronRight, ImagePlus, Upload } from 'lucide-react';
import { ConfirmationDialog } from '../../../../components/overlays/ConfirmationDialog';
import { DatePicker } from '../../../../components/overlays/DatePicker';
import type { PatientPreviewItem } from './patientTypes';

export type PatientFormMode = 'add' | 'edit';
type StepKey = 1 | 2 | 3 | 4;
type MedicalAnswer = 'yes' | 'no' | '';

export interface PatientFormState {
  photoUrl: string;
  lastName: string;
  firstName: string;
  middleName: string;
  nickname: string;
  birthDate: string;
  age: string;
  sex: '' | 'Male' | 'Female';
  religion: string;
  nationality: string;
  civilStatus: string;
  homeAddress: string;
  city: string;
  telNumbers: string;
  company: string;
  occupation: string;
  officeNumber: string;
  dentalInsurance: string;
  faxNumber: string;
  effectiveDate: string;
  mobileNumber: string;
  email: string;
  parentGuardianName: string;
  referralSource: string;
  consultationReason: string;
  previousDentist: string;
  lastDentalVisit: string;
  physicianName: string;
  medicalSpecialty: string;
  physicianOfficeAddress: string;
  physicianOfficeNumber: string;
  medicalQuestions: Record<string, MedicalAnswer>;
  allergies: string[];
  bloodType: string;
  bloodPressure: string;
  medicalConditions: string[];
  dentalHabits: string[];
  signatureName: string;
  signatureDate: string;
}

interface DraftState {
  status: 'draft';
  currentStep: StepKey;
  data: PatientFormState;
  savedAt: string;
}

interface Props {
  mode?: PatientFormMode;
  patient?: PatientPreviewItem | null;
  onCancel: () => void;
  onSave: (form: PatientFormState) => void;
}

const stepLabels: Record<StepKey, string> = {
  1: 'Patient Information',
  2: 'Minor, Referral & History',
  3: 'Medical Questions & Allergies',
  4: 'Conditions, Habits & Consent'
};

const medicalQuestionLabels = [
  'Are you in good condition?',
  'Are you under medical treatment now?',
  'Have you ever had serious illness or surgical operation?',
  'Have you ever been hospitalized?',
  'Are you taking any prescription / non-prescription medication?',
  'Do you use tobacco products?',
  'Do you use alcohol, cocaine or other dangerous drugs?'
];

const allergyOptions = ['Penicillin', 'Latex', 'Aspirin', 'Sulfa', 'Local Anesthetic'];

const medicalConditionOptions = [
  'High Blood Pressure',
  'Low Blood Pressure',
  'Epilepsy or Convulsion',
  'AIDS/HIV Infection',
  'Sexually Transmitted Disease',
  'Stomach Troubles or Ulcers',
  'Fainting Seizures',
  'Rapid Weight Loss',
  'Radiation Therapy',
  'Joint Replacement or Implant',
  'Heart Surgery',
  'Heart Attack',
  'Heart Disease',
  'Heart Murmur',
  'Hepatitis or Liver Disease',
  'Rheumatic Fever',
  'Allergies',
  'Respiratory Problems',
  'Tuberculosis',
  'Gout or Swollen Ankles',
  'Kidney Disease',
  'Chest Pain',
  'Stroke',
  'Cancer or Tumors',
  'Anemia',
  'Angina',
  'Asthma',
  'Bleeding Problems',
  'Emphysema',
  'Head Injuries',
  'Arthritis or Rheumatism',
  'Thyroid Problem',
  'Diabetes',
  'Others'
];

const dentalHabitOptions = [
  'Night-time Bottle Feeding',
  'Thumb Sucking',
  'Tongue Thrusting',
  'Teeth Grinding',
  'Nail Biting',
  'Mouth Breathing',
  'Smoking'
];

const draftStorageKey = 'pnj_clinic_patient_draft_v2';

const createBlankPatientForm = (): PatientFormState => ({
  photoUrl: '',
  lastName: '',
  firstName: '',
  middleName: '',
  nickname: '',
  birthDate: '',
  age: '',
  sex: '',
  religion: '',
  nationality: '',
  civilStatus: '',
  homeAddress: '',
  city: '',
  telNumbers: '',
  company: '',
  occupation: '',
  officeNumber: '',
  dentalInsurance: '',
  faxNumber: '',
  effectiveDate: '',
  mobileNumber: '',
  email: '',
  parentGuardianName: '',
  referralSource: '',
  consultationReason: '',
  previousDentist: '',
  lastDentalVisit: '',
  physicianName: '',
  medicalSpecialty: '',
  physicianOfficeAddress: '',
  physicianOfficeNumber: '',
  medicalQuestions: Object.fromEntries(medicalQuestionLabels.map((question) => [question, ''])) as Record<string, MedicalAnswer>,
  allergies: [],
  bloodType: '',
  bloodPressure: '',
  medicalConditions: [],
  dentalHabits: [],
  signatureName: '',
  signatureDate: ''
});

const formatDateInput = (value?: string) => {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
};

const calculateAge = (birthDate: string) => {
  if (!birthDate) return '';
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return '';
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age > 0 ? String(age) : '';
};

const splitPatientName = (patient: PatientPreviewItem | null | undefined) => {
  if (!patient) return { firstName: '', middleName: '', lastName: '' };
  if (patient.firstName || patient.lastName || patient.middleName) {
    return {
      firstName: patient.firstName || '',
      middleName: patient.middleName || '',
      lastName: patient.lastName || ''
    };
  }
  const parts = patient.name.trim().split(/\s+/);
  if (parts.length <= 1) return { firstName: patient.name, middleName: '', lastName: '' };
  if (parts.length === 2) return { firstName: parts[0], middleName: '', lastName: parts[1] };
  return { firstName: parts[0], middleName: parts.slice(1, -1).join(' '), lastName: parts[parts.length - 1] };
};

const createPatientFormFromPatient = (patient?: PatientPreviewItem | null): PatientFormState => {
  const blank = createBlankPatientForm();
  if (!patient) return blank;
  const name = splitPatientName(patient);
  return {
    ...blank,
    photoUrl: patient.photoUrl || '',
    firstName: name.firstName,
    middleName: name.middleName,
    lastName: name.lastName,
    nickname: patient.nickname || '',
    birthDate: formatDateInput(patient.birthDate),
    age: patient.age || calculateAge(formatDateInput(patient.birthDate)),
    sex: patient.sex,
    religion: patient.religion || '',
    nationality: patient.nationality || '',
    civilStatus: patient.civilStatus || '',
    homeAddress: patient.address || '',
    city: patient.city || '',
    telNumbers: patient.telNumbers || '',
    company: patient.company || '',
    occupation: patient.occupation || '',
    officeNumber: patient.officeNumber || '',
    dentalInsurance: patient.dentalInsurance || '',
    faxNumber: patient.faxNumber || '',
    effectiveDate: formatDateInput(patient.effectiveDate),
    mobileNumber: patient.mobileNumber || patient.contact || '',
    email: patient.email || '',
    parentGuardianName: patient.parentGuardianName || '',
    referralSource: patient.referralSource || '',
    consultationReason: patient.consultationReason || '',
    previousDentist: patient.previousDentist || '',
    lastDentalVisit: formatDateInput(patient.lastDentalVisit),
    physicianName: patient.physicianName || '',
    medicalSpecialty: patient.medicalSpecialty || '',
    physicianOfficeAddress: patient.physicianOfficeAddress || '',
    physicianOfficeNumber: patient.physicianOfficeNumber || '',
    medicalQuestions: { ...blank.medicalQuestions, ...(patient.medicalQuestions || {}) },
    allergies: patient.allergyList || patient.allergies.split(',').map((item) => item.trim()).filter((item) => item && item !== 'None reported'),
    bloodType: patient.bloodType || '',
    bloodPressure: patient.bloodPressure || '',
    medicalConditions: patient.medicalConditions || [],
    dentalHabits: patient.dentalHabits || [],
    signatureName: patient.signatureName || patient.name,
    signatureDate: formatDateInput(patient.signatureDate)
  };
};

const hasMeaningfulDraft = (form: PatientFormState, currentStep: StepKey) => {
  if (currentStep !== 1) return true;
  return Object.entries(form).some(([key, value]) => {
    if (key === 'medicalQuestions') return Object.values(value as Record<string, string>).some(Boolean);
    if (Array.isArray(value)) return value.length > 0;
    return String(value || '').trim().length > 0;
  });
};

const loadDraft = (): DraftState | null => {
  try {
    const raw = localStorage.getItem(draftStorageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DraftState;
    if (!parsed || parsed.status !== 'draft') return null;
    return parsed;
  } catch {
    return null;
  }
};

export function AddPatientStepper({ mode = 'add', patient = null, onCancel, onSave }: Props) {
  const isEdit = mode === 'edit';
  const existingDraft = useMemo(() => (isEdit ? null : loadDraft()), [isEdit]);
  const initialForm = useMemo(() => (isEdit ? createPatientFormFromPatient(patient) : existingDraft?.data || createBlankPatientForm()), [existingDraft?.data, isEdit, patient]);
  const [currentStep, setCurrentStep] = useState<StepKey>(existingDraft?.currentStep || 1);
  const [form, setForm] = useState<PatientFormState>(initialForm);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(existingDraft?.savedAt || null);
  const [draftExitOpen, setDraftExitOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setForm(initialForm);
    setCurrentStep(existingDraft?.currentStep || 1);
  }, [existingDraft?.currentStep, initialForm]);

  const canContinue = useMemo(() => {
    if (currentStep !== 1) return true;
    return Boolean(form.firstName.trim() && form.lastName.trim() && form.birthDate);
  }, [currentStep, form.birthDate, form.firstName, form.lastName]);

  const hasUnsavedChanges = hasMeaningfulDraft(form, currentStep) || Boolean(draftSavedAt);

  const updateField = <Key extends keyof PatientFormState>(key: Key, value: PatientFormState[Key]) => {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === 'birthDate') next.age = calculateAge(String(value));
      return next;
    });
  };

  const toggleListValue = (key: 'allergies' | 'medicalConditions' | 'dentalHabits', value: string) => {
    setForm((current) => {
      const list = current[key];
      return {
        ...current,
        [key]: list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
      };
    });
  };

  const updateMedicalQuestion = (question: string, answer: MedicalAnswer) => {
    setForm((current) => ({
      ...current,
      medicalQuestions: {
        ...current.medicalQuestions,
        [question]: answer
      }
    }));
  };

  const handlePhotoSelected = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateField('photoUrl', String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const goNext = () => {
    if (currentStep < 4 && canContinue) setCurrentStep((step) => (step + 1) as StepKey);
  };

  const goPrevious = () => {
    if (currentStep > 1) setCurrentStep((step) => (step - 1) as StepKey);
  };

  const saveDraft = () => {
    if (isEdit) return null;
    const savedAt = new Date().toISOString();
    const draft: DraftState = {
      status: 'draft',
      currentStep,
      data: form,
      savedAt
    };
    localStorage.setItem(draftStorageKey, JSON.stringify(draft));
    setDraftSavedAt(savedAt);
    return savedAt;
  };

  const clearDraft = () => {
    localStorage.removeItem(draftStorageKey);
    setDraftSavedAt(null);
  };

  const openExitProtection = () => {
    if (hasUnsavedChanges) {
      setDraftExitOpen(true);
      return;
    }
    onCancel();
  };

  const discardChanges = () => {
    if (!isEdit) clearDraft();
    setCurrentStep(1);
    setForm(isEdit ? createPatientFormFromPatient(patient) : createBlankPatientForm());
    setDraftExitOpen(false);
    onCancel();
  };

  const continueEditing = () => setDraftExitOpen(false);

  const saveAndExit = () => {
    saveDraft();
    setDraftExitOpen(false);
    onCancel();
  };

  const handleSubmit = () => {
    clearDraft();
    onSave(form);
  };

  const title = isEdit ? 'Update Patient Record' : 'Add New Patient';
  const subtitle = isEdit
    ? 'Edit the patient information here. The person icon stays as a full read-only record view.'
    : 'Complete the patient registration using the four-phase clinical intake form.';

  return (
    <div className="patient-stepper">
      <div className="patient-stepper__hero">
        <button type="button" className="patient-record__back" onClick={openExitProtection}>
          <ArrowLeft size={16} aria-hidden="true" />
          Back to Patients
        </button>
        <div className="patient-stepper__hero-card">
          <div>
            <span className="patient-stepper__eyebrow">{isEdit ? 'Patient record editor' : 'Patient registration'}</span>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
          <div className="patient-stepper__counter">Phase {currentStep} / 4</div>
        </div>
      </div>

      <DraftIndicator draftSavedAt={draftSavedAt} hasDraft={!isEdit && Boolean(existingDraft || draftSavedAt)} />

      <div className="patient-stepper__progress" aria-label="Patient form steps">
        {(Object.keys(stepLabels) as unknown as StepKey[]).map((step) => (
          <button
            type="button"
            key={step}
            className={`patient-stepper__step ${currentStep === step ? 'is-active' : ''} ${currentStep > step ? 'is-complete' : ''}`}
            onClick={() => setCurrentStep(step)}
          >
            <span>{currentStep > step ? <Check size={14} aria-hidden="true" /> : step}</span>
            <strong>{stepLabels[step]}</strong>
          </button>
        ))}
      </div>

      <div className="patient-stepper__body">
        {currentStep === 1 && (
          <section className="patient-record__card patient-stepper__stage-card">
            <div className="patient-stepper__section-header">
              <div>
                <p className="patient-stepper__section-kicker">1. Patient Information</p>
                <h3>Profile capture and registration details</h3>
              </div>
            </div>

            <div className="patient-stepper__photo-banner">
              <div className="patient-stepper__photo-preview" aria-label="Patient photo preview">
                {form.photoUrl ? <img src={form.photoUrl} alt="Patient 2x2 preview" /> : <ImagePlus size={36} aria-hidden="true" />}
              </div>
              <div className="patient-stepper__photo-copy">
                <span className="patient-stepper__mini-kicker">Patient 2x2 Photo</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  className="patient-stepper__file-input"
                  onChange={(event) => handlePhotoSelected(event.target.files?.[0])}
                />
                <div className="patient-stepper__photo-actions">
                  <button type="button" className="btn btn-primary" onClick={() => fileInputRef.current?.click()}>
                    <Upload size={16} aria-hidden="true" />
                    Add Image
                  </button>
                  <button type="button" className="btn btn-outline">
                    <Camera size={16} aria-hidden="true" />
                    Capture
                  </button>
                </div>
              </div>
            </div>

            <div className="patient-stepper__panel-grid">
              <section className="patient-stepper__subpanel patient-stepper__subpanel--wide">
                <div className="patient-stepper__subpanel-head">
                  <span className="patient-stepper__mini-kicker">Identity</span>
                  <h4>Basic patient information</h4>
                </div>
                <div className="patient-stepper__form-grid patient-stepper__form-grid--three">
                  <Field label="Last Name" required value={form.lastName} onChange={(value) => updateField('lastName', value)} />
                  <Field label="First Name" required value={form.firstName} onChange={(value) => updateField('firstName', value)} />
                  <Field label="Middle Name" value={form.middleName} onChange={(value) => updateField('middleName', value)} />
                  <Field label="Nickname" value={form.nickname} onChange={(value) => updateField('nickname', value)} />
                  <Field
                    label="Birth Date"
                    required
                    type="date"
                    value={form.birthDate}
                    maxDate={new Date().toISOString().split('T')[0]}
                    onChange={(value) => updateField('birthDate', value)}
                  />
                  <Field label="Age" value={form.age} onChange={(value) => updateField('age', value)} />
                  <SelectField label="Sex" value={form.sex} onChange={(value) => updateField('sex', value as PatientFormState['sex'])} options={['Male', 'Female']} />
                  <Field label="Religion" value={form.religion} onChange={(value) => updateField('religion', value)} />
                  <Field label="Nationality" value={form.nationality} onChange={(value) => updateField('nationality', value)} />
                  <SelectField label="Civil Status" value={form.civilStatus} onChange={(value) => updateField('civilStatus', value)} options={['Single', 'Married', 'Widowed', 'Separated']} />
                </div>
              </section>

              <section className="patient-stepper__subpanel patient-stepper__subpanel--wide">
                <div className="patient-stepper__subpanel-head">
                  <span className="patient-stepper__mini-kicker">Contact & Work</span>
                  <h4>Addresses, numbers, and work profile</h4>
                </div>
                <div className="patient-stepper__form-grid patient-stepper__form-grid--three">
                  <Field label="Home Address" value={form.homeAddress} onChange={(value) => updateField('homeAddress', value)} wide />
                  <Field label="City Lived In" value={form.city} onChange={(value) => updateField('city', value)} />
                  <Field label="Tel. No/s." value={form.telNumbers} onChange={(value) => updateField('telNumbers', value)} />
                  <Field label="Mobile No/s." value={form.mobileNumber} onChange={(value) => updateField('mobileNumber', value)} />
                  <Field label="Email Add." type="email" value={form.email} onChange={(value) => updateField('email', value)} />
                  <Field label="Company" value={form.company} onChange={(value) => updateField('company', value)} />
                  <Field label="Occupation" value={form.occupation} onChange={(value) => updateField('occupation', value)} />
                  <Field label="Office No/s." value={form.officeNumber} onChange={(value) => updateField('officeNumber', value)} />
                  <Field label="Dental Insurance" value={form.dentalInsurance} onChange={(value) => updateField('dentalInsurance', value)} />
                  <Field label="Fax No/s." value={form.faxNumber} onChange={(value) => updateField('faxNumber', value)} />
                  <Field label="Effective Date" type="date" value={form.effectiveDate} onChange={(value) => updateField('effectiveDate', value)} />
                </div>
              </section>
            </div>
          </section>
        )}

        {currentStep === 2 && (
          <div className="patient-stepper__grid patient-stepper__grid--balanced">
            <section className="patient-record__card patient-stepper__stage-card">
              <div className="patient-stepper__section-header patient-stepper__section-header--compact">
                <div>
                  <p className="patient-stepper__section-kicker">2. Minor, Referral & History</p>
                  <h3>Context before treatment starts</h3>
                </div>
                <p>Capture guardian details, referral notes, consultation reason, and prior providers in one structured phase.</p>
              </div>

              <div className="patient-stepper__panel-grid patient-stepper__panel-grid--dual">
                <section className="patient-stepper__subpanel">
                  <div className="patient-stepper__subpanel-head">
                    <span className="patient-stepper__mini-kicker">Referral</span>
                    <h4>Minor and referral details</h4>
                  </div>
                  <div className="patient-stepper__form-grid patient-stepper__form-grid--single">
                    <Field label="Parent / Guardian's Name (for minors)" value={form.parentGuardianName} onChange={(value) => updateField('parentGuardianName', value)} />
                    <Field label="Whom may we thank for referring you?" value={form.referralSource} onChange={(value) => updateField('referralSource', value)} />
                    <Field label="What is your reason for dental consultation?" value={form.consultationReason} onChange={(value) => updateField('consultationReason', value)} />
                  </div>
                </section>

                <section className="patient-stepper__subpanel">
                  <div className="patient-stepper__subpanel-head">
                    <span className="patient-stepper__mini-kicker">Provider History</span>
                    <h4>Dental and medical history</h4>
                  </div>
                  <div className="patient-stepper__form-grid">
                    <Field label="Previous Dentist" value={form.previousDentist} onChange={(value) => updateField('previousDentist', value)} />
                    <Field label="Last Dental Visit" type="date" value={form.lastDentalVisit} onChange={(value) => updateField('lastDentalVisit', value)} />
                    <Field label="Physician's Name" value={form.physicianName} onChange={(value) => updateField('physicianName', value)} />
                    <Field label="Specialty, if applicable" value={form.medicalSpecialty} onChange={(value) => updateField('medicalSpecialty', value)} />
                    <Field label="Office Address" value={form.physicianOfficeAddress} onChange={(value) => updateField('physicianOfficeAddress', value)} wide />
                    <Field label="Office No/s." value={form.physicianOfficeNumber} onChange={(value) => updateField('physicianOfficeNumber', value)} />
                  </div>
                </section>
              </div>
            </section>
          </div>
        )}

        {currentStep === 3 && (
          <div className="patient-stepper__grid patient-stepper__grid--balanced">
            <section className="patient-record__card patient-stepper__stage-card">
              <div className="patient-stepper__section-header patient-stepper__section-header--compact">
                <div>
                  <p className="patient-stepper__section-kicker">3. Medical Questions & Allergies</p>
                  <h3>Health screening before care</h3>
                </div>
                <p>Review the current medical status, existing treatment flags, and allergy information before procedures are scheduled.</p>
              </div>

              <section className="patient-stepper__subpanel patient-stepper__subpanel--unified">
                <div className="patient-stepper__subpanel-head">
                  <span className="patient-stepper__mini-kicker">Medical Questions</span>
                  <h4>Current patient screening and allergy review</h4>
                </div>
                <div className="patient-stepper__question-list">
                  {medicalQuestionLabels.map((question) => (
                    <div className="patient-stepper__question" key={question}>
                      <span>{question}</span>
                      <div className="patient-stepper__yes-no">
                        <label><input type="radio" name={question} checked={form.medicalQuestions[question] === 'yes'} onChange={() => updateMedicalQuestion(question, 'yes')} /> Yes</label>
                        <label><input type="radio" name={question} checked={form.medicalQuestions[question] === 'no'} onChange={() => updateMedicalQuestion(question, 'no')} /> No</label>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="patient-stepper__subsection">
                  <div className="patient-stepper__subsection-head">
                    <span className="patient-stepper__mini-kicker">Allergies</span>
                    <h4>Health details and reactions</h4>
                  </div>
                  <p className="patient-stepper__helper">Are you allergic to any of the following?</p>
                  <CheckboxGrid
                    options={allergyOptions}
                    selected={form.allergies}
                    onToggle={(value) => toggleListValue('allergies', value)}
                    variant="plain"
                    className="patient-stepper__checklist--allergies"
                  />
                  <div className="patient-stepper__form-grid patient-stepper__form-grid--compact">
                    <SelectField label="Blood Type" value={form.bloodType} onChange={(value) => updateField('bloodType', value)} options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']} />
                    <Field label="Blood Pressure" value={form.bloodPressure} onChange={(value) => updateField('bloodPressure', value)} />
                  </div>
                </div>
              </section>
            </section>
          </div>
        )}

        {currentStep === 4 && (
          <div className="patient-stepper__grid patient-stepper__grid--stack">
            <section className="patient-record__card patient-stepper__stage-card">
              <div className="patient-stepper__section-header patient-stepper__section-header--compact">
                <div>
                  <p className="patient-stepper__section-kicker">4. Conditions, Habits & Consent</p>
                  <h3>Clinical checklist and final consent</h3>
                </div>
                <p>Finalize systemic conditions, dental habits, and patient signature before completing the registration workflow.</p>
              </div>

              <section className="patient-stepper__subpanel patient-stepper__subpanel--unified">
                <div className="patient-stepper__subsection">
                  <div className="patient-stepper__subsection-head">
                    <span className="patient-stepper__mini-kicker">Medical Conditions</span>
                    <h4>Systemic history checklist</h4>
                  </div>
                  <p className="patient-stepper__helper">Check all that apply.</p>
                  <CheckboxGrid
                    options={medicalConditionOptions}
                    selected={form.medicalConditions}
                    onToggle={(value) => toggleListValue('medicalConditions', value)}
                    columns="four"
                    variant="plain"
                    className="patient-stepper__checklist--conditions"
                  />
                </div>

                <div className="patient-stepper__subsection">
                  <div className="patient-stepper__subsection-head">
                    <span className="patient-stepper__mini-kicker">Dental Habits</span>
                    <h4>Behavior and oral habits</h4>
                  </div>
                  <p className="patient-stepper__helper">Check all that apply.</p>
                  <CheckboxGrid
                    options={dentalHabitOptions}
                    selected={form.dentalHabits}
                    onToggle={(value) => toggleListValue('dentalHabits', value)}
                    columns="three"
                    variant="plain"
                    className="patient-stepper__checklist--habits"
                  />
                </div>

                <div className="patient-stepper__subsection patient-stepper__subsection--consent">
                  <div className="patient-stepper__subsection-head">
                    <span className="patient-stepper__mini-kicker">Consent</span>
                    <h4>Signature and confirmation</h4>
                  </div>
                  <div className="patient-stepper__form-grid patient-stepper__form-grid--compact">
                    <Field label="Signature / Printed Name" value={form.signatureName} onChange={(value) => updateField('signatureName', value)} />
                    <Field label="Date" type="date" value={form.signatureDate} onChange={(value) => updateField('signatureDate', value)} />
                  </div>
                </div>
              </section>
            </section>
          </div>
        )}
      </div>

      <div className="patient-stepper__actions">
        <button type="button" className="btn btn-outline" onClick={openExitProtection}>Cancel</button>
        <div className="patient-stepper__actions-right">
          {!isEdit ? (
            <button type="button" className="btn btn-outline" onClick={saveDraft}>
              Save as Draft
            </button>
          ) : null}
          <button type="button" className="btn btn-outline" onClick={goPrevious} disabled={currentStep === 1}>
            <ChevronLeft size={16} aria-hidden="true" />
            Back
          </button>
          {currentStep < 4 ? (
            <button type="button" className="btn btn-primary" onClick={goNext} disabled={!canContinue}>
              Next
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={handleSubmit}>
              <Check size={16} aria-hidden="true" />
              Finish & Save
            </button>
          )}
        </div>
      </div>

      <DraftExitConfirmation
        open={draftExitOpen}
        isEdit={isEdit}
        onContinueEditing={continueEditing}
        onSaveAsDraft={saveAndExit}
        onDiscard={discardChanges}
      />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  wide = false,
  maxDate,
  minDate
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  wide?: boolean;
  maxDate?: string;
  minDate?: string;
}) {
  return (
    <label className={wide ? 'patient-stepper__field patient-stepper__field--wide' : 'patient-stepper__field'}>
      <span>{label}{required ? ' *' : ''}</span>
      {type === 'date' ? (
        <DatePicker value={value} onChange={onChange} maxDate={maxDate} minDate={minDate} />
      ) : (
        <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="patient-stepper__field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Select...</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function CheckboxGrid({
  options,
  selected,
  onToggle,
  columns = 'two',
  className = '',
  variant = 'card'
}: {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  columns?: 'two' | 'three' | 'four';
  className?: string;
  variant?: 'card' | 'plain';
}) {
  return (
    <div className={`patient-stepper__checklist patient-stepper__checklist--${columns} ${variant === 'plain' ? 'patient-stepper__checklist--plain' : ''} ${className}`.trim()}>
      {options.map((item) => (
        <label key={item}>
          <input type="checkbox" checked={selected.includes(item)} onChange={() => onToggle(item)} />
          <span>{item}</span>
        </label>
      ))}
    </div>
  );
}

export function DraftIndicator({ draftSavedAt, hasDraft }: { draftSavedAt: string | null; hasDraft: boolean }) {
  if (!hasDraft) return null;
  return (
    <div className="patient-draft-indicator" aria-live="polite">
      <strong>Patient Registration Draft</strong>
      <span>{draftSavedAt ? `Draft Saved - ${formatRelativeTime(draftSavedAt)}` : 'Draft Saved'}</span>
    </div>
  );
}

export function DraftExitConfirmation({
  open,
  isEdit,
  onContinueEditing,
  onSaveAsDraft,
  onDiscard
}: {
  open: boolean;
  isEdit: boolean;
  onContinueEditing: () => void;
  onSaveAsDraft: () => void;
  onDiscard: () => void;
}) {
  return (
    <ConfirmationDialog
      open={open}
      title={isEdit ? 'Discard patient record changes?' : 'Save patient draft?'}
      description={isEdit ? 'You have unsaved edits in this patient record.' : 'You have unfinished patient information.'}
      confirmLabel="Continue Editing"
      cancelLabel={isEdit ? 'Discard Changes' : 'Discard'}
      onConfirm={onContinueEditing}
      onCancel={onDiscard}
      destructive
      footerPrefix={!isEdit ? <button type="button" className="btn btn-outline" onClick={onSaveAsDraft}>Save as Draft</button> : undefined}
    >
      {!isEdit ? (
        <div className="patient-draft-confirmation">
          <p>Choose how you want to leave this workflow.</p>
        </div>
      ) : null}
    </ConfirmationDialog>
  );
}

function formatRelativeTime(iso: string) {
  const savedAt = new Date(iso).getTime();
  const diffMinutes = Math.max(1, Math.round((Date.now() - savedAt) / 60000));
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  const diffHours = Math.round(diffMinutes / 60);
  return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
}
