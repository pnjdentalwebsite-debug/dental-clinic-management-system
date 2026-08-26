import type { PatientPreviewItem } from '../../components/patientTypes';
import type { PatientModuleRecordBase } from '../shared/PatientModuleScaffold';
import {
  countCalendarRecallsForProgressNote,
  removeCalendarRecallsForProgressNote,
  syncCalendarRecallFromAppointment
} from '../../../scheduling/scheduleStorage';
import {
  getPatientClinicId,
  getPatientScopedStorageKey,
  loadPatientScopedRecords,
  savePatientScopedRecords
} from '../shared/patientClinicalStorage';

export interface AppointmentRecord extends PatientModuleRecordBase {
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  provider: string;
  notes: string;
  recallReason?: string;
  source?: 'manual' | 'progress-note';
  sourceId?: string;
}

export interface ProgressNoteAppointmentRemovalResult {
  appointmentRemovedCount: number;
  calendarRemovedCount: number;
}

interface ProgressNoteAppointmentSyncSource {
  id: string;
  patientName: string;
  recallDate: string;
  recallTime: string;
  recallReason: string;
  dentist: string;
  notes: string;
}

interface ProgressNoteAppointmentSyncResult {
  synced: boolean;
  removed: boolean;
  calendarSynced: boolean;
  calendarRemoved: boolean;
}

const STORAGE_KEY_PREFIX = 'clinicAppointments:';
export const APPOINTMENTS_UPDATED_EVENT = 'clinic-appointments:updated';

export const getAppointmentsStorageKey = (patientId: string) =>
  `${STORAGE_KEY_PREFIX}${patientId}`;

export const getScopedAppointmentsStorageKey = (patientId: string, clinicId?: string) =>
  getPatientScopedStorageKey(STORAGE_KEY_PREFIX, patientId, clinicId);

export const createInitialAppointmentRecords = (_patient: PatientPreviewItem): AppointmentRecord[] => {
  return [];
};

export const loadAppointmentRecords = (patient: PatientPreviewItem): AppointmentRecord[] => {
  return loadPatientScopedRecords(STORAGE_KEY_PREFIX, patient, createInitialAppointmentRecords);
};

export const saveAppointmentRecords = (patientId: string, records: AppointmentRecord[], clinicId?: string) => {
  savePatientScopedRecords(STORAGE_KEY_PREFIX, patientId, records, clinicId);
  window.dispatchEvent(
    new CustomEvent(APPOINTMENTS_UPDATED_EVENT, {
      detail: { patientId, clinicId: clinicId || getPatientClinicId() }
    })
  );
};

export const removeLinkedAppointmentRecord = (
  patientId: string,
  options: { appointmentId?: string; sourceId?: string; clinicId?: string }
) => {
  try {
    const raw = localStorage.getItem(getScopedAppointmentsStorageKey(patientId, options.clinicId))
      ?? localStorage.getItem(getAppointmentsStorageKey(patientId));
    if (!raw) {
      return 0;
    }

    const parsed = JSON.parse(raw) as AppointmentRecord[];
    const currentRecords = Array.isArray(parsed) ? parsed : [];
    const nextRecords = currentRecords.filter((record) => {
      if (options.appointmentId && record.id === options.appointmentId) {
        return false;
      }

      if (options.sourceId && record.source === 'progress-note' && record.sourceId === options.sourceId) {
        return false;
      }

      return true;
    });

    const removedCount = currentRecords.length - nextRecords.length;
    if (removedCount > 0) {
      saveAppointmentRecords(patientId, nextRecords, options.clinicId);
    }

    return removedCount;
  } catch {
    return 0;
  }
};

export const syncAppointmentsFromProgressNote = (
  patient: PatientPreviewItem,
  note: ProgressNoteAppointmentSyncSource
): ProgressNoteAppointmentSyncResult => {
  const currentRecords = loadAppointmentRecords(patient);
  const retainedRecords = currentRecords.filter(
    (record) => !(record.source === 'progress-note' && record.sourceId === note.id)
  );
  const existingRecord = currentRecords.find(
    (record) => record.source === 'progress-note' && record.sourceId === note.id
  );

  if (!note.recallDate || !note.recallReason.trim()) {
    saveAppointmentRecords(patient.id, retainedRecords, patient.clinicId);
    const calendarRemoved = removeCalendarRecallsForProgressNote(note.id, patient.clinicId);
    return {
      synced: false,
      removed: Boolean(existingRecord),
      calendarSynced: false,
      calendarRemoved: calendarRemoved > 0
    };
  }

  const linkedRecord: AppointmentRecord = {
    id: existingRecord?.id || `APPT-${Date.now()}`,
    appointmentDate: note.recallDate,
    appointmentTime: note.recallTime || '',
    appointmentType: note.recallReason.trim(),
    provider: note.dentist.trim() || 'Unassigned',
    notes: note.notes.trim() || 'Linked recall appointment from clinical progress note.',
    recallReason: note.recallReason.trim(),
    statusLabel: 'Scheduled',
    statusTone: 'warning',
    source: 'progress-note',
    sourceId: note.id
  };

  const nextRecords = [linkedRecord, ...retainedRecords];
  saveAppointmentRecords(patient.id, nextRecords, patient.clinicId);
  syncCalendarRecallFromAppointment(patient, {
    appointmentId: linkedRecord.id,
    progressNoteId: note.id,
    appointmentDate: linkedRecord.appointmentDate,
    appointmentTime: linkedRecord.appointmentTime,
    appointmentType: linkedRecord.appointmentType,
    provider: linkedRecord.provider,
    notes: linkedRecord.notes,
    recallReason: linkedRecord.recallReason,
    statusLabel: linkedRecord.statusLabel
  });
  return {
    synced: true,
    removed: false,
    calendarSynced: true,
    calendarRemoved: false
  };
};

export const countAppointmentsForProgressNote = (patient: PatientPreviewItem, noteId: string) =>
  loadAppointmentRecords(patient).filter(
    (record) => record.source === 'progress-note' && record.sourceId === noteId
  ).length;

export const removeAppointmentsForProgressNote = (
  patient: PatientPreviewItem,
  noteId: string
): ProgressNoteAppointmentRemovalResult => {
  const currentRecords = loadAppointmentRecords(patient);
  const nextRecords = currentRecords.filter(
    (record) => !(record.source === 'progress-note' && record.sourceId === noteId)
  );
  const appointmentRemovedCount = currentRecords.length - nextRecords.length;
  const calendarRemovedCountBefore = countCalendarRecallsForProgressNote(noteId, patient.clinicId);

  if (appointmentRemovedCount > 0) {
    saveAppointmentRecords(patient.id, nextRecords, patient.clinicId);
    const calendarRemovedCount = removeCalendarRecallsForProgressNote(noteId, patient.clinicId);
    return {
      appointmentRemovedCount,
      calendarRemovedCount
    };
  }

  const calendarRemovedCount = removeCalendarRecallsForProgressNote(noteId, patient.clinicId);
  return {
    appointmentRemovedCount: 0,
    calendarRemovedCount: calendarRemovedCountBefore > 0 ? calendarRemovedCount : 0
  };
};
