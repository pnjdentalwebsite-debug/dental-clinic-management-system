import { requireSupabaseClient } from './client';

type AuthClient = ReturnType<typeof requireSupabaseClient>;

export interface PlatformReviewPayment {
  id: string;
  method: string;
  referenceNumber: string | null;
  amountCentavos: number;
  status: string;
  submittedAt: string;
  reviewedAt: string | null;
  note?: string | null;
}

export interface PlatformReviewRegistration {
  registrationId: string;
  registrationNumber: string;
  ownerName: string;
  ownerEmail: string;
  ownerMobile: string | null;
  clinicName: string;
  clinicEmail: string;
  clinicMobile: string | null;
  registrationStatus: string;
  paymentStatus: string;
  emailVerifiedAt: string | null;
  billingCycle: 'monthly' | 'annual';
  submittedAt: string;
  createdAt: string;
  plan: { code: string; name: string; applicableAmountCentavos: number } | null;
  payment: PlatformReviewPayment | null;
}

export interface PlatformReviewDetail extends PlatformReviewRegistration {
  owner: { name: string; email: string; mobile: string | null; address: string | null; city: string | null; province: string | null; postalCode: string | null };
  clinic: { name: string; email: string; mobile: string | null; address: string | null; city: string | null; province: string | null; postalCode: string | null; dentistCount: number | null; staffCount: number | null; locationCount: number | null; worksWithLaboratory: boolean; laboratoryName: string | null };
}

export class PlatformAdminClientError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export type PlatformAdminReadResource = 'summary' | 'subscribers' | 'users' | 'clinics' | 'payments' | 'subscriptions' | 'plans';

export interface PlatformAdminReadPage<T = Record<string, unknown>> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export type PlatformAdminReadQuery = {
  id?: string;
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  role?: string;
  excludeRole?: string;
  subscriberId?: string;
  clinicId?: string;
  planId?: string;
  plan?: string;
  paymentStatus?: string;
  subscriptionStatus?: string;
  paymentMethod?: string;
  billingCycle?: string;
};

export interface PlatformReviewPage {
  items: PlatformReviewRegistration[];
  page: number;
  pageSize: number;
  total: number;
}

export interface PlatformAdminDirectorySnapshot {
  summary: {
    pendingRegistrationReviews: number;
    pendingPaymentReviews: number;
    activeSubscribers: number;
    activeClinics: number;
    activeSubscriptions: number;
    platformUsers: number;
    activeSubscriptionMrrCentavos: number;
    subscriptionStatuses: { active: number; pending: number; expiringSoon: number; expired: number; suspended: number; cancelled: number };
    activePlanDistribution: Record<string, number>;
  };
  subscribers: PlatformAdminReadPage;
  users: PlatformAdminReadPage;
  clinics: PlatformAdminReadPage;
  payments: PlatformAdminReadPage;
  subscriptions: PlatformAdminReadPage;
  plans: PlatformAdminReadPage;
}

async function errorCode(error: unknown): Promise<string | null> {
  const response = (error as { context?: Response } | null)?.context;
  if (!response) return null;
  const payload = await response.clone().json().catch(() => null) as { error?: { code?: unknown; message?: unknown } } | null;
  return typeof payload?.error?.code === 'string' ? payload.error.code : null;
}

function safeErrorMessage(code: string | null): string {
  const messages: Record<string, string> = {
    UNAUTHORIZED: 'Please sign in again.',
    FORBIDDEN: 'Platform Administrator access is required.',
    NOT_FOUND: 'The requested record was not found.',
    STATE_CONFLICT: 'This record was already reviewed or is no longer eligible for that action.',
    PROVISIONING_IN_PROGRESS: 'Provisioning is already in progress for this registration.',
    PROVISIONING_STATE_CONFLICT: 'This registration is not currently eligible for provisioning.',
    IDENTITY_ALREADY_ASSIGNED: 'The Clinic Owner identity is already assigned.',
    EXISTING_UNASSIGNED_IDENTITY: 'The Clinic Owner identity requires platform support before provisioning.',
    CREDENTIAL_RESEND_NOT_ALLOWED: 'Initial credential resend is unavailable for this record.',
    PROVISIONING_NOT_COMPLETED: 'Provisioning must complete before credentials can be resent.',
  };
  return messages[code ?? ''] ?? 'The Platform Administrator request could not be completed.';
}

