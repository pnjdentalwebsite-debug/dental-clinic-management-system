import {
  ConfigurableDocumentHeader,
  type DocumentHeaderSettings
} from './ConfigurableDocumentHeader';

interface CertificatePrintFormProps {
  headerSettings?: Partial<DocumentHeaderSettings>;
  title?: string;
  intro?: string;
  dentistName?: string;
  dentistTitle?: string;
  dentistLicense?: string;
  signatureImageData?: string;
  signatureSize?: number;
  signaturePlacement?: string;
  patientName?: string;
  patientAge?: string;
  issueDate?: string;
  clinicName?: string;
}

export function CertificatePrintForm({
  headerSettings,
  title = 'DENTAL CERTIFICATE',
  intro = 'To Whom It May Concern:',
  dentistName = 'Maria Jessica David - Tanarte, DMD',
  dentistTitle = '',
  dentistLicense = '0052369',
  signatureImageData = '',
  signatureSize = 100,
  signaturePlacement = 'Right Align',
  patientName = 'awdawd dawdawd',
  patientAge = '25',
  issueDate = '05/07/2026',
  clinicName = 'P&J Tanarte Dental Clinic'
}: CertificatePrintFormProps) {
  return (
    <article className="certificate-print-form" data-pdf-print-root="certificate-form">
      <ConfigurableDocumentHeader settings={headerSettings} compact />

      <section className="certificate-print-form__contact">
        <div>
          <span>Unit 11, 2F The Ford Arcade, Amparo Subd.</span>
          <span>cor. Aguinaldo Highway, Bayan Luma 4,</span>
          <span>Imus, Cavite</span>
          <span>Tel. Nos. (046) 884-7593 ; 0917-8071853</span>
        </div>
        <div>
          <span>Monday - Saturday</span>
          <span>9AM - 5PM</span>
          <span>Sunday - By Appointment</span>
        </div>
      </section>

      <div className="certificate-print-form__rule" />
      <h1>{title}</h1>

      <section className="certificate-print-form__body">
        <div className="certificate-print-form__date">
          <span>Date:</span>
          <strong>{issueDate}</strong>
        </div>

        <p>{intro}</p>

        <p className="certificate-print-form__certify">
          This is to certify that Mr./Mrs./Ms.
          <InlineValue value={patientName} wide />
          <InlineValue value={patientAge} />
          years of age, was
          <br />
          examined and treated at {clinicName} on with the following diagnosis:
        </p>

        <WritingLines count={4} />

        <p>I therefore recommend:</p>
        <WritingLines count={4} />

        <p className="certificate-print-form__legal">
          This certificate was issued upon the request of the patient, for whichever legal purpose/s it
          may serve (excluding legal matters).
        </p>

        <p>Thank you very much.</p>
        <p>Respectfully yours,</p>

        <div
          className="certificate-print-form__dentist"
          style={{ textAlign: signaturePlacement === 'Center' ? 'center' : signaturePlacement === 'Left Align' ? 'left' : 'right' }}
        >
          {signatureImageData && (
            <img
              className="document-dentist-signature"
              src={signatureImageData}
              alt="Dentist signature"
              style={{ width: `${signatureSize}px` }}
            />
          )}
          {dentistName && <strong>{[dentistName, dentistTitle].filter(Boolean).join(' - ')}</strong>}
          {dentistLicense && <span>License # {dentistLicense}</span>}
        </div>
      </section>
    </article>
  );
}

function InlineValue({ value, wide = false }: { value: string; wide?: boolean }) {
  return <span className={`certificate-print-form__inline ${wide ? 'is-wide' : ''}`}>{value}</span>;
}

function WritingLines({ count }: { count: number }) {
  return (
    <div className="certificate-print-form__writing-lines">
      {Array.from({ length: count }, (_, index) => <i key={index} />)}
    </div>
  );
}
