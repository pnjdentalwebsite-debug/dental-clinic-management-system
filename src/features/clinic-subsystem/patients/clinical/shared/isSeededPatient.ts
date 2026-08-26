import type { PatientPreviewItem } from '../../components/patientTypes';

/**
 * Pure Zero-State Initialization:
 * No patient is seeded with artificial records. Every newly created patient starts 100% clean and empty.
 */
export const isSeededPatient = (_patientOrId: PatientPreviewItem | string): boolean => {
  return false;
};
