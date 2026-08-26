export type PlanStatus = 'draft' | 'active' | 'inactive' | 'archived';
export type PlanVisibility = 'public' | 'internal' | 'hidden';
export type BillingCycle = 'monthly' | 'annual';
export type LimitType = 'number' | 'unlimited' | 'not_included' | 'pending';

export interface PlanFeature {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
  availabilityNote?: string;
}

export interface PlanLimit {
  key: string;
  label: string;
  type: LimitType;
  value?: number;
}

export interface PlanHistoryRecord {
  id: string;
  planId: string;
  action: string;
  details: string;
  createdAt: string;
  actor: string;
}

export interface Plan {
  id: string;
  planCode: string;
  name: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  monthlyPrice: number;
  annualPrice: number;
  currency: 'PHP';
  billingCycles: BillingCycle[];
  status: PlanStatus;
  visibility: PlanVisibility;
  isRecommended: boolean;
  badgeLabel?: string;
  displayOrder: number;
  features: PlanFeature[];
  limits: PlanLimit[];
  subscriberCount: number;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  createdBy: string;
  updatedBy: string;
}

export interface PlanFormData {
  planCode: string;
  name: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  monthlyPrice: number;
  annualPrice: number;
  currency: 'PHP';
  billingCycles: BillingCycle[];
  status: PlanStatus;
  visibility: PlanVisibility;
  isRecommended: boolean;
  badgeLabel: string;
  displayOrder: number;
  features: PlanFeature[];
  limits: PlanLimit[];
}

export interface PlanFilters {
  search: string;
  status: string;
  visibility: string;
  tab: string;
}

export interface PlanSort {
  field: keyof Plan;
  direction: 'asc' | 'desc';
}

export interface PlanResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export type LegacySubscriberPlanName = string;
