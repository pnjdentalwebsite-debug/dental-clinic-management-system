import type { ReactNode } from 'react';
import {
  ConfigurableDocumentHeader,
  type DocumentHeaderSettings
} from './ConfigurableDocumentHeader';

export interface ContractLedgerRow {
  id: string;
  date: string;
  amountCharged: string;
  amountPaid: string;
  remarks: string;
  signature: string;
}

interface ContractPrintFormProps {
  headerSettings?: Partial<DocumentHeaderSettings>;
  title?: string;
  patientName?: string;
  patientAge?: string;
  patientAddress?: string;
  patientContact?: string;
  patientBirthDate?: string;
  acknowledgementPrintedName?: string;
  acknowledgementAddressAt?: string;
  acknowledgementAge?: string;
  dentistName?: string;
  dentistRole?: string;
  treatmentPackage?: string;
  balanceTerms?: string;
  downPaymentTerms?: string[];
  ledgerRows?: ContractLedgerRow[];
}

const inclusions = [
  'Oral prophylaxis (cleaning) every dental check-up during the orthodontic treatment.',
  'A minimum of two (2) restorations or tooth filling of tooth caries present during the time of consultation. However, extensive or deep restorations and other teeth that have carious lesions must be charged accordingly.'
];

const nonInclusionsPageOne = [
  'Serial extractions needed for the treatment.',
  'Odontectomy (surgical removal of impacted teeth) and extraction of 3rd molars (wisdom teeth).',
  'Frenectomy.',
  'Temporary Anchorage Device (TADS).',
  'Splints.',
  'Temporary Dentures.',
  'Panoramic and Cephalometric X-rays.',
  'Fixed Porcelain or Plastic Crowns.',
  'Root Canal Treatment (RCT).',
  'Gingivectomy.'
];

const nonInclusionsPageTwo = [
  'Retainers after treatment. This is due to the unpredictable cost of manufacturing of retainers; however, if a patient refers to a person for possible orthodontic treatment commences, it shall be converted into points and thus deducted from the total cost of the retainers of the patients who referred the individual.',
  'Painless anaesthesia for any root canal treatment, periodontal and other surgery procedures and tooth extraction.'
];

const packageFees = [
  'The Orthodontic Treatment Package (OTP) shall be determined by the dentist or orthodontist or doctor. Prices may vary due to the nature of each patient case.',
  'Cost of Orthodontic Treatment Package: Initial Down Payment, Monthly Installment, and Estimated Duration of Treatment.',
  'The Orthodontic Treatment Package will include all cost of the material needed for the patient case, dentist or orthodontist or doctor professional fees and all other expenses, fees and charges necessary for or incidental to the specific treatment.',
  'All minor patients must have written consent form from the parents or guardians before the treatment commences.',
  'Payment of the Orthodontic Treatment Package fees shall be made on a monthly basis. If a patient fails to pay on the specific monthly visit, it is understood that such payment must be settled on the patient next visit.',
  'Prices/Cost shall be kept confidential at all times, even after the termination of the doctor-patient relationship.',
  'The Orthodontic Treatment Package fees should be settled upon completion of the treatment.'
];

