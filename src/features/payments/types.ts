export type PaymentStatus =
  | 'draft'
  | 'submitted'
  | 'pending_verification'
  | 'approved'
  | 'partially_allocated'
  | 'fully_allocated'
  | 'rejected'
  | 'refunded'
  | 'partially_refunded'
  | 'voided';

export type VerificationStatus = 'not_required' | 'pending' | 'verified' | 'rejected' | 'additional_information_required';
export type AllocationStatus = 'unallocated' | 'partially_allocated' | 'fully_allocated';
export type PaymentMethod = 'gcash' | 'maya' | 'bank_transfer' | 'over_the_counter' | 'cash' | 'card' | 'demo_payment' | 'other';
export type AllocationType = 'registration' | 'subscription_initial' | 'subscription_renewal' | 'plan_change' | 'subscription_extension' | 'manual_adjustment';

export interface ProofOfPayment {
  fileName: string;
  fileType: string;
  previewLabel: string;
}

export interface Payment {
  id: string;
  paymentNumber: string;
  registrationId?: string;
  subscriberId?: string;
  subscriptionId?: string;
  planId?: string;
  planName?: string;
  payerName: string;
  payerEmail: string;
  amount: number;
  allocatedAmount: number;
  unallocatedAmount: number;
  refundedAmount: number;
  currency: 'PHP';
  paymentMethod: PaymentMethod;
  referenceNumber: string;
  paymentDate: string;
  submittedAt?: string;
  verifiedAt?: string;
  rejectedAt?: string;
  refundedAt?: string;
  voidedAt?: string;
  status: PaymentStatus;
  verificationStatus: VerificationStatus;
  allocationStatus: AllocationStatus;
  proofOfPayment?: ProofOfPayment;
  notes?: string;
  administrativeNotes?: string;
  rejectionReason?: string;
  refundReason?: string;
  voidReason?: string;
  informationRequest?: string;
  informationDueDate?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface PaymentAllocation {
  id: string;
  paymentId: string;
  subscriberId?: string;
  subscriptionId?: string;
  registrationId?: string;
  allocationType: AllocationType;
  amount: number;
  description: string;
  createdAt: string;
  createdBy: string;
  reversedAt?: string;
  reversalReason?: string;
}

export interface PaymentRefund {
  id: string;
  paymentId: string;
  amount: number;
  reason: string;
  refundDate: string;
  administrativeNote?: string;
  createdAt: string;
  createdBy: string;
}

export interface PaymentHistoryRecord {
  id: string;
  paymentId: string;
  action: string;
  details: string;
  previousStatus?: PaymentStatus;
  nextStatus?: PaymentStatus;
  createdAt: string;
  actor: string;
}

export interface PaymentFormData {
  ownerType: 'registration' | 'subscriber';
  registrationId: string;
  subscriberId: string;
  subscriptionId: string;
  planId: string;
  payerName: string;
  payerEmail: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber: string;
  paymentDate: string;
  notes: string;
  administrativeNotes: string;
  proofFileName: string;
  proofFileType: string;
  allocationMode: 'unallocated' | AllocationType;
  allocationAmount: number;
}

export interface PaymentFilters {
  search: string;
  subscriberId: string;
  registrationId: string;
  subscriptionId: string;
  planId: string;
  paymentMethod: string;
  status: string;
  verificationStatus: string;
  allocationStatus: string;
  paymentDate: string;
  submittedDate: string;
  minAmount: string;
  maxAmount: string;
  tab: string;
}

export interface PaymentSort {
  field: keyof Payment;
  direction: 'asc' | 'desc';
}

export interface PaymentResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface ReconciliationResult {
  status: 'balanced' | 'underallocated' | 'fully_allocated' | 'overallocated_error' | 'refunded' | 'allocation_mismatch' | 'missing_target';
  warnings: string[];
  expectedAmount: number;
  allocatedAmount: number;
  refundableAmount: number;
}
