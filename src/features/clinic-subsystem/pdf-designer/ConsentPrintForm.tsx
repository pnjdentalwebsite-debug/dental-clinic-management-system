import {
  ConfigurableDocumentHeader,
  type DocumentHeaderSettings
} from './ConfigurableDocumentHeader';

const medicalColumns = [
  [
    'High Blood Pressure',
    'A Heart Condition',
    'Rheumatic Fever',
    'Venereal Disease',
    'Kidney Disease',
    'Fainting History',
    'Thyroid Disease',
    'Liver Disease',
    'Rheumatism'
  ],
  [
    'Asthma',
    'Anemia',
    'Diabetes',
    'Hepatitis',
    'Epilepsy',
    'Arthritis',
    'Allergies',
    'Tonsillitis',
    'Glaucoma'
  ],
  [
    'Hay Fever',
    'Tuberculosis',
    'Stomach Ulcer',
    'Sinus Problem',
    'Clotting Disorder',
    'Nervous Disorder',
    'Bleeding Disorder',
    'Enlarged Adenoids'
  ]
];

const allergyItems = ['Penicillin', 'Other Antibiotics', 'Local Anesthesia', 'Others'];

const risks = [
  'Postoperative discomfort and swelling that may necessitate several days of home recuperation.',
  'Restricted mouth opening for several days or weeks.',
  'Heavy bleeding that may be prolonged.',
  'Nausea and vomiting (usually associated with medications prescribed for pain).',
  'Postoperative infection requiring additional treatment.',
  'Decision to leave a small piece of root in the jaw when its removal would require extensive surgery.',
  'Damage to adjacent teeth, fillings, and crowns.',
  'Stretching of the corners of the mouth with resulting cracking and bruising.',
  'Change in occlusion and temporo-mandibular joint difficulty.',
  'Prolonged drowsiness.',
  'With surgery and extractions of the upper jaw, an opening into the maxillary nasal sinus or nose requiring additional surgery.',
  'With surgery and extractions of the lower jaw, injury to the nerve underlying the teeth resulting in numbness or tingling.',
  'Breakage / fracture of the jaw.',
  'Cardiac arrest.'
];

interface ConsentPrintFormProps {
  headerSettings?: Partial<DocumentHeaderSettings>;
  title?: string;
  dentistName?: string;
  signatureImageData?: string;
  signatureSize?: number;
  signaturePlacement?: string;
  patientName?: string;
  birthDate?: string;
  patientAge?: string;
  patientStatus?: string;
  selectedMedicalConditions?: string[];
  selectedAllergies?: string[];
}

