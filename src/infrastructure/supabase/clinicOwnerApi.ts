import type { SupabaseClient } from '@supabase/supabase-js';
import { requireSupabaseClient } from './client';

export type ClinicOwnerQuotaLimit =
  | { kind: 'number'; value: number }
  | { kind: 'unlimited' }
  | { kind: 'not_included' }
  | { kind: 'pending' }
  | { kind: 'unavailable' };

export interface ClinicOwnerQuotaUsage {
  key: 'clinics' | 'laboratories' | 'associates' | 'staff';
  limit: ClinicOwnerQuotaLimit;
  activeUsage: number;
}

export interface ClinicOwnerBootstrap {
  auth: {
    userId: string;
  };
  owner: {
    membershipId: string;
    displayName: string;
    email: string;
    mobileNumber: string | null;
    accountStatus: string;
  };
  subscriber: {
    id: string;
    subscriberNumber: string;
    businessName: string;
    accountStatus: string;
    createdAt: string;
    activatedAt: string | null;
  };
  subscription: {
    id: string;
    status: string;
    billingCycle: string | null;
    amountCentavos: number | null;
    startsAt: string | null;
    expiresAt: string | null;
  };
  plan: {
    id: string;
    code: string;
    name: string;
    monthlyAmountCentavos: number;
    annualAmountCentavos: number | null;
    limits: unknown;
    features: unknown;
  };
  clinics: Array<{
    id: string;
    clinicNumber: string;
    branchType: string;
    name: string;
    isPrimary: boolean;
    status: string;
    email: string | null;
    contactNumber: string | null;
    addressLine1: string;
    addressLine2: string | null;
    barangay: string | null;
    city: string;
    province: string;
    postalCode: string | null;
    createdAt: string;
  }>;
  auditEvents: Array<{
    id: string;
    clinicId: string | null;
    eventType: string;
    entityType: string;
    entityId: string | null;
    createdAt: string;
  }>;
  resourceCounts: {
    activeClinics: number;
    activeLaboratories: number;
    activeAssociates: number;
    activeStaff: number;
  };
  quotas: {
    clinics: ClinicOwnerQuotaUsage;
    laboratories: ClinicOwnerQuotaUsage;
    associates: ClinicOwnerQuotaUsage;
    staff: ClinicOwnerQuotaUsage;
  };
}

export type ClinicOwnerApiErrorCode =
  | 'UNAUTHENTICATED'
  | 'NO_ACTIVE_CLINIC_OWNER_MEMBERSHIP'
  | 'MULTIPLE_ACTIVE_CLINIC_OWNER_MEMBERSHIPS'
  | 'PASSWORD_CHANGE_REQUIRED'
  | 'SUBSCRIBER_NOT_FOUND'
  | 'SUBSCRIPTION_NOT_FOUND'
  | 'PLAN_NOT_FOUND'
  | 'DATA_UNAVAILABLE';

const safeMessages: Record<ClinicOwnerApiErrorCode, string> = {
  UNAUTHENTICATED: 'Your Clinic Owner session is unavailable. Please sign in again.',
  NO_ACTIVE_CLINIC_OWNER_MEMBERSHIP: 'Your account does not have an active Clinic Owner membership.',
  MULTIPLE_ACTIVE_CLINIC_OWNER_MEMBERSHIPS: 'Your account has multiple active Clinic Owner memberships. Please contact platform support.',
  PASSWORD_CHANGE_REQUIRED: 'Complete the required initial password change before opening the Clinic Owner workspace.',
  SUBSCRIBER_NOT_FOUND: 'Your Clinic Owner organization record is unavailable. Please contact platform support.',
  SUBSCRIPTION_NOT_FOUND: 'Your current subscription is unavailable. Please contact platform support.',
  PLAN_NOT_FOUND: 'Your subscription plan is unavailable. Please contact platform support.',
  DATA_UNAVAILABLE: 'Clinic Owner data could not be loaded. No mock data was substituted.',
};

