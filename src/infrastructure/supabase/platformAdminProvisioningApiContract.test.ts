/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const approval = read('supabase/functions/platform-approve-registration/index.ts');
const resend = read('supabase/functions/platform-resend-initial-credential/index.ts');
const provisioning = read('supabase/functions/_shared/platform-provisioning.ts');
const platformAdmin = read('supabase/functions/_shared/platform-admin.ts');
const emailAdapter = read('supabase/functions/_shared/registration-email.ts');
const otpRequest = read('supabase/functions/registration-request-otp/index.ts');
const completePassword = read('supabase/functions/complete-initial-password/index.ts');
const completePasswordLogic = read('supabase/functions/complete-initial-password/logic.ts').replaceAll('"', "'");
const migration = read('supabase/migrations/20260829142527_phase_2_platform_admin_review_provisioning_foundation.sql');
const config = read('supabase/config.toml');

describe('Phase 2C.2B Platform Admin provisioning orchestration contract', () => {
  it('requires an authenticated caller and the shared authoritative Platform Admin lookup', () => {
    expect(approval).toContain("withSupabase({ auth: 'user' }");
    expect(resend).toContain("withSupabase({ auth: 'user' }");
    expect(approval).toContain('await requirePlatformAdmin(ctx)');
    expect(resend).toContain('await requirePlatformAdmin(ctx)');
    expect(platformAdmin).toContain(".from('platform_admins')");
    expect(platformAdmin).toContain("new PlatformAdminApiError('UNAUTHORIZED', 401");
    expect(platformAdmin).toContain("new PlatformAdminApiError('FORBIDDEN', 403");
  });

  it('accepts registrationId only and never accepts browser-supplied identity or tenant fields', () => {
    expect(approval).toContain('registrationIdOnly(payload)');
    expect(resend).toContain('registrationIdOnly(payload)');
    expect(provisioning).toContain("Object.keys(payload).filter((key) => key !== 'registrationId')");
    expect(provisioning).toContain("'Only registrationId may be supplied.'");
    for (const prohibited of ['ownerUserId', 'actorUserId', 'subscriberId', 'clinicId', 'paymentAmount', 'temporaryPassword']) {
      expect(approval).not.toContain(`payload.${prohibited}`);
      expect(resend).not.toContain(`payload.${prohibited}`);
    }
  });

  it('claims one registration-anchored attempt through the approved begin RPC', () => {
    expect(approval).toContain("rpc('begin_registration_provisioning'");
    expect(approval).toContain('p_registration_id: registrationId');
    expect(approval).toContain('p_platform_admin_user_id: actorId');
    expect(migration).toContain('registration_id uuid not null unique');
    expect(migration).toContain('for update');
  });

  it('relies on begin provisioning to require approved authoritative payment and eligibility', () => {
    expect(migration).toContain("v_registration.payment_status <> 'approved'");
    expect(migration).toContain('Exactly one approved payment is required for provisioning.');
    expect(migration).toContain('v_payment.amount_centavos <> v_authoritative_amount');
    expect(migration).toContain('v_registration.email_verified_at is null');
  });

  it('handles in-progress and completed attempts without creating another tenant', () => {
    expect(approval).toContain("priorAttempt?.status === 'claimed'");
    expect(approval).toContain("'PROVISIONING_IN_PROGRESS'");
    expect(approval).toContain("activeAttempt.status === 'database_provisioned' || activeAttempt.status === 'completed'");
    expect(approval).toContain('loadSafeProvisionedScope(admin, registrationId, activeAttempt)');
  });

  it('creates exactly one confirmed Auth identity only when no matching identity exists', () => {
    const lookup = approval.indexOf('findAuthUserByEmail(admin, ownerEmail)');
    const create = approval.indexOf('admin.auth.admin.createUser');
    expect(lookup).toBeGreaterThan(-1);
    expect(create).toBeGreaterThan(lookup);
    expect(approval).toContain('email: ownerEmail');
    expect(approval).toContain('email_confirm: true');
    expect(approval).toContain("app_metadata: { pnj_role: 'clinic_owner' }");
    expect(approval).toContain('user_metadata: { display_name: registration.owner_name }');
  });

  it('returns typed conflicts for unassigned and assigned existing identities', () => {
    expect(approval).toContain("'EXISTING_UNASSIGNED_IDENTITY'");
    expect(approval).toContain("'IDENTITY_ALREADY_ASSIGNED'");
    expect(approval).toContain('hasSubscriberMembership(admin, existingUser.id)');
  });

  it('reuses only an Auth identity recorded as created by the same attempt', () => {
    expect(approval).toContain('if (activeAttempt.auth_user_id)');
    expect(approval).toContain('if (!activeAttempt.auth_user_created_by_attempt)');
    expect(approval).toContain('getAuthUserById(admin, activeAttempt.auth_user_id)');
    expect(approval).toContain("normalizeEmail(recordedUser.email ?? '') !== ownerEmail");
    expect(approval).toContain('hasSubscriberMembership(admin, recordedUser.id)');
  });

  it('records attempt ownership before database provisioning', () => {
    const record = approval.indexOf('recordCreatedIdentity(admin, activeAttempt, createdOwnerUserId)');
    const provision = approval.indexOf("rpc('approve_registration_provisioning'");
    expect(record).toBeGreaterThan(-1);
    expect(provision).toBeGreaterThan(record);
    expect(approval).toContain('auth_user_created_by_attempt: true');
  });

  it('uses only the revised four-argument final provisioning RPC', () => {
    expect(approval).toContain('p_registration_id: registrationId');
    expect(approval).toContain('p_provisioning_attempt_id: activeAttempt.id');
    expect(approval).toContain('p_owner_user_id: ownerUserId');
    expect(approval).toContain('p_actor_user_id: actorId');
    expect(migration).toContain('approve_registration_provisioning(uuid, uuid, uuid, uuid)');
    expect(migration).toContain('drop function if exists public.approve_registration_provisioning(uuid, uuid, uuid)');
  });

  it('does not duplicate transactional tenant writes in either Edge Function', () => {
    for (const source of [approval, resend]) {
      expect(source).not.toContain(".from('subscribers').insert");
      expect(source).not.toContain(".from('clinics').insert");
      expect(source).not.toContain(".from('subscriptions').insert");
      expect(source).not.toContain(".from('clinic_assignments').insert");
    }
  });

  it('never includes credential material in the safe approval response model', () => {
    const safeScopeStart = provisioning.indexOf('export interface SafeProvisionedScope');
    const safeScopeEnd = provisioning.indexOf('export function normalizeEmail');
    const safeScope = provisioning.slice(safeScopeStart, safeScopeEnd);
    expect(safeScope).toContain('registrationNumber');
    expect(safeScope).toContain('credentialDelivery');
    expect(safeScope).not.toMatch(/password|token|otp/i);
    expect(approval).not.toContain('account: {');
    expect(approval).not.toContain('requiresPasswordChange');
  });

  it('persists no password, OTP, or token in the provisioning attempt ledger', () => {
    const start = migration.indexOf('create table if not exists public.registration_provisioning_attempts');
    const end = migration.indexOf('create index if not exists registration_provisioning_attempts_status_started_idx');
    const table = migration.slice(start, end);
    expect(table).toContain('credential_delivery_status');
    expect(table).toContain('failure_code text');
    expect(table).not.toMatch(/password|otp_hash|auth_token|gatewayToken/i);
  });

  it('compensates only an Auth identity created by the current invocation before database commit', () => {
    expect(approval).toContain('createdByThisInvocation && ownerUserId');
    expect(approval).toContain("attempt.status !== 'claimed'");
    expect(approval).toContain('!attempt.auth_user_created_by_attempt');
    expect(approval).toContain('hasSubscriberMembership(admin, userId)');
    expect(approval).toContain('admin.auth.admin.deleteUser(userId)');
    expect(approval).toContain("afterRpc.status !== 'database_provisioned' && afterRpc.status !== 'completed'");
  });

  it('rechecks durable state after an RPC error so a lost response cannot trigger duplication or Auth deletion', () => {
    const rpcError = approval.indexOf('if (provisionError || !provisioned?.[0])');
    const reload = approval.indexOf('const afterRpc = await loadProvisioningAttempt', rpcError);
    const compensate = approval.indexOf('await compensateCreatedIdentity', rpcError);
    expect(reload).toBeGreaterThan(rpcError);
    expect(compensate).toBeGreaterThan(reload);
    expect(approval).toContain("afterRpc.status !== 'database_provisioned' && afterRpc.status !== 'completed'");
  });

  it('sends the initial credential only after database provisioning succeeds', () => {
    const provision = approval.indexOf("rpc('approve_registration_provisioning'");
    const email = approval.indexOf('await sendInitialClinicOwnerCredentialEmail');
    expect(email).toBeGreaterThan(provision);
  });

  it('keeps successful tenant provisioning when credential email delivery fails', () => {
    expect(approval).toContain("deliveryStatus = 'failed'");
    expect(approval).toContain('recordCredentialDelivery(');
    const emailSection = approval.slice(approval.indexOf('let deliveryStatus'));
    expect(emailSection).not.toContain('deleteUser');
    expect(provisioning).toContain("status: 'completed'");
    expect(provisioning).toContain("credential_delivery_status: status");
  });

  it('records only safe credential delivery audit metadata', () => {
    expect(provisioning).toContain("'platform.initial_credential.sent'");
    expect(provisioning).toContain("'platform.initial_credential.delivery_failed'");
    const auditStart = provisioning.indexOf("const { error: auditError }");
    const auditEnd = provisioning.indexOf('if (auditError)', auditStart);
    const auditWrite = provisioning.slice(auditStart, auditEnd);
    expect(auditWrite).toContain('registration_id');
    expect(auditWrite).toContain('failure_code');
    expect(auditWrite).not.toMatch(/password|otp|token|authorization|gateway/i);
  });

  it('rotates a resend credential and never repeats tenant provisioning', () => {
    expect(resend).toContain('auth.admin.updateUserById(attempt.auth_user_id');
    expect(resend).toContain('password: temporaryPassword');
    expect(resend).toContain('must_change_password: true');
    expect(resend).toContain('sendInitialClinicOwnerCredentialEmail');
    expect(resend).not.toContain("rpc('approve_registration_provisioning'");
    expect(resend).not.toContain("rpc('begin_registration_provisioning'");
  });

  it('requires resend ownership, active Clinic Owner membership, and matching normalized emails', () => {
    expect(resend).toContain('attempt.auth_user_created_by_attempt');
    expect(resend).toContain(".eq('role', 'clinic_owner')");
    expect(resend).toContain(".eq('account_status', 'active')");
    expect(resend).toContain('ownerEmail !== attempt.owner_email_normalized');
    expect(resend).toContain('normalizeEmail(profileResult.data.email) !== ownerEmail');
    expect(resend).toContain("normalizeEmail(authUser.email ?? '') !== ownerEmail");
  });

  it('keeps existing Auth users out of automatic password reset and credential email paths', () => {
    const existingBranch = approval.slice(
      approval.indexOf('if (existingUser)'),
      approval.indexOf('temporaryPassword = randomPassword()', approval.indexOf('if (existingUser)')),
    );
    expect(existingBranch).toContain('throw new PlatformAdminApiError');
    expect(existingBranch).not.toContain('updateUserById');
    expect(existingBranch).not.toContain('sendInitialClinicOwnerCredentialEmail');
  });

  it('generalizes the server-only mail adapter while preserving the Phase 1 OTP wrapper', () => {
    expect(emailAdapter).toContain('export async function sendRegistrationEmail');
    expect(emailAdapter).toContain('gatewayToken: token');
    expect(emailAdapter).toContain("Deno.env.get('REGISTRATION_EMAIL_ENDPOINT')");
    expect(emailAdapter).toContain("Deno.env.get('REGISTRATION_EMAIL_API_TOKEN')");
    expect(emailAdapter).toContain("Deno.env.get('REGISTRATION_EMAIL_FROM')");
    expect(emailAdapter).toContain('export async function sendRegistrationOtpEmail');
    expect(otpRequest).toContain('await sendRegistrationOtpEmail');
    expect(emailAdapter).not.toContain('console.');
  });

  it('keeps subscriber membership as the single authoritative initial-password state', () => {
    expect(migration).toContain("'clinic_owner', 'active', v_now, true");
    expect(completePassword).toContain('handleInitialPasswordCompletion(req, ctx)');
    expect(completePasswordLogic).toContain('must_change_password: false');
    expect(completePasswordLogic).toContain(".eq('user_id', userId)");
    expect(approval).not.toContain('must_change_password: true');
    expect(approval).not.toContain('user_metadata: { must_change_password');
  });

  it('requires JWT verification for both Platform Admin credential functions', () => {
    expect(config).toMatch(/\[functions\.platform-approve-registration\][\s\S]*?verify_jwt = true/);
    expect(config).toMatch(/\[functions\.platform-resend-initial-credential\][\s\S]*?verify_jwt = true/);
  });
});
