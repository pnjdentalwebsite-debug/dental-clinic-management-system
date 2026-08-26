export type DentalConditionId = string;

export type DentalSurfaceId = 'mesial' | 'distal' | 'buccal' | 'lingual' | 'occlusal';

export type DentalChartStatus = 'unset' | 'dentally-fit' | 'for-compliance';

export type DentalTagCategoryId = 'conditions' | 'restorations' | 'surgery' | 'xray';

export interface DentalTagOption {
  code: string;
  label: string;
  category: DentalTagCategoryId;
}

export interface DentalConditionOption {
  id: DentalConditionId;
  label: string;
  description: string;
  visualState: string;
  behavior?: 'clear' | 'surface' | 'whole-tooth';
}

export interface SurfaceMarking {
  surface: DentalSurfaceId;
  condition: DentalConditionId;
}

export interface ToothEntry {
  toothNumber: string;
  condition: DentalConditionId;
  notes: string;
  surfaces: DentalSurfaceId[];
  surfaceMarkings: SurfaceMarking[];
  tags: string[];
  createdAt: string;
}

import type { ToothNotationSystem } from './toothNotationHelper';

export interface DentalChartRecord {
  id?: string;
  patientId: string;
  updatedAt: string;
  toothNotation?: ToothNotationSystem;
  teeth: ToothEntry[];
  findings: string;
  recommendations: string;
  recommendationPlan: {
    oralProphylaxis: boolean;
    prosthodonticsManagement: boolean;
    rootCanalTreatment: boolean;
    others: boolean;
    toothNumber: string;
    restorativeFillingToothNumber: string;
    extractionToothNumber: string;
  };
  remarks: string;
  status: DentalChartStatus;
  checkedBy: string;
  checkedDate: string;
  presentMedicalCondition?: string;
  presentMedications?: string;
  allergiesToMedications?: string;
  recallDate?: string;
  intraOralAppliances?: string[];
  intraOralApplianceNotes?: string;
  occlusionIndexSelections?: string[];
  occlusionIndexValues?: Record<string, string>;
  periodontalPsrSelections?: string[];
  periodontalPsrNotes?: string;
  tmjAssessmentSelections?: string[];
  tmjAssessmentNotes?: string;
}

export interface DentalChartQuadrant {
  id: string;
  label: string;
  teeth: string[];
}
