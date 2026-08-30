import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { mapPlatformAdminDirectoryItems } from '../../features/platformManagement/realData/platformAdminRealDataService';
import { makePlatformAdminRealDataTestSnapshot } from '../../features/platformManagement/realData/platformAdminRealDataTestFixture';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const edge = read('supabase/functions/platform-admin-read/index.ts');
const config = read('supabase/config.toml');
const api = read('src/infrastructure/supabase/platformAdminApi.ts');
const provider = read('src/features/platformManagement/realData/PlatformAdminReadProvider.tsx');
const service = read('src/features/platformManagement/realData/platformAdminRealDataService.ts');
const app = read('src/App.tsx');
const subscriberDetails = read('src/features/platformManagement/pages/SubscriberDetailsPage.tsx');
const userDetails = read('src/features/platformManagement/pages/UserDetailsPage.tsx');
const clinicDetails = read('src/features/clinics/pages/ClinicDetailsPage.tsx');
const paymentDetails = read('src/features/payments/pages/PaymentDetailsPage.tsx');
const subscriptionDetails = read('src/features/subscriptions/pages/SubscriptionDetailsPage.tsx');
const planDetails = read('src/features/plans/pages/PlanDetailsPage.tsx');

const targetPages = [
  'src/features/platformManagement/pages/PlatformDashboardPage.tsx',
  'src/features/platformManagement/pages/SubscribersPage.tsx',
  'src/features/platformManagement/pages/SubscriberDetailsPage.tsx',
  'src/features/platformManagement/pages/UsersPage.tsx',
  'src/features/platformManagement/pages/UserDetailsPage.tsx',
  'src/features/clinics/pages/ClinicsPage.tsx',
  'src/features/clinics/pages/ClinicDetailsPage.tsx',
  'src/features/payments/pages/PaymentsPage.tsx',
  'src/features/payments/pages/PaymentDetailsPage.tsx',
  'src/features/subscriptions/pages/SubscriptionsPage.tsx',
  'src/features/subscriptions/pages/SubscriptionDetailsPage.tsx',
  'src/features/plans/pages/PlansPage.tsx',
  'src/features/plans/pages/PlanDetailsPage.tsx',
].map(read);

