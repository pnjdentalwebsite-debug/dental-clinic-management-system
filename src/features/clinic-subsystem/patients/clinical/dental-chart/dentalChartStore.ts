import type { DentalChartRecord, ToothEntry } from './dentalChartTypes';
import { isSeededPatient } from '../shared/isSeededPatient';
import {
  DEFAULT_PATIENT_CLINIC_ID,
  getPatientScopedStorageKey,
  getLegacyPatientStorageKey
} from '../shared/patientClinicalStorage';

const storageKeyPrefix = 'clinicDentalChart:';
const chartListStorageKeyPrefix = 'clinicDentalCharts:';

export const adultDentalToothNumbers = [
  '18', '17', '16', '15', '14', '13', '12', '11',
  '21', '22', '23', '24', '25', '26', '27', '28',
  '48', '47', '46', '45', '44', '43', '42', '41',
  '31', '32', '33', '34', '35', '36', '37', '38'
];

export const pediatricDentalToothNumbers = [
  '55', '54', '53', '52', '51', '61', '62', '63', '64', '65',
  '85', '84', '83', '82', '81', '71', '72', '73', '74', '75'
];

export const allDentalToothNumbers = [
  ...adultDentalToothNumbers,
  ...pediatricDentalToothNumbers
];

const createEmptyTooth = (toothNumber: string, createdAt: string): ToothEntry => ({
  toothNumber,
  condition: 'status-clear',
  notes: '',
  surfaces: [],
  surfaceMarkings: [],
  tags: [],
  createdAt
});

export const createEmptyDentalChartRecord = (patientId: string): DentalChartRecord => {
  const now = new Date().toISOString();

  return {
    patientId,
    updatedAt: now,
    toothNotation: 'FDI',
    teeth: allDentalToothNumbers.map((toothNumber) => createEmptyTooth(toothNumber, now)),
    findings: '',
    recommendations: '',
    recommendationPlan: {
      oralProphylaxis: false,
      prosthodonticsManagement: false,
      rootCanalTreatment: false,
      others: false,
      toothNumber: '',
      restorativeFillingToothNumber: '',
      extractionToothNumber: ''
    },
    remarks: '',
    status: 'unset',
    checkedBy: '',
    checkedDate: '',
    presentMedicalCondition: '',
    presentMedications: '',
    allergiesToMedications: '',
    recallDate: '',
    intraOralAppliances: [],
    intraOralApplianceNotes: '',
    occlusionIndexSelections: [],
    occlusionIndexValues: {},
    periodontalPsrSelections: [],
    periodontalPsrNotes: '',
    tmjAssessmentSelections: [],
    tmjAssessmentNotes: ''
  };
};

export const getDentalChartStorageKey = (patientId: string, clinicId?: string) =>
  getPatientScopedStorageKey(storageKeyPrefix, patientId, clinicId);

