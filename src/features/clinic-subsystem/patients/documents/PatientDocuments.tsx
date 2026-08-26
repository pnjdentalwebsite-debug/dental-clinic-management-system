import { useMemo, useState } from 'react';
import type { PatientPreviewItem } from '../components/patientTypes';
import { pdfDesignerTemplates } from '../../pdf-designer/pdfDesigner.mock';
import { DocumentHistory } from './DocumentHistory';
import { DocumentPreview } from './DocumentPreview';
import { DocumentSelector } from './DocumentSelector';
import { buildPatientDocumentPreview, buildPatientDocumentsHistory, patientDocumentTypes } from './documents.mock';
import type { PatientDocumentHistoryItem, PatientDocumentTypeOption } from './documentTypes';

interface Props {
  patient: PatientPreviewItem;
}

export function PatientDocuments({ patient }: Props) {
  const [activeDocumentTypeId, setActiveDocumentTypeId] = useState<PatientDocumentTypeOption['id']>('patient-information-report');
  const [history, setHistory] = useState<PatientDocumentHistoryItem[]>(() => buildPatientDocumentsHistory(patient));

  const activeDocumentType = patientDocumentTypes.find((documentType) => documentType.id === activeDocumentTypeId) || patientDocumentTypes[0];
  const activeTemplate = pdfDesignerTemplates.find((template) => template.id === activeDocumentType.templateId) || pdfDesignerTemplates[0];

  const preview = useMemo(
    () => buildPatientDocumentPreview(patient, activeDocumentType, history),
    [activeDocumentType, history, patient]
  );

  const createDocument = (documentTypeId: PatientDocumentTypeOption['id']) => {
    const documentType = patientDocumentTypes.find((item) => item.id === documentTypeId) || patientDocumentTypes[0];
    const nextDocument: PatientDocumentHistoryItem = {
      id: `doc-${Date.now()}`,
      patientId: patient.id,
      title: documentType.label,
      documentType: documentType.id,
      templateId: documentType.templateId,
      createdDate: 'July 29, 2026',
      status: 'Draft',
      dataSource: [documentType.source],
      createdAt: new Date().toISOString()
    };

    setActiveDocumentTypeId(documentType.id);
    setHistory((current) => [nextDocument, ...current]);
  };

  const selectHistoryDocument = (documentId: string) => {
    const selected = history.find((item) => item.id === documentId);
    if (!selected) {
      return;
    }

    setActiveDocumentTypeId(selected.documentType);
  };

  return (
    <section className="patient-documents">
      <div className="patient-documents__header patient-record__card">
        <div>
          <p className="patient-clinical-workspace__eyebrow">Documents</p>
          <h3>Printable Patient Documents</h3>
          <span>Create patient documents, connect them to PDF templates, and review printable previews.</span>
        </div>
        <div className="patient-documents__template-badge">
          <strong>{activeTemplate.name}</strong>
          <span>{activeTemplate.documentType}</span>
        </div>
      </div>

      <DocumentSelector
        documentTypes={patientDocumentTypes}
        activeDocumentTypeId={activeDocumentTypeId}
        onSelectDocumentType={setActiveDocumentTypeId}
        onCreateDocument={createDocument}
      />

      <div className="patient-documents__layout">
        <DocumentPreview preview={preview} />
        <DocumentHistory
          history={history}
          onView={selectHistoryDocument}
          onEdit={selectHistoryDocument}
          onDelete={(documentId) => setHistory((current) => current.filter((item) => item.id !== documentId))}
        />
      </div>
    </section>
  );
}
