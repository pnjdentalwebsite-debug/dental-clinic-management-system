import type { PatientPreviewItem } from '../patients/components/patientTypes';
import type { PDFTemplate } from './templateTypes';

interface Props {
  template: PDFTemplate;
  patient: PatientPreviewItem;
}

export function DocumentPreview({ template, patient }: Props) {
  const visibleSections = [...template.sections].filter((section) => section.visible).sort((a, b) => a.order - b.order);

  return (
    <section className="pdf-designer-preview" aria-label="Live document preview">
      <div className="pdf-designer-preview__page">
        <div className="pdf-designer-preview__branding">
          <div className="pdf-designer-preview__logo">{template.branding.logo}</div>
          <div>
            <span>{template.branding.clinicName}</span>
            <strong>{template.name}</strong>
          </div>
        </div>

        {visibleSections.map((section) => (
          <div key={section.id} className="pdf-designer-preview__section">
            <strong>{section.title}</strong>
            <p>{renderPreviewSection(section.contentType, patient)}</p>
          </div>
        ))}

        <div className="pdf-designer-preview__footer">
          <span>{template.branding.footerText}</span>
          <small>{template.branding.contactNumber}</small>
        </div>
      </div>
    </section>
  );
}

function renderPreviewSection(contentType: string, patient: PatientPreviewItem) {
  switch (contentType) {
    case 'patient':
      return `Patient: ${patient.name} • ID: ${patient.id} • Status: ${patient.status}`;
    case 'findings':
      return 'Dental findings section placeholder for certificate or report content.';
    case 'dentist':
      return 'Dentist: Dr. Santos';
    case 'signature':
      return 'Signature area placeholder with printed name and date.';
    case 'footer':
      return 'Footer content and document notes appear here.';
    case 'treatment':
      return 'Treatment information section placeholder.';
    case 'chart':
      return 'Dental chart report preview content placeholder.';
    case 'recommendation':
      return 'Recommendations and follow-up notes placeholder.';
    case 'medical':
      return 'Medical information report placeholder.';
    case 'appointments':
      return 'Appointment history placeholder.';
    default:
      return 'Section preview content.';
  }
}
