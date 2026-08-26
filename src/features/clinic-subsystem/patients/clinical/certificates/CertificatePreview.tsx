import { formatDisplayDate } from './certificateUtils';
import type { CertificateFormValues } from './certificateTypes';

interface Props {
  clinicName: string;
  patientName: string;
  values: CertificateFormValues;
}

export function CertificatePreview({ clinicName, patientName, values }: Props) {
  return (
    <section className="certificate-preview" aria-label="Certificate preview">
      <div className="certificate-preview__header">
        <span>{clinicName}</span>
        <h3>{values.title || 'Certificate Title'}</h3>
        <p>{patientName}</p>
      </div>

      <div className="certificate-preview__body">
        <p>{values.purpose || 'Certificate purpose appears here.'}</p>
        <p>{values.remarks || 'Remarks and supporting notes appear here.'}</p>
      </div>

      <div className="certificate-preview__signature">
        <div>
          <span>Dentist Signature</span>
          <strong>{values.dentist || 'Dr. Name'}</strong>
        </div>
        <div>
          <span>Issue Date</span>
          <strong>{formatDisplayDate(values.issuedDate)}</strong>
        </div>
      </div>
    </section>
  );
}
