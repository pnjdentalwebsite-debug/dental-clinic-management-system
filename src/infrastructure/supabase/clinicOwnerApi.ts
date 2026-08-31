import type { SupabaseClient } from '@supabase/supabase-js';
import { requireSupabaseClient } from './client';
import type { BusinessHours, ClinicBranchType, ClinicFormData, ClinicVisibility } from '../../features/clinics/types';

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
    quotaConsumingClinics: number;
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
  | 'OWNER_MEMBERSHIP_REQUIRED'
  | 'OWNER_MEMBERSHIP_CONFLICT'
  | 'SUBSCRIBER_UNAVAILABLE'
  | 'SUBSCRIPTION_UNAVAILABLE'
  | 'PLAN_UNAVAILABLE'
  | 'CLINIC_QUOTA_REACHED'
  | 'INVALID_BRANCH_INPUT'
  | 'CLINIC_NOT_FOUND'
  | 'PRIMARY_CLINIC_CONFLICT'
  | 'DATA_UNAVAILABLE';

const safeMessages: Record<ClinicOwnerApiErrorCode, string> = {
  UNAUTHENTICATED: 'Your Clinic Owner session is unavailable. Please sign in again.',
  NO_ACTIVE_CLINIC_OWNER_MEMBERSHIP: 'Your account does not have an active Clinic Owner membership.',
  MULTIPLE_ACTIVE_CLINIC_OWNER_MEMBERSHIPS: 'Your account has multiple active Clinic Owner memberships. Please contact platform support.',
  PASSWORD_CHANGE_REQUIRED: 'Complete the required initial password change before opening the Clinic Owner workspace.',
  SUBSCRIBER_NOT_FOUND: 'Your Clinic Owner organization record is unavailable. Please contact platform support.',
  SUBSCRIPTION_NOT_FOUND: 'Your current subscription is unavailable. Please contact platform support.',
  PLAN_NOT_FOUND: 'Your subscription plan is unavailable. Please contact platform support.',
  OWNER_MEMBERSHIP_REQUIRED: 'Clinic Owner access is unavailable for this account.',
  OWNER_MEMBERSHIP_CONFLICT: 'Your organization access has a conflict. Please contact platform support.',
  SUBSCRIBER_UNAVAILABLE: 'Your organization is currently unavailable.',
  SUBSCRIPTION_UNAVAILABLE: 'An active subscription is required to manage clinic branches.',
  PLAN_UNAVAILABLE: 'Your plan quota is currently unavailable. Please try again later.',
  CLINIC_QUOTA_REACHED: 'The clinic limit for your current plan has been reached.',
  INVALID_BRANCH_INPUT: 'Please review the branch information and try again.',
  CLINIC_NOT_FOUND: 'The requested clinic branch was not found.',
  PRIMARY_CLINIC_CONFLICT: 'The primary clinic configuration requires attention before another branch can be added.',
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
    quotaConsumingClinics: clinics.filter((clinic) => ['draft', 'pending', 'active', 'inactive'].includes(clinic.status)).length,
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
      clinics: { key: 'clinics', limit: quotaLimits.clinics, activeUsage: resourceCounts.quotaConsumingClinics },
      laboratories: { key: 'laboratories', limit: quotaLimits.laboratories, activeUsage: resourceCounts.activeLaboratories },
      associates: { key: 'associates', limit: quotaLimits.associates, activeUsage: resourceCounts.activeAssociates },
      staff: { key: 'staff', limit: quotaLimits.staff, activeUsage: resourceCounts.activeStaff },
    },
  };
}

/** The form deliberately uses labels while the branch contract uses Postgres weekday numbers. */
export const clinicBranchWeekdays = [
  ['Monday', 1],
  ['Tuesday', 2],
  ['Wednesday', 3],
  ['Thursday', 4],
  ['Friday', 5],
  ['Saturday', 6],
  ['Sunday', 0],
] as const;

type ClinicBranchWeekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface ClinicBranchBusinessHours {
  dayOfWeek: ClinicBranchWeekday;
  isOpen: boolean;
  openingTime: string | null;
  closingTime: string | null;
  breakStart: string | null;
  breakEnd: string | null;
}