export function ConsentPrintForm({
  headerSettings,
  title = 'ORAL SURGERY CONSENT FORM',
  dentistName = '',
  signatureImageData = '',
  signatureSize = 100,
  signaturePlacement = 'Right Align',
  patientName = 'awdawd dawdawd',
  birthDate = '2000-11-28',
  patientAge = '25',
  patientStatus = '',
  selectedMedicalConditions = [],
  selectedAllergies = []
}: ConsentPrintFormProps) {
  const medicalConditionSet = new Set(selectedMedicalConditions.map((item) => item.toLowerCase()));
  const allergySet = new Set(selectedAllergies.map((item) => item.toLowerCase()));
  return (
    <article className="consent-print-form" data-pdf-print-root="consent-form">
      <ConfigurableDocumentHeader settings={headerSettings} compact />
      <h1>{title}</h1>

      <section className="consent-print-form__identity">
        <LabeledValue label="Patient Name:" value={patientName} wide />
        <LabeledValue label="Date of Birth:" value={birthDate} />
        <LabeledValue label="Age:" value={patientAge} short />
        <LabeledValue label="Status:" value={patientStatus} short />
      </section>

      <h2>MEDICAL HISTORY</h2>
      <section className="consent-print-form__medical">
        <div className="consent-print-form__medical-main">
          <h3>Do you have or have you had any of the following? (Please check)</h3>
          <div className="consent-print-form__condition-columns">
            {medicalColumns.map((items, index) => (
              <ChecklistColumn key={index} items={items} selectedItems={medicalConditionSet} />
            ))}
          </div>
        </div>

        <div className="consent-print-form__allergies">
          <h3>Do you have any allergies?</h3>
          <ChecklistColumn items={allergyItems} selectedItems={allergySet} />
          <QuestionLine label="Are you taking medications at present?" />
          <QuestionLine label="Are you being treated by a Physician?" />
          <QuestionLine label="Previous Extraction?" />
        </div>
      </section>

      <section className="consent-print-form__authorization">
        <p>
          I hereby authorize Dr. <InlineBlank /> and any other dentists of <InlineBlank /> to perform
          the following treatment or surgical procedure <InlineBlank wide />, and I understand that
          this is an elective, urgent, or emergency procedure <InlineBlank />.
        </p>

        <p>
          I have been informed that the risks to my health if this procedure is not performed include,
          but are not limited to pain, infection, cyst formation, loss of bone around the teeth causing
          their loss, and an increased risk of complications if surgery is postponed.
        </p>

        <p>
          I have been informed of any possible alternative methods of treatment should any exist.
          Further, I understand that there are certain inherent and potential risks in any treatment or
          procedure, and that in this specific instance, such risks may include the following:
        </p>

        <ol>
          {risks.map((risk) => <li key={risk}>{risk}</li>)}
          <li>Other: <InlineBlank wide /></li>
        </ol>

        <label className="consent-print-form__consent-check">
          <span className="consent-print-form__box" />
          <span>
            I consent to the administration of local anesthesia, nitrous oxide analgesia or oral
            sedation in connection to the procedure referred to above.
          </span>
        </label>

        <p className="consent-print-form__centered">
          I certify that I have read the above and fully understand this consent for surgery, and that
          I understand that a perfect result cannot be guaranteed.
        </p>

        <p className="consent-print-form__centered">
          Drugs given at the time of surgery for sedative purposes or control of pain may cause
          drowsiness and lack of awareness or coordination.
        </p>
      </section>

      <footer className="consent-print-form__signatures">
        <SignatureLine label="Patient's Signature / Date" />
        <SignatureLine label="Witness or Interpreter / Date" />
        <SignatureLine label="Parent or Legal Guardian" sublabel="(If patient under 18 years of age) / Date" />
        <SignatureLine
          label="Dentist's Signature / Date"
          name={dentistName}
          signatureImageData={signatureImageData}
          signatureSize={signatureSize}
          signaturePlacement={signaturePlacement}
        />
      </footer>
    </article>
  );
}

function ChecklistColumn({
  items,
  selectedItems = new Set<string>()
}: {
  items: string[];
  selectedItems?: Set<string>;
}) {
  return (
    <div className="consent-print-form__check-column">
      <div className="consent-print-form__yes-no"><span>YES</span><span>NO</span></div>
      {items.map((item) => (
        <div key={item} className="consent-print-form__check-row">
          <span className="consent-print-form__box">{selectedItems.has(item.toLowerCase()) ? '✓' : ''}</span>
          <span className="consent-print-form__box">{selectedItems.has(item.toLowerCase()) ? '' : '✓'}</span>
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}

function QuestionLine({ label }: { label: string }) {
  return (
    <div className="consent-print-form__question-line">
      <span>{label}</span>
      <i />
    </div>
  );
}

function LabeledValue({
  label,
  value,
  wide = false,
  short = false
}: {
  label: string;
  value: string;
  wide?: boolean;
  short?: boolean;
}) {
  return (
    <div className={`consent-print-form__field ${wide ? 'is-wide' : ''} ${short ? 'is-short' : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function InlineBlank({ wide = false }: { wide?: boolean }) {
  return <span className={`consent-print-form__inline-blank ${wide ? 'is-wide' : ''}`} />;
}

function SignatureLine({
  label,
  sublabel = '',
  name = '',
  signatureImageData = '',
  signatureSize = 100,
  signaturePlacement = 'Right Align'
}: {
  label: string;
  sublabel?: string;
  name?: string;
  signatureImageData?: string;
  signatureSize?: number;
  signaturePlacement?: string;
}) {
  return (
    <div
      className="consent-print-form__signature"
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
      <span />
      <strong>{label}</strong>
      {name && <small className="consent-print-form__signature-name">{name}</small>}
      {sublabel && <small>{sublabel}</small>}
    </div>
  );
}
