import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { errorResponse, preflight, requestJson, response, text, uuid } from '../_shared/http.ts';
import { platformAdminErrorResponse, PlatformAdminApiError, requirePlatformAdmin } from '../_shared/platform-admin.ts';

const resources = new Set(['summary', 'subscribers', 'users', 'clinics', 'payments', 'subscriptions', 'plans']);
const statuses = new Set(['pending', 'active', 'suspended', 'deactivated', 'draft', 'inactive', 'archived', 'expiring_soon', 'expired', 'cancelled', 'unpaid', 'pending_verification', 'approved', 'rejected', 'refunded', 'voided']);
const roles = new Set(['clinic_owner', 'associate', 'staff']);
const paymentMethods = new Set(['gcash', 'maya', 'bank_transfer', 'over_the_counter', 'cash', 'card', 'demo_payment', 'other']);
const billingCycles = new Set(['monthly', 'annual']);
const workDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

type QueryOptions = {
  page: number;
  pageSize: number;
  search: string | null;
  status: string | null;
  role: string | null;
  excludeRole: string | null;
  id: string | null;
  subscriberId: string | null;
  clinicId: string | null;
  planId: string | null;
  plan: string | null;
  paymentStatus: string | null;
  subscriptionStatus: string | null;
  paymentMethod: string | null;
  billingCycle: string | null;
};

const noMatchId = '00000000-0000-0000-0000-000000000000';

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
  const excludeRole = payload.excludeRole === undefined ? null : text(payload.excludeRole, 'Excluded role', 30);
  const id = payload.id === undefined ? null : uuid(payload.id, 'Record ID');
  const subscriberId = payload.subscriberId === undefined ? null : uuid(payload.subscriberId, 'Subscriber ID');
  const clinicId = payload.clinicId === undefined ? null : uuid(payload.clinicId, 'Clinic ID');
  const planId = payload.planId === undefined ? null : uuid(payload.planId, 'Plan ID');
  const plan = payload.plan === undefined ? null : text(payload.plan, 'Plan', 80);
  const paymentStatus = payload.paymentStatus === undefined ? null : text(payload.paymentStatus, 'Payment status', 40);
  const subscriptionStatus = payload.subscriptionStatus === undefined ? null : text(payload.subscriptionStatus, 'Subscription status', 40);
  const paymentMethod = payload.paymentMethod === undefined ? null : text(payload.paymentMethod, 'Payment method', 40).toLowerCase();
  const billingCycle = payload.billingCycle === undefined ? null : text(payload.billingCycle, 'Billing cycle', 20);
  if (status && !statuses.has(status)) throw new PlatformAdminApiError('INVALID_STATUS', 422, 'Status filter is invalid.');
  if (role && !roles.has(role)) throw new PlatformAdminApiError('INVALID_ROLE', 422, 'Role filter is invalid.');
  if (excludeRole && !roles.has(excludeRole)) throw new PlatformAdminApiError('INVALID_ROLE', 422, 'Excluded role filter is invalid.');
  if (paymentStatus && !statuses.has(paymentStatus)) throw new PlatformAdminApiError('INVALID_PAYMENT_STATUS', 422, 'Payment status filter is invalid.');
  if (subscriptionStatus && !statuses.has(subscriptionStatus)) throw new PlatformAdminApiError('INVALID_SUBSCRIPTION_STATUS', 422, 'Subscription status filter is invalid.');
  if (paymentMethod && !paymentMethods.has(paymentMethod)) throw new PlatformAdminApiError('INVALID_PAYMENT_METHOD', 422, 'Payment method filter is invalid.');
  if (billingCycle && !billingCycles.has(billingCycle)) throw new PlatformAdminApiError('INVALID_BILLING_CYCLE', 422, 'Billing cycle filter is invalid.');
  return { resource, options: { page, pageSize, search, status, role, excludeRole, id, subscriberId, clinicId, planId, plan, paymentStatus, subscriptionStatus, paymentMethod, billingCycle } };
}

const uuidIn = (values: unknown[]) => [...new Set(values.filter(Boolean).map(String))];
const applyUuidMatches = (query: any, column: string, values: string[]) => values.length ? query.in(column, values) : query.eq(column, noMatchId);

