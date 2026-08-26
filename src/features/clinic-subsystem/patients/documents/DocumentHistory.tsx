import type { PatientDocumentHistoryItem } from './documentTypes';

interface Props {
  history: PatientDocumentHistoryItem[];
  onView: (documentId: string) => void;
  onEdit: (documentId: string) => void;
  onDelete: (documentId: string) => void;
}

const statusClassMap: Record<PatientDocumentHistoryItem['status'], string> = {
  Draft: 'is-draft',
  Generated: 'is-generated',
  Archived: 'is-archived'
};

export function DocumentHistory({ history, onView, onEdit, onDelete }: Props) {
  return (
    <section className="patient-documents-history patient-record__card">
      <div className="patient-documents-history__header">
        <div>
          <p className="patient-clinical-workspace__eyebrow">Generated Documents</p>
          <h3>Document History</h3>
          <span>Review the printable document records created from this patient file.</span>
        </div>
      </div>

      {history.length > 0 ? (
        <div className="patient-documents-history__list">
          {history.map((item) => (
            <article key={item.id} className="patient-documents-history__item">
              <div>
                <strong>{item.title}</strong>
                <p>Created: {item.createdDate}</p>
                <small>Template: {item.templateId}</small>
              </div>
              <div className={`patient-documents-history__status ${statusClassMap[item.status]}`}>{item.status}</div>
              <div className="patient-documents-history__actions">
                <button type="button" className="btn btn-secondary" onClick={() => onView(item.id)}>View</button>
                <button type="button" className="btn btn-secondary" onClick={() => onEdit(item.id)}>Edit</button>
                <button type="button" className="btn btn-secondary" onClick={() => onDelete(item.id)}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="patient-clinical-empty">No documents generated yet.</p>
      )}
    </section>
  );
}