const termsPageOne = [
  'The clinic follows a strict rule of "FIRST COME, FIRST SERVE WITH APPOINTMENT" rules. Clinic only accepts patients on an appointment basis.',
  'The clinic strictly follows the CHART TIME RULE. This is determined based on how many times the patient comes in for the treatment; the clinic does not use CALENDAR TIME in determining treatment duration.',
  'Six (6) months or more of non-appearance and treatment, despite repetitive reminders from the clinic staff, entitles the clinic to automatically put the patient case in our dormant file. No notices will be sent afterwards. No paid fees shall be refunded.',
  'The clinic reserves the right not to accept delinquent patients of six (6) months or more. No paid fees shall be refunded.',
  'The patient must advise the dentist/orthodontist/doctor of any temporary cessation of treatment due to illness, pregnancy and/or any other health conditions prior to the next scheduled appointment/treatment. Failure to notify and to keep the appointment shall result in an additional 10% of cost package, which shall be collected upon resumption of treatment.',
  'However, if a patient notifies the clinic of the above mentioned circumstances, treatment and payment of fees will resume. No additional fees shall be collected.',
  'In all cases of the above mentioned, the dentist/orthodontist/doctor WILL NOT BE HELD LIABLE FOR WHATEVER CONSEQUENCES THAT MAY ARISE DUE TO NON-APPEARANCE OF THE PATIENT FOR TREATMENT.',
  'There shall be NO REFUND OF FEES that are already paid for.',
  'There shall be NO REFUND OF FEES for patients who wish to pre-terminate treatment and contract for whatever reason. Patient shall have to pay the running cost incurred by the dentist/orthodontist/doctor at the time of pre-termination.',
  'No release of diagnostic aids (panoramic, periapical, cephalometric radiograph), working and study casts and patient chart during and after the treatment.',
  'The clinic and/or dentist/orthodontist/doctor reserve the right to refuse treatment to an individual who is unruly in behavior and to pre-terminate contract if the patient is proven to be uncooperative.',
  'The clinic only accepts referral from current or previous patients.',
  'If the patient intends to leave for another country or migrates while still undergoing treatment, the patient shall advise the dentist/orthodontist/doctor of his/her intentions and make arrangements with the clinic. No records shall be released except for the patient profile.'
];

const termsPageTwo = [
  'The dentist/orthodontist/doctor shall not be liable for relapse of any dental condition, whether or not covered by the OTP, for which the patient has sought any treatment.',
  'Lost, misplaced, or damaged brackets, buccal tubes, and molar bands shall be charged to patient: repaste - PHP 200/each; replacement - PHP 500/each.',
  'Patients who wish to have their appliance removed temporarily for an occasion will be charged with a minimum fee for removal and reinstallation. The dentist/orthodontist/doctor DO NOT use same appliance for reinstallation.'
];

