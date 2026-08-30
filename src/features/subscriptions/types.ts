import type { PaymentStatus, SubscriptionStatus } from '../platformManagement/types';

export type SubscriptionLifecycleStatus = 'draft' | SubscriptionStatus;
export type BillingCycle = 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'custom';
export type SubscriptionPaymentStatus = PaymentStatus | 'partially_paid' | 'paid' | 'overdue';

export interface PriceSnapshot {
  planId: string;
  planName: string;
  monthlyPrice: number;
  annualPrice: number;
  billingCycle: BillingCycle;
  appliedAmount: number;
  currency: 'PHP';
}

export interface Subscription {
  id: string;
  subscriptionNumber: string;
  subscriberId: string;
  subscriberNumber?: string;
  subscriberName?: string;
  subscriberEmail?: string;
  ownerDisplayName?: string;
  ownerEmail?: string;
  planId: string;
  registrationId?: string;
  status: SubscriptionLifecycleStatus;
  billingCycle: BillingCycle;
  startDate: string;
  expirationDate: string;
  startedAt: string;
  expiresAt: string;
  trialStartDate?: string;
  trialEndDate?: string;
  renewalDate?: string;
  cancelledAt?: string;
  suspendedAt?: string;
  reactivatedAt?: string;
  autoRenew: boolean;
  paymentStatus: SubscriptionPaymentStatus;
  priceSnapshot: PriceSnapshot;
  currency: 'PHP';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  notes?: string;
  cancellationReason?: string;
  suspensionReason?: string;
  renewalStatus: string;
  changeHistory: string[];
}

export interface SubscriptionHistoryRecord {
  id: string;
  subscriptionId: string;
  type: 'created' | 'updated' | 'status' | 'renewal' | 'plan_change' | 'extension' | 'provisioned';
  action: string;
  details: string;
  previousStatus?: SubscriptionLifecycleStatus;
  nextStatus?: SubscriptionLifecycleStatus;
  previousExpiration?: string;
  nextExpiration?: string;
  previousPlanId?: string;
  nextPlanId?: string;
  priceSnapshot?: PriceSnapshot;
  createdAt: string;
  actor: string;
}

export interface SubscriptionFormData {
  subscriberId: string;
  planId: string;
  billingCycle: BillingCycle;
  startDate: string;
  expirationDate: string;
  autoRenew: boolean;
  paymentStatus: SubscriptionPaymentStatus;
  notes: string;
  status: SubscriptionLifecycleStatus;
}

export interface SubscriptionFilters {
  search: string;
  subscriberId: string;
  planId: string;
  status: string;
  billingCycle: string;
  paymentStatus: string;
  startDate: string;
  expirationDate: string;
  autoRenew: string;
  tab: string;
}

export interface SubscriptionSort {
  field: keyof Subscription;
  direction: 'asc' | 'desc';
}

export interface SubscriptionResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}