export const loadDentalChartRecord = (patientId: string, clinicId?: string): DentalChartRecord => {
  const emptyRecord = createEmptyDentalChartRecord(patientId);

  try {
    const storedValue = localStorage.getItem(getDentalChartStorageKey(patientId, clinicId))
      ?? localStorage.getItem(getLegacyPatientStorageKey(storageKeyPrefix, patientId));
    if (!storedValue) return emptyRecord;

    const storedRecord = JSON.parse(storedValue) as Partial<DentalChartRecord>;
    const storedTeeth = new Map(
      Array.isArray(storedRecord.teeth)
        ? storedRecord.teeth.map((tooth) => [tooth.toothNumber, tooth])
        : []
    );

    return {
      ...emptyRecord,
      ...storedRecord,
      patientId,
      toothNotation: storedRecord.toothNotation || 'FDI',
      teeth: emptyRecord.teeth.map((emptyTooth) => ({
        ...emptyTooth,
        ...(storedTeeth.get(emptyTooth.toothNumber) || {})
      })),
      recommendationPlan: {
        ...emptyRecord.recommendationPlan,
        ...(storedRecord.recommendationPlan || {})
      },
      status: storedRecord.status === 'dentally-fit' || storedRecord.status === 'for-compliance'
        ? storedRecord.status
        : 'unset',
      presentMedicalCondition: storedRecord.presentMedicalCondition || '',
      presentMedications: storedRecord.presentMedications || '',
      allergiesToMedications: storedRecord.allergiesToMedications || '',
      recallDate: storedRecord.recallDate || '',
      intraOralAppliances: Array.isArray(storedRecord.intraOralAppliances) ? storedRecord.intraOralAppliances : [],
      intraOralApplianceNotes: storedRecord.intraOralApplianceNotes || '',
      occlusionIndexSelections: Array.isArray(storedRecord.occlusionIndexSelections)
        ? storedRecord.occlusionIndexSelections
        : Object.entries(storedRecord.occlusionIndexValues || {})
            .filter(([, value]) => String(value || '').trim().length > 0)
            .map(([key]) => key),
      occlusionIndexValues: storedRecord.occlusionIndexValues || {},
      periodontalPsrSelections: Array.isArray(storedRecord.periodontalPsrSelections) ? storedRecord.periodontalPsrSelections : [],
      periodontalPsrNotes: storedRecord.periodontalPsrNotes || '',
      tmjAssessmentSelections: Array.isArray(storedRecord.tmjAssessmentSelections) ? storedRecord.tmjAssessmentSelections : [],
      tmjAssessmentNotes: storedRecord.tmjAssessmentNotes || ''
    };
  } catch {
    return emptyRecord;
  }
};

export const saveDentalChartRecord = (record: DentalChartRecord, clinicId?: string) => {
  localStorage.setItem(getDentalChartStorageKey(record.patientId, clinicId), JSON.stringify(record));
};

export const loadDentalChartRecords = (patientId: string, clinicId?: string): DentalChartRecord[] => {
  const effectiveClinicId = clinicId || DEFAULT_PATIENT_CLINIC_ID;
  const listKey = getPatientScopedStorageKey(chartListStorageKeyPrefix, patientId, effectiveClinicId);
  const legacyListKey = getLegacyPatientStorageKey(chartListStorageKeyPrefix, patientId);
  try {
    const listValue = localStorage.getItem(listKey) ?? localStorage.getItem(legacyListKey);
    if (listValue) {
      return JSON.parse(listValue) as DentalChartRecord[];
    }
    
    // Fallback and migration for single record
    const singleRecord = loadDentalChartRecord(patientId, effectiveClinicId);
    const hasChanges = singleRecord.findings || 
                       singleRecord.remarks || 
                       singleRecord.status !== 'unset' || 
                       singleRecord.teeth.some(t => t.condition !== 'status-clear' || t.surfaces.length > 0 || t.tags.length > 0);
    
    if (hasChanges) {
      const records = [
        {
          ...singleRecord,
          id: `CHART-${Date.now()}`
        }
      ];
      saveDentalChartRecords(patientId, records, effectiveClinicId);
      return records;
    }

    if (!isSeededPatient(patientId) || effectiveClinicId !== DEFAULT_PATIENT_CLINIC_ID) {
      return [];
    }

    // Default seeded record to match user mockup
    const seeded: DentalChartRecord[] = [
      {
        ...singleRecord,
        id: 'CHART-001',
        checkedDate: '2026-08-05',
        checkedBy: 'Dr. Maria Jessica Tanarte',
        updatedAt: '2026-08-05T10:30:00.000Z',
        findings: 'dawdaw',
        remarks: 'dawdaw',
        status: 'dentally-fit'
      }
    ];
    saveDentalChartRecords(patientId, seeded, effectiveClinicId);
    return seeded;
  } catch {
    return [];
  }
};

export const saveDentalChartRecords = (patientId: string, records: DentalChartRecord[], clinicId?: string) => {
  localStorage.setItem(
    getPatientScopedStorageKey(chartListStorageKeyPrefix, patientId, clinicId),
    JSON.stringify(records)
  );
};