export function ContractPrintForm({
  headerSettings,
  title = 'CONTRACT FOR ORTHODONTIC TREATMENT',
  patientName = 'awdawd dawdawd',
  patientAge = '25',
  patientAddress = 'dawdawd',
  patientContact = 'dadawdawd',
  patientBirthDate = '2000-11-28',
  acknowledgementPrintedName = 'awdawd dawdawd',
  acknowledgementAddressAt = 'dawdawd',
  acknowledgementAge = '25',
  dentistName = 'Maria Jessica David - Tanarte, DMD',
  dentistRole = 'Associate Dentist',
  treatmentPackage = '',
  balanceTerms = '',
  downPaymentTerms = ['', '', '', '', ''],
  ledgerRows = defaultLedgerRows
}: ContractPrintFormProps) {
  const paymentTerms = normalizePaymentTerms(downPaymentTerms);

  return (
    <article className="contract-print-form" data-pdf-print-root="contract-form">
      <section className="contract-print-form__page" data-pdf-page="contract-page-1">
        <ConfigurableDocumentHeader settings={headerSettings} compact />
        <h1>{title}</h1>

        <div className="contract-print-form__identity">
          <InlineField label="NAME:" value={patientName} wide />
          <InlineField label="AGE:" value={patientAge} short />
          <InlineField label="ADDRESS:" value={patientAddress} wide />
          <InlineField label="TEL/MOBILE NO:" value={patientContact} />
          <InlineField label="DATE OF BIRTH:" value={patientBirthDate} />
        </div>

        <ContractSection title="ORTHODONTIC TREATMENT PACKAGE FEES">
          <RomanList start={1} items={packageFees} />
        </ContractSection>

        <ContractSection title="INCLUSIONS">
          <RomanList start={1} items={inclusions} />
        </ContractSection>

        <ContractSection title="NON INCLUSIONS">
          <RomanList start={1} items={nonInclusionsPageOne} />
        </ContractSection>
      </section>

      <section className="contract-print-form__page" data-pdf-page="contract-page-2">
        <div className="contract-print-form__continuation">
          <ContractSection title="NON INCLUSIONS (CONTINUED)">
            <RomanList start={11} items={nonInclusionsPageTwo} />
          </ContractSection>

          <p className="contract-print-form__body-copy">
            All Standard rates apply hereafter, however, discounts may be given at the discretion of the
            dentist/orthodontist/doctor.
          </p>

          <ContractSection title="TERMS AND CONDITIONS">
            <RomanList start={1} items={termsPageOne} />
          </ContractSection>
        </div>
      </section>

      <section className="contract-print-form__page" data-pdf-page="contract-page-3">
        <ContractSection title="TERMS AND CONDITIONS (CONTINUED)">
          <RomanList start={14} items={termsPageTwo} />
        </ContractSection>

        <p className="contract-print-form__body-copy contract-print-form__acknowledgement">
          I, <InlineText value={acknowledgementPrintedName} />, with address at,
          <InlineText value={acknowledgementAddressAt} />, age, <InlineText value={acknowledgementAge} />,
          have read, understood and conform all the term and conditions stated in this contract.
        </p>

        <footer className="contract-print-form__signature-grid">
          <SignatureLine label="Signature over printed name" name={dentistName} sublabel={dentistRole} />
          <SignatureLine
            label="Signature over printed name of Legal Guardian"
            sublabel="if the patient is minor"
          />
        </footer>
      </section>

      <section className="contract-print-form__page" data-pdf-page="contract-page-4">
        <h2>ORTHODONTIC TREATMENT PACKAGE</h2>

        <div className="contract-print-form__package-identity">
          <InlineField label="Name of the Patient:" value={patientName} wide />
          <InlineField label="Tel./Mobile No.:" value={patientContact} />
          <InlineField label="Age:" value={patientAge} short />
        </div>

        <div className="contract-print-form__package-lines">
          <LinedBlock label="Orthodontic Treatment Package" value={treatmentPackage} tall />
          <LinedBlock label="Down payment Terms" value={paymentTerms[0]} />
          {paymentTerms.slice(1).map((term, index) => (
            <LinedBlock key={`down-term-${index}`} label="" value={term} />
          ))}
          <LinedBlock label="Balance Terms" value={balanceTerms} tall />
        </div>

        <table className="contract-print-form__ledger">
          <thead>
            <tr>
              <th>Date</th>
              <th>Amount Charged</th>
              <th>Amount Paid</th>
              <th>Remarks</th>
              <th>Signature</th>
            </tr>
          </thead>
          <tbody>
            {ledgerRows.map((row) => (
              <tr key={row.id}>
                <td>{row.date || 'dd/mm/yyyy'}</td>
                <td>{row.amountCharged || '0.00'}</td>
                <td>{row.amountPaid || '0.00'}</td>
                <td>{row.remarks}</td>
                <td>{row.signature}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </article>
  );
}

function ContractSection({
  title,
  children
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="contract-print-form__section">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function RomanList({ items, start }: { items: string[]; start: number }) {
  return (
    <ol className="contract-print-form__roman-list" start={start} type="I">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ol>
  );
}

function InlineField({
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
    <div className={`contract-print-form__field ${wide ? 'is-wide' : ''} ${short ? 'is-short' : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function InlineText({ value }: { value: string }) {
  return <span className="contract-print-form__inline-text">{value}</span>;
}

function LinedBlock({
  label,
  value,
  tall = false
}: {
  label: string;
  value: string;
  tall?: boolean;
}) {
  return (
    <div className={`contract-print-form__lined-block ${tall ? 'is-tall' : ''}`}>
      {label && <span>{label}:</span>}
      <div>{value}</div>
    </div>
  );
}

function SignatureLine({
  label,
  name = '',
  sublabel = ''
}: {
  label: string;
  name?: string;
  sublabel?: string;
}) {
  return (
    <div className="contract-print-form__signature-line">
      <span />
      {name && <strong>{name}</strong>}
      {sublabel && <small>{sublabel}</small>}
      <p>{label}</p>
    </div>
  );
}

function normalizePaymentTerms(terms: string[]) {
  const nextTerms = [...terms];
  while (nextTerms.length < 5) nextTerms.push('');
  return nextTerms.slice(0, 5);
}

const defaultLedgerRows: ContractLedgerRow[] = Array.from({ length: 4 }, (_, index) => ({
  id: `ledger-row-${index + 1}`,
  date: '',
  amountCharged: '',
  amountPaid: '',
  remarks: '',
  signature: ''
}));
