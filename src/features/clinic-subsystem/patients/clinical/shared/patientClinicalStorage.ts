import type { PatientPreviewItem } from '../../components/patientTypes';

export const DEFAULT_PATIENT_CLINIC_ID = 'CLN-SUB-396924';

export const getPatientClinicId = (patient?: Pick<PatientPreviewItem, 'clinicId'> | null) =>
  patient?.clinicId || DEFAULT_PATIENT_CLINIC_ID;

export const getPatientScopedStorageKey = (prefix: string, patientId: string, clinicId?: string) =>
  `${prefix}${clinicId || DEFAULT_PATIENT_CLINIC_ID}:${patientId}`;

export const getLegacyPatientStorageKey = (prefix: string, patientId: string) =>
  `${prefix}${patientId}`;

export function loadPatientScopedRecords<T>(
  prefix: string,
  patient: PatientPreviewItem,
  createInitial: (patient: PatientPreviewItem) => T[]
): T[] {
  try {
    const scopedKey = getPatientScopedStorageKey(prefix, patient.id, getPatientClinicId(patient));
    const legacyKey = getLegacyPatientStorageKey(prefix, patient.id);
    const raw = localStorage.getItem(scopedKey) ?? localStorage.getItem(legacyKey);

    if (!raw) {
      return createInitial(patient);
    }

    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : createInitial(patient);
  } catch {
    return createInitial(patient);
  }
}

export function savePatientScopedRecords<T>(
  prefix: string,
  patientId: string,
  records: T[],
  clinicId?: string
) {
  localStorage.setItem(
    getPatientScopedStorageKey(prefix, patientId, clinicId),
    JSON.stringify(records)
  );
}
