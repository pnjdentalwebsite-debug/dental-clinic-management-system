export type TreatmentCategoryId = 'preventive' | 'restorative' | 'endodontic' | 'surgical' | 'orthodontic';

export type TreatmentStatus = 'Pending' | 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';

export type TreatmentFilter = 'All' | 'Completed' | 'Pending' | 'Cancelled';

export type TreatmentSort = 'newest' | 'oldest';

export interface TreatmentCategory {
  id: TreatmentCategoryId;
  label: string;
  procedures: string[];
}

export interface TreatmentRecordEntry {
  id: string;
  patientId: string;
  date: string;
  procedure: string;
  category: TreatmentCategoryId;
  toothNumber: string;
  dentist: string;
  description: string;
  status: TreatmentStatus;
  amount: number;
  notes: string;
  createdAt: string;
}

export interface TreatmentFormValues {
  date: string;
  procedure: string;
  category: TreatmentCategoryId;
  toothNumber: string;
  dentist: string;
  description: string;
  status: TreatmentStatus;
  amount: string;
  notes: string;
}
