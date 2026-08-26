import { formatDisplayDate } from './certificateUtils';
import type { CertificateRecord, CertificateTypeOption } from './certificateTypes';

interface Props {
  certificate: CertificateRecord;
  certificateType: CertificateTypeOption;
  onView: (certificateId: string) => void;
  onEdit: (certificateId: string) => void;
  onDelete: (certificateId: string) => void;
}

const statusClassMap: Record<CertificateRecord['status'], string> = {
  Draft: 'certificate-status-badge--draft',
  Issued: 'certificate-status-badge--issued',
  Archived: 'certificate-status-badge--archived'
};

export function CertificateCard({ certificate, certificateType, onView, onEdit, onDelete }: Props) {
  return (
    <article className="certificate-card">
      <div className="certificate-card__main">
        <div>
          <span className="certificate-card__date">Issued: {formatDisplayDate(certificate.issuedDate)}</span>
          <h3>{certificate.title}</h3>
          <p>{certificateType.description}</p>
        </div>
        <span className={`certificate-status-badge ${statusClassMap[certificate.status]}`}>{certificate.status}</span>
      </div>

      <dl className="certificate-card__details">
        <div><dt>Dentist</dt><dd>{certificate.dentist}</dd></div>
        <div><dt>Clinic</dt><dd>{certificate.clinicName}</dd></div>
        <div><dt>Type</dt><dd>{certificateType.label}</dd></div>
        <div><dt>Purpose</dt><dd>{certificate.purpose}</dd></div>
      </dl>

      <div className="certificate-card__actions">
        <button type="button" className="btn btn-outline" onClick={() => onView(certificate.id)}>View</button>
        <button type="button" className="btn btn-outline" onClick={() => onEdit(certificate.id)}>Edit</button>
        <button type="button" className="btn btn-outline certificate-card__delete" onClick={() => onDelete(certificate.id)}>Delete</button>
      </div>
    </article>
  );
}