async function invoke<T>(name: string, body: Record<string, unknown>, client: AuthClient): Promise<T> {
  const { data, error } = await client.functions.invoke<T>(name, { body });
  if (error) {
    const code = await errorCode(error);
    throw new PlatformAdminClientError(code ?? 'PLATFORM_ADMIN_REQUEST_FAILED', safeErrorMessage(code));
  }
  if (data === null) throw new PlatformAdminClientError('PLATFORM_ADMIN_REQUEST_FAILED', 'The Platform Administrator request returned no data.');
  return data;
}

async function readAllReviewPages(
  filters: { registrationStatus?: string; paymentStatus?: string; search?: string },
  client: AuthClient,
): Promise<PlatformReviewPage> {
  const pageSize = 100;
  const items: PlatformReviewRegistration[] = [];
  let page = 1;
  let total = 0;
  do {
    const result = await invoke<PlatformReviewPage>('platform-registration-review-list', { ...filters, page, pageSize }, client);
    if (result.items.length === 0) {
      total = result.total;
      break;
    }
    items.push(...result.items);
    total = result.total;
    page += 1;
  } while (items.length < total);
  return { items, page: 1, pageSize, total };
}

export const platformAdminApi = {
  getSummary: (client: AuthClient = requireSupabaseClient()) =>
    invoke<{ summary: PlatformAdminDirectorySnapshot['summary'] }>('platform-admin-read', { resource: 'summary' }, client),
  readDirectory: <T = Record<string, unknown>>(
    resource: PlatformAdminReadResource,
    query: PlatformAdminReadQuery = {},
    client: AuthClient = requireSupabaseClient(),
  ) => invoke<PlatformAdminReadPage<T> | { item: T } | { summary: PlatformAdminDirectorySnapshot['summary'] }>('platform-admin-read', { resource, ...query }, client),
  listReview: (filters: { page?: number; pageSize?: number; registrationStatus?: string; paymentStatus?: string; search?: string } = {}, client: AuthClient = requireSupabaseClient()) =>
    invoke<PlatformReviewPage>('platform-registration-review-list', filters, client),
  listAllReview: (filters: { registrationStatus?: string; paymentStatus?: string; search?: string } = {}, client: AuthClient = requireSupabaseClient()) =>
    readAllReviewPages(filters, client),
  getReviewDetail: (registrationId: string, client: AuthClient = requireSupabaseClient()) =>
    invoke<{ registration: PlatformReviewDetail }>('platform-registration-review-detail', { registrationId }, client),
  reviewPayment: (registrationId: string, paymentId: string, decision: 'approve' | 'reject', reason?: string, client: AuthClient = requireSupabaseClient()) =>
    invoke<{ payment: { id: string; status: string; reviewedAt: string }; registration: { id: string; status: string } }>('platform-review-payment', { registrationId, paymentId, decision, ...(reason ? { reason } : {}) }, client),
  rejectRegistration: (registrationId: string, reason: string, client: AuthClient = requireSupabaseClient()) =>
    invoke<{ registration: { id: string; status: string; paymentStatus: string; reviewedAt: string } }>('platform-reject-registration', { registrationId, reason }, client),
  approveRegistration: (registrationId: string, client: AuthClient = requireSupabaseClient()) =>
    invoke<{ registrationId: string; provisioningStatus: string; credentialDelivery?: { status: string; code?: string }; scope?: { subscriberId: string; clinicId: string; subscriptionId: string } }>('platform-approve-registration', { registrationId }, client),
  resendInitialCredential: (registrationId: string, client: AuthClient = requireSupabaseClient()) =>
    invoke<{ registrationId: string; provisioningStatus: string; credentialDelivery: { status: string; code?: string } }>('platform-resend-initial-credential', { registrationId }, client),
};
