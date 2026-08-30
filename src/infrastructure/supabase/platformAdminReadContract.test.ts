import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const edge = read('supabase/functions/platform-admin-read/index.ts');
const config = read('supabase/config.toml');
const api = read('src/infrastructure/supabase/platformAdminApi.ts');
const provider = read('src/features/platformManagement/realData/PlatformAdminReadProvider.tsx');
const service = read('src/features/platformManagement/realData/platformAdminRealDataService.ts');
const app = read('src/App.tsx');

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
    expect(api).toContain("invoke<PlatformAdminReadPage>('platform-admin-read'");
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

  it('loads every safe directory page and uses membership UUIDs for unambiguous user details', () => {
    expect(api).toContain('while (items.length < total)');
    expect(api).toContain("readAllDirectoryPages('users', client)");
    expect(api).toContain('readAllReviewPages(filters, client)');
    expect(provider).toContain("platformAdminApi.listAllReview({ registrationStatus: 'pending_review' })");
    expect(edge).toContain("query.eq('id', options.id)");
    expect(edge).toContain('id: row.id');
    expect(edge).toContain('userId: row.user_id');
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

  it('drives Dashboard counts and plan pricing from the real snapshot', () => {
    const dashboard = targetPages[0];
    expect(dashboard).toContain('getPlatformAdminSummary()');
    expect(dashboard).toContain('platformAdminSubscriptionService.listSubscriptions()');
    expect(dashboard).not.toContain('mockPlatformManagementService');
  });
});
