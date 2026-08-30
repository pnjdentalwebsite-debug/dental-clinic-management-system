import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { errorResponse, preflight, requestJson, response, text, uuid } from '../_shared/http.ts';
import { platformAdminErrorResponse, PlatformAdminApiError, requirePlatformAdmin } from '../_shared/platform-admin.ts';

const resources = new Set(['summary', 'subscribers', 'users', 'clinics', 'payments', 'subscriptions', 'plans']);
const statuses = new Set(['pending', 'active', 'suspended', 'deactivated', 'draft', 'inactive', 'archived', 'expiring_soon', 'expired', 'cancelled', 'unpaid', 'pending_verification', 'approved', 'rejected', 'refunded', 'voided']);
const roles = new Set(['clinic_owner', 'associate', 'staff']);
const workDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

type QueryOptions = {
  page: number;
  pageSize: number;
  search: string | null;
  status: string | null;
  role: string | null;
  id: string | null;
};

const escapedLike = (value: string) => value.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_');
const first = (value: unknown): Record<string, any> | null => Array.isArray(value) ? (value[0] ?? null) : (value as Record<string, any> | null);
const list = (value: unknown): Array<Record<string, any>> => Array.isArray(value) ? value : [];
const safeWorkSchedule = (value: unknown): Record<string, { enabled: boolean; startTime: string; endTime: string }> => {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {};
  return Object.fromEntries(workDays.flatMap(day => {
    const entry = source[day];
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return [];
    return [[day, {
      enabled: entry.enabled === true,
      startTime: typeof entry.startTime === 'string' ? entry.startTime : '',
      endTime: typeof entry.endTime === 'string' ? entry.endTime : '',
    }]];
  }));
};

function parseOptions(payload: Record<string, unknown>): { resource: string; options: QueryOptions } {
  const resource = text(payload.resource, 'Resource', 30);
  if (!resources.has(resource)) throw new PlatformAdminApiError('INVALID_RESOURCE', 422, 'Resource is invalid.');
  const page = payload.page === undefined ? 1 : Number(payload.page);
  const pageSize = payload.pageSize === undefined ? 25 : Number(payload.pageSize);
  if (!Number.isInteger(page) || page < 1 || page > 10000) throw new PlatformAdminApiError('INVALID_PAGE', 422, 'Page must be a positive integer.');
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) throw new PlatformAdminApiError('INVALID_PAGE_SIZE', 422, 'Page size must be between 1 and 100.');
  const search = payload.search === undefined ? null : text(payload.search, 'Search', 80);
  const status = payload.status === undefined ? null : text(payload.status, 'Status', 40);
  const role = payload.role === undefined ? null : text(payload.role, 'Role', 30);
  const id = payload.id === undefined ? null : uuid(payload.id, 'Record ID');
  if (status && !statuses.has(status)) throw new PlatformAdminApiError('INVALID_STATUS', 422, 'Status filter is invalid.');
  if (role && !roles.has(role)) throw new PlatformAdminApiError('INVALID_ROLE', 422, 'Role filter is invalid.');
  return { resource, options: { page, pageSize, search, status, role, id } };
}

async function countActivePlatformUsers(admin: any): Promise<number> {
  const userIds = new Set<string>();
  const pageSize = 1000;
  let from = 0;
  while (true) {
    const { data, error } = await admin
      .from('subscriber_memberships')
      .select('user_id')
      .eq('account_status', 'active')
      .range(from, from + pageSize - 1);
    if (error) throw new PlatformAdminApiError('DIRECTORY_QUERY_FAILED', 503, 'Platform summary is temporarily unavailable.');
    const rows = data ?? [];
    for (const row of rows) if (row.user_id) userIds.add(String(row.user_id));
    if (rows.length < pageSize) break;
    from += pageSize;
  }
  return userIds.size;
}

async function summary(admin: any) {
  const count = (table: string, apply?: (query: any) => any) => {
    let query = admin.from(table).select('id', { count: 'exact', head: true });
    if (apply) query = apply(query);
    return query;
  };
  const results = await Promise.all([
    count('registrations', q => q.eq('registration_status', 'pending_review')),
    count('payments', q => q.eq('status', 'pending_verification')),
    count('subscribers', q => q.eq('account_status', 'active')),
    count('clinics', q => q.eq('status', 'active')),
    count('subscriptions', q => q.eq('status', 'active')),
    countActivePlatformUsers(admin),
  ]);
  if (results.slice(0, 5).some(result => result.error)) throw new PlatformAdminApiError('DIRECTORY_QUERY_FAILED', 503, 'Platform summary is temporarily unavailable.');
  return {
    pendingRegistrationReviews: results[0].count ?? 0,
    pendingPaymentReviews: results[1].count ?? 0,
    activeSubscribers: results[2].count ?? 0,
    activeClinics: results[3].count ?? 0,
    activeSubscriptions: results[4].count ?? 0,
    platformUsers: results[5],
  };
}

