import type { PatientPreviewItem } from '../../components/patientTypes';
import type { PatientModuleRecordBase } from '../shared/PatientModuleScaffold';
import {
  getPatientClinicId,
  getPatientScopedStorageKey,
  loadPatientScopedRecords,
  savePatientScopedRecords
} from '../shared/patientClinicalStorage';

export interface DentalRecallRecord extends PatientModuleRecordBase {
  recallDate: string;
  recallReason: string;
  assignedTo: string;
  reminderChannel: string;
  notes: string;
  source?: 'manual' | 'progress-note';
  sourceId?: string;
}

interface ProgressNoteDentalRecallSyncSource {
  id: string;
  recallDate: string;
  recallReason: string;
  dentist: string;
  notes: string;
}

interface ProgressNoteDentalRecallSyncResult {
  synced: boolean;
  removed: boolean;
}

const STORAGE_KEY_PREFIX = 'clinicDentalRecalls:';
export const DENTAL_RECALLS_UPDATED_EVENT = 'clinic-dental-recalls:updated';

export const getDentalRecallsStorageKey = (patientId: string) =>
  `${STORAGE_KEY_PREFIX}${patientId}`;

export const getScopedDentalRecallsStorageKey = (patientId: string, clinicId?: string) =>
  getPatientScopedStorageKey(STORAGE_KEY_PREFIX, patientId, clinicId);

export const createInitialDentalRecallRecords = (_patient: PatientPreviewItem): DentalRecallRecord[] => {
  return [];
};

export const loadDentalRecallRecords = (patient: PatientPreviewItem): DentalRecallRecord[] => {
  return loadPatientScopedRecords(STORAGE_KEY_PREFIX, patient, createInitialDentalRecallRecords);
};

export const saveDentalRecallRecords = (patientId: string, records: DentalRecallRecord[], clinicId?: string) => {
  savePatientScopedRecords(STORAGE_KEY_PREFIX, patientId, records, clinicId);
  window.dispatchEvent(
    new CustomEvent(DENTAL_RECALLS_UPDATED_EVENT, {
      detail: { patientId, clinicId: clinicId || getPatientClinicId() }
    })
  );
};

export const syncDentalRecallsFromProgressNote = (
  patient: PatientPreviewItem,
  note: ProgressNoteDentalRecallSyncSource
): ProgressNoteDentalRecallSyncResult => {
  const currentRecords = loadDentalRecallRecords(patient);
  const retainedRecords = currentRecords.filter(
    (record) => !(record.source === 'progress-note' && record.sourceId === note.id)
  );
  const existingRecord = currentRecords.find(
    (record) => record.source === 'progress-note' && record.sourceId === note.id
  );

  if (!note.recallDate || !note.recallReason.trim()) {
    if (existingRecord) {
      saveDentalRecallRecords(patient.id, retainedRecords, patient.clinicId);
      return { synced: false, removed: true };
    }

    return { synced: false, removed: false };
  }

  const linkedRecord: DentalRecallRecord = {
    id: existingRecord?.id || `RECALL-${Date.now()}`,
    recallDate: note.recallDate,
    recallReason: note.recallReason.trim(),
    assignedTo: note.dentist.trim() || 'Unassigned',
    reminderChannel: existingRecord?.reminderChannel || 'SMS',
    notes: note.notes.trim() || 'Linked dental recall from clinical progress note.',
    statusLabel: 'Scheduled',
    statusTone: 'success',
    source: 'progress-note',
    sourceId: note.id
  };

  saveDentalRecallRecords(patient.id, [linkedRecord, ...retainedRecords], patient.clinicId);
  return { synced: true, removed: false };
};

export const countDentalRecallsForProgressNote = (patient: PatientPreviewItem, noteId: string) =>
  loadDentalRecallRecords(patient).filter(
    (record) => record.source === 'progress-note' && record.sourceId === noteId
  ).length;

export const removeDentalRecallsForProgressNote = (patient: PatientPreviewItem, noteId: string) => {
  const currentRecords = loadDentalRecallRecords(patient);
  const nextRecords = currentRecords.filter(
    (record) => !(record.source === 'progress-note' && record.sourceId === noteId)
  );
  const removedCount = currentRecords.length - nextRecords.length;

  if (removedCount > 0) {
    saveDentalRecallRecords(patient.id, nextRecords, patient.clinicId);
  }

  return removedCount;
};