export class ClinicOwnerApiError extends Error {
  readonly code: ClinicOwnerApiErrorCode;

  constructor(code: ClinicOwnerApiErrorCode) {
    super(safeMessages[code]);
    this.code = code;
  }
}

interface FirstLoginMembership {
  membershipId: string;
  role: string;
  accountStatus: string;
  mustChangePassword: boolean;
}

const record = (value: unknown): Record<string, unknown> => (
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
);

function parseFirstLoginMemberships(value: unknown): FirstLoginMembership[] | null {
  const state = record(value);
  if (!Array.isArray(state.memberships)) return null;
  const memberships = state.memberships.map((item) => {
    const membership = record(item);
    if (typeof membership.membershipId !== 'string'
      || typeof membership.role !== 'string'
      || typeof membership.accountStatus !== 'string'
      || typeof membership.mustChangePassword !== 'boolean') return null;
    return membership as unknown as FirstLoginMembership;
  });
  return memberships.every(Boolean) ? memberships as FirstLoginMembership[] : null;
}

function normalizedLimit(value: unknown): ClinicOwnerQuotaLimit {
  const limit = record(value);
  if (limit.type === 'unlimited') return { kind: 'unlimited' };
  if (limit.type === 'not_included') return { kind: 'not_included' };
  if (limit.type === 'pending') return { kind: 'pending' };
  if (limit.type === 'number' && typeof limit.value === 'number' && Number.isFinite(limit.value) && limit.value >= 0) {
    return { kind: 'number', value: limit.value };
  }
  return { kind: 'unavailable' };
}

export function normalizeClinicOwnerPlanLimits(limits: unknown): Record<ClinicOwnerQuotaUsage['key'], ClinicOwnerQuotaLimit> {
  const entries = Array.isArray(limits) ? limits : [];
  const find = (key: ClinicOwnerQuotaUsage['key']) => normalizedLimit(entries.find((item) => record(item).key === key));
  return {
    clinics: find('clinics'),
    laboratories: find('laboratories'),
    associates: find('associates'),
    staff: find('staff'),
  };
}

const string = (value: unknown): string => typeof value === 'string' ? value : '';
const nullableString = (value: unknown): string | null => typeof value === 'string' && value ? value : null;
const nullableNumber = (value: unknown): number | null => typeof value === 'number' && Number.isFinite(value) ? value : null;

function queryFailed(error: unknown): asserts error is null {
  if (error) throw new ClinicOwnerApiError('DATA_UNAVAILABLE');
}

