import type { PlatformAdminDirectorySnapshot, PlatformAdminReadResource, PlatformReviewRegistration } from '../../../infrastructure/supabase/platformAdminApi';
import type { Clinic, ClinicAssignment, ClinicFilters, ClinicHistoryRecord, ClinicSort } from '../../clinics/types';
import type { Payment, PaymentAllocation, PaymentFilters, PaymentHistoryRecord, PaymentSort } from '../../payments/types';
import type { Plan, PlanFilters, PlanHistoryRecord, PlanSort } from '../../plans/types';
import type { Subscription, SubscriptionFilters, SubscriptionHistoryRecord, SubscriptionSort } from '../../subscriptions/types';
import type { ActivityLogLike, PlatformUser, RegistrationLike, ServiceResult, SortState, Subscriber, SubscriberFilters } from '../types';

export interface PlatformAdminSummary {
  pendingRegistrationReviews: number;
  pendingPaymentReviews: number;
  activeSubscribers: number;
  activeClinics: number;
  activeSubscriptions: number;
  platformUsers: number;
  activeSubscriptionMrrCentavos: number;
  subscriptionStatuses: { active: number; pending: number; expiringSoon: number; expired: number; suspended: number; cancelled: number };
  activePlanDistribution: Record<string, number>;
}

interface RealDataSnapshot {
  summary: PlatformAdminSummary;
  subscribers: Subscriber[];
  users: PlatformUser[];
  clinics: Clinic[];
  payments: Payment[];
  subscriptions: Subscription[];
  plans: Plan[];
  registrations: RegistrationLike[];
}

const emptySnapshot = (): RealDataSnapshot => ({
  summary: { pendingRegistrationReviews: 0, pendingPaymentReviews: 0, activeSubscribers: 0, activeClinics: 0, activeSubscriptions: 0, platformUsers: 0, activeSubscriptionMrrCentavos: 0, subscriptionStatuses: { active: 0, pending: 0, expiringSoon: 0, expired: 0, suspended: 0, cancelled: 0 }, activePlanDistribution: {} },
  subscribers: [], users: [], clinics: [], payments: [], subscriptions: [], plans: [], registrations: [],
});

let snapshot = emptySnapshot();

const records = <T,>(value: unknown): T[] => Array.isArray(value) ? value as T[] : [];
const object = (value: unknown): Record<string, any> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {};
const dateOnly = (value: unknown): string => typeof value === 'string' && value ? value.slice(0, 10) : '';
const compare = (a: unknown, b: unknown) => String(a ?? '').localeCompare(String(b ?? ''), undefined, { numeric: true, sensitivity: 'base' });
const unsupportedWrite = (..._args: any[]): ServiceResult<any> => ({ ok: false, error: 'This action is unavailable until an approved secure Platform Administrator mutation contract is deployed.' });

function toRegistration(item: PlatformReviewRegistration): RegistrationLike {
  return {
    id: item.registrationId,
    plan: item.plan?.code ?? item.plan?.name ?? '',
    ownerName: item.ownerName,
    ownerEmail: item.ownerEmail,
    ownerMobile: item.ownerMobile ?? '',
    ownerAddress: '',
    clinicName: item.clinicName,
    clinicEmail: item.clinicEmail,
    clinicMobile: item.clinicMobile ?? '',
    clinicAddress: '',
    dentistsCount: 0,
    staffCount: 0,
    locationsCount: 0,
    worksWithLab: false,
    emailVerified: Boolean(item.emailVerifiedAt),
    paymentStatus: item.paymentStatus as RegistrationLike['paymentStatus'],
    registrationStatus: item.registrationStatus,
    submittedDate: dateOnly(item.submittedAt),
    updatedDate: dateOnly(item.createdAt),
    referenceNumber: item.payment?.referenceNumber ?? undefined,
    paymentMethod: item.payment?.method ?? undefined,
  };
}

