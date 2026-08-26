import type { PatientDocumentPreviewModel } from './documentTypes';

interface Props {
  preview: PatientDocumentPreviewModel;
}

export function DocumentPreview({ preview }: Props) {
  return (
    <section className="patient-documents-preview patient-record__card" aria-label="Printable document preview">
      <div className="patient-documents-preview__header">
        <div>
          <p className="patient-clinical-workspace__eyebrow">Preview</p>
          <h3>{preview.documentType.label}</h3>
          <span>Connected template: {preview.templateName}</span>
        </div>
        <div className="patient-documents-preview__meta">
          <strong>{preview.patient.name}</strong>
          <span>{preview.patient.id}</span>
        </div>
      </div>

      <div className="patient-documents-preview__page">
        <div className="patient-documents-preview__branding">
          <span>Angelo Dental Clinic</span>
          <strong>{preview.templateName}</strong>
        </div>

        {preview.sections.map((section) => (
          <section key={section.title} className="patient-documents-preview__section">
            <strong>{section.title}</strong>
            <ul>
              {section.lines.map((line) => <li key={line}>{line}</li>)}
            </ul>
          </section>
        ))}

        <footer className="patient-documents-preview__footer">
          <span>Prepared for printable workflow preview.</span>
          <small>Future export engine placeholder</small>
        </footer>
      </div>
    </section>
  );
}