export interface ClinicBranchInput {
  branchType: ClinicBranchType;
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
  visibility: ClinicVisibility;
  businessHours: ClinicBranchBusinessHours[];
}

export interface ClinicBranchCreateInput extends ClinicBranchInput {
  saveMode: 'draft' | 'active';
}

export interface ClinicOwnerClinicBranch {
  id: string;
  clinicNumber: string;
  branchType: ClinicBranchType;
  name: string;
  legalBusinessName: string | null;
  email: string;
  contactNumber: string;
  alternativeContactNumber: string | null;
  addressLine1: string;
  addressLine2: string | null;
  barangay: string | null;
  city: string;
  province: string;
  postalCode: string | null;
  country: string;
  timezone: string;
  description: string | null;
  visibility: ClinicVisibility;
  status: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
  businessHours: ClinicBranchBusinessHours[];
  /** False only when a legacy clinic has no persisted business-hours rows. */
  businessHoursConfigured: boolean;
}

function nullableInput(value: string): string | null {
  const trimmed = value.trim();
  return trimmed || null;
}

/**
 * Produces the precise public RPC allowlist. Legacy ClinicFormData fields are
 * intentionally omitted so neither browser state nor local mock metadata can
 * become tenant or lifecycle authority.
 */
export function clinicBranchInputFromForm(data: ClinicFormData): ClinicBranchInput {
  return {
    branchType: data.branchType,
    name: data.name.trim(),
    legalBusinessName: data.legalBusinessName.trim(),
    email: data.email.trim(),
    contactNumber: data.contactNumber.trim(),
    alternativeContactNumber: data.alternativeContactNumber.trim(),
    addressLine1: data.addressLine1.trim(),
    addressLine2: data.addressLine2.trim(),
    barangay: data.barangay.trim(),
    city: data.city.trim(),
    province: data.province.trim(),
    postalCode: data.postalCode.trim(),
    country: data.country.trim(),
    timezone: data.timezone.trim(),
    description: data.description.trim(),
    visibility: data.visibility,
    businessHours: clinicBranchHoursFromForm(data.businessHours),
  };
}

export function clinicBranchHoursFromForm(hours: BusinessHours): ClinicBranchBusinessHours[] {
  return clinicBranchWeekdays.map(([day, dayOfWeek]) => {
    const value = hours[day];
    const isOpen = value?.enabled === true;
    return {
      dayOfWeek,
      isOpen,
      openingTime: isOpen ? nullableInput(value?.openingTime ?? '') : null,
      closingTime: isOpen ? nullableInput(value?.closingTime ?? '') : null,
      breakStart: isOpen && value?.breakEnabled ? nullableInput(value.breakStart) : null,
      breakEnd: isOpen && value?.breakEnabled ? nullableInput(value.breakEnd) : null,
    };
  });
}

export function clinicBranchHoursToForm(rows: ClinicBranchBusinessHours[]): BusinessHours {
  const byDay = new Map(rows.map((row) => [row.dayOfWeek, row]));
  return Object.fromEntries(clinicBranchWeekdays.map(([day, dayOfWeek]) => {
    const row = byDay.get(dayOfWeek);
    const enabled = row?.isOpen === true;
    const breakEnabled = enabled && Boolean(row?.breakStart && row?.breakEnd);
    return [day, {
      enabled,
      openingTime: enabled ? row?.openingTime ?? '' : '',
      closingTime: enabled ? row?.closingTime ?? '' : '',
      breakEnabled,
      breakStart: breakEnabled ? row?.breakStart ?? '' : '',
      breakEnd: breakEnabled ? row?.breakEnd ?? '' : '',
    }];
  }));
}

