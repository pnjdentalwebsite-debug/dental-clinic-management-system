import { CertificateCard } from './CertificateCard';
import type { CertificateRecord, CertificateTypeOption } from './certificateTypes';

interface Props {
  certificates: CertificateRecord[];
  certificateTypesById: Record<string, CertificateTypeOption>;
  onCreateFirst: () => void;
  onView: (certificateId: string) => void;
  onEdit: (certificateId: string) => void;
  onDelete: (certificateId: string) => void;
}

export function CertificateList({ certificates, certificateTypesById, onCreateFirst, onView, onEdit, onDelete }: Props) {
  if (certificates.length === 0) {
    return (
      <div className="certificate-empty-state">
        <strong>No certificates available for this patient.</strong>
        <p>Create patient certificates to maintain official clinical documentation.</p>
        <button type="button" className="btn btn-primary" onClick={onCreateFirst}>Create First Certificate</button>
      </div>
    );
  }

  return (
    <div className="certificate-list">
      {certificates.map((certificate) => (
        <CertificateCard
          key={certificate.id}
          certificate={certificate}
          certificateType={certificateTypesById[certificate.certificateType]}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
