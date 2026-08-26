import {
  ConfigurableDocumentHeader,
  type DocumentHeaderSettings
} from './ConfigurableDocumentHeader';
import type { PatientPreviewItem } from '../patients/components/patientTypes';
import { buildPatientDocumentIdentity } from '../patients/components/patientDocumentData';

interface PatientRecordPrintFormProps {
  clinicName: string;
  address: string;
  contact: string;
  badgeText: string;
  showClinicName: boolean;
  showAddress: boolean;
  showContact: boolean;
  showBadge: boolean;
  showLeftImage: boolean;
  showLeftImageOutline: boolean;
  showRightImage: boolean;
  visibleSectionIds: Set<string>;
  sectionOrder?: string[];
  headerSettings?: Partial<DocumentHeaderSettings>;
  badgeMarginTop?: number;
  badgeMarginBottom?: number;
  dentistName?: string;
  signatureImageData?: string;
  signatureSize?: number;
  signaturePlacement?: string;
  patient?: PatientPreviewItem;
}

const medicalQuestions = [
  { question: '1. Are you in good condition?' },
  {
    question: '2. Are you under medical treatment now?',
    followUp: 'If so, what is the condition being treated?'
  },
  {
    question: '3. Have you ever had serious illness or surgical operation?',
    followUp: 'If so, what illness or operation?'
  },
  {
    question: '4. Have you ever been hospitalized?',
    followUp: 'If so, when and why?'
  },
  {
    question: '5. Are you taking any prescription / non-prescription medication?',
    followUp: 'If so, please specify:'
  },
  { question: '6. Do you use tobacco products?' },
  { question: '7. Do you use alcohol, cocaine or other dangerous drugs?' }
];

const allergyItems = [
  'Local Anesthetic',
  'Sulfa Drugs',
  'Latex',
  'Penicillin / Antibiotics',
  'Aspirin',
  'Other:'
];

const medicalConditions = [
  'High Blood Pressure',
  'Low Blood Pressure',
  'Epilepsy / Convulsion',
  'AIDS or HIV Infection',
  'Sexually Transmitted Disease',
  'Stomach Troubles / Ulcers',
  'Fainting Seizure',
  'Rapid Weight Loss',
  'Radiation Therapy',
  'Joint Replacement / Implant',
  'Heart Surgery',
  'Heart Attack',
  'Heart Disease',
  'Heart Murmur',
  'Hepatitis / Liver Disease',
  'Rheumatic Fever',
  'Hay Fever / Allergies',
  'Respiratory Problems',
  'Hepatitis / Jaundice',
  'Tuberculosis',
  'Swollen Ankles',
  'Kidney Disease',
  'Chest Pain',
  'Stroke',
  'Cancer / Tumors',
  'Anemia',
  'Angina',
  'Asthma',
  'Emphysema',
  'Bleeding Problems',
  'Blood Disease',
  'Head Injuries',
  'Arthritis / Rheumatism',
  'Thyroid Problem',
  'Diabetes',
  'Others'
];

