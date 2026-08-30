import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const app = read('src/App.tsx');
const api = read('src/infrastructure/supabase/clinicOwnerApi.ts');
const provider = read('src/features/clinic-owner/realData/ClinicOwnerReadProvider.tsx');

describe('Phase 2E.3A Clinic Owner read foundation contract', () => {
  it('derives tenant scope from the authenticated owner membership without legacy authority', () => {
    expect(api).toContain("client.rpc('get_my_first_login_state')");
    expect(api).toContain(".from('subscriber_memberships')");
    expect(api).toContain(".eq('user_id', authUser.id)");
    expect(api).toContain(".eq('role', 'clinic_owner')");
    expect(api).not.toMatch(/localStorage|sessionStorage|mockPlatformManagementService|resolveClinicOwnerContext/);
  });

  it('connects only the authenticated Clinic Owner shell to the real provider', () => {
    expect(app).toContain("<ClinicOwnerReadProvider enabled={clinicOwnerAccess.kind === 'ready'}>");
    expect(app).toContain('bootstrap.owner.displayName');
    expect(app).toContain('bootstrap.subscriber.businessName');
    expect(app).toContain('bootstrap.plan.name');
    expect(app).not.toContain('onResetMock={() => setResetMockModalOpen(true)}');
  });

  it('exposes controlled provider states and never substitutes mock data', () => {
    for (const state of ['loading', 'ready', 'unauthorized', 'membership_conflict', 'subscription_unavailable', 'data_unavailable']) {
      expect(provider).toContain(`'${state}'`);
    }
    expect(provider).toContain('No mock data was substituted.');
    expect(provider).not.toMatch(/localStorage|sessionStorage|tenantScope|mock[A-Z]/);
  });

  it('leaves deferred owner page adapters untouched for later subphases', () => {
    expect(app).toContain('<ClinicOwnerDashboardPage');
    expect(app).toContain('<ClinicBranchesPage');
    expect(app).toContain('<AssociateDentistsPage');
    expect(app).toContain('<StaffManagementPage');
    expect(app).toContain('<ClinicLaboratoriesPage');
  });
});
