import type { PatientPreviewItem } from '../components/patientTypes';

export const PATIENT_DIRECTORY_UPDATED_EVENT = 'clinic-subsystem:patients-updated';
const PATIENT_DIRECTORY_STORAGE_KEY = 'clinic-subsystem:patient-directory:v1';

export const seededPatientDirectory: PatientPreviewItem[] = [];

export const DEFAULT_PRIMARY_CLINIC_ID = 'CLN-SUB-396924';

const PATIENT_SCOPED_DATA_PREFIXES = [
  'clinicDentalChart:',
  'clinicDentalCharts:',
  'clinicBillPayments:',
  'clinicProgressNotes:',
  'clinicAppointments:',
  'clinicDentalRecalls:',
  'clinicPrescriptions:',
  'clinicCertificates:',
  'patientContractForm:',
  'clinicUploads:',
  'clinicUploadXrays:',
  'clinicScratchpad:',
  'clinicFollowup:',
  'clinicContractForm:',
  'clinicPatientForms:',
  'clinicTreatmentRecords:'
];

export function purgePatientScopedData(patientId: string, clinicId?: string): void {
  if (typeof window === 'undefined') return;

  const keysToRemove = new Set<string>();
  PATIENT_SCOPED_DATA_PREFIXES.forEach((prefix) => {
    keysToRemove.add(`${prefix}${patientId}`);
    if (clinicId) {
      keysToRemove.add(`${prefix}${clinicId}:${patientId}`);
    }
  });

  for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
    const key = window.localStorage.key(index);
    if (!key) continue;

    const isPatientScopedKey = PATIENT_SCOPED_DATA_PREFIXES.some((prefix) => {
      if (!key.startsWith(prefix)) return false;
      if (key === `${prefix}${patientId}`) return true;
      if (clinicId) return key === `${prefix}${clinicId}:${patientId}`;
      return key.endsWith(`:${patientId}`);
    });

    if (isPatientScopedKey) {
      keysToRemove.add(key);
    }
  }

  keysToRemove.forEach((key) => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
  });
}

export function loadPatientDirectoryRecords(clinicId?: string): PatientPreviewItem[] {
  if (typeof window === 'undefined') {
    return clinicId ? seededPatientDirectory.filter((p) => p.clinicId === clinicId) : seededPatientDirectory;
  }

  try {
    const raw = window.localStorage.getItem(PATIENT_DIRECTORY_STORAGE_KEY);
    if (raw === null) {
      window.localStorage.setItem(PATIENT_DIRECTORY_STORAGE_KEY, JSON.stringify(seededPatientDirectory));
      return clinicId ? seededPatientDirectory.filter((p) => p.clinicId === clinicId) : seededPatientDirectory;
    }
    const parsed = JSON.parse(raw);
    const rawList: PatientPreviewItem[] = Array.isArray(parsed) ? parsed : seededPatientDirectory;
    const normalizedList = rawList.filter((patient) => Boolean(patient?.clinicId));
    if (normalizedList.length !== rawList.length) {
      window.localStorage.setItem(PATIENT_DIRECTORY_STORAGE_KEY, JSON.stringify(normalizedList));
    }

    if (clinicId) {
      return normalizedList.filter((p) => p.clinicId === clinicId);
    }
    return normalizedList;
  } catch {
    return clinicId ? seededPatientDirectory.filter((p) => p.clinicId === clinicId) : seededPatientDirectory;
  }
}

export function savePatientDirectoryRecords(records: PatientPreviewItem[], clinicId?: string): void {
  if (typeof window === 'undefined') return;

  try {
    let combinedList: PatientPreviewItem[] = [];
    if (clinicId) {
      const allExisting = loadPatientDirectoryRecords(); // loads all without clinicId filter
      const otherClinicsRecords = allExisting.filter((p) => p.clinicId !== clinicId);
      const scopedRecordsWithClinic = records.map((p) => ({ ...p, clinicId: p.clinicId || clinicId }));
      combinedList = [...otherClinicsRecords, ...scopedRecordsWithClinic];
    } else {
      combinedList = records.filter((record) => Boolean(record?.clinicId));
    }

    window.localStorage.setItem(PATIENT_DIRECTORY_STORAGE_KEY, JSON.stringify(combinedList));
    window.dispatchEvent(new CustomEvent(PATIENT_DIRECTORY_UPDATED_EVENT));
  } catch {
    // Keep UI usable even when local storage is unavailable.
  }
}

export function updatePatientBalance(patientId: string, balance: string, clinicId?: string): void {
  const allRecords = loadPatientDirectoryRecords();
  const matchesPatient = (patient: PatientPreviewItem) =>
    patient.id === patientId && (!clinicId || patient.clinicId === clinicId);
  const target = allRecords.find(matchesPatient);
  if (target && target.balance !== balance) {
    const next = allRecords.map((p) => (matchesPatient(p) ? { ...p, balance } : p));
    savePatientDirectoryRecords(next);
  }
}

export function deletePatientDirectoryRecord(patientId: string, clinicId?: string): PatientPreviewItem[] {
  purgePatientScopedData(patientId, clinicId);
  const allRecords = loadPatientDirectoryRecords();
  const next = allRecords.filter((p) =>
    clinicId ? !(p.id === patientId && p.clinicId === clinicId) : p.id !== patientId
  );
  savePatientDirectoryRecords(next);
  return clinicId ? next.filter((p) => p.clinicId === clinicId) : next;
}
