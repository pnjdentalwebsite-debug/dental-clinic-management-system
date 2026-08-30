import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const app = read('src/App.tsx');
const auth = read('src/infrastructure/supabase/platformAdminAuth.ts');
const api = read('src/infrastructure/supabase/platformAdminApi.ts');
const dashboard = read('src/features/platformManagement/pages/PlatformDashboardPage.tsx');

describe('Phase 2E.2 Platform Administrator real-data cutover contracts', () => {
  it('derives Platform Administrator authority from the authenticated platform_admins row', () => {
    expect(auth).toContain(".from('platform_admins')");
    expect(auth).toContain(".select('user_id')");
    expect(auth).not.toMatch(/localStorage|DEFAULT_PLATFORM_OWNER|mockStorage/);
    expect(app).toContain('resolvePlatformAdminAccess(client)');
    expect(app).toContain("user.role === 'associate' || user.role === 'staff'");
  });

  it('uses deployed review, decision, provisioning, and credential APIs without browser authority fields', () => {
    for (const name of ['platform-registration-review-list', 'platform-registration-review-detail', 'platform-review-payment', 'platform-reject-registration', 'platform-approve-registration', 'platform-resend-initial-credential']) {
      expect(api).toContain(`'${name}'`);
    }
    expect(api).not.toMatch(/actorId|subscriberId.*approveRegistration|amountCentavos.*reviewPayment|temporaryPassword/);
  });

  it('uses the real Dashboard review list and delegates approval back to the authenticated App boundary', () => {
    expect(dashboard).not.toContain('mockPaymentService.approveRegistrationPayment');
    expect(dashboard).not.toContain('mockPlatformManagementService.listRegistrations');
    expect(dashboard).toContain('onApproveRegistration?.(reg)');
    expect(app).toContain("platformAdminApi.reviewPayment(selectedRegAdmin.id, selectedRegAdmin.paymentId, 'approve'");
    expect(app).toContain('platformAdminApi.approveRegistration(selectedRegAdmin.id, client)');
    expect(app).toContain('await refreshPlatformReviewRecords()');
  });
});
