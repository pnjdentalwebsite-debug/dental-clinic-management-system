import type { PatientPreviewItem } from '../components/patientTypes';

export type PatientClinicalTabId =
  | 'overview'
  | 'dental-chart'
  | 'progress-notes'
  | 'certificates'
  | 'prescriptions'
  | 'bills-payments'
  | 'upload-xrays'
  | 'dental-recalls'
  | 'appointments'
  | 'scratchpad-notes'
  | 'followup-lists';

export interface PatientClinicalTab {
  id: PatientClinicalTabId;
  label: string;
  description: string;
  status: 'available' | 'future';
}

export interface ClinicalModuleStatus {
  id: string;
  title: string;
  statusLabel: string;
  description: string;
  tone: 'neutral' | 'attention' | 'ready';
}

export interface PatientClinicalSummary {
  patient: PatientPreviewItem;
  chartStatus: ClinicalModuleStatus;
  treatmentStatus: ClinicalModuleStatus;
  recentActivity: string[];
}
