import type { ClinicStatus } from '../../clinics/types';

export type AssociateDentistStatus = 'draft' | 'active' | 'inactive';
export type AssociateDentistVisibility = 'visible' | 'hidden';

export interface AssociateDentistPrivileges {
  // Calendar
  viewCalendar: boolean;
  viewAssociates: boolean;
  viewAppointments: boolean;
  viewBirthdays: boolean;
  viewFollowUps: boolean;
  viewEventsSchedules: boolean;
  viewOnlineBookings: boolean;

  // Expenses
  viewExpenses: boolean;
  postExpenses: boolean;
  addExpenses: boolean;

  // Patients
  viewPatientContactInfo: boolean;
  editPatientData: boolean;

  // Dashboard privileges
  viewPatientsWithBalance: boolean;
}

export interface AssociateDentistWorkDay {
  enabled: boolean;
  startTime: string;
  endTime: string;
}

export type AssociateDentistWorkSchedule = Record<
  'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday',
  AssociateDentistWorkDay
>;

export interface AssociateDentistClinicPermission {
  clinicId: string;
  clinicName: string;
  clinicStatus: ClinicStatus;
}

export interface AssociateDentistRecord {
  id: string;
  associateNumber: string;
  subscriberId: string;
  lastName: string;
  firstName: string;
  middleName?: string;
  extensionName?: string;
  mobileNumber: string;
  email?: string;
  password?: string;
  deviceRestrictionEnabled?: boolean;
  address: string;
  licenseNumber: string;
  ptrNumber: string;
  s2LicenseNumber: string;
  designation: string;
  specialization: string;
  calendarColor: string;
  certificatesAndQualifications?: string;
  alternateAssociateIds: string[];
  authorizedClinics: string[];
  authorizedLaboratories: string[];
  privileges: AssociateDentistPrivileges;
  workSchedule: AssociateDentistWorkSchedule;
  status: AssociateDentistStatus;
  visibility: AssociateDentistVisibility;
  clinicIds: string[];
  laboratoryIds: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface AssociateDentistFormData {
  subscriberId: string;
  lastName: string;
  firstName: string;
  middleName: string;
  extensionName: string;
  mobileNumber: string;
  email: string;
  password?: string;
  deviceRestrictionEnabled: boolean;
  address: string;
  licenseNumber: string;
  ptrNumber: string;
  s2LicenseNumber: string;
  designation: string;
  specialization: string;
  calendarColor: string;
  certificatesAndQualifications: string;
  alternateAssociateIds: string;
  authorizedClinics: string[];
  authorizedLaboratories: string[];
  privileges: AssociateDentistPrivileges;
  workSchedule: AssociateDentistWorkSchedule;
  status: AssociateDentistStatus;
  visibility: AssociateDentistVisibility;
}

export interface AssociateDentistResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
  warning?: string;
}

export interface AssociateDentistSummary {
  total: number;
  active: number;
  draft: number;
  inactive: number;
  clinicsCovered: number;
}