async function resolveUserSearch(admin: any, search: string): Promise<{ membershipIds: string[]; userIds: string[]; subscriberIds: string[] }> {
  const term = escapedLike(search);
  const [profiles, staff, associates, subscribers] = await Promise.all([
    admin.from('profiles').select('id').or(`email.ilike.%${term}%,display_name.ilike.%${term}%,first_name.ilike.%${term}%,middle_name.ilike.%${term}%,last_name.ilike.%${term}%,mobile_number.ilike.%${term}%`),
    admin.from('staff_profiles').select('membership_id').or(`staff_number.ilike.%${term}%,position.ilike.%${term}%,phone_number.ilike.%${term}%`),
    admin.from('associate_dentist_profiles').select('membership_id').or(`associate_number.ilike.%${term}%,designation.ilike.%${term}%,specialization.ilike.%${term}%`),
    admin.from('subscribers').select('id').or(`subscriber_number.ilike.%${term}%,business_name.ilike.%${term}%,email.ilike.%${term}%`),
  ]);
  if ([profiles, staff, associates, subscribers].some(result => result.error)) throw new PlatformAdminApiError('DIRECTORY_QUERY_FAILED', 503, 'User search is temporarily unavailable.');
  return {
    membershipIds: uuidIn([...(staff.data ?? []).map((row: any) => row.membership_id), ...(associates.data ?? []).map((row: any) => row.membership_id)]),
    userIds: uuidIn((profiles.data ?? []).map((row: any) => row.id)),
    subscriberIds: uuidIn((subscribers.data ?? []).map((row: any) => row.id)),
  };
}

async function resolveSubscriptionSearch(admin: any, search: string): Promise<{ subscriberIds: string[]; planIds: string[] }> {
  const term = escapedLike(search);
  const [subscribers, plans] = await Promise.all([
    admin.from('subscribers').select('id').or(`subscriber_number.ilike.%${term}%,business_name.ilike.%${term}%,email.ilike.%${term}%`),
    admin.from('plans').select('id').or(`plan_code.ilike.%${term}%,name.ilike.%${term}%`),
  ]);
  if (subscribers.error || plans.error) throw new PlatformAdminApiError('DIRECTORY_QUERY_FAILED', 503, 'Subscription search is temporarily unavailable.');
  return { subscriberIds: uuidIn((subscribers.data ?? []).map((row: any) => row.id)), planIds: uuidIn((plans.data ?? []).map((row: any) => row.id)) };
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

async function activeSubscriptionMetrics(admin: any): Promise<{ mrrCentavos: number; planDistribution: Record<string, number> }> {
  const rows: any[] = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await admin.from('subscriptions').select('billing_cycle, amount_centavos, plans(plan_code)').eq('status', 'active').range(from, from + pageSize - 1);
    if (error) throw new PlatformAdminApiError('DIRECTORY_QUERY_FAILED', 503, 'Platform summary is temporarily unavailable.');
    rows.push(...(data ?? []));
    if ((data ?? []).length < pageSize) break;
  }
  return rows.reduce((metrics, row) => {
    const plan = first(row.plans)?.plan_code ?? 'other';
    metrics.planDistribution[plan] = (metrics.planDistribution[plan] ?? 0) + 1;
    metrics.mrrCentavos += row.billing_cycle === 'annual' ? Math.round(Number(row.amount_centavos ?? 0) / 12) : Number(row.amount_centavos ?? 0);
    return metrics;
  }, { mrrCentavos: 0, planDistribution: {} as Record<string, number> });
}

async function paymentMetrics(admin: any) {
  const metrics = { total: 0, pendingVerification: 0, approved: 0, rejected: 0, refunded: 0, voided: 0, approvedAmountCentavos: 0, refundedAmountCentavos: 0 };
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await admin.from('payments').select('status, amount_centavos').range(from, from + pageSize - 1);
    if (error) throw new PlatformAdminApiError('DIRECTORY_QUERY_FAILED', 503, 'Platform summary is temporarily unavailable.');
    for (const row of data ?? []) {
      metrics.total += 1;
      if (row.status === 'pending_verification') metrics.pendingVerification += 1;
      if (row.status === 'approved') { metrics.approved += 1; metrics.approvedAmountCentavos += Number(row.amount_centavos ?? 0); }
      if (row.status === 'rejected') metrics.rejected += 1;
      if (row.status === 'refunded') { metrics.refunded += 1; metrics.refundedAmountCentavos += Number(row.amount_centavos ?? 0); }
      if (row.status === 'voided') metrics.voided += 1;
    }
    if ((data ?? []).length < pageSize) break;
  }
  return metrics;
}

