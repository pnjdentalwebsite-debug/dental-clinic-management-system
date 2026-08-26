export const OPEN_ADD_PATIENT_EVENT = 'clinic-subsystem:open-add-patient';
export const OPEN_ADD_PATIENT_STORAGE_KEY = 'clinic-subsystem:pending-open-add-patient';

export const queueAddPatientOpen = (clinicId?: string | null) => {
  if (typeof window === 'undefined') return;
  const targetClinicId = clinicId || 'unknown-branch';
  window.sessionStorage.setItem(OPEN_ADD_PATIENT_STORAGE_KEY, targetClinicId);
};

export const consumeQueuedAddPatientOpen = (clinicId?: string | null) => {
  if (typeof window === 'undefined') return false;
  const targetClinicId = clinicId || 'unknown-branch';
  const queuedClinicId = window.sessionStorage.getItem(OPEN_ADD_PATIENT_STORAGE_KEY);
  if (queuedClinicId !== targetClinicId) return false;
  window.sessionStorage.removeItem(OPEN_ADD_PATIENT_STORAGE_KEY);
  return true;
};

export const emitOpenAddPatient = () => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(OPEN_ADD_PATIENT_EVENT));
};