function rpcPayload(input: ClinicBranchInput, saveMode?: ClinicBranchCreateInput['saveMode']) {
  const payload = {
    branchType: input.branchType,
    name: input.name,
    legalBusinessName: input.legalBusinessName,
    email: input.email,
    contactNumber: input.contactNumber,
    alternativeContactNumber: input.alternativeContactNumber,
    addressLine1: input.addressLine1,
    addressLine2: input.addressLine2,
    barangay: input.barangay,
    city: input.city,
    province: input.province,
    postalCode: input.postalCode,
    country: input.country,
    timezone: input.timezone,
    description: input.description,
    visibility: input.visibility,
    businessHours: input.businessHours,
  };
  return saveMode ? { saveMode, ...payload } : payload;
}

function normalizedBranchHours(value: unknown): ClinicBranchBusinessHours[] {
  if (!Array.isArray(value) || value.length !== 7) throw new ClinicOwnerApiError('DATA_UNAVAILABLE');
  const hours = value.map((item) => {
    const row = record(item);
    const dayOfWeek = row.dayOfWeek;
    if (typeof dayOfWeek !== 'number' || !Number.isFinite(dayOfWeek)
      || !Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6 || typeof row.isOpen !== 'boolean') {
      throw new ClinicOwnerApiError('DATA_UNAVAILABLE');
    }
    return {
      dayOfWeek: dayOfWeek as ClinicBranchWeekday,
      isOpen: row.isOpen,
      openingTime: nullableString(row.openingTime),
      closingTime: nullableString(row.closingTime),
      breakStart: nullableString(row.breakStart),
      breakEnd: nullableString(row.breakEnd),
    };
  });
  if (new Set(hours.map((row) => row.dayOfWeek)).size !== 7) throw new ClinicOwnerApiError('DATA_UNAVAILABLE');
  return hours.sort((left, right) => left.dayOfWeek - right.dayOfWeek);
}

function branchFromDto(value: unknown, businessHours = normalizedBranchHours(record(value).businessHours), businessHoursConfigured = true): ClinicOwnerClinicBranch {
  const branch = record(value);
  const branchType = string(branch.branchType);
  const visibility = string(branch.visibility);
  if (!string(branch.id) || !string(branch.clinicNumber)
    || (branchType !== 'main' && branchType !== 'satellite')
    || (visibility !== 'visible' && visibility !== 'hidden')
    || !string(branch.name) || !string(branch.email) || !string(branch.contactNumber)
    || !string(branch.addressLine1) || !string(branch.city) || !string(branch.province)
    || !string(branch.country) || !string(branch.timezone) || !string(branch.status)
    || typeof branch.isPrimary !== 'boolean' || !string(branch.createdAt) || !string(branch.updatedAt)) {
    throw new ClinicOwnerApiError('DATA_UNAVAILABLE');
  }
  return {
    id: string(branch.id),
    clinicNumber: string(branch.clinicNumber),
    branchType,
    name: string(branch.name),
    legalBusinessName: nullableString(branch.legalBusinessName),
    email: string(branch.email),
    contactNumber: string(branch.contactNumber),
    alternativeContactNumber: nullableString(branch.alternativeContactNumber),
    addressLine1: string(branch.addressLine1),
    addressLine2: nullableString(branch.addressLine2),
    barangay: nullableString(branch.barangay),
    city: string(branch.city),
    province: string(branch.province),
    postalCode: nullableString(branch.postalCode),
    country: string(branch.country),
    timezone: string(branch.timezone),
    description: nullableString(branch.description),
    visibility,
    status: string(branch.status),
    isPrimary: branch.isPrimary,
    createdAt: string(branch.createdAt),
    updatedAt: string(branch.updatedAt),
    businessHours,
    businessHoursConfigured,
  };
}

function safeBranchError(error: unknown): ClinicOwnerApiError {
  const errorRecord = record(error);
  const serialized = [errorRecord.message, errorRecord.details, errorRecord.hint]
    .filter((value): value is string => typeof value === 'string')
    .join(' ');
  const codes: ClinicOwnerApiErrorCode[] = [
    'UNAUTHENTICATED', 'OWNER_MEMBERSHIP_REQUIRED', 'OWNER_MEMBERSHIP_CONFLICT',
    'PASSWORD_CHANGE_REQUIRED', 'SUBSCRIBER_UNAVAILABLE', 'SUBSCRIPTION_UNAVAILABLE',
    'PLAN_UNAVAILABLE', 'CLINIC_QUOTA_REACHED', 'INVALID_BRANCH_INPUT', 'CLINIC_NOT_FOUND',
    'PRIMARY_CLINIC_CONFLICT', 'DATA_UNAVAILABLE',
  ];
  const code = codes.find((candidate) => serialized.includes(candidate));
  return new ClinicOwnerApiError(code ?? 'DATA_UNAVAILABLE');
}