async function subscribers(admin: any, options: QueryOptions) {
  let query = admin.from('subscribers').select(`
    id, subscriber_number, registration_id, business_name, email, mobile_number, account_status,
    created_at, updated_at, activated_at, deactivated_at,
    registrations(id, plan_id, submitted_at, payment_status),
    clinics(id, clinic_number, name, status, is_primary), laboratories(id),
    subscriptions(id, plan_id, status, billing_cycle, amount_centavos, starts_at, expires_at, plans(id, plan_code, name)),
    subscriber_memberships(id, user_id, role, account_status, must_change_password, created_at, updated_at, profiles(id, email, display_name, first_name, middle_name, last_name, mobile_number))
  `, { count: 'exact' }).order('created_at', { ascending: false });
  if (options.id) query = query.eq('id', options.id);
  if (options.status) query = query.eq('account_status', options.status);
  if (options.search) {
    const term = escapedLike(options.search);
    query = query.or(`subscriber_number.ilike.%${term}%,business_name.ilike.%${term}%,email.ilike.%${term}%`);
  }
  const from = (options.page - 1) * options.pageSize;
  const { data, count, error } = await query.range(from, from + options.pageSize - 1);
  if (error) throw new PlatformAdminApiError('DIRECTORY_QUERY_FAILED', 503, 'Subscribers are temporarily unavailable.');
  const items = (data ?? []).map((row: any) => {
    const registration = first(row.registrations);
    const memberships = list(row.subscriber_memberships);
    const ownerMembership = memberships.find(membership => membership.role === 'clinic_owner') ?? null;
    const ownerProfile = first(ownerMembership?.profiles);
    const clinics = list(row.clinics);
    const primaryClinic = clinics.find(clinic => clinic.is_primary) ?? clinics[0] ?? null;
    const subscriptions = list(row.subscriptions);
    const currentSubscription = subscriptions.find(subscription => ['pending', 'active', 'expiring_soon', 'suspended'].includes(subscription.status)) ?? subscriptions[0] ?? null;
    const plan = first(currentSubscription?.plans);
    return {
      id: row.id,
      subscriberNumber: row.subscriber_number,
      registrationId: row.registration_id,
      paymentStatus: registration?.payment_status ?? 'unpaid',
      businessName: row.business_name,
      email: row.email,
      mobileNumber: row.mobile_number,
      accountStatus: row.account_status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      activatedAt: row.activated_at,
      deactivatedAt: row.deactivated_at,
      owner: ownerMembership ? {
        membershipId: ownerMembership.id,
        userId: ownerMembership.user_id,
        email: ownerProfile?.email ?? row.email,
        displayName: ownerProfile?.display_name ?? [ownerProfile?.first_name, ownerProfile?.middle_name, ownerProfile?.last_name].filter(Boolean).join(' ') || row.business_name,
        mobileNumber: ownerProfile?.mobile_number ?? row.mobile_number,
        accountStatus: ownerMembership.account_status,
        mustChangePassword: Boolean(ownerMembership.must_change_password),
      } : null,
      primaryClinic: primaryClinic ? { id: primaryClinic.id, clinicNumber: primaryClinic.clinic_number, name: primaryClinic.name, status: primaryClinic.status } : null,
      subscription: currentSubscription ? {
        id: currentSubscription.id,
        planId: currentSubscription.plan_id,
        planCode: plan?.plan_code ?? null,
        planName: plan?.name ?? null,
        status: currentSubscription.status,
        billingCycle: currentSubscription.billing_cycle,
        amountCentavos: currentSubscription.amount_centavos,
        startsAt: currentSubscription.starts_at,
        expiresAt: currentSubscription.expires_at,
      } : null,
      counts: {
        clinics: clinics.length,
        laboratories: list(row.laboratories).length,
        associates: memberships.filter(membership => membership.role === 'associate').length,
        staff: memberships.filter(membership => membership.role === 'staff').length,
      },
    };
  });
  return { items, page: options.page, pageSize: options.pageSize, total: count ?? 0 };
}