describe('Phase 2E.2B secure Platform Administrator read model', () => {
  it('requires a verified user JWT and the shared platform_admins authorization helper', () => {
    expect(edge).toContain("withSupabase({ auth: 'user' }");
    expect(edge).toContain('await requirePlatformAdmin(ctx)');
    expect(edge.indexOf('await requirePlatformAdmin(ctx)')).toBeLessThan(edge.indexOf('parseOptions(await requestJson(req))'));
    expect(config).toMatch(/\[functions\.platform-admin-read\][\s\S]*?verify_jwt = true/);
  });

  it('never places service-role material in browser code or the response contract', () => {
    expect(api).not.toMatch(/service.?role|SUPABASE_SERVICE_ROLE_KEY/i);
    expect(provider).not.toMatch(/service.?role|SUPABASE_SERVICE_ROLE_KEY/i);
    expect(service).not.toMatch(/service.?role|SUPABASE_SERVICE_ROLE_KEY/i);
    expect(edge).not.toMatch(/Deno\.env\.get\(['"]SUPABASE_SERVICE_ROLE_KEY/);
  });

  it('uses one cohesive typed read endpoint for every approved resource', () => {
    expect(api).toContain("invoke<PlatformAdminReadPage<T> | { item: T }");
    expect(api).toContain("invoke<{ summary: PlatformAdminDirectorySnapshot['summary'] }>('platform-admin-read'");
    for (const resource of ['subscribers', 'users', 'clinics', 'payments', 'subscriptions', 'plans']) {
      expect(edge).toContain(resource);
    }
  });

  it('constrains pagination, search, status, role, resource, and detail IDs server-side', () => {
    expect(edge).toContain('pageSize > 100');
    expect(edge).toContain("text(payload.search, 'Search', 80)");
    expect(edge).toContain('statuses.has(status)');
    expect(edge).toContain('roles.has(role)');
    expect(edge).toContain('resources.has(resource)');
    expect(edge).toContain("uuid(payload.id, 'Record ID')");
  });

  it('does not download a complete cross-tenant directory snapshot on sign-in', () => {
    expect(api).not.toContain('readAllDirectoryPages');
    expect(api).not.toContain('getDirectorySnapshot');
    expect(provider).toContain('platformAdminApi.getSummary()');
    expect(provider).not.toMatch(/readDirectory\(['"](?:subscribers|users|clinics|payments|subscriptions|plans)/);
    expect(api).toContain('readAllReviewPages(filters, client)');
    expect(provider).toContain("platformAdminApi.listAllReview({ registrationStatus: 'pending_review' })");
  });

  it('sends the active page, bounded page size, search, and filters to the read endpoint', () => {
    expect(provider).toContain('model.loadPage(resource, query)');
    expect(provider).toContain('installPlatformAdminDirectoryPage(resource, result.items)');
    for (const page of targetPages.filter(value => !value.includes('DetailsPage') && !value.includes('Platform Control Center'))) {
      expect(page).toContain('usePlatformAdminDirectoryPage(');
    }
    expect(targetPages.join('\n')).toContain('pageSize: PAGE_SIZE');
    expect(targetPages.join('\n')).toContain("search: filters.search.trim() || undefined");
  });

  it('applies users and subscriptions search before range and keeps exact filtered totals', () => {
    const usersReader = edge.slice(edge.indexOf('async function users'), edge.indexOf('async function clinics'));
    const subscriptionsReader = edge.slice(edge.indexOf('async function subscriptions'), edge.indexOf('async function plans'));
    for (const reader of [usersReader, subscriptionsReader]) {
      expect(reader.indexOf('if (options.search)')).toBeGreaterThan(-1);
      expect(reader.indexOf('if (options.search)')).toBeLessThan(reader.indexOf('.range('));
      expect(reader).toContain("select(`");
      expect(reader).toContain("{ count: 'exact' }");
      expect(reader).toContain('total: count ?? 0');
      expect(reader).not.toContain('total: options.search ? items.length');
    }
  });

  it('keeps directory page size bounded and detail lookup UUID-exact', () => {
    expect(edge).toContain('pageSize > 100');
    expect(edge).toContain("query.eq('id', options.id)");
    expect(edge).toContain('id: row.id');
    expect(edge).toContain('userId: row.user_id');
  });

  it('counts only active subscriber resources where status authority exists', () => {
    expect(edge).toContain('laboratories(id, laboratory_number, name, status');
    expect(edge).toContain("clinics.filter(clinic => clinic.status === 'active')");
    expect(edge).toContain("list(row.laboratories).filter(laboratory => laboratory.status === 'active')");
    expect(edge).toContain("memberships.filter(membership => membership.account_status === 'active')");
  });

  it('maps explicit safe DTOs and excludes credential, OTP, and token fields', () => {
    for (const forbidden of ['password_hash', 'temporary_password', 'otp_hash', 'refresh_token', 'access_token']) {
      expect(edge.toLowerCase()).not.toContain(forbidden);
    }
    expect(edge).toContain('amountCentavos: row.amount_centavos');
    expect(edge).toContain('mustChangePassword: Boolean(ownerMembership.must_change_password)');
  });

  it('keeps empty backend arrays empty and clears state on read failure', () => {
    expect(service).toContain('subscribers: [], users: [], clinics: [], payments: [], subscriptions: [], plans: [], registrations: []');
    expect(provider).toContain('clearPlatformAdminSnapshot();');
    expect(provider).not.toMatch(/mockPlatformManagementService|mockPaymentService|mockClinicService|mockSubscriptionService|mockPlanService|localStorage/);
  });

  it('removes localStorage-backed mock service imports from all target pages', () => {
    for (const page of targetPages) {
      expect(page).not.toMatch(/from ['"].*services\/mock(?:PlatformManagement|Payment|Subscription|Clinic|Plan)Service/);
      expect(page).not.toMatch(/localStorage|sessionStorage/);
    }
  });

  it('loads every detail route by authoritative backend UUID', () => {
    const details = targetPages.filter(page => page.includes('DetailsPage'));
    for (const resource of ['subscribers', 'users', 'clinics', 'payments', 'subscriptions', 'plans']) {
      expect(details.some(page => page.includes(`usePlatformAdminDetail('${resource}'`))).toBe(true);
    }
  });

  it('keeps detail pages coherent from their exact resource DTO without cross-directory authority', () => {
    expect(edge).toContain('financialSummary: payments.reduce');
    expect(edge).toContain('approvedPaidAmountCentavos');
    expect(edge).toContain('monthlyAmountCentavos: plan?.monthly_amount_centavos');
    expect(edge).toContain('sourcePayment: options.id && sourcePayment ?');
    expect(subscriberDetails).toContain("subscriber.ownerDisplayName || owner?.fullName || 'Owner identity unavailable'");
    expect(subscriberDetails).toContain('subscriber.financialSummary');
    expect(subscriberDetails).not.toContain('activePlanPrice *');
    expect(subscriberDetails).not.toContain("handleCopy(credentialDeliveryStatus");
    expect(subscriberDetails).not.toMatch(/initialPassword|temporaryPassword|plaintextPassword/);
    expect(userDetails).not.toContain('platformAdminClinicService');
    expect(clinicDetails).not.toContain('platformAdminDirectoryService');
    expect(clinicDetails).not.toContain('platformAdminLaboratoryService');
    expect(paymentDetails).not.toContain('platformAdminDirectoryService');
    expect(paymentDetails).not.toContain('platformAdminSubscriptionService');
    expect(subscriptionDetails).not.toContain('platformAdminDirectoryService');
    expect(subscriptionDetails).not.toContain('platformAdminPaymentService');
    expect(subscriptionDetails).not.toContain('platformAdminPlanService');
    expect(planDetails).not.toContain('getPlanSubscribers');
    expect([paymentDetails, subscriptionDetails, planDetails].join('\n')).not.toMatch(/Angelo Mhyr|7990|86292|SUBS-000001|SCP-000101/);
  });

  it('maps the authoritative subscriber owner, price, facilities, and paid total', () => {
    const [subscriber] = mapPlatformAdminDirectoryItems('subscribers', [{
      id: '11111111-1111-4111-8111-111111111111', subscriberNumber: 'SUB-DETAIL-001', businessName: 'Angelo Dental Clinic', email: 'owner@example.test', mobileNumber: '09170000000', accountStatus: 'active', paymentStatus: 'approved', createdAt: '2026-08-30T00:00:00Z', updatedAt: '2026-08-30T00:00:00Z',
      owner: { membershipId: '99999999-9999-4999-8999-999999999991', userId: '22222222-2222-4222-8222-222222222222', displayName: 'Angelo Mhyr Lagsac', email: 'owner@example.test', accountStatus: 'active' },
      primaryClinic: { id: '44444444-4444-4444-8444-444444444444', name: 'Angelo Dental Clinic' },
      subscription: { id: '66666666-6666-4666-8666-666666666666', planCode: 'plus', planName: 'Plus', monthlyAmountCentavos: 850000, annualAmountCentavos: 8670000, amountCentavos: 850000, billingCycle: 'monthly', status: 'active' },
      facilities: { clinics: [{ id: '44444444-4444-4444-8444-444444444444', clinicNumber: 'CLN-DETAIL-001', name: 'Angelo Dental Clinic', status: 'active', isPrimary: true, addressLine1: 'Development Address', city: 'Manila', province: 'Metro Manila' }], laboratories: [] },
      personnel: [], payments: [{ id: '77777777-7777-4777-8777-777777777777', paymentMethod: 'gcash', referenceNumber: 'DEV-DETAIL-001', amountCentavos: 850000, status: 'approved', submittedAt: '2026-08-30T00:00:00Z' }],
      financialSummary: { approvedPaidAmountCentavos: 850000, pendingAmountCentavos: 0, refundedAmountCentavos: 0, paymentCount: 1 }, counts: { clinics: 1, laboratories: 0, associates: 0, staff: 0 },
    }]);
    expect(subscriber).toMatchObject({ ownerDisplayName: 'Angelo Mhyr Lagsac', planName: 'Plus', monthlyPlanAmount: 8500, clinicCount: 1, financialSummary: { approvedPaidAmount: 8500, paymentCount: 1 } });
  });

  it('uses existing approved secure mutations and blocks all other fake writes', () => {
    expect(targetPages.join('\n')).toContain('platformAdminApi.reviewPayment');
    expect(targetPages.join('\n')).toContain('platformAdminApi.resendInitialCredential');
    expect(service).toContain('approved secure Platform Administrator mutation contract');
    expect(service).not.toMatch(/localStorage|sessionStorage|Math\.random/);
  });

  it('blocks direct mock-backed form routes and never displays an initial password', () => {
    expect(app).not.toMatch(/import \{ (PlanFormPage|SubscriptionFormPage|PaymentFormPage|ClinicFormPage) \}/);
    expect(app).toContain('PlatformReadOnlyRoute resource="Plans"');
    expect(app).toContain('PlatformReadOnlyRoute resource="Subscriptions"');
    expect(app).toContain('PlatformReadOnlyRoute resource="Payments"');
    expect(app).toContain('PlatformReadOnlyRoute resource="Clinics"');
    expect(app).not.toContain('Copy Password');
    expect(app).not.toContain('Temporary Access Password (Issued for First Sign-In)');
    expect(app).toContain('No local approval was performed.');
    expect(app).toContain('No local rejection was performed.');
  });

  it('drives Dashboard from summary/review state without requiring directory downloads', () => {
    const dashboard = targetPages[0];
    expect(dashboard).toContain('const { revision, summary } = usePlatformAdminReadModel()');
    expect(dashboard).toContain('summary.paymentSummary');
    expect(dashboard).toContain('summary.clinicSummary');
    expect(dashboard).not.toContain('mockPlatformManagementService');
    expect(provider).toContain('installPlatformAdminDashboard(summaryResult.summary, review.items)');
  });

  it('keeps an unfiltered subscriptions page consistent with the authoritative active count', () => {
    const snapshot = makePlatformAdminRealDataTestSnapshot();
    const subscriptions = mapPlatformAdminDirectoryItems('subscriptions', snapshot.subscriptions.items);
    expect(snapshot.summary.activeSubscriptions).toBe(1);
    expect(snapshot.subscriptions.total).toBe(1);
    expect(subscriptions).toHaveLength(1);
    expect(subscriptions[0]).toMatchObject({ status: 'active', subscriberName: 'Harbor Dental Clinic' });
    expect(provider).toContain('items: mapPlatformAdminDirectoryItems(resource, result.items)');
  });

  it('keeps list pages independent from other resource snapshots', () => {
    const subscribers = targetPages[1];
    const users = targetPages[3];
    const clinics = targetPages[5];
    const payments = targetPages[7];
    const subscriptions = targetPages[9];
    const plans = targetPages[11];
    for (const page of [subscribers, users, clinics, payments, subscriptions, plans]) {
      expect(page).toContain('directoryPage.items');
    }
    expect(subscribers).toContain('subscriber.ownerDisplayName');
    expect(subscribers).toContain('platformSummary.activeSubscriptionMrrCentavos');
    expect(clinics).toContain('clinic.ownerDisplayName');
    expect(subscriptions).not.toContain('listSubscriptions()');
    expect(payments).not.toContain('listPayments()');
  });

  it('hides mock reset and prototype authority from the real Platform Administrator shell', () => {
    expect(app).toContain("{userRole !== 'platform_owner' && <span className=\"badge-prototype\"");
    expect(app).toContain("{userRole !== 'platform_owner' && <button");
    expect(app).not.toContain('Stale-Safe Purge');
  });
});