async function clinicMetrics(admin: any) {
  const metrics = { total: 0, active: 0, pending: 0, draft: 0, inactive: 0, archived: 0, primary: 0, withoutDentists: 0, withoutStaff: 0 };
  const activeIds: string[] = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await admin.from('clinics').select('id, status, is_primary').range(from, from + pageSize - 1);
    if (error) throw new PlatformAdminApiError('DIRECTORY_QUERY_FAILED', 503, 'Platform summary is temporarily unavailable.');
    for (const row of data ?? []) {
      metrics.total += 1;
      if (row.status in metrics) (metrics as any)[row.status] += 1;
      if (row.is_primary) metrics.primary += 1;
      if (row.status === 'active') activeIds.push(row.id);
    }
    if ((data ?? []).length < pageSize) break;
  }
  if (activeIds.length) {
    const dentistClinics = new Set<string>();
    const staffClinics = new Set<string>();
    for (let from = 0; ; from += pageSize) {
      const { data, error } = await admin.from('clinic_assignments').select('clinic_id, assignment_role').eq('status', 'active').range(from, from + pageSize - 1);
      if (error) throw new PlatformAdminApiError('DIRECTORY_QUERY_FAILED', 503, 'Platform summary is temporarily unavailable.');
      for (const row of data ?? []) {
        if (row.assignment_role === 'associate') dentistClinics.add(row.clinic_id);
        if (row.assignment_role === 'staff') staffClinics.add(row.clinic_id);
      }
      if ((data ?? []).length < pageSize) break;
    }
    metrics.withoutDentists = activeIds.filter(id => !dentistClinics.has(id)).length;
    metrics.withoutStaff = activeIds.filter(id => !staffClinics.has(id)).length;
  }
  return metrics;
}

async function activeOwnerSummaries(admin: any, subscriberIds: string[]) {
  const owners = new Map<string, { membershipId: string; userId: string; displayName: string | null; email: string | null }>();
  if (!subscriberIds.length) return owners;
  const { data, error } = await admin.from('subscriber_memberships').select('id, subscriber_id, user_id, created_at, profiles(email, display_name, first_name, middle_name, last_name)').in('subscriber_id', subscriberIds).eq('role', 'clinic_owner').eq('account_status', 'active').order('created_at', { ascending: true });
  if (error) throw new PlatformAdminApiError('DIRECTORY_QUERY_FAILED', 503, 'Owner identity is temporarily unavailable.');
  for (const row of data ?? []) {
    if (owners.has(row.subscriber_id)) continue;
    const profile = first(row.profiles);
    const joinedName = [profile?.first_name, profile?.middle_name, profile?.last_name].filter(Boolean).join(' ');
    owners.set(row.subscriber_id, { membershipId: row.id, userId: row.user_id, displayName: profile?.display_name ?? (joinedName || null), email: profile?.email ?? null });
  }
  return owners;
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
    count('subscriptions', q => q.eq('status', 'pending')),
    count('subscriptions', q => q.eq('status', 'expiring_soon')),
    count('subscriptions', q => q.eq('status', 'expired')),
    count('subscriptions', q => q.eq('status', 'suspended')),
    count('subscriptions', q => q.eq('status', 'cancelled')),
    activeSubscriptionMetrics(admin),
    count('subscribers'),
    count('subscribers', q => q.eq('account_status', 'pending')),
    count('subscribers', q => q.eq('account_status', 'suspended')),
    count('subscribers', q => q.eq('account_status', 'deactivated')),
    clinicMetrics(admin),
    paymentMetrics(admin),
    count('subscriber_memberships', q => q.neq('role', 'clinic_owner')),
    count('subscriber_memberships', q => q.neq('role', 'clinic_owner').eq('account_status', 'active')),
    count('subscriber_memberships', q => q.eq('role', 'associate')),
    count('subscriber_memberships', q => q.eq('role', 'staff')),
  ]);
  if ([...results.slice(0, 5), ...results.slice(6, 11), ...results.slice(12, 16), ...results.slice(18, 22)].some((result: any) => result.error)) throw new PlatformAdminApiError('DIRECTORY_QUERY_FAILED', 503, 'Platform summary is temporarily unavailable.');
  return {
    pendingRegistrationReviews: results[0].count ?? 0,
    pendingPaymentReviews: results[1].count ?? 0,
    activeSubscribers: results[2].count ?? 0,
    activeClinics: results[3].count ?? 0,
    activeSubscriptions: results[4].count ?? 0,
    platformUsers: results[5],
    activeSubscriptionMrrCentavos: results[11].mrrCentavos,
    subscriptionStatuses: {
      active: results[4].count ?? 0,
      pending: results[6].count ?? 0,
      expiringSoon: results[7].count ?? 0,
      expired: results[8].count ?? 0,
      suspended: results[9].count ?? 0,
      cancelled: results[10].count ?? 0,
    },
    activePlanDistribution: results[11].planDistribution,
    subscriberSummary: { total: results[12].count ?? 0, active: results[2].count ?? 0, pending: results[13].count ?? 0, suspended: results[14].count ?? 0, deactivated: results[15].count ?? 0 },
    clinicSummary: results[16],
    paymentSummary: results[17],
    personnelSummary: { total: results[18].count ?? 0, active: results[19].count ?? 0, associates: results[20].count ?? 0, staff: results[21].count ?? 0 },
  };
}

