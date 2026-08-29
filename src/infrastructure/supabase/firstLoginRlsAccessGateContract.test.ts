/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const migration = read('supabase/migrations/20260829155055_first_login_rls_access_gate.sql');
const coreMigration = read('supabase/migrations/20260826101055_core_tenant_identity_and_branch_scope.sql');
const phase2Migration = read('supabase/migrations/20260829142527_phase_2_platform_admin_review_provisioning_foundation.sql');
const completionFunction = read('supabase/functions/complete-initial-password/index.ts');
const completionLogic = read('supabase/functions/complete-initial-password/logic.ts').replaceAll('"', "'");

const functionBody = (signature: string, nextSignature?: string) => {
  const start = migration.indexOf(signature);
  const end = nextSignature ? migration.indexOf(nextSignature, start + signature.length) : migration.length;
  return migration.slice(start, end);
};

describe('Phase 2C.2C-A first-login RLS access gate contract', () => {
  it('is one additive migration after the Phase 2 provisioning foundation', () => {
    expect(migration).toContain('create or replace function app_private.is_subscriber_member');
    expect(migration).not.toMatch(/drop\s+(table|schema)|truncate|create\s+table/i);
    expect(coreMigration).not.toContain('get_my_first_login_state');
    expect(phase2Migration).not.toContain('get_my_first_login_state');
  });

  it('gates all normal subscriber membership access on completed first login', () => {
    const member = functionBody(
      'create or replace function app_private.is_subscriber_member',
      'create or replace function app_private.is_subscriber_owner',
    );
    expect(member).toContain('app_private.is_platform_admin() or exists');
    expect(member).toContain("membership.account_status = 'active'");
    expect(member).toContain('membership.must_change_password = false');
    expect(member).toContain('membership.user_id = (select auth.uid())');
    expect(member).toContain('membership.subscriber_id = target_subscriber_id');
  });

  it('gates Clinic Owner authorization while preserving role and subscriber checks', () => {
    const owner = functionBody(
      'create or replace function app_private.is_subscriber_owner',
      'create or replace function app_private.can_access_clinic',
    );
    expect(owner).toContain('app_private.is_platform_admin() or exists');
    expect(owner).toContain("membership.role = 'clinic_owner'");
    expect(owner).toContain("membership.account_status = 'active'");
    expect(owner).toContain('membership.must_change_password = false');
  });

  it('gates both Clinic Owner and assignment-derived clinic access paths', () => {
    const clinic = functionBody(
      'create or replace function app_private.can_access_clinic',
      'create or replace function public.get_my_first_login_state',
    );
    expect(clinic).toContain('app_private.is_subscriber_owner(target_subscriber_id) or exists');
    expect(clinic).toContain('join public.subscriber_memberships membership');
    expect(clinic).toContain("assignment.status = 'active'");
    expect(clinic).toContain("membership.account_status = 'active'");
    expect(clinic).toContain('membership.must_change_password = false');
    expect(clinic).toContain('membership.user_id = (select auth.uid())');
  });

  it('provides a no-argument, caller-bound minimal login-state RPC', () => {
    const loginState = functionBody('create or replace function public.get_my_first_login_state');
    expect(loginState).toContain('public.get_my_first_login_state()');
    expect(loginState).toContain('membership.user_id = (select auth.uid())');
    expect(loginState).toContain("'membershipId', membership.id");
    expect(loginState).toContain("'role', membership.role");
    expect(loginState).toContain("'accountStatus', membership.account_status");
    expect(loginState).toContain("'mustChangePassword', membership.must_change_password");
    expect(loginState).toContain("'activeClinicOwnerMembershipCount'");
    expect(loginState).toContain("'hasMultipleActiveClinicOwnerMemberships'");
    expect(loginState).not.toMatch(/subscriberId|permissions|userId/);
  });

  it('pins every SECURITY DEFINER search path and schema-qualifies relations', () => {
    expect(migration.match(/security definer/g)).toHaveLength(4);
    expect(migration.match(/set search_path = ''/g)).toHaveLength(4);
    expect(migration).toContain('from public.subscriber_memberships membership');
    expect(migration).toContain('from public.clinic_assignments assignment');
  });

  it('denies public and anon execution while granting only authenticated browser execution', () => {
    for (const signature of [
      'app_private.is_subscriber_member(uuid)',
      'app_private.is_subscriber_owner(uuid)',
      'app_private.can_access_clinic(uuid, uuid)',
    ]) {
      expect(migration).toContain(`revoke all on function ${signature} from public, anon`);
      expect(migration).toContain(`grant execute on function ${signature} to authenticated`);
    }
    expect(migration).toContain('revoke all on function public.get_my_first_login_state() from public, anon');
    expect(migration).toContain('grant execute on function public.get_my_first_login_state() to authenticated');
    expect(migration).not.toContain('to service_role');
  });

  it('keeps password completion on its existing server boundary', () => {
    expect(completionFunction).toMatch(/withSupabase\(\{ auth: ["']user["'] \}/);
    expect(completionFunction).toContain('handleInitialPasswordCompletion(req, ctx)');
    expect(completionLogic).toContain(".from('subscriber_memberships')");
    expect(completionLogic).toContain(".eq('user_id', userId)");
    expect(migration).not.toContain('complete-initial-password');
  });
});
