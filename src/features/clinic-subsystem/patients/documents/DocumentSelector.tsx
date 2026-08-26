import type { PatientDocumentTypeOption } from './documentTypes';

interface Props {
  documentTypes: PatientDocumentTypeOption[];
  activeDocumentTypeId: PatientDocumentTypeOption['id'];
  onSelectDocumentType: (documentTypeId: PatientDocumentTypeOption['id']) => void;
  onCreateDocument: (documentTypeId: PatientDocumentTypeOption['id']) => void;
}

export function DocumentSelector({ documentTypes, activeDocumentTypeId, onSelectDocumentType, onCreateDocument }: Props) {
  return (
    <section className="patient-documents-selector patient-record__card">
      <div className="patient-documents-selector__header">
        <div>
          <p className="patient-clinical-workspace__eyebrow">Document Selection</p>
          <h3>Create Patient Document</h3>
          <span>Select a printable document type and generate a preview from existing clinical data.</span>
        </div>
      </div>

      <div className="patient-documents-selector__grid">
        {documentTypes.map((documentType) => {
          const isActive = documentType.id === activeDocumentTypeId;

          return (
            <article key={documentType.id} className={`patient-documents-selector__card${isActive ? ' is-active' : ''}`}>
              <div>
                <strong>{documentType.label}</strong>
                <p>{documentType.description}</p>
                <small>Source: {documentType.source}</small>
              </div>
              <div className="patient-documents-selector__actions">
                <button type="button" className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`} onClick={() => onSelectDocumentType(documentType.id)}>
                  {isActive ? 'Selected' : 'Preview'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => onCreateDocument(documentType.id)}>
                  Create
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
