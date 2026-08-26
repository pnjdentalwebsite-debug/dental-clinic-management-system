import type { PatientPreviewItem } from '../components/patientTypes';

export type PatientDocumentTypeId =
  | 'patient-information-report'
  | 'dental-chart-report'
  | 'treatment-history-report'
  | 'certificate-document';

export type PatientDocumentStatus = 'Draft' | 'Generated' | 'Archived';

export interface PatientDocumentTypeOption {
  id: PatientDocumentTypeId;
  label: string;
  description: string;
  templateId: string;
  source: string;
}

export interface PatientDocumentHistoryItem {
  id: string;
  patientId: string;
  title: string;
  documentType: PatientDocumentTypeId;
  templateId: string;
  createdDate: string;
  status: PatientDocumentStatus;
  dataSource: string[];
  createdAt: string;
}

export interface PatientDocumentPreviewModel {
  patient: PatientPreviewItem;
  documentType: PatientDocumentTypeOption;
  templateName: string;
  sections: Array<{
    title: string;
    lines: string[];
  }>;
  history: PatientDocumentHistoryItem[];
}