function toSubscriber(value: unknown): Subscriber {
  const item = object(value);
  const owner = object(item.owner);
  const clinic = object(item.primaryClinic);
  const subscription = object(item.subscription);
  const counts = object(item.counts);
  return {
    id: String(item.id),
    subscriberNumber: String(item.subscriberNumber ?? item.id),
    registrationId: item.registrationId ? String(item.registrationId) : undefined,
    ownerUserId: owner.membershipId ? String(owner.membershipId) : undefined,
    businessName: String(item.businessName ?? ''),
    primaryClinicName: String(clinic.name ?? item.businessName ?? ''),
    email: String(owner.email ?? item.email ?? ''),
    mobileNumber: String(owner.mobileNumber ?? item.mobileNumber ?? ''),
    planId: String(subscription.planCode ?? subscription.planName ?? subscription.planId ?? ''),
    subscriptionId: String(subscription.id ?? ''),
    paymentStatus: String(item.paymentStatus ?? 'unpaid') as Subscriber['paymentStatus'],
    subscriptionStatus: String(subscription.status ?? 'pending') as Subscriber['subscriptionStatus'],
    accountStatus: String(item.accountStatus ?? 'pending') as Subscriber['accountStatus'],
    clinicCount: Number(counts.clinics ?? 0),
    laboratoryCount: Number(counts.laboratories ?? 0),
    associateCount: Number(counts.associates ?? 0),
    staffCount: Number(counts.staff ?? 0),
    registeredAt: dateOnly(item.createdAt),
    activatedAt: item.activatedAt ? dateOnly(item.activatedAt) : undefined,
    expiresAt: subscription.expiresAt ? dateOnly(subscription.expiresAt) : undefined,
    deactivatedAt: item.deactivatedAt ? dateOnly(item.deactivatedAt) : undefined,
    createdAt: dateOnly(item.createdAt),
    updatedAt: dateOnly(item.updatedAt),
  };
}

