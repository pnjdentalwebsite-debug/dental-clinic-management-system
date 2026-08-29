/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const index = read('supabase/functions/complete-initial-password/index.ts');
const logic = read('supabase/functions/complete-initial-password/logic.ts').replaceAll('"', "'");
const config = read('supabase/config.toml');
const rlsMigration = read('supabase/migrations/20260829155055_first_login_rls_access_gate.sql');
const provisioningMigration = read('supabase/migrations/20260829142527_phase_2_platform_admin_review_provisioning_foundation.sql');
const resend = read('supabase/functions/platform-resend-initial-credential/index.ts');
const registrationContract = read('src/infrastructure/supabase/registrationBackendContract.test.ts');

describe('Phase 2C.2C-B hardened initial-password completion contract', () => {
  it('requires verified user JWT handling and keeps verify_jwt enabled', () => {
    expect(index).toMatch(/withSupabase\(\{ auth: ["']user["'] \}/);
    expect(config).toMatch(/\[functions\.complete-initial-password\][\s\S]*?verify_jwt = true/);
    expect(logic).toContain("typeof ctx.userClaims?.id === 'string'");
  });

  it('accepts only newPassword and rejects target identity fields', () => {
    expect(logic).toContain("keys.length !== 1 || keys[0] !== 'newPassword'");
    expect(logic).toContain("'INVALID_REQUEST'");
    for (const prohibited of [
      'payload.userId', 'payload.ownerUserId', 'payload.subscriberId', 'payload.membershipId',
      'payload.clinicId', 'payload.actorId', 'payload.temporaryPassword', 'payload.oldPassword',
    ]) {
      expect(logic).not.toContain(prohibited);
    }
  });

  it('resolves at most two active Clinic Owner memberships for the verified user', () => {
    expect(logic).toContain(".eq('user_id', userId)");
    expect(logic).toContain(".eq('role', 'clinic_owner')");
    expect(logic).toContain(".eq('account_status', 'active')");
    expect(logic).toContain('.limit(2)');
    expect(logic).toContain("'NO_ACTIVE_CLINIC_OWNER_MEMBERSHIP'");
    expect(logic).toContain("'MULTIPLE_ACTIVE_CLINIC_OWNER_MEMBERSHIPS'");
  });

  it('blocks repeat completion before password validation or Auth rotation', () => {
    const completed = logic.indexOf('if (!membership.must_change_password)');
    const validation = logic.indexOf('validateNewPassword(newPassword)');
    const authUpdate = logic.indexOf('auth.admin.updateUserById');
    expect(completed).toBeGreaterThan(-1);
    expect(validation).toBeGreaterThan(completed);
    expect(authUpdate).toBeGreaterThan(validation);
    expect(logic).toContain("'INITIAL_PASSWORD_ALREADY_COMPLETED'");
  });

  it('enforces the server-side 12-character letter-and-digit policy', () => {
    expect(logic).toContain('password.length < 12');
    expect(logic).toContain('/\\p{L}/u.test(password)');
    expect(logic).toContain('/\\p{N}/u.test(password)');
    expect(logic).toContain("'INVALID_PASSWORD'");
  });

  it('updates Auth before conditionally finalizing only the resolved membership', () => {
    const authUpdate = logic.indexOf('auth.admin.updateUserById');
    const membershipUpdate = logic.indexOf('.update({', logic.indexOf('const passwordChangedAt'));
    expect(authUpdate).toBeGreaterThan(-1);
    expect(membershipUpdate).toBeGreaterThan(authUpdate);
    for (const condition of [
      ".eq('id', membership.id)",
      ".eq('user_id', userId)",
      ".eq('role', 'clinic_owner')",
      ".eq('account_status', 'active')",
      ".eq('must_change_password', true)",
    ]) {
      expect(logic.slice(membershipUpdate)).toContain(condition);
    }
    expect(logic).toContain('password_changed_at: passwordChangedAt');
  });

  it('returns safe typed Auth and finalization failure states', () => {
    expect(logic).toContain("'AUTH_PASSWORD_UPDATE_FAILED'");
    expect(logic).toContain("'PASSWORD_UPDATED_STATE_FINALIZATION_REQUIRED'");
    expect(logic).toContain("'MEMBERSHIP_STATE_UNAVAILABLE'");
    expect(logic).not.toContain('authError.message');
    expect(logic).not.toContain('finalizationError.message');
  });

  it('records the safe success event after membership finalization', () => {
    const membershipUpdate = logic.indexOf(".update({ must_change_password: false");
    const successAudit = logic.indexOf("event_type: 'account.initial_password.changed'");
    expect(successAudit).toBeGreaterThan(membershipUpdate);
    const auditStart = logic.lastIndexOf("const { error: auditError }", successAudit);
    const auditBlock = logic.slice(auditStart, logic.indexOf('if (auditError)', successAudit));
    expect(auditBlock).toContain('actor_user_id: userId');
    expect(auditBlock).toContain('subscriber_id: membership.subscriber_id');
    expect(auditBlock).toContain('entity_id: membership.id');
    expect(auditBlock).not.toMatch(/newPassword|accessToken|authorization|temporaryPassword|otp|secret/i);
  });

  it('selectively revokes other sessions with the request access token', () => {
    expect(logic).toContain("request.headers.get('authorization')");
    expect(logic).toMatch(/auth\.admin\.signOut\(\s*accessToken,\s*'others',?\s*\)/);
    expect(logic).not.toContain("signOut(accessToken, 'global')");
  });

  it('returns only the approved safe success state', () => {
    const successLine = "return response(request, { completed: true, mustChangePassword: false });";
    expect(logic).toContain(successLine);
    expect(successLine).not.toMatch(/token|session|subscriber|membershipId|newPassword|temporaryPassword/i);
  });

  it('does not use browser storage, mock credentials, random passwords, or hardcoded identities', () => {
    expect(logic).not.toMatch(/localStorage|sessionStorage|Math\.random|mock|temporary credential|hardcoded/i);
    expect(logic).not.toMatch(/userId\s*=\s*payload|subscriberId\s*=\s*payload|membershipId\s*=\s*payload/i);
  });

  it('remains compatible with the narrow login-state RPC and RLS transition', () => {
    expect(rlsMigration).toContain('create or replace function public.get_my_first_login_state()');
    expect(rlsMigration).toContain('membership.must_change_password = false');
    expect(logic).toContain('must_change_password: false');
    expect(logic).toContain('password_changed_at: passwordChangedAt');
  });

  it('remains compatible with provisioning and credential resend state', () => {
    expect(provisioningMigration).toContain("'clinic_owner', 'active', v_now, true");
    expect(resend).toContain('must_change_password: true');
    expect(resend).toContain('password_changed_at: null');
    expect(logic).toContain("event_type: 'account.initial_password.changed'");
  });

  it('keeps Phase 1 Registration contracts in the focused compatibility suite', () => {
    expect(registrationContract).toContain("describe('Phase 1C registration backend contract'");
    expect(index).not.toMatch(/registration-(plans|submit|request-otp|verify-otp|submit-payment|status)/);
  });
});