const normalizeLookupText = (value: string) =>
  value
    .toLowerCase()
    .replace(/^\d+\.\s*/, '')
    .replace(/[:/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const parseDisplayDate = (value?: string) => {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = new Date(`${value}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatFormDate = (value?: string) => {
  const parsed = parseDisplayDate(value);
  if (!parsed) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(parsed);
};

export function PatientRecordPrintForm({
  clinicName,
  address,
  contact,
  badgeText,
  showClinicName,
  showAddress,
  showContact,
  showBadge,
  showLeftImage,
  showLeftImageOutline,
  showRightImage,
  visibleSectionIds,
  sectionOrder = [],
  headerSettings,
  badgeMarginTop = 0,
  badgeMarginBottom = 4,
  dentistName = '',
  signatureImageData = '',
  signatureSize = 100,
  signaturePlacement = 'Right Align',
  patient
}: PatientRecordPrintFormProps) {
  const identity = patient ? buildPatientDocumentIdentity(patient) : null;
  const patientAllergies = new Set(
    (patient?.allergyList?.length ? patient.allergyList : patient?.allergies || '')
      .toString()
      .split(/[,;/]/)
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
  );
  const patientConditions = new Set(
    (patient?.medicalConditions || [])
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
  );
  const isVisible = (sectionId: string) => visibleSectionIds.has(sectionId);
  const sectionStyle = (sectionId: string) => ({
    order: Math.max(1, sectionOrder.indexOf(sectionId) + 1)
  });
  const questionAnswers = patient?.medicalQuestions || {};
  const printDate = formatFormDate(patient?.signatureDate) || formatFormDate(patient?.effectiveDate) || new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
  const getQuestionAnswer = (question: string) => {
    const normalizedTarget = normalizeLookupText(question);
    const match = Object.entries(questionAnswers).find(([key]) => normalizeLookupText(key) === normalizedTarget);
    return match?.[1] || '';
  };
  const hasAllergy = (item: string) => {
    const normalizedItem = normalizeLookupText(item.replace('Drugs', '').replace('Antibiotics', '').replace('Other:', 'Other'));
    return Array.from(patientAllergies).some((allergy) => {
      const normalizedAllergy = normalizeLookupText(allergy);
      if (normalizedAllergy === normalizedItem) return true;
      if (normalizedItem.includes(normalizedAllergy) || normalizedAllergy.includes(normalizedItem)) return true;
      if (normalizedItem === 'sulfa' && normalizedAllergy.includes('sulfa')) return true;
      if (normalizedItem.includes('penicillin') && normalizedAllergy.includes('penicillin')) return true;
      if (normalizedItem.includes('local anesthetic') && normalizedAllergy.includes('local anesthetic')) return true;
      return false;
    });
  };

  return (
    <article className="patient-print-form" data-pdf-print-root="patient-form">
      <ConfigurableDocumentHeader
        settings={headerSettings ?? {
          clinicName,
          address,
          contact,
          showClinicName,
          showAddress,
          showContact,
          showLeftImage,
          showLeftImageOutline,
          showRightImage
        }}
      />

      {showBadge && (
        <div
          className="patient-print-form__badge"
          style={{ marginTop: `${badgeMarginTop}px`, marginBottom: `${badgeMarginBottom}px` }}
        >
          {badgeText}
        </div>
      )}

      {isVisible('patient-information-record') && (
        <section className="patient-print-form__section patient-print-form__identity" style={sectionStyle('patient-information-record')}>
          <div className="patient-print-form__row patient-print-form__row--name">
            <span className="patient-print-form__label">Name:</span>
            <PrintField hint="Last Name" value={identity?.lastName} />
            <PrintField hint="First Name" value={identity?.firstName} />
            <PrintField hint="Middle" value={identity?.middleName} />
          </div>
          <div className="patient-print-form__row patient-print-form__row--three">
            <PrintField label="Birthday (mm/dd/yy):" value={identity?.birthDate} />
            <PrintField label="Nickname:" value={identity?.nickname} />
            <div className="patient-print-form__paired-fields">
              <PrintField label="Age:" value={identity?.age} />
              <PrintField label="Sex: M / F" value={identity?.sex} />
            </div>
          </div>
          <div className="patient-print-form__row patient-print-form__row--three">
            <PrintField label="Religion:" value={patient?.religion} />
            <PrintField label="Nationality:" value={patient?.nationality} />
            <PrintField label="Civil Status:" value={patient?.civilStatus} />
          </div>
          <div className="patient-print-form__row patient-print-form__row--three">
            <PrintField label="Home Address:" value={patient?.address} className="patient-print-form__span-two" />
            <PrintField label="Tel. No/s.:" value={patient?.contact} />
          </div>
          <div className="patient-print-form__row patient-print-form__row--three">
            <PrintField label="Company:" value={patient?.company} />
            <PrintField label="Occupation:" value={patient?.occupation} />
            <PrintField label="Office No/s.:" value={patient?.officeNumber} />
          </div>
          <div className="patient-print-form__row patient-print-form__row--three">
            <PrintField label="Dental Insurance:" value={patient?.dentalInsurance} className="patient-print-form__span-two" />
            <PrintField label="Fax No/s.:" value={patient?.faxNumber} />
          </div>
          <div className="patient-print-form__row patient-print-form__row--three">
            <PrintField label="Effective Date:" value={patient?.effectiveDate} className="patient-print-form__span-two" />
            <PrintField label="Mobile No/s.:" value={patient?.mobileNumber || patient?.contact} />
          </div>
        </section>
      )}

      {isVisible('minor-referral-details') && (
        <section className="patient-print-form__section patient-print-form__minor" style={sectionStyle('minor-referral-details')}>
          <div className="patient-print-form__row patient-print-form__row--minor">
            <strong>For Minors:</strong>
            <PrintField label="Email Add.:" value={patient?.email} />
          </div>
          <PrintField label="Parents / Guardian's Name:" value={patient?.parentGuardianName} />
          <PrintField label="Whom may we thank for referring you?:" value={patient?.referralSource} />
          <PrintField label="What is your reason for dental consultation?:" value={patient?.consultationReason} />
        </section>
      )}

      {isVisible('dental-history') && (
        <section className="patient-print-form__section" style={sectionStyle('dental-history')}>
          <h2>Dental History</h2>
          <PrintField label="Previous Dentist: Dr." value={patient?.previousDentist} />
          <PrintField label="Last Dental visit:" value={patient?.lastDentalVisit} />
        </section>
      )}

      {isVisible('medical-history') && (
        <section className="patient-print-form__section" style={sectionStyle('medical-history')}>
          <h2>Medical History</h2>
          <div className="patient-print-form__row patient-print-form__row--medical">
            <PrintField label="Name of the Physician: Dr." value={patient?.physicianName} />
            <PrintField label="Specialty, if applicable:" value={patient?.medicalSpecialty} />
          </div>
          <div className="patient-print-form__row patient-print-form__row--medical-address">
            <PrintField label="Office Address:" value={patient?.physicianOfficeAddress} />
            <PrintField label="Office No/s.:" value={patient?.physicianOfficeNumber} />
          </div>
        </section>
      )}

      {isVisible('medical-questions') && (
        <section className="patient-print-form__section patient-print-form__questions" style={sectionStyle('medical-questions')}>
          <div className="patient-print-form__question-heading">
            <span>Please place (x) under &quot;YES&quot; or &quot;NO&quot;.</span>
            <strong>YES</strong>
            <strong>NO</strong>
          </div>
          {medicalQuestions.map(({ question, followUp }) => {
            const answer = getQuestionAnswer(question);
            return (
            <div key={question} className="patient-print-form__question-block">
              <div className="patient-print-form__question">
                <span>{question}</span>
                <span className={`patient-print-form__choice-mark ${answer === 'yes' ? 'is-selected' : ''}`} aria-hidden="true">
                  {answer === 'yes' ? '(x)' : '( )'}
                </span>
                <span className={`patient-print-form__choice-mark ${answer === 'no' ? 'is-selected' : ''}`} aria-hidden="true">
                  {answer === 'no' ? '(x)' : '( )'}
                </span>
              </div>
              {followUp && <PrintField label={followUp} className="patient-print-form__follow-up" />}
            </div>
          )})}
        </section>
      )}

      {isVisible('allergies') && (
        <section className="patient-print-form__section patient-print-form__allergies" style={sectionStyle('allergies')}>
          <p>Are you allergic to any of the following:</p>
          <div className="patient-print-form__check-grid patient-print-form__check-grid--allergies">
            {allergyItems.map((item) => (
              <CheckItem key={item} label={item} selected={hasAllergy(item)} />
            ))}
          </div>
        </section>
      )}

      {isVisible('health-details') && (
        <section className="patient-print-form__section" style={sectionStyle('health-details')}>
          <div className="patient-print-form__row patient-print-form__row--medical">
            <PrintField label="Blood Type:" value={patient?.bloodType} />
            <PrintField label="Blood Pressure:" value={patient?.bloodPressure} />
          </div>
        </section>
      )}

      {isVisible('for-women-only') && (
        <section className="patient-print-form__section patient-print-form__women" style={sectionStyle('for-women-only')}>
          <strong>For women only:</strong>
          <div>
            {['Are you pregnant?', 'Are you nursing?', 'Are you taking birth control pills?'].map((question) => (
              <div key={question} className="patient-print-form__question">
                <span>{question}</span>
                <span className="patient-print-form__choice-mark" aria-hidden="true">O</span>
                <span className="patient-print-form__choice-mark" aria-hidden="true">O</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {isVisible('medical-conditions-checklist') && (
        <section className="patient-print-form__section patient-print-form__conditions" style={sectionStyle('medical-conditions-checklist')}>
          <p>Do you have or have you had any of the following? Check which apply.</p>
          <div className="patient-print-form__check-grid patient-print-form__check-grid--conditions">
            {medicalConditions.map((condition) => (
              <CheckItem key={condition} label={condition} selected={patientConditions.has(condition.toLowerCase())} />
            ))}
          </div>
        </section>
      )}

      {isVisible('signature-consent') && (
        <footer className="patient-print-form__footer" style={sectionStyle('signature-consent')}>
          <div className="patient-print-form__signature-block">
            <span className="patient-print-form__signature-value">{printDate}</span>
            <strong>Date</strong>
          </div>
          <div
            className="patient-print-form__signature-block patient-print-form__signature-block--wide"
            style={{ alignItems: signaturePlacement === 'Center' ? 'center' : signaturePlacement === 'Left Align' ? 'flex-start' : 'flex-end' }}
          >
            {signatureImageData && (
              <img
                className="document-dentist-signature"
                src={signatureImageData}
                alt="Dentist signature"
                style={{ width: `${signatureSize}px` }}
              />
            )}
            <span className="patient-print-form__signature-value">{patient?.signatureName || identity?.fullName || ''}</span>
            <strong>Patient / Parent / Guardian Signature</strong>
            <small>Over Printed Name</small>
            {dentistName && <small>Prepared with {dentistName}</small>}
          </div>
        </footer>
      )}
    </article>
  );
}

function PrintField({
  label,
  hint,
  value,
  className = ''
}: {
  label?: string;
  hint?: string;
  value?: string;
  className?: string;
}) {
  return (
    <div className={`patient-print-form__field ${className}`}>
      {label && <span>{label}</span>}
      <i>{value && <span className="patient-print-form__field-value">{value}</span>}</i>
      {hint && <small>{hint}</small>}
    </div>
  );
}

function CheckItem({ label, selected = false }: { label: string; selected?: boolean }) {
  return (
    <div className="patient-print-form__check-item">
      <span className={`patient-print-form__choice-mark ${selected ? 'is-selected' : ''}`} aria-hidden="true">
        {selected ? '(x)' : '( )'}
      </span>
      <span>{label}</span>
    </div>
  );
}