export async function getClinicOwnerBootstrap(
  client: SupabaseClient = requireSupabaseClient(),
): Promise<ClinicOwnerBootstrap> {
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError || !userData.user?.id || !userData.user.email) throw new ClinicOwnerApiError('UNAUTHENTICATED');
  const authUser = userData.user;
  const authEmail = userData.user.email;

  const { data: firstLoginData, error: firstLoginError } = await client.rpc('get_my_first_login_state');
  if (firstLoginError) throw new ClinicOwnerApiError('DATA_UNAVAILABLE');
  const memberships = parseFirstLoginMemberships(firstLoginData);
  if (!memberships) throw new ClinicOwnerApiError('DATA_UNAVAILABLE');
  const activeOwners = memberships.filter((membership) => membership.role === 'clinic_owner' && membership.accountStatus === 'active');
  if (activeOwners.length === 0) throw new ClinicOwnerApiError('NO_ACTIVE_CLINIC_OWNER_MEMBERSHIP');
  if (activeOwners.length > 1) throw new ClinicOwnerApiError('MULTIPLE_ACTIVE_CLINIC_OWNER_MEMBERSHIPS');
  const firstLoginMembership = activeOwners[0];
  if (firstLoginMembership.mustChangePassword) throw new ClinicOwnerApiError('PASSWORD_CHANGE_REQUIRED');

  const { data: membershipData, error: membershipError } = await client
    .from('subscriber_memberships')
    .select('id, subscriber_id, user_id, role, account_status, must_change_password')
    .eq('id', firstLoginMembership.membershipId)
    .eq('user_id', authUser.id)
    .eq('role', 'clinic_owner')
    .eq('account_status', 'active')
    .eq('must_change_password', false)
    .maybeSingle();
  queryFailed(membershipError);
  const membership = record(membershipData);
  const subscriberId = string(membership.subscriber_id);
  if (!subscriberId) throw new ClinicOwnerApiError('NO_ACTIVE_CLINIC_OWNER_MEMBERSHIP');

  const [profileResult, subscriberResult] = await Promise.all([
    client.from('profiles').select('id, email, display_name, first_name, middle_name, last_name, mobile_number').eq('id', authUser.id).maybeSingle(),
    client.from('subscribers').select('id, subscriber_number, business_name, account_status, created_at, activated_at').eq('id', subscriberId).maybeSingle(),
  ]);
  queryFailed(profileResult.error);
  queryFailed(subscriberResult.error);
  const subscriber = record(subscriberResult.data);
  if (!string(subscriber.id)) throw new ClinicOwnerApiError('SUBSCRIBER_NOT_FOUND');

  const { data: subscriptionRows, error: subscriptionError } = await client
    .from('subscriptions')
    .select('id, subscriber_id, plan_id, status, billing_cycle, amount_centavos, starts_at, expires_at')
    .eq('subscriber_id', subscriberId)
    .in('status', ['pending', 'active', 'expiring_soon', 'suspended']);
  queryFailed(subscriptionError);
  if (!Array.isArray(subscriptionRows) || subscriptionRows.length === 0) throw new ClinicOwnerApiError('SUBSCRIPTION_NOT_FOUND');
  if (subscriptionRows.length !== 1) throw new ClinicOwnerApiError('DATA_UNAVAILABLE');
  const subscription = record(subscriptionRows[0]);
  const planId = string(subscription.plan_id);
  if (!planId) throw new ClinicOwnerApiError('PLAN_NOT_FOUND');

  const { data: planData, error: planError } = await client
    .from('plans')
    .select('id, plan_code, name, monthly_amount_centavos, annual_amount_centavos, limits, features')
    .eq('id', planId)
    .maybeSingle();
  queryFailed(planError);
  const plan = record(planData);
  if (!string(plan.id)) throw new ClinicOwnerApiError('PLAN_NOT_FOUND');

  const [clinicsResult, auditEventsResult, laboratoryCountResult, associateCountResult, staffCountResult] = await Promise.all([
    client.from('clinics').select('id, subscriber_id, clinic_number, branch_type, name, is_primary, status, email, contact_number, address_line_1, address_line_2, barangay, city, province, postal_code, created_at').eq('subscriber_id', subscriberId).order('is_primary', { ascending: false }).order('created_at', { ascending: true }),
    client.from('audit_events').select('id, subscriber_id, clinic_id, event_type, entity_type, entity_id, created_at').eq('subscriber_id', subscriberId).order('created_at', { ascending: false }).limit(10),
    client.from('laboratories').select('id', { count: 'exact', head: true }).eq('subscriber_id', subscriberId).eq('status', 'active'),
    client.from('subscriber_memberships').select('id', { count: 'exact', head: true }).eq('subscriber_id', subscriberId).eq('role', 'associate').eq('account_status', 'active'),
    client.from('subscriber_memberships').select('id', { count: 'exact', head: true }).eq('subscriber_id', subscriberId).eq('role', 'staff').eq('account_status', 'active'),
  ]);
  queryFailed(clinicsResult.error);
  queryFailed(auditEventsResult.error);
  queryFailed(laboratoryCountResult.error);
  queryFailed(associateCountResult.error);
  queryFailed(staffCountResult.error);
  if (!Array.isArray(clinicsResult.data)) throw new ClinicOwnerApiError('DATA_UNAVAILABLE');
  if (!Array.isArray(auditEventsResult.data)) throw new ClinicOwnerApiError('DATA_UNAVAILABLE');

  const clinics = clinicsResult.data.map((value) => {
    const clinic = record(value);
    if (string(clinic.subscriber_id) !== subscriberId) throw new ClinicOwnerApiError('DATA_UNAVAILABLE');
    return {
      id: string(clinic.id),
      clinicNumber: string(clinic.clinic_number),
      branchType: string(clinic.branch_type),
      name: string(clinic.name),
      isPrimary: clinic.is_primary === true,
      status: string(clinic.status),
      email: nullableString(clinic.email),
      contactNumber: nullableString(clinic.contact_number),
      addressLine1: string(clinic.address_line_1),
      addressLine2: nullableString(clinic.address_line_2),
      barangay: nullableString(clinic.barangay),
      city: string(clinic.city),
      province: string(clinic.province),
      postalCode: nullableString(clinic.postal_code),
      createdAt: string(clinic.created_at),
    };
  });
  const auditEvents = auditEventsResult.data.map((value) => {
    const event = record(value);
    if (string(event.subscriber_id) !== subscriberId) throw new ClinicOwnerApiError('DATA_UNAVAILABLE');
    return {
      id: string(event.id),
      clinicId: nullableString(event.clinic_id),
      eventType: string(event.event_type),
      entityType: string(event.entity_type),
      entityId: nullableString(event.entity_id),
      createdAt: string(event.created_at),
    };
  });
  const resourceCounts = {
    activeClinics: clinics.filter((clinic) => clinic.status === 'active').length,
    activeLaboratories: laboratoryCountResult.count ?? 0,
    activeAssociates: associateCountResult.count ?? 0,
    activeStaff: staffCountResult.count ?? 0,
  };
  const quotaLimits = normalizeClinicOwnerPlanLimits(plan.limits);
  const profile = record(profileResult.data);
  const joinedName = [profile.first_name, profile.middle_name, profile.last_name].map(string).filter(Boolean).join(' ');

  return {
    auth: { userId: authUser.id },
    owner: {
      membershipId: string(membership.id),
      displayName: string(profile.display_name) || joinedName || authEmail,
      email: string(profile.email) || authEmail,
      mobileNumber: nullableString(profile.mobile_number),
      accountStatus: string(membership.account_status),
    },
    subscriber: {
      id: subscriberId,
      subscriberNumber: string(subscriber.subscriber_number),
      businessName: string(subscriber.business_name),
      accountStatus: string(subscriber.account_status),
      createdAt: string(subscriber.created_at),
      activatedAt: nullableString(subscriber.activated_at),
    },
    subscription: {
      id: string(subscription.id),
      status: string(subscription.status),
      billingCycle: nullableString(subscription.billing_cycle),
      amountCentavos: nullableNumber(subscription.amount_centavos),
      startsAt: nullableString(subscription.starts_at),
      expiresAt: nullableString(subscription.expires_at),
    },
    plan: {
      id: planId,
      code: string(plan.plan_code),
      name: string(plan.name),
      monthlyAmountCentavos: nullableNumber(plan.monthly_amount_centavos) ?? 0,
      annualAmountCentavos: nullableNumber(plan.annual_amount_centavos),
      limits: plan.limits,
      features: plan.features,
    },
    clinics,
    auditEvents,
    resourceCounts,
    quotas: {
      clinics: { key: 'clinics', limit: quotaLimits.clinics, activeUsage: resourceCounts.activeClinics },
      laboratories: { key: 'laboratories', limit: quotaLimits.laboratories, activeUsage: resourceCounts.activeLaboratories },
      associates: { key: 'associates', limit: quotaLimits.associates, activeUsage: resourceCounts.activeAssociates },
      staff: { key: 'staff', limit: quotaLimits.staff, activeUsage: resourceCounts.activeStaff },
    },
  };
}
