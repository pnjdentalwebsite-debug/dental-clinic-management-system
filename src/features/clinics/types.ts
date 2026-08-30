import type { PlatformUserRole } from '../platformManagement/types';

export type ClinicStatus = 'draft' | 'pending' | 'active' | 'inactive' | 'archived';
export type ClinicVisibility = 'visible' | 'hidden';
export type ClinicAssignmentStatus = 'active' | 'inactive' | 'removed';
export type ClinicAssignmentRole = 'clinic_owner' | 'associate' | 'staff';
export type ClinicSortField = 'clinicNumber' | 'name' | 'city' | 'province' | 'status' | 'createdAt';
export type ClinicBranchType = 'main' | 'satellite';

export interface BusinessHourDay {
  enabled: boolean;
  openingTime: string;
  closingTime: string;
  breakEnabled: boolean;
  breakStart: string;
  breakEnd: string;
}

export type BusinessHours = Record<string, BusinessHourDay>;

export interface LogoMetadata {
  fileName: string;
  fileType: string;
  previewLabel: string;
  previewUrl?: string;
}

export interface Clinic {
  id: string;
  clinicNumber: string;
  subscriberId: string;
  subscriberNumber?: string;
  subscriberName?: string;
  primaryOwnerUserId?: string;
  ownerDisplayName?: string;
  ownerEmail?: string;
  branchType?: ClinicBranchType;
  name: string;
  legalBusinessName: string;
  email: string;
  contactNumber: string;
  alternativeContactNumber?: string;
  addressLine1: string;
  addressLine2?: string;
  barangay?: string;
  city: string;
  province: string;
  postalCode?: string;
  country: string;
  timezone: string;
  description?: string;
  logoMetadata?: LogoMetadata;
  status: ClinicStatus;
  visibility: ClinicVisibility;
  isPrimaryClinic: boolean;
  dentistUserIds: string[];
  staffUserIds: string[];
  laboratoryIds: string[];
  businessHours: BusinessHours;
  createdAt: string;
  updatedAt: string;
  activatedAt?: string;
  deactivatedAt?: string;
  archivedAt?: string;
  createdBy: string;
  updatedBy: string;
  deactivationReason?: string;
  archiveReason?: string;
}

export interface ClinicAssignment {
  id: string;
  subscriberId: string;
  clinicId: string;
  userId: string;
  assignmentRole: ClinicAssignmentRole;
  assignmentStatus: ClinicAssignmentStatus;
  assignedAt: string;
  removedAt?: string;
  assignedBy: string;
  removedBy?: string;
  note?: string;
  removalReason?: string;
}

export interface ClinicHistoryRecord {
  id: string;
  clinicId: string;
  action: string;
  details: string;
  createdAt: string;
  actor: string;
  previousStatus?: ClinicStatus;
  nextStatus?: ClinicStatus;
}

export interface ClinicFormData {
  subscriberId: string;
  primaryOwnerUserId: string;
  branchType: ClinicBranchType;
  isPrimaryClinic: boolean;
  name: string;
  legalBusinessName: string;
  email: string;
  contactNumber: string;
  alternativeContactNumber: string;
  addressLine1: string;
  addressLine2: string;
  barangay: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  timezone: string;
  description: string;
  logoFileName: string;
  logoFileType: string;
  visibility: ClinicVisibility;
  businessHours: BusinessHours;
  dentistUserIds: string[];
  staffUserIds: string[];
}

export interface ClinicFilters {
  search: string;
  subscriberId: string;
  status: string;
  primary: string;
  province: string;
  city: string;
  dentistAssignment: string;
  staffAssignment: string;
  createdDate: string;
  tab: string;
}

export interface ClinicSort {
  field: ClinicSortField;
  direction: 'asc' | 'desc';
}

export interface ClinicResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
  warning?: string;
}

export interface ClinicLimitResult {
  valid: boolean;
  message?: string;
  warning?: string;
  limitLabel: string;
  limitValue: number | 'unlimited' | 'not_included' | 'pending';
  usage: number;
  remaining: number | 'unlimited' | 'pending';
}

export interface ClinicSummary {
  total: number;
  active: number;
  draft: number;
  inactive: number;
  archived: number;
  primary: number;
  withoutDentists: number;
  withoutStaff: number;
}

export type AssignableUserRole = Extract<PlatformUserRole, 'clinic_owner' | 'associate' | 'staff'>;
