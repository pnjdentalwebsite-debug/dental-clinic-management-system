export type PaymentStatus = 'unpaid' | 'pending_verification' | 'approved' | 'rejected' | 'refunded';
export type AccountStatus = 'pending' | 'active' | 'suspended' | 'deactivated';
export type SubscriptionStatus = 'pending' | 'active' | 'expiring_soon' | 'expired' | 'suspended' | 'cancelled';
export type SubscriberPlan = string;
export type PlatformUserRole = 'clinic_owner' | 'associate' | 'staff';

export interface RegistrationLike {
  id: string;
  plan: string;
  ownerName: string;
  ownerEmail: string;
  ownerMobile: string;
  ownerAddress: string;
  clinicName: string;
  clinicEmail: string;
  clinicMobile: string;
  clinicAddress: string;
  dentistsCount: number;
  staffCount: number;
  locationsCount: number;
  worksWithLab: boolean;
  labName?: string;
  emailVerified: boolean;
  paymentStatus: 'unpaid' | 'pending_verification' | 'approved' | 'rejected';
  registrationStatus: string;
  submittedDate: string;
  updatedDate: string;
  referenceNumber?: string;
  paymentMethod?: string;
  tempPassword?: string;
  rejectionReason?: string;
  subscriberId?: string;
  userId?: string;
}

export interface Subscriber {
  id: string;
  subscriberNumber: string;
  registrationId?: string;
  ownerUserId?: string;
  businessName: string;
  primaryClinicName: string;
  email: string;
  mobileNumber: string;
  planId: string;
  subscriptionId: string;
  paymentStatus: PaymentStatus;
  subscriptionStatus: SubscriptionStatus;
  accountStatus: AccountStatus;
  clinicCount: number;
  laboratoryCount: number;
  associateCount: number;
  staffCount: number;
  registeredAt: string;
  activatedAt?: string;
  expiresAt?: string;
  suspendedAt?: string;
  deactivatedAt?: string;
  createdAt: string;
  updatedAt: string;
  suspensionReason?: string;
  deactivationReason?: string;
}

export interface PlatformUser {
  id: string;
  userNumber: string;
  subscriberId?: string;
  clinicIds: string[];
  fullName: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  role: PlatformUserRole;
  position: string;
  workSchedule?: Record<string, { enabled: boolean; startTime: string; endTime: string }>;
  accountStatus: AccountStatus;
  mustChangePassword: boolean;
  registeredAt: string;
  lastLoginAt?: string;
  suspendedAt?: string;
  deactivatedAt?: string;
  createdAt: string;
  updatedAt: string;
  suspensionReason?: string;
  deactivationReason?: string;
  resetRequired?: boolean;
}

export interface MockClinic {
  id: string;
  clinicNumber: string;
  subscriberId: string;
  name: string;
  email: string;
  contactNumber: string;
  address: string;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MockSubscription {
  id: string;
  subscriberId: string;
  planId: string;
  status: SubscriptionStatus;
  startedAt: string;
  expiresAt: string;
  renewalStatus: string;
  createdAt: string;
  updatedAt: string;
  changeHistory: string[];
}

export interface PaymentLike {
  id: string;
  registrationId: string;
  method: string;
  referenceNumber: string;
  amount: string;
  submittedDate: string;
  status: PaymentStatus;
  adminNotes?: string;
}

export interface ActivityLogLike {
  id: string;
  timestamp: string;
  event: string;
  details: string;
  role: string;
}

export interface ServiceResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface SubscriberFilters {
  search: string;
  plan: string;
  paymentStatus: string;
  subscriptionStatus: string;
  accountStatus: string;
  registeredDate: string;
  tab: string;
}

export interface UserFilters {
  search: string;
  role: string;
  subscriberId: string;
  clinicId: string;
  accountStatus: string;
  registeredDate: string;
}

export interface SortState {
  field: string;
  direction: 'asc' | 'desc';
}