export async function createClinicBranch(
  input: ClinicBranchCreateInput,
  client: SupabaseClient = requireSupabaseClient(),
): Promise<ClinicOwnerClinicBranch> {
  const { data, error } = await client.rpc('create_my_clinic_branch', { p_input: rpcPayload(input, input.saveMode) });
  if (error) throw safeBranchError(error);
  return branchFromDto(data);
}

export async function updateClinicBranch(
  clinicId: string,
  input: ClinicBranchInput,
  client: SupabaseClient = requireSupabaseClient(),
): Promise<ClinicOwnerClinicBranch> {
  const { data, error } = await client.rpc('update_my_clinic_branch', { p_clinic_id: clinicId, p_input: rpcPayload(input) });
  if (error) throw safeBranchError(error);
  return branchFromDto(data);
}

/** RLS determines tenant access; this read is deliberately scoped only by the requested clinic UUID. */
export async function getClinicBranchDetail(
  clinicId: string,
  client: SupabaseClient = requireSupabaseClient(),
): Promise<ClinicOwnerClinicBranch> {
  const { data: clinicData, error: clinicError } = await client
    .from('clinics')
    .select('id, clinic_number, branch_type, name, legal_business_name, email, contact_number, alternative_contact_number, address_line_1, address_line_2, barangay, city, province, postal_code, country, timezone, description, visibility, status, is_primary, created_at, updated_at')
    .eq('id', clinicId)
    .maybeSingle();
  if (clinicError) throw safeBranchError(clinicError);
  const clinic = record(clinicData);
  if (!string(clinic.id)) throw new ClinicOwnerApiError('CLINIC_NOT_FOUND');

  const { data: hoursData, error: hoursError } = await client
    .from('clinic_business_hours')
    .select('day_of_week, is_open, opening_time, closing_time, break_start, break_end')
    .eq('clinic_id', clinicId)
    .order('day_of_week', { ascending: true });
  if (hoursError || !Array.isArray(hoursData)) throw safeBranchError(hoursError);
  const rawBusinessHours = hoursData.map((value) => {
    const row = record(value);
    return {
      dayOfWeek: row.day_of_week,
      isOpen: row.is_open,
      openingTime: row.opening_time,
      closingTime: row.closing_time,
      breakStart: row.break_start,
      breakEnd: row.break_end,
    };
  });
  // Provisioned clinics predating branch mutations may intentionally have no rows.
  // A partial schedule is still an unavailable/corrupt detail response and remains rejected.
  const businessHoursConfigured = rawBusinessHours.length > 0;
  const businessHours = businessHoursConfigured ? normalizedBranchHours(rawBusinessHours) : [];

  return branchFromDto({
    id: clinic.id,
    clinicNumber: clinic.clinic_number,
    branchType: clinic.branch_type,
    name: clinic.name,
    legalBusinessName: clinic.legal_business_name,
    email: clinic.email,
    contactNumber: clinic.contact_number,
    alternativeContactNumber: clinic.alternative_contact_number,
    addressLine1: clinic.address_line_1,
    addressLine2: clinic.address_line_2,
    barangay: clinic.barangay,
    city: clinic.city,
    province: clinic.province,
    postalCode: clinic.postal_code,
    country: clinic.country,
    timezone: clinic.timezone,
    description: clinic.description,
    visibility: clinic.visibility,
    status: clinic.status,
    isPrimary: clinic.is_primary,
    createdAt: clinic.created_at,
    updatedAt: clinic.updated_at,
    businessHours,
  }, businessHours, businessHoursConfigured);
}
