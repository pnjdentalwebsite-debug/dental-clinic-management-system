export type StaffStatus = 'active' | 'inactive' | 'draft' | 'on_leave';

export interface SystemPrivileges {
  // Progress notes
  viewProgressNotesActions: boolean;
  addNewProgressNote: boolean;
  viewOnlyProgressNotes: boolean;

  // Patient treatment plans
  deleteTreatmentPlan: boolean;
  editExistingTreatmentPlan: boolean;
  addNewTreatmentPlan: boolean;
  generateProgressNote: boolean;

  // Patient charting
  deletePatientChart: boolean;

  // Patient bills/payments
  addBill: boolean;
  editPatientBill: boolean;
  addPayment: boolean;
  applyAccountCredit: boolean;
  deletePatientBill: boolean;

  // Patient prescriptions
  deletePatientPrescription: boolean;
  createPatientPrescription: boolean;
  editPatientPrescription: boolean;

  // Upload attachments / lab results
  deletePatientAttachment: boolean;

  // Patient certificates
  deletePatientCertificate: boolean;
  createPatientCertificate: boolean;
  editPatientCertificate: boolean;

  // Expenses
  viewExpenses: boolean;
  postExpenses: boolean;
  addExpenses: boolean;

  // Patient privileges
  canDeletePatients: boolean;

  // Dashboard privileges
  viewPatientsWithBalance: boolean;
}

export interface StaffWorkDay {
  enabled: boolean;
  startTime: string;
  endTime: string;
}

export type StaffWorkSchedule = Record<
  'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday',
  StaffWorkDay
>;

export interface StaffMemberFormData {
  // Phase 1: Personal Information
  lastName: string;
  firstName: string;
  middleName?: string;
  extensionName?: string;
  mobileNumber: string;
  phoneNumber: string;
  address: string;
  role: string;

  // Phase 2: Access & Permissions
  authorizedClinics: string[];
  authorizedLaboratories: string[];
  privileges: SystemPrivileges;

  // Phase 3: Work Schedule
  workSchedule: StaffWorkSchedule;

  // Phase 4: Account Settings & Security
  email: string;
  password?: string;
  enableDeviceRestriction: boolean;
}

export interface StaffMemberRecord extends StaffMemberFormData {
  id: string;
  subscriberId: string;
  staffNumber: string; // e.g. STF-000001
  status: StaffStatus;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface StaffSummary {
  total: number;
  active: number;
  inactive: number;
  draft: number;
  rolesCount: number;
}