async function users(admin: any, options: QueryOptions) {
  let query = admin.from('subscriber_memberships').select(`
    id, subscriber_id, user_id, role, account_status, must_change_password, activated_at, created_at, updated_at,
    subscribers(id, subscriber_number, business_name),
    profiles(id, email, display_name, first_name, middle_name, last_name, mobile_number, created_at, updated_at),
    staff_profiles(staff_number, position, phone_number, work_schedule),
    associate_dentist_profiles(associate_number, designation, specialization, work_schedule),
    clinic_assignments(clinic_id, assignment_role, status)
  `, { count: 'exact' }).order('created_at', { ascending: false });
  if (options.id) query = query.eq('id', options.id);
  if (options.status) query = query.eq('account_status', options.status);
  if (options.role) query = query.eq('role', options.role);
  const from = (options.page - 1) * options.pageSize;
  const { data, count, error } = await query.range(from, from + options.pageSize - 1);
  if (error) throw new PlatformAdminApiError('DIRECTORY_QUERY_FAILED', 503, 'Users are temporarily unavailable.');
  let items = (data ?? []).map((row: any) => {
    const profile = first(row.profiles);
    const staff = first(row.staff_profiles);
    const associate = first(row.associate_dentist_profiles);
    const subscriber = first(row.subscribers);
    const displayName = profile?.display_name ?? [profile?.first_name, profile?.middle_name, profile?.last_name].filter(Boolean).join(' ');
    return {
      id: row.id,
      userId: row.user_id,
      subscriberId: row.subscriber_id,
      subscriberNumber: subscriber?.subscriber_number ?? null,
      subscriberName: subscriber?.business_name ?? null,
      userNumber: staff?.staff_number ?? associate?.associate_number ?? `USR-${String(row.user_id).slice(0, 8).toUpperCase()}`,
      fullName: displayName || profile?.email || 'Unnamed user',
      firstName: profile?.first_name ?? '',
      middleName: profile?.middle_name ?? null,
      lastName: profile?.last_name ?? '',
      email: profile?.email ?? '',
      mobileNumber: profile?.mobile_number ?? staff?.phone_number ?? '',
      role: row.role,
      position: staff?.position ?? associate?.designation ?? (row.role === 'clinic_owner' ? 'Clinic Owner' : row.role),
      workSchedule: safeWorkSchedule(staff?.work_schedule ?? associate?.work_schedule),
      accountStatus: row.account_status,
      mustChangePassword: Boolean(row.must_change_password),
      clinicIds: list(row.clinic_assignments).filter(assignment => assignment.status === 'active').map(assignment => assignment.clinic_id),
      activatedAt: row.activated_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  });
  if (options.search) {
    const term = options.search.toLowerCase();
    items = items.filter((item: any) => [item.userNumber, item.fullName, item.email, item.mobileNumber, item.subscriberName].some(value => String(value ?? '').toLowerCase().includes(term)));
  }
  return { items, page: options.page, pageSize: options.pageSize, total: options.search ? items.length : count ?? 0 };
}

async function clinics(admin: any, options: QueryOptions) {
  let query = admin.from('clinics').select(`
    id, subscriber_id, clinic_number, branch_type, name, legal_business_name, email, contact_number,
    alternative_contact_number, address_line_1, address_line_2, barangay, city, province, postal_code,
    country, timezone, description, status, visibility, is_primary, created_at, updated_at, activated_at,
    deactivated_at, archived_at, subscribers(id, subscriber_number, business_name),
    clinic_assignments(membership_id, assignment_role, status),
    clinic_business_hours(day_of_week, is_open, opening_time, closing_time, break_start, break_end)
  `, { count: 'exact' }).order('created_at', { ascending: false });
  if (options.id) query = query.eq('id', options.id);
  if (options.status) query = query.eq('status', options.status);
  if (options.search) {
    const term = escapedLike(options.search);
    query = query.or(`clinic_number.ilike.%${term}%,name.ilike.%${term}%,city.ilike.%${term}%,province.ilike.%${term}%`);
  }
  const from = (options.page - 1) * options.pageSize;
  const { data, count, error } = await query.range(from, from + options.pageSize - 1);
  if (error) throw new PlatformAdminApiError('DIRECTORY_QUERY_FAILED', 503, 'Clinics are temporarily unavailable.');
  const items = (data ?? []).map((row: any) => {
    const subscriber = first(row.subscribers);
    const assignments = list(row.clinic_assignments).filter(assignment => assignment.status === 'active');
    return {
      id: row.id,
      subscriberId: row.subscriber_id,
      subscriberNumber: subscriber?.subscriber_number ?? null,
      subscriberName: subscriber?.business_name ?? null,
      clinicNumber: row.clinic_number,
      branchType: row.branch_type,
      name: row.name,
      legalBusinessName: row.legal_business_name,
      email: row.email,
      contactNumber: row.contact_number,
      alternativeContactNumber: row.alternative_contact_number,
      addressLine1: row.address_line_1,
      addressLine2: row.address_line_2,
      barangay: row.barangay,
      city: row.city,
      province: row.province,
      postalCode: row.postal_code,
      country: row.country,
      timezone: row.timezone,
      description: row.description,
      status: row.status,
      visibility: row.visibility,
      isPrimary: row.is_primary,
      ownerMembershipId: assignments.find(assignment => assignment.assignment_role === 'clinic_owner')?.membership_id ?? null,
      dentistMembershipIds: assignments.filter(assignment => assignment.assignment_role === 'associate').map(assignment => assignment.membership_id),
      staffMembershipIds: assignments.filter(assignment => assignment.assignment_role === 'staff').map(assignment => assignment.membership_id),
      businessHours: list(row.clinic_business_hours).map(hours => ({ dayOfWeek: hours.day_of_week, isOpen: hours.is_open, openingTime: hours.opening_time, closingTime: hours.closing_time, breakStart: hours.break_start, breakEnd: hours.break_end })),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      activatedAt: row.activated_at,
      deactivatedAt: row.deactivated_at,
      archivedAt: row.archived_at,
    };
  });
  return { items, page: options.page, pageSize: options.pageSize, total: count ?? 0 };
}

async function payments(admin: any, options: QueryOptions) {
  let query = admin.from('payments').select(`
    id, registration_id, subscriber_id, payment_method, reference_number, amount_centavos, status,
    submitted_at, reviewed_at, notes, created_at, updated_at,
    registrations(id, registration_number, owner_name, owner_email, plan_id),
    subscribers(id, subscriber_number, business_name, email)
  `, { count: 'exact' }).order('submitted_at', { ascending: false });
  if (options.id) query = query.eq('id', options.id);
  if (options.status) query = query.eq('status', options.status);
  if (options.search) {
    const term = escapedLike(options.search);
    query = query.or(`reference_number.ilike.%${term}%,payment_method.ilike.%${term}%`);
  }
  const from = (options.page - 1) * options.pageSize;
  const { data, count, error } = await query.range(from, from + options.pageSize - 1);
  if (error) throw new PlatformAdminApiError('DIRECTORY_QUERY_FAILED', 503, 'Payments are temporarily unavailable.');
  const paymentIds = (data ?? []).map((row: any) => row.id);
  const subscriptionResult = paymentIds.length
    ? await admin.from('subscriptions').select('id, plan_id, source_payment_id').in('source_payment_id', paymentIds)
    : { data: [], error: null };
  if (subscriptionResult.error) throw new PlatformAdminApiError('DIRECTORY_QUERY_FAILED', 503, 'Payment associations are temporarily unavailable.');
  const items = (data ?? []).map((row: any) => {
    const registration = first(row.registrations);
    const subscriber = first(row.subscribers);
    const subscription = list(subscriptionResult.data).find(item => item.source_payment_id === row.id) ?? null;
    return {
      id: row.id,
      registrationId: row.registration_id,
      registrationNumber: registration?.registration_number ?? null,
      subscriberId: row.subscriber_id,
      subscriberNumber: subscriber?.subscriber_number ?? null,
      subscriptionId: subscription?.id ?? null,
      planId: subscription?.plan_id ?? registration?.plan_id ?? null,
      payerName: registration?.owner_name ?? subscriber?.business_name ?? '',
      payerEmail: registration?.owner_email ?? subscriber?.email ?? '',
      paymentMethod: row.payment_method,
      referenceNumber: row.reference_number,
      amountCentavos: row.amount_centavos,
      status: row.status,
      submittedAt: row.submitted_at,
      reviewedAt: row.reviewed_at,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  });
  return { items, page: options.page, pageSize: options.pageSize, total: count ?? 0 };
}

async function subscriptions(admin: any, options: QueryOptions) {
  let query = admin.from('subscriptions').select(`
    id, subscriber_id, plan_id, status, billing_cycle, amount_centavos, source_payment_id,
    starts_at, expires_at, created_at, updated_at,
    subscribers(id, subscriber_number, registration_id, business_name, email),
    plans(id, plan_code, name, monthly_amount_centavos, annual_amount_centavos)
  `, { count: 'exact' }).order('created_at', { ascending: false });
  if (options.id) query = query.eq('id', options.id);
  if (options.status) query = query.eq('status', options.status);
  const from = (options.page - 1) * options.pageSize;
  const { data, count, error } = await query.range(from, from + options.pageSize - 1);
  if (error) throw new PlatformAdminApiError('DIRECTORY_QUERY_FAILED', 503, 'Subscriptions are temporarily unavailable.');
  const sourcePaymentIds = (data ?? []).map((row: any) => row.source_payment_id).filter(Boolean);
  const paymentResult = sourcePaymentIds.length
    ? await admin.from('payments').select('id, status').in('id', sourcePaymentIds)
    : { data: [], error: null };
  if (paymentResult.error) throw new PlatformAdminApiError('DIRECTORY_QUERY_FAILED', 503, 'Subscription payment state is temporarily unavailable.');
  let items = (data ?? []).map((row: any) => {
    const subscriber = first(row.subscribers);
    const plan = first(row.plans);
    return {
      id: row.id,
      subscriberId: row.subscriber_id,
      subscriberNumber: subscriber?.subscriber_number ?? null,
      subscriberName: subscriber?.business_name ?? null,
      registrationId: subscriber?.registration_id ?? null,
      planId: row.plan_id,
      planCode: plan?.plan_code ?? null,
      planName: plan?.name ?? null,
      billingCycle: row.billing_cycle,
      amountCentavos: row.amount_centavos,
      monthlyAmountCentavos: plan?.monthly_amount_centavos ?? null,
      annualAmountCentavos: plan?.annual_amount_centavos ?? null,
      sourcePaymentId: row.source_payment_id,
      sourcePaymentStatus: list(paymentResult.data).find(payment => payment.id === row.source_payment_id)?.status ?? null,
      status: row.status,
      startsAt: row.starts_at,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  });
  if (options.search) {
    const term = options.search.toLowerCase();
    items = items.filter((item: any) => [item.subscriberNumber, item.subscriberName, item.planCode, item.planName].some(value => String(value ?? '').toLowerCase().includes(term)));
  }
  return { items, page: options.page, pageSize: options.pageSize, total: options.search ? items.length : count ?? 0 };
}

async function plans(admin: any, options: QueryOptions) {
  let query = admin.from('plans').select('id, plan_code, name, status, monthly_amount_centavos, annual_amount_centavos, limits, features, created_at, updated_at', { count: 'exact' }).order('monthly_amount_centavos', { ascending: true });
  if (options.id) query = query.eq('id', options.id);
  if (options.status) query = query.eq('status', options.status);
  if (options.search) {
    const term = escapedLike(options.search);
    query = query.or(`plan_code.ilike.%${term}%,name.ilike.%${term}%`);
  }
  const from = (options.page - 1) * options.pageSize;
  const { data, count, error } = await query.range(from, from + options.pageSize - 1);
  if (error) throw new PlatformAdminApiError('DIRECTORY_QUERY_FAILED', 503, 'Plans are temporarily unavailable.');
  const usageResults = await Promise.all((data ?? []).map((row: any) =>
    admin.from('subscriptions').select('id', { count: 'exact', head: true }).eq('plan_id', row.id)
  ));
  if (usageResults.some(result => result.error)) throw new PlatformAdminApiError('DIRECTORY_QUERY_FAILED', 503, 'Plan usage is temporarily unavailable.');
  const items = (data ?? []).map((row: any, index: number) => ({
    id: row.id,
    planCode: row.plan_code,
    name: row.name,
    status: row.status,
    monthlyAmountCentavos: row.monthly_amount_centavos,
    annualAmountCentavos: row.annual_amount_centavos,
    limits: row.limits,
    features: row.features,
    subscriberCount: usageResults[index].count ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
  return { items, page: options.page, pageSize: options.pageSize, total: count ?? 0 };
}

const readers: Record<string, (admin: any, options: QueryOptions) => Promise<any>> = { subscribers, users, clinics, payments, subscriptions, plans };

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    const optionsResponse = preflight(req);
    if (optionsResponse) return optionsResponse;
    if (req.method !== 'POST') return errorResponse(req, 'Method not allowed.', 405);
    try {
      await requirePlatformAdmin(ctx);
      const { resource, options } = parseOptions(await requestJson(req));
      if (resource === 'summary') return response(req, { summary: await summary(ctx.supabaseAdmin) });
      const result = await readers[resource](ctx.supabaseAdmin, options);
      if (options.id && result.items.length === 0) throw new PlatformAdminApiError('NOT_FOUND', 404, 'The requested record was not found.');
      return response(req, options.id ? { item: result.items[0] } : result);
    } catch (error) {
      return platformAdminErrorResponse(req, error, 'Unable to load Platform Administrator data.');
    }
  }),
};