function toUser(value: unknown): PlatformUser {
  const item = object(value);
  return {
    id: String(item.id),
    userNumber: String(item.userNumber ?? item.id),
    subscriberId: item.subscriberId ? String(item.subscriberId) : undefined,
    clinicIds: records<string>(item.clinicIds).map(String),
    fullName: String(item.fullName ?? item.email ?? ''),
    firstName: String(item.firstName ?? ''),
    middleName: item.middleName ? String(item.middleName) : undefined,
    lastName: String(item.lastName ?? ''),
    email: String(item.email ?? ''),
    mobileNumber: String(item.mobileNumber ?? ''),
    role: String(item.role) as PlatformUser['role'],
    position: String(item.position ?? ''),
    workSchedule: object(item.workSchedule) as PlatformUser['workSchedule'],
    accountStatus: String(item.accountStatus ?? 'pending') as PlatformUser['accountStatus'],
    mustChangePassword: Boolean(item.mustChangePassword),
    registeredAt: dateOnly(item.createdAt),
    createdAt: dateOnly(item.createdAt),
    updatedAt: dateOnly(item.updatedAt),
  };
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
function toClinic(value: unknown, users: PlatformUser[]): Clinic {
  const item = object(value);
  const ownerUser = users.find(user => user.id === String(item.ownerMembershipId ?? ''));
  const dentistIds = records<string>(item.dentistMembershipIds).map(String);
  const staffIds = records<string>(item.staffMembershipIds).map(String);
  const businessHours = Object.fromEntries(records<Record<string, any>>(item.businessHours).map(hours => [dayNames[Number(hours.dayOfWeek)] ?? String(hours.dayOfWeek), {
    enabled: Boolean(hours.isOpen), openingTime: String(hours.openingTime ?? ''), closingTime: String(hours.closingTime ?? ''),
    breakEnabled: Boolean(hours.breakStart && hours.breakEnd), breakStart: String(hours.breakStart ?? ''), breakEnd: String(hours.breakEnd ?? ''),
  }]));
  return {
    id: String(item.id), clinicNumber: String(item.clinicNumber ?? item.id), subscriberId: String(item.subscriberId), primaryOwnerUserId: ownerUser?.id ?? (item.ownerMembershipId ? String(item.ownerMembershipId) : undefined),
    branchType: String(item.branchType ?? 'main') as Clinic['branchType'], name: String(item.name ?? ''), legalBusinessName: String(item.legalBusinessName ?? item.name ?? ''),
    email: String(item.email ?? ''), contactNumber: String(item.contactNumber ?? ''), alternativeContactNumber: item.alternativeContactNumber ? String(item.alternativeContactNumber) : undefined,
    addressLine1: String(item.addressLine1 ?? ''), addressLine2: item.addressLine2 ? String(item.addressLine2) : undefined, barangay: item.barangay ? String(item.barangay) : undefined,
    city: String(item.city ?? ''), province: String(item.province ?? ''), postalCode: item.postalCode ? String(item.postalCode) : undefined,
    country: String(item.country ?? 'Philippines'), timezone: String(item.timezone ?? 'Asia/Manila'), description: item.description ? String(item.description) : undefined,
    status: String(item.status ?? 'draft') as Clinic['status'], visibility: String(item.visibility ?? 'visible') as Clinic['visibility'], isPrimaryClinic: Boolean(item.isPrimary),
    dentistUserIds: dentistIds, staffUserIds: staffIds, laboratoryIds: [], businessHours,
    createdAt: dateOnly(item.createdAt), updatedAt: dateOnly(item.updatedAt), activatedAt: item.activatedAt ? dateOnly(item.activatedAt) : undefined,
    deactivatedAt: item.deactivatedAt ? dateOnly(item.deactivatedAt) : undefined, archivedAt: item.archivedAt ? dateOnly(item.archivedAt) : undefined,
    createdBy: 'system', updatedBy: 'system',
  };
}

function toPayment(value: unknown): Payment {
  const item = object(value);
  const status = String(item.status ?? 'pending_verification') as Payment['status'];
  const approved = status === 'approved';
  const amount = Number(item.amountCentavos ?? 0) / 100;
  return {
    id: String(item.id), paymentNumber: String(item.id), registrationId: item.registrationId ? String(item.registrationId) : undefined,
    subscriberId: item.subscriberId ? String(item.subscriberId) : undefined, subscriptionId: item.subscriptionId ? String(item.subscriptionId) : undefined,
    planId: item.planId ? String(item.planId) : undefined, payerName: String(item.payerName ?? ''), payerEmail: String(item.payerEmail ?? ''),
    amount, allocatedAmount: approved ? amount : 0, unallocatedAmount: approved ? 0 : amount, refundedAmount: status === 'refunded' ? amount : 0, currency: 'PHP',
    paymentMethod: String(item.paymentMethod ?? 'other') as Payment['paymentMethod'], referenceNumber: String(item.referenceNumber ?? ''), paymentDate: dateOnly(item.submittedAt),
    submittedAt: item.submittedAt ? dateOnly(item.submittedAt) : undefined, verifiedAt: item.reviewedAt && approved ? dateOnly(item.reviewedAt) : undefined,
    rejectedAt: item.reviewedAt && status === 'rejected' ? dateOnly(item.reviewedAt) : undefined, status,
    verificationStatus: approved ? 'verified' : status === 'rejected' ? 'rejected' : 'pending', allocationStatus: approved ? 'fully_allocated' : 'unallocated',
    notes: item.notes ? String(item.notes) : undefined, createdAt: dateOnly(item.createdAt), updatedAt: dateOnly(item.updatedAt), createdBy: 'system', updatedBy: 'system',
  };
}

function toSubscription(value: unknown): Subscription {
  const item = object(value);
  const billingCycle = String(item.billingCycle ?? 'monthly') as Subscription['billingCycle'];
  const monthlyPrice = Number(item.monthlyAmountCentavos ?? 0) / 100;
  const annualPrice = Number(item.annualAmountCentavos ?? 0) / 100;
  const appliedAmount = Number(item.amountCentavos ?? 0) / 100;
  return {
    id: String(item.id), subscriptionNumber: String(item.id), subscriberId: String(item.subscriberId), planId: String(item.planCode ?? item.planId),
    registrationId: item.registrationId ? String(item.registrationId) : undefined, status: String(item.status ?? 'pending') as Subscription['status'], billingCycle,
    startDate: dateOnly(item.startsAt ?? item.createdAt), expirationDate: dateOnly(item.expiresAt), startedAt: dateOnly(item.startsAt ?? item.createdAt), expiresAt: dateOnly(item.expiresAt),
    autoRenew: false, paymentStatus: String(item.sourcePaymentStatus ?? 'unpaid') as Subscription['paymentStatus'],
    priceSnapshot: { planId: String(item.planId), planName: String(item.planName ?? item.planCode ?? ''), monthlyPrice, annualPrice, billingCycle, appliedAmount, currency: 'PHP' },
    currency: 'PHP', createdAt: dateOnly(item.createdAt), updatedAt: dateOnly(item.updatedAt), createdBy: 'system', updatedBy: 'system', renewalStatus: String(item.status ?? 'pending'), changeHistory: [],
  };
}

function toPlan(value: unknown, index: number): Plan {
  const item = object(value);
  return {
    id: String(item.id), planCode: String(item.planCode ?? ''), name: String(item.name ?? ''), slug: String(item.planCode ?? ''), shortDescription: '', fullDescription: '',
    monthlyPrice: Number(item.monthlyAmountCentavos ?? 0) / 100, annualPrice: Number(item.annualAmountCentavos ?? 0) / 100, currency: 'PHP', billingCycles: ['monthly', 'annual'],
    status: String(item.status ?? 'active') as Plan['status'], visibility: item.status === 'active' ? 'public' : 'hidden', isRecommended: false,
    badgeLabel: undefined, displayOrder: index + 1,
    features: records<Plan['features'][number]>(item.features), limits: records<Plan['limits'][number]>(item.limits), subscriberCount: Number(item.subscriberCount ?? 0),
    createdAt: dateOnly(item.createdAt), updatedAt: dateOnly(item.updatedAt), createdBy: 'system', updatedBy: 'system',
  };
}

export function installPlatformAdminDashboard(summary: PlatformAdminDirectorySnapshot['summary'], reviews: PlatformReviewRegistration[] = []): void {
  snapshot.summary = summary;
  snapshot.registrations = reviews.map(toRegistration);
}

// Test-fixture installer only. Runtime code installs dashboard and individual
// bounded resource pages through the dedicated functions below.
export function installPlatformAdminSnapshot(data: PlatformAdminDirectorySnapshot, reviews: PlatformReviewRegistration[] = []): void {
  clearPlatformAdminSnapshot();
  installPlatformAdminDashboard(data.summary, reviews);
  for (const resource of ['subscribers', 'users', 'clinics', 'payments', 'subscriptions', 'plans'] as const) {
    installPlatformAdminDirectoryPage(resource, data[resource].items);
  }
}

export function installPlatformAdminDirectoryPage(resource: Exclude<PlatformAdminReadResource, 'summary'>, values: unknown[]): void {
  if (resource === 'subscribers') snapshot.subscribers = values.map(toSubscriber);
  if (resource === 'users') snapshot.users = values.map(toUser);
  if (resource === 'clinics') snapshot.clinics = values.map(item => toClinic(item, snapshot.users));
  if (resource === 'payments') snapshot.payments = values.map(toPayment);
  if (resource === 'subscriptions') snapshot.subscriptions = values.map(toSubscription);
  if (resource === 'plans') snapshot.plans = values.map(toPlan);
}

export function clearPlatformAdminResource(resource: Exclude<PlatformAdminReadResource, 'summary'>): void {
  installPlatformAdminDirectoryPage(resource, []);
}

export function clearPlatformAdminSnapshot(): void { snapshot = emptySnapshot(); }
export function getPlatformAdminSummary(): PlatformAdminSummary { return snapshot.summary; }

export function installPlatformAdminDirectoryItem(resource: 'subscribers' | 'users' | 'clinics' | 'payments' | 'subscriptions' | 'plans', value: unknown): void {
  if (resource === 'subscribers') snapshot.subscribers = [toSubscriber(value), ...snapshot.subscribers.filter(item => item.id !== object(value).id)];
  if (resource === 'users') snapshot.users = [toUser(value), ...snapshot.users.filter(item => item.id !== object(value).id)];
  if (resource === 'clinics') snapshot.clinics = [toClinic(value, snapshot.users), ...snapshot.clinics.filter(item => item.id !== object(value).id)];
  if (resource === 'payments') snapshot.payments = [toPayment(value), ...snapshot.payments.filter(item => item.id !== object(value).id)];
  if (resource === 'subscriptions') snapshot.subscriptions = [toSubscription(value), ...snapshot.subscriptions.filter(item => item.id !== object(value).id)];
  if (resource === 'plans') snapshot.plans = [toPlan(value, snapshot.plans.findIndex(item => item.id === object(value).id)), ...snapshot.plans.filter(item => item.id !== object(value).id)];
}

export const platformAdminDirectoryService = {
  listSubscribers: () => snapshot.subscribers,
  getSubscriberById: (id: string) => snapshot.subscribers.find(item => item.id === id || item.subscriberNumber === id) ?? null,
  getSubscriberSummary: () => ({ total: snapshot.subscribers.length, active: snapshot.subscribers.filter(item => item.accountStatus === 'active').length, pendingRegistrations: snapshot.summary.pendingRegistrationReviews, suspended: snapshot.subscribers.filter(item => item.accountStatus === 'suspended').length, expired: snapshot.subscribers.filter(item => item.subscriptionStatus === 'expired').length, rejectedRegistrations: 0 }),
  getUsersBySubscriberId: (id: string) => snapshot.users.filter(item => item.subscriberId === id),
  listUsers: () => snapshot.users,
  getUserById: (id: string) => snapshot.users.find(item => item.id === id || item.userNumber === id) ?? null,
  listRegistrations: () => snapshot.registrations,
  listActivity: (): ActivityLogLike[] => [],
  getStatusBadgeClass: (status: string) => ['active', 'approved'].includes(status) ? 'success' : ['suspended', 'rejected', 'deactivated', 'cancelled', 'expired'].includes(status) ? 'danger' : ['pending', 'pending_verification', 'unpaid', 'expiring_soon'].includes(status) ? 'warning' : 'info',
  filterSubscribers: (items: Subscriber[], filters: SubscriberFilters, registrations: RegistrationLike[]) => {
    let next = items;
    if (filters.tab === 'active') next = next.filter(item => item.accountStatus === 'active' && item.subscriptionStatus !== 'expired');
    if (filters.tab === 'suspended') next = next.filter(item => item.accountStatus === 'suspended');
    if (filters.tab === 'expired') next = next.filter(item => item.subscriptionStatus === 'expired');
    const term = filters.search.trim().toLowerCase();
    if (term) next = next.filter(item => [item.subscriberNumber, item.businessName, item.primaryClinicName, item.email, item.planId].some(value => value.toLowerCase().includes(term)));
    if (filters.plan !== 'all') next = next.filter(item => item.planId === filters.plan);
    if (filters.paymentStatus !== 'all') next = next.filter(item => item.paymentStatus === filters.paymentStatus);
    if (filters.subscriptionStatus !== 'all') next = next.filter(item => item.subscriptionStatus === filters.subscriptionStatus);
    if (filters.accountStatus !== 'all') next = next.filter(item => item.accountStatus === filters.accountStatus);
    if (filters.registeredDate) next = next.filter(item => item.registeredAt === filters.registeredDate);
    if (filters.tab === 'pending') { const ids = new Set(registrations.map(item => item.id)); next = next.filter(item => item.accountStatus === 'pending' || Boolean(item.registrationId && ids.has(item.registrationId))); }
    return next;
  },
  sortSubscribers: (items: Subscriber[], sort: SortState) => [...items].sort((a, b) => compare(a[sort.field as keyof Subscriber], b[sort.field as keyof Subscriber]) * (sort.direction === 'asc' ? 1 : -1)),
  paginateSubscribers: (items: Subscriber[], page: number, size: number) => items.slice((page - 1) * size, page * size),
  sortUsers: (items: PlatformUser[], sort: SortState) => [...items].sort((a, b) => compare(a[sort.field as keyof PlatformUser], b[sort.field as keyof PlatformUser]) * (sort.direction === 'asc' ? 1 : -1)),
  paginateUsers: (items: PlatformUser[], page: number, size: number) => items.slice((page - 1) * size, page * size),
  suspendSubscriber: unsupportedWrite, reactivateSubscriber: unsupportedWrite, deactivateSubscriber: unsupportedWrite, changeSubscriberPlanMock: unsupportedWrite,
  renewSubscriberMock: unsupportedWrite, deleteSubscriber: unsupportedWrite, initiateMockPasswordReset: unsupportedWrite, updateUser: unsupportedWrite, suspendUser: unsupportedWrite,
  reactivateUser: unsupportedWrite, deactivateUser: unsupportedWrite, deleteUser: unsupportedWrite,
};

export const platformAdminClinicService = {
  listClinics: () => snapshot.clinics,
  getClinicById: (id: string) => snapshot.clinics.find(item => item.id === id || item.clinicNumber === id) ?? null,
  getClinicsBySubscriberId: (id: string) => snapshot.clinics.filter(item => item.subscriberId === id),
  getClinicsByUserId: (id: string) => snapshot.clinics.filter(item => item.primaryOwnerUserId === id || item.dentistUserIds.includes(id) || item.staffUserIds.includes(id)),
  getClinicAssignments: (clinicId: string): ClinicAssignment[] => {
    const clinic = snapshot.clinics.find(item => item.id === clinicId); if (!clinic) return [];
    const entries = [[clinic.primaryOwnerUserId, 'clinic_owner'], ...clinic.dentistUserIds.map(id => [id, 'associate']), ...clinic.staffUserIds.map(id => [id, 'staff'])] as Array<[string | undefined, ClinicAssignment['assignmentRole']]>;
    return entries.filter(([id]) => Boolean(id)).map(([id, role]) => ({ id: `${clinicId}:${id}:${role}`, subscriberId: clinic.subscriberId, clinicId, userId: id!, assignmentRole: role, assignmentStatus: 'active', assignedAt: clinic.createdAt, assignedBy: 'system' }));
  },
  getClinicDentists: (id: string) => snapshot.users.filter(user => snapshot.clinics.find(clinic => clinic.id === id)?.dentistUserIds.includes(user.id)),
  getClinicStaff: (id: string) => snapshot.users.filter(user => snapshot.clinics.find(clinic => clinic.id === id)?.staffUserIds.includes(user.id)),
  getClinicHistory: (_id: string): ClinicHistoryRecord[] => [],
  validateClinicLimit: (subscriberId: string, currentClinicId?: string, _allowPendingOverride?: boolean) => {
    const subscriber = snapshot.subscribers.find(item => item.id === subscriberId); const plan = snapshot.plans.find(item => [item.id, item.name, item.planCode].includes(subscriber?.planId ?? ''));
    const limit = plan?.limits.find(item => item.key === 'clinics'); const usage = snapshot.clinics.filter(item => item.subscriberId === subscriberId && item.id !== currentClinicId && item.status !== 'archived').length;
    if (!limit) return { valid: false, message: 'Plan clinic limit is unavailable.', limitLabel: 'Unknown', limitValue: 'pending' as const, usage, remaining: 'pending' as const };
    if (limit.type === 'unlimited') return { valid: true, limitLabel: limit.label, limitValue: 'unlimited' as const, usage, remaining: 'unlimited' as const };
    const remaining = Math.max(0, Number(limit.value ?? 0) - usage); return { valid: remaining > 0, message: remaining ? undefined : 'This subscriber has reached the plan clinic limit.', limitLabel: limit.label, limitValue: Number(limit.value ?? 0), usage, remaining };
  },
  filterClinics: (items: Clinic[], filters: ClinicFilters) => {
    let next = items; const term = filters.search.trim().toLowerCase();
    if (term) next = next.filter(item => [item.clinicNumber, item.name, item.city, item.province, snapshot.subscribers.find(sub => sub.id === item.subscriberId)?.businessName].some(value => String(value ?? '').toLowerCase().includes(term)));
    if (filters.tab !== 'all') next = next.filter(item => item.status === filters.tab); if (filters.subscriberId !== 'all') next = next.filter(item => item.subscriberId === filters.subscriberId);
    if (filters.status !== 'all') next = next.filter(item => item.status === filters.status); if (filters.primary !== 'all') next = next.filter(item => String(item.isPrimaryClinic) === filters.primary);
    if (filters.province) next = next.filter(item => item.province.toLowerCase().includes(filters.province.toLowerCase())); if (filters.city) next = next.filter(item => item.city.toLowerCase().includes(filters.city.toLowerCase()));
    if (filters.dentistAssignment === 'with') next = next.filter(item => item.dentistUserIds.length > 0); if (filters.dentistAssignment === 'without') next = next.filter(item => item.dentistUserIds.length === 0);
    if (filters.staffAssignment === 'with') next = next.filter(item => item.staffUserIds.length > 0); if (filters.staffAssignment === 'without') next = next.filter(item => item.staffUserIds.length === 0); if (filters.createdDate) next = next.filter(item => item.createdAt === filters.createdDate); return next;
  },
  sortClinics: (items: Clinic[], sort: ClinicSort) => [...items].sort((a, b) => compare(a[sort.field], b[sort.field]) * (sort.direction === 'asc' ? 1 : -1)),
  paginateClinics: (items: Clinic[], page: number, size: number) => items.slice((page - 1) * size, page * size),
  getClinicSummary: () => ({ total: snapshot.clinics.length, active: snapshot.clinics.filter(item => item.status === 'active').length, draft: snapshot.clinics.filter(item => item.status === 'draft').length, inactive: snapshot.clinics.filter(item => item.status === 'inactive').length, archived: snapshot.clinics.filter(item => item.status === 'archived').length, primary: snapshot.clinics.filter(item => item.isPrimaryClinic).length, withoutDentists: snapshot.clinics.filter(item => !item.dentistUserIds.length && item.status !== 'archived').length, withoutStaff: snapshot.clinics.filter(item => !item.staffUserIds.length && item.status !== 'archived').length }),
  activateClinic: unsupportedWrite, deactivateClinic: unsupportedWrite, archiveClinic: unsupportedWrite, restoreClinic: unsupportedWrite, setPrimaryClinic: unsupportedWrite,
  permanentlyDeleteClinic: unsupportedWrite, assignUserToClinic: unsupportedWrite, changePrimaryAdministrator: unsupportedWrite, removeUserFromClinic: unsupportedWrite,
};

export const platformAdminPaymentService = {
  listPayments: () => snapshot.payments, getPaymentById: (id: string) => snapshot.payments.find(item => item.id === id || item.paymentNumber === id) ?? null,
  getPaymentsBySubscriptionId: (id: string) => snapshot.payments.filter(item => item.subscriptionId === id), getPaymentsBySubscriberId: (id: string) => snapshot.payments.filter(item => item.subscriberId === id),
  calculateSubscriberPaymentSummary: (id: string) => { const items = snapshot.payments.filter(item => item.subscriberId === id); return { totalPaid: items.filter(item => item.status === 'approved').reduce((sum, item) => sum + item.amount, 0), totalPending: items.filter(item => item.status === 'pending_verification').reduce((sum, item) => sum + item.amount, 0), totalRefunded: items.reduce((sum, item) => sum + item.refundedAmount, 0), lastPaymentAt: items[0]?.paymentDate, paymentCount: items.length }; },
  getPaymentAllocations: (_id: string): PaymentAllocation[] => [], getPaymentHistory: (_id: string): PaymentHistoryRecord[] => [],
  filterPayments: (items: Payment[], filters: PaymentFilters) => { let next = items; const term = filters.search.trim().toLowerCase(); if (term) next = next.filter(item => [item.paymentNumber, item.referenceNumber, item.payerName, item.payerEmail, item.status, item.paymentMethod].some(value => String(value ?? '').toLowerCase().includes(term))); if (filters.tab !== 'all') next = next.filter(item => filters.tab === 'pending_verification' ? item.status === 'pending_verification' : item.status === filters.tab); if (filters.subscriberId !== 'all') next = next.filter(item => item.subscriberId === filters.subscriberId); if (filters.registrationId !== 'all') next = next.filter(item => item.registrationId === filters.registrationId); if (filters.subscriptionId !== 'all') next = next.filter(item => item.subscriptionId === filters.subscriptionId); if (filters.planId !== 'all') next = next.filter(item => item.planId === filters.planId); if (filters.paymentMethod !== 'all') next = next.filter(item => item.paymentMethod === filters.paymentMethod); if (filters.status !== 'all') next = next.filter(item => item.status === filters.status); if (filters.verificationStatus !== 'all') next = next.filter(item => item.verificationStatus === filters.verificationStatus); if (filters.allocationStatus !== 'all') next = next.filter(item => item.allocationStatus === filters.allocationStatus); if (filters.paymentDate) next = next.filter(item => item.paymentDate === filters.paymentDate); if (filters.submittedDate) next = next.filter(item => item.submittedAt === filters.submittedDate); if (filters.minAmount) next = next.filter(item => item.amount >= Number(filters.minAmount)); if (filters.maxAmount) next = next.filter(item => item.amount <= Number(filters.maxAmount)); return next; },
  sortPayments: (items: Payment[], sort: PaymentSort) => [...items].sort((a, b) => compare(a[sort.field], b[sort.field]) * (sort.direction === 'asc' ? 1 : -1)), paginatePayments: (items: Payment[], page: number, size: number) => items.slice((page - 1) * size, page * size),
  getPaymentSummary: () => ({ total: snapshot.payments.length, pendingVerification: snapshot.payments.filter(item => item.status === 'pending_verification').length, approved: snapshot.payments.filter(item => item.status === 'approved').length, partiallyAllocated: 0, fullyAllocated: snapshot.payments.filter(item => item.allocationStatus === 'fully_allocated').length, rejected: snapshot.payments.filter(item => item.status === 'rejected').length, refunded: snapshot.payments.filter(item => item.status === 'refunded').length, voided: snapshot.payments.filter(item => item.status === 'voided').length, collectedAmount: snapshot.payments.filter(item => item.status === 'approved').reduce((sum, item) => sum + item.amount, 0), refundedAmount: snapshot.payments.reduce((sum, item) => sum + item.refundedAmount, 0) }),
  approvePayment: unsupportedWrite, rejectPayment: unsupportedWrite, requestPaymentInformation: unsupportedWrite, allocatePayment: unsupportedWrite, reverseAllocation: unsupportedWrite, refundPayment: unsupportedWrite, voidPayment: unsupportedWrite, restoreVoidedPayment: unsupportedWrite, permanentlyDeletePayment: unsupportedWrite,
};

export const platformAdminSubscriptionService = {
  listSubscriptions: () => snapshot.subscriptions, getSubscriptionById: (id: string) => snapshot.subscriptions.find(item => item.id === id || item.subscriptionNumber === id) ?? null,
  getCurrentSubscriptionBySubscriberId: (id: string) => snapshot.subscriptions.find(item => item.subscriberId === id && ['pending', 'active', 'expiring_soon', 'suspended'].includes(item.status)) ?? snapshot.subscriptions.find(item => item.subscriberId === id) ?? null,
  getSubscriptionHistory: (_id: string): SubscriptionHistoryRecord[] => [], getDaysRemaining: (item: Subscription) => item.expirationDate ? Math.ceil((new Date(item.expirationDate).getTime() - Date.now()) / 86400000) : 0,
  filterSubscriptions: (items: Subscription[], filters: SubscriptionFilters) => { let next = items; const term = filters.search.trim().toLowerCase(); if (term) next = next.filter(item => [item.id, item.subscriptionNumber, item.planId, item.priceSnapshot.planName, item.status, snapshot.subscribers.find(sub => sub.id === item.subscriberId)?.businessName].some(value => String(value ?? '').toLowerCase().includes(term))); if (filters.tab !== 'all') next = next.filter(item => item.status === filters.tab); if (filters.subscriberId !== 'all') next = next.filter(item => item.subscriberId === filters.subscriberId); if (filters.planId !== 'all') next = next.filter(item => [item.planId, item.priceSnapshot.planId, item.priceSnapshot.planName].includes(filters.planId)); if (filters.status !== 'all') next = next.filter(item => item.status === filters.status); if (filters.billingCycle !== 'all') next = next.filter(item => item.billingCycle === filters.billingCycle); if (filters.paymentStatus !== 'all') next = next.filter(item => item.paymentStatus === filters.paymentStatus); if (filters.startDate) next = next.filter(item => item.startDate === filters.startDate); if (filters.expirationDate) next = next.filter(item => item.expirationDate === filters.expirationDate); if (filters.autoRenew !== 'all') next = next.filter(item => String(item.autoRenew) === filters.autoRenew); return next; },
  sortSubscriptions: (items: Subscription[], sort: SubscriptionSort) => [...items].sort((a, b) => compare(a[sort.field], b[sort.field]) * (sort.direction === 'asc' ? 1 : -1)), paginateSubscriptions: (items: Subscription[], page: number, size: number) => items.slice((page - 1) * size, page * size),
  getSubscriptionSummary: () => ({ total: snapshot.subscriptions.length, active: snapshot.subscriptions.filter(item => item.status === 'active').length, pending: snapshot.subscriptions.filter(item => item.status === 'pending').length, expiringSoon: snapshot.subscriptions.filter(item => item.status === 'expiring_soon').length, expired: snapshot.subscriptions.filter(item => item.status === 'expired').length, suspended: snapshot.subscriptions.filter(item => item.status === 'suspended').length, cancelled: snapshot.subscriptions.filter(item => item.status === 'cancelled').length, draft: snapshot.subscriptions.filter(item => item.status === 'draft').length }),
  renewSubscription: unsupportedWrite, changeSubscriptionPlan: unsupportedWrite, extendExpiration: unsupportedWrite, suspendSubscription: unsupportedWrite, reactivateSubscription: unsupportedWrite, restoreSubscription: unsupportedWrite, cancelSubscription: unsupportedWrite, permanentlyDeleteSubscription: unsupportedWrite,
};

export const platformAdminPlanService = {
  listPlans: () => snapshot.plans, getPlanById: (id: string) => snapshot.plans.find(item => item.id === id) ?? null, getPlanByCode: (code: string) => snapshot.plans.find(item => item.planCode.toLowerCase() === code.toLowerCase() || item.name.toLowerCase() === code.toLowerCase()) ?? null, getSelectableSubscriberPlans: () => snapshot.plans.filter(item => item.status === 'active'),
  getPlanSubscribers: (plan: Plan) => snapshot.subscribers.filter(item => [plan.id, plan.name, plan.planCode].includes(item.planId)), getPlanHistory: (_id: string): PlanHistoryRecord[] => [],
  filterPlans: (items: Plan[], filters: PlanFilters) => { let next = items; const term = filters.search.trim().toLowerCase(); if (term) next = next.filter(item => [item.name, item.planCode, item.slug, item.status, item.visibility].some(value => value.toLowerCase().includes(term))); if (filters.tab !== 'all') next = next.filter(item => item.status === filters.tab); if (filters.status !== 'all') next = next.filter(item => item.status === filters.status); if (filters.visibility !== 'all') next = next.filter(item => item.visibility === filters.visibility); return next; },
  sortPlans: (items: Plan[], sort: PlanSort) => [...items].sort((a, b) => compare(a[sort.field], b[sort.field]) * (sort.direction === 'asc' ? 1 : -1)),
  getPlanSummary: () => ({ total: snapshot.plans.length, active: snapshot.plans.filter(item => item.status === 'active').length, draft: snapshot.plans.filter(item => item.status === 'draft').length, inactive: snapshot.plans.filter(item => item.status === 'inactive').length, archived: snapshot.plans.filter(item => item.status === 'archived').length, subscriberUsage: snapshot.plans.reduce((sum, item) => sum + item.subscriberCount, 0) }),
  duplicatePlan: unsupportedWrite, activatePlan: unsupportedWrite, deactivatePlan: unsupportedWrite, archivePlan: unsupportedWrite, restorePlan: unsupportedWrite, permanentlyDeleteUnusedPlan: unsupportedWrite,
};

// Laboratory directory data is outside the approved 2E.2 read contract. These
// empty/blocked methods keep existing UI tabs truthful without consulting mock storage.
export const platformAdminLaboratoryService = {
  getLaboratoriesBySubscriberId: (_id: string): any[] => [],
  getClinicLaboratories: (_id: string): any[] => [],
  getLaboratoryById: (_id: string): any => null,
  getLaboratoryServices: (_id: string): any[] => [],
  connectLaboratoryToClinic: unsupportedWrite,
  disconnectLaboratoryFromClinic: unsupportedWrite,
  setPreferredLaboratory: unsupportedWrite,
};
