import type { BusinessHours, LogoMetadata } from '../clinics/types';

export type LaboratoryStatus = 'draft' | 'pending' | 'active' | 'inactive' | 'archived';
export type LaboratoryVisibility = 'visible' | 'hidden';
export type LaboratoryType = 'internal' | 'external' | 'partner' | 'independent';
export type LaboratoryServiceStatus = 'active' | 'inactive' | 'archived';
export type ClinicLaboratoryConnectionStatus = 'active' | 'inactive' | 'disconnected';
export type LaboratoryServiceCategory = 'crowns_and_bridges' | 'dentures' | 'orthodontics' | 'implants' | 'veneers' | 'retainers' | 'night_guards' | 'repairs' | 'diagnostic_models' | 'other';
export type LaboratorySortField = 'laboratoryNumber' | 'name' | 'laboratoryType' | 'city' | 'status' | 'createdAt';

export interface Laboratory {
  id: string;
  laboratoryNumber: string;
  subscriberId: string;
  name: string;
  legalBusinessName: string;
  laboratoryType: LaboratoryType;
  email: string;
  contactNumber: string;
  alternativeContactNumber?: string;
  contactPersonName: string;
  contactPersonPosition: string;
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
  status: LaboratoryStatus;
  visibility: LaboratoryVisibility;
  serviceArea: string;
  defaultTurnaroundDays: number;
  rushTurnaroundDays: number;
  acceptsRushOrders: boolean;
  clinicIds: string[];
  serviceIds: string[];
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

export interface LaboratoryService {
  id: string;
  laboratoryId: string;
  serviceCode: string;
  name: string;
  category: LaboratoryServiceCategory;
  description: string;
  defaultPrice?: number;
  currency: 'PHP';
  defaultTurnaroundDays: number;
  rushAvailable: boolean;
  rushAdditionalDays: number;
  rushFee?: number;
  status: LaboratoryServiceStatus;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

export interface ClinicLaboratoryConnection {
  id: string;
  subscriberId: string;
  clinicId: string;
  laboratoryId: string;
  status: ClinicLaboratoryConnectionStatus;
  isPreferred: boolean;
  servicesAllowed: string[];
  defaultTurnaroundDays?: number;
  notes?: string;
  connectedAt: string;
  disconnectedAt?: string;
  connectedBy: string;
  disconnectedBy?: string;
  disconnectionReason?: string;
}

export interface LaboratoryHistoryRecord {
  id: string;
  laboratoryId: string;
  action: string;
  details: string;
  createdAt: string;
  actor: string;
  previousStatus?: LaboratoryStatus | LaboratoryServiceStatus | ClinicLaboratoryConnectionStatus;
  nextStatus?: LaboratoryStatus | LaboratoryServiceStatus | ClinicLaboratoryConnectionStatus;
}

export interface LaboratoryFormServiceInput {
  id?: string;
  serviceCode: string;
  name: string;
  category: LaboratoryServiceCategory;
  description: string;
  defaultPrice: string;
  defaultTurnaroundDays: number;
  rushAvailable: boolean;
  rushAdditionalDays: number;
  rushFee: string;
  status: LaboratoryServiceStatus;
}

export interface LaboratoryFormData {
  subscriberId: string;
  laboratoryType: LaboratoryType;
  initialClinicIds: string[];
  name: string;
  legalBusinessName: string;
  email: string;
  contactNumber: string;
  alternativeContactNumber: string;
  contactPersonName: string;
  contactPersonPosition: string;
  description: string;
  logoFileName: string;
  logoFileType: string;
  logoPreviewUrl: string;
  addressLine1: string;
  addressLine2: string;
  barangay: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  timezone: string;
  visibility: LaboratoryVisibility;
  serviceArea: string;
  defaultTurnaroundDays: number;
  rushTurnaroundDays: number;
  acceptsRushOrders: boolean;
  businessHours: BusinessHours;
  initialServices: LaboratoryFormServiceInput[];
}

export interface LaboratoryFilters {
  search: string;
  subscriberId: string;
  laboratoryType: string;
  status: string;
  province: string;
  city: string;
  clinicConnection: string;
  preferred: string;
  serviceAvailability: string;
  createdDate: string;
  tab: string;
}

export interface LaboratorySort {
  field: LaboratorySortField;
  direction: 'asc' | 'desc';
}

export interface LaboratoryLimitResult {
  valid: boolean;
  message?: string;
  warning?: string;
  limitLabel: string;
  limitValue: number | 'unlimited' | 'not_included' | 'pending';
  usage: number;
  remaining: number | 'unlimited' | 'pending';
}

export interface LaboratorySummary {
  total: number;
  active: number;
  draft: number;
  inactive: number;
  archived: number;
  internal: number;
  external: number;
  withoutClinicConnections: number;
  withoutActiveServices: number;
}

export interface LaboratoryResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
  warning?: string;
}
