import type { PatientPreviewItem } from '../../components/patientTypes';
import {
  getPatientClinicId,
  getPatientScopedStorageKey,
  loadPatientScopedRecords,
  savePatientScopedRecords
} from '../shared/patientClinicalStorage';

export interface ProgressNoteServiceRow {
  id: string;
  service: string;
  tooth: string;
  cost: number;
}

export type ProgressNoteStatus = 'Draft' | 'Saved';

export interface ProgressNoteRecord {
  id: string;
  patientName: string;
  visitDate: string;
  visitTime: string;
  recallDate: string;
  recallTime: string;
  recallReason: string;
  title: string;
  dentist: string;
  notes: string;
  attachments: string[];
  services: ProgressNoteServiceRow[];
  discount: number;
  status: ProgressNoteStatus;
}

const STORAGE_KEY_PREFIX = 'clinicProgressNotes:';
export const PROGRESS_NOTES_UPDATED_EVENT = 'clinic-progress-notes:updated';

export const getProgressNotesStorageKey = (patientId: string) =>
  `${STORAGE_KEY_PREFIX}${patientId}`;

export const getScopedProgressNotesStorageKey = (patientId: string, clinicId?: string) =>
  getPatientScopedStorageKey(STORAGE_KEY_PREFIX, patientId, clinicId);

export const createInitialProgressNotes = (_patient: PatientPreviewItem): ProgressNoteRecord[] => {
  return [];
};

export const loadProgressNotes = (patient: PatientPreviewItem): ProgressNoteRecord[] => {
  return loadPatientScopedRecords(STORAGE_KEY_PREFIX, patient, createInitialProgressNotes);
};

export const saveProgressNotes = (patientId: string, notes: ProgressNoteRecord[], clinicId?: string) => {
  savePatientScopedRecords(STORAGE_KEY_PREFIX, patientId, notes, clinicId);
  window.dispatchEvent(
    new CustomEvent(PROGRESS_NOTES_UPDATED_EVENT, {
      detail: { patientId, clinicId: clinicId || getPatientClinicId() }
    })
  );
};