async function subscribers(admin: any, options: QueryOptions) {
  let query = admin.from('subscribers').select(`
    id, subscriber_number, registration_id, business_name, email, mobile_number, account_status,
    created_at, updated_at, activated_at, deactivated_at,
    registrations(id, plan_id, submitted_at, payment_status),
    clinics(id, clinic_number, name, status, is_primary, address_line_1, city, province),
    laboratories(id, laboratory_number, name, status, city, province),
    subscriptions(id, plan_id, status, billing_cycle, amount_centavos, starts_at, expires_at, plans(id, plan_code, name, monthly_amount_centavos, annual_amount_centavos)),
    subscriber_memberships(id, user_id, role, account_status, must_change_password, created_at, updated_at,
      profiles(id, email, display_name, first_name, middle_name, last_name, mobile_number),
      staff_profiles(position, phone_number), associate_dentist_profiles(designation))
  `, { count: 'exact' }).order('created_at', { ascending: false });
  if (options.id) query = query.eq('id', options.id);
  if (options.status) query = query.eq('account_status', options.status);
  if (options.plan || options.subscriptionStatus) {
    let subscriptionFilter = admin.from('subscriptions').select('subscriber_id');
    if (options.subscriptionStatus) subscriptionFilter = subscriptionFilter.eq('status', options.subscriptionStatus);
    if (options.plan) {
      const term = escapedLike(options.plan);
      const planResult = await admin.from('plans').select('id').or(`plan_code.ilike.${term},name.ilike.${term}`);
      if (planResult.error) throw new PlatformAdminApiError('DIRECTORY_QUERY_FAILED', 503, 'Subscriber plan filtering is temporarily unavailable.');
      subscriptionFilter = applyUuidMatches(subscriptionFilter, 'plan_id', uuidIn((planResult.data ?? []).map((row: any) => row.id)));
    }
    const subscriptionResult = await subscriptionFilter;
    if (subscriptionResult.error) throw new PlatformAdminApiError('DIRECTORY_QUERY_FAILED', 503, 'Subscriber subscription filtering is temporarily unavailable.');
    query = applyUuidMatches(query, 'id', uuidIn((subscriptionResult.data ?? []).map((row: any) => row.subscriber_id)));
  }
  if (options.paymentStatus) {
    const registrationResult = await admin.from('registrations').select('id').eq('payment_status', options.paymentStatus);
    if (registrationResult.error) throw new PlatformAdminApiError('DIRECTORY_QUERY_FAILED', 503, 'Subscriber payment filtering is temporarily unavailable.');
    query = applyUuidMatches(query, 'registration_id', uuidIn((registrationResult.data ?? []).map((row: any) => row.id)));
  }
  if (options.search) {
    const term = escapedLike(options.search);
    query = query.or(`subscriber_number.ilike.%${term}%,business_name.ilike.%${term}%,email.ilike.%${term}%`);
  }
  const from = (options.page - 1) * options.pageSize;
  const { data, count, error } = await query.range(from, from + options.pageSize - 1);
  if (error) throw new PlatformAdminApiError('DIRECTORY_QUERY_FAILED', 503, 'Subscribers are temporarily unavailable.');
  const detailPayments = options.id && data?.[0]
    ? await admin.from('payments').select('id, payment_method, reference_number, amount_centavos, status, submitted_at').eq('subscriber_id', data[0].id).order('submitted_at', { ascending: false })
    : { data: [], error: null };
  if (detailPayments.error) throw new PlatformAdminApiError('DIRECTORY_QUERY_FAILED', 503, 'Subscriber payment summary is temporarily unavailable.');
  const items = (data ?? []).map((row: any) => {
    const registration = first(row.registrations);
    const memberships = list(row.subscriber_memberships);
    const ownerMembership = memberships.find(membership => membership.role === 'clinic_owner' && membership.account_status === 'active') ?? memberships.find(membership => membership.role === 'clinic_owner') ?? null;
    const ownerProfile = first(ownerMembership?.profiles);
    const clinics = list(row.clinics);
    const activeClinics = clinics.filter(clinic => clinic.status === 'active');
    const activeLaboratories = list(row.laboratories).filter(laboratory => laboratory.status === 'active');
    const activeMemberships = memberships.filter(membership => membership.account_status === 'active');
    const primaryClinic = clinics.find(clinic => clinic.is_primary) ?? clinics[0] ?? null;
    const subscriptions = list(row.subscriptions);
    const currentSubscription = subscriptions.find(subscription => ['pending', 'active', 'expiring_soon', 'suspended'].includes(subscription.status)) ?? subscriptions[0] ?? null;
    const plan = first(currentSubscription?.plans);
    const payments = options.id ? list(detailPayments.data) : [];
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
        displayName: ownerProfile?.display_name ?? ([ownerProfile?.first_name, ownerProfile?.middle_name, ownerProfile?.last_name].filter(Boolean).join(' ') || null),
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
        monthlyAmountCentavos: plan?.monthly_amount_centavos ?? null,
        annualAmountCentavos: plan?.annual_amount_centavos ?? null,
        status: currentSubscription.status,
        billingCycle: currentSubscription.billing_cycle,
        amountCentavos: currentSubscription.amount_centavos,
        startsAt: currentSubscription.starts_at,
        expiresAt: currentSubscription.expires_at,
      } : null,
      facilities: {
        clinics: options.id ? activeClinics.map(clinic => ({ id: clinic.id, clinicNumber: clinic.clinic_number, name: clinic.name, status: clinic.status, isPrimary: clinic.is_primary, addressLine1: clinic.address_line_1 ?? '', city: clinic.city ?? '', province: clinic.province ?? '' })) : [],
        laboratories: options.id ? activeLaboratories.map(laboratory => ({ id: laboratory.id, laboratoryNumber: laboratory.laboratory_number, name: laboratory.name, status: laboratory.status, city: laboratory.city ?? '', province: laboratory.province ?? '' })) : [],
      },
      personnel: options.id ? activeMemberships.map(membership => {
        const profile = first(membership.profiles);
        const staff = first(membership.staff_profiles);
        const associate = first(membership.associate_dentist_profiles);
        const displayName = profile?.display_name ?? [profile?.first_name, profile?.middle_name, profile?.last_name].filter(Boolean).join(' ');
        return { id: membership.id, fullName: displayName || profile?.email || 'Unnamed user', email: profile?.email ?? '', mobileNumber: profile?.mobile_number ?? staff?.phone_number ?? '', role: membership.role, position: staff?.position ?? associate?.designation ?? (membership.role === 'clinic_owner' ? 'Clinic Owner' : membership.role), accountStatus: membership.account_status };
      }) : [],
      payments: payments.map(payment => ({ id: payment.id, paymentMethod: payment.payment_method, referenceNumber: payment.reference_number, amountCentavos: payment.amount_centavos, status: payment.status, submittedAt: payment.submitted_at })),
      financialSummary: payments.reduce((summary, payment) => {
        summary.paymentCount += 1;
        if (payment.status === 'approved') summary.approvedPaidAmountCentavos += Number(payment.amount_centavos ?? 0);
        if (payment.status === 'pending_verification') summary.pendingAmountCentavos += Number(payment.amount_centavos ?? 0);
        if (payment.status === 'refunded') summary.refundedAmountCentavos += Number(payment.amount_centavos ?? 0);
        return summary;
      }, { approvedPaidAmountCentavos: 0, pendingAmountCentavos: 0, refundedAmountCentavos: 0, paymentCount: 0 }),
      counts: {
        clinics: activeClinics.length,
        laboratories: activeLaboratories.length,
        associates: activeMemberships.filter(membership => membership.role === 'associate').length,
        staff: activeMemberships.filter(membership => membership.role === 'staff').length,
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
    clinic_assignments(clinic_id, assignment_role, status, clinics(id, name, address_line_1, city, province, status, is_primary))
  `, { count: 'exact' }).order('created_at', { ascending: false });
  if (options.id) query = query.eq('id', options.id);
  if (options.status) query = query.eq('account_status', options.status);
  if (options.role) query = query.eq('role', options.role);
  if (options.excludeRole) query = query.neq('role', options.excludeRole);
  if (options.subscriberId) query = query.eq('subscriber_id', options.subscriberId);
  if (options.clinicId) {
    const assignmentResult = await admin.from('clinic_assignments').select('membership_id').eq('clinic_id', options.clinicId).eq('status', 'active');
    if (assignmentResult.error) throw new PlatformAdminApiError('DIRECTORY_QUERY_FAILED', 503, 'Clinic user filtering is temporarily unavailable.');
    query = applyUuidMatches(query, 'id', uuidIn((assignmentResult.data ?? []).map((row: any) => row.membership_id)));
  }
  if (options.search) {
    const matches = await resolveUserSearch(admin, options.search);
    const predicates = [
      matches.membershipIds.length ? `id.in.(${matches.membershipIds.join(',')})` : null,
      matches.userIds.length ? `user_id.in.(${matches.userIds.join(',')})` : null,
      matches.subscriberIds.length ? `subscriber_id.in.(${matches.subscriberIds.join(',')})` : null,
    ].filter(Boolean).join(',');
    query = predicates ? query.or(predicates) : query.eq('id', noMatchId);
  }
  const from = (options.page - 1) * options.pageSize;
  const { data, count, error } = await query.range(from, from + options.pageSize - 1);
  if (error) throw new PlatformAdminApiError('DIRECTORY_QUERY_FAILED', 503, 'Users are temporarily unavailable.');
  const items = (data ?? []).map((row: any) => {
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
      clinics: list(row.clinic_assignments).filter(assignment => assignment.status === 'active').map(assignment => { const clinic = first(assignment.clinics); return { id: assignment.clinic_id, name: clinic?.name ?? '', addressLine1: clinic?.address_line_1 ?? null, city: clinic?.city ?? null, province: clinic?.province ?? null, status: clinic?.status ?? null, isPrimaryClinic: Boolean(clinic?.is_primary) }; }),
      activatedAt: row.activated_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  });
  return { items, page: options.page, pageSize: options.pageSize, total: count ?? 0 };
}

async function clinics(admin: any, options: QueryOptions) {
  let query = admin.from('clinics').select(`
    id, subscriber_id, clinic_number, branch_type, name, legal_business_name, email, contact_number,
    alternative_contact_number, address_line_1, address_line_2, barangay, city, province, postal_code,
    country, timezone, description, status, visibility, is_primary, created_at, updated_at, activated_at,
    deactivated_at, archived_at, subscribers(id, subscriber_number, business_name),
    clinic_assignments(membership_id, assignment_role, status,
      subscriber_memberships(id, role, account_status, profiles(email, display_name, first_name, middle_name, last_name, mobile_number), staff_profiles(position, phone_number), associate_dentist_profiles(designation))),
    clinic_business_hours(day_of_week, is_open, opening_time, closing_time, break_start, break_end)
  `, { count: 'exact' }).order('created_at', { ascending: false });
  if (options.id) query = query.eq('id', options.id);
  if (options.status) query = query.eq('status', options.status);
  if (options.subscriberId) query = query.eq('subscriber_id', options.subscriberId);
  if (options.search) {
    const term = escapedLike(options.search);
    query = query.or(`clinic_number.ilike.%${term}%,name.ilike.%${term}%,city.ilike.%${term}%,province.ilike.%${term}%`);
  }
  const from = (options.page - 1) * options.pageSize;
  const { data, count, error } = await query.range(from, from + options.pageSize - 1);
  if (error) throw new PlatformAdminApiError('DIRECTORY_QUERY_FAILED', 503, 'Clinics are temporarily unavailable.');
  const owners = await activeOwnerSummaries(admin, uuidIn((data ?? []).map((row: any) => row.subscriber_id)));
  const subscriberIds = uuidIn((data ?? []).map((row: any) => row.subscriber_id));
  const subscriptionResult = subscriberIds.length ? await admin.from('subscriptions').select('id, subscriber_id, plan_id, status, billing_cycle, plans(plan_code, name)').in('subscriber_id', subscriberIds).in('status', ['pending', 'active', 'expiring_soon', 'suspended']).order('created_at', { ascending: false }) : { data: [], error: null };
  if (subscriptionResult.error) throw new PlatformAdminApiError('DIRECTORY_QUERY_FAILED', 503, 'Clinic subscription summary is temporarily unavailable.');
  const items = (data ?? []).map((row: any) => {
    const subscriber = first(row.subscribers);
    const assignments = list(row.clinic_assignments).filter(assignment => assignment.status === 'active');
    const subscription = list(subscriptionResult.data).find(item => item.subscriber_id === row.subscriber_id) ?? null;
    const plan = first(subscription?.plans);
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
      owner: owners.get(row.subscriber_id) ?? null,
      personnel: options.id ? assignments.map(assignment => {
        const membership = first(assignment.subscriber_memberships);
        const profile = first(membership?.profiles);
        const staff = first(membership?.staff_profiles);
        const associate = first(membership?.associate_dentist_profiles);
        const joinedName = [profile?.first_name, profile?.middle_name, profile?.last_name].filter(Boolean).join(' ');
        return { id: assignment.membership_id, fullName: profile?.display_name ?? (joinedName || profile?.email || 'Unnamed user'), email: profile?.email ?? '', mobileNumber: profile?.mobile_number ?? staff?.phone_number ?? '', role: membership?.role ?? assignment.assignment_role, position: staff?.position ?? associate?.designation ?? (assignment.assignment_role === 'clinic_owner' ? 'Clinic Owner' : assignment.assignment_role), accountStatus: membership?.account_status ?? 'pending' };
      }) : [],
      subscription: options.id && subscription ? { id: subscription.id, status: subscription.status, planId: subscription.plan_id, planName: plan?.name ?? '', planCode: plan?.plan_code ?? '', billingCycle: subscription.billing_cycle } : null,
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
  if (options.subscriberId) query = query.eq('subscriber_id', options.subscriberId);
  if (options.paymentMethod) query = query.eq('payment_method', options.paymentMethod);
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
  const planIds = uuidIn([...(subscriptionResult.data ?? []).map((row: any) => row.plan_id), ...(data ?? []).map((row: any) => first(row.registrations)?.plan_id)]);
  const planResult = planIds.length ? await admin.from('plans').select('id, plan_code, name').in('id', planIds) : { data: [], error: null };
  if (planResult.error) throw new PlatformAdminApiError('DIRECTORY_QUERY_FAILED', 503, 'Payment plan summaries are temporarily unavailable.');
  const items = (data ?? []).map((row: any) => {
    const registration = first(row.registrations);
    const subscriber = first(row.subscribers);
    const subscription = list(subscriptionResult.data).find(item => item.source_payment_id === row.id) ?? null;
    const planId = subscription?.plan_id ?? registration?.plan_id ?? null;
    const plan = list(planResult.data).find(item => item.id === planId) ?? null;
    return {
      id: row.id,
      registrationId: row.registration_id,
      registrationNumber: registration?.registration_number ?? null,
      subscriberId: row.subscriber_id,
      subscriberNumber: subscriber?.subscriber_number ?? null,
      subscriberName: subscriber?.business_name ?? null,
      subscriptionId: subscription?.id ?? null,
      planId,
      planName: plan?.name ?? plan?.plan_code ?? null,
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
  if (options.subscriberId) query = query.eq('subscriber_id', options.subscriberId);
  if (options.planId) query = query.eq('plan_id', options.planId);
  if (options.plan) {
    const term = escapedLike(options.plan);
    const planResult = await admin.from('plans').select('id').or(`plan_code.ilike.${term},name.ilike.${term}`);
    if (planResult.error) throw new PlatformAdminApiError('DIRECTORY_QUERY_FAILED', 503, 'Subscription plan filtering is temporarily unavailable.');
    query = applyUuidMatches(query, 'plan_id', uuidIn((planResult.data ?? []).map((row: any) => row.id)));
  }
  if (options.billingCycle) query = query.eq('billing_cycle', options.billingCycle);
  if (options.paymentStatus) {
    const paymentResult = await admin.from('payments').select('id').eq('status', options.paymentStatus);
    if (paymentResult.error) throw new PlatformAdminApiError('DIRECTORY_QUERY_FAILED', 503, 'Subscription payment filtering is temporarily unavailable.');
    query = applyUuidMatches(query, 'source_payment_id', uuidIn((paymentResult.data ?? []).map((row: any) => row.id)));
  }
  if (options.search) {
    const matches = await resolveSubscriptionSearch(admin, options.search);
    const predicates = [
      matches.subscriberIds.length ? `subscriber_id.in.(${matches.subscriberIds.join(',')})` : null,
      matches.planIds.length ? `plan_id.in.(${matches.planIds.join(',')})` : null,
    ].filter(Boolean).join(',');
    query = predicates ? query.or(predicates) : query.eq('id', noMatchId);
  }
  const from = (options.page - 1) * options.pageSize;
  const { data, count, error } = await query.range(from, from + options.pageSize - 1);
  if (error) throw new PlatformAdminApiError('DIRECTORY_QUERY_FAILED', 503, 'Subscriptions are temporarily unavailable.');
  const owners = await activeOwnerSummaries(admin, uuidIn((data ?? []).map((row: any) => row.subscriber_id)));
  const sourcePaymentIds = (data ?? []).map((row: any) => row.source_payment_id).filter(Boolean);
  const paymentResult = sourcePaymentIds.length
    ? await admin.from('payments').select('id, status, payment_method, reference_number, amount_centavos, submitted_at').in('id', sourcePaymentIds)
    : { data: [], error: null };
  if (paymentResult.error) throw new PlatformAdminApiError('DIRECTORY_QUERY_FAILED', 503, 'Subscription payment state is temporarily unavailable.');
  const items = (data ?? []).map((row: any) => {
    const subscriber = first(row.subscribers);
    const plan = first(row.plans);
    const owner = owners.get(row.subscriber_id) ?? null;
    const sourcePayment = list(paymentResult.data).find(payment => payment.id === row.source_payment_id) ?? null;
    return {
      id: row.id,
      subscriberId: row.subscriber_id,
      subscriberNumber: subscriber?.subscriber_number ?? null,
      subscriberName: subscriber?.business_name ?? null,
      subscriberEmail: subscriber?.email ?? null,
      ownerDisplayName: owner?.displayName ?? null,
      ownerEmail: owner?.email ?? null,
      registrationId: subscriber?.registration_id ?? null,
      planId: row.plan_id,
      planCode: plan?.plan_code ?? null,
      planName: plan?.name ?? null,
      billingCycle: row.billing_cycle,
      amountCentavos: row.amount_centavos,
      monthlyAmountCentavos: plan?.monthly_amount_centavos ?? null,
      annualAmountCentavos: plan?.annual_amount_centavos ?? null,
      sourcePaymentId: row.source_payment_id,
      sourcePaymentStatus: sourcePayment?.status ?? null,
      sourcePayment: options.id && sourcePayment ? {
        id: sourcePayment.id,
        status: sourcePayment.status,
        paymentMethod: sourcePayment.payment_method,
        referenceNumber: sourcePayment.reference_number,
        amountCentavos: sourcePayment.amount_centavos,
        submittedAt: sourcePayment.submitted_at,
      } : null,
      status: row.status,
      startsAt: row.starts_at,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  });
  return { items, page: options.page, pageSize: options.pageSize, total: count ?? 0 };
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
